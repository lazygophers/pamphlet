/**
 * 图表管线：从 AST 里收集图表围栏 → 查缓存 → 批量渲染 → 换色 → 回填。
 * 这一层不产出 HTML，只把渲染结果挂回 AST 上，由后面的组装器取用。
 */

import { createRequire } from 'node:module'
import type { Root, RootContent, Code } from 'mdast'
import { isFenceLanguage, type FenceLanguage } from '../ast.js'
import { diagnostic, type Diagnostic } from '../diagnostics.js'
import { createCache, cacheKey, type Cache } from './cache.js'
import { createMermaidEngine, sizeDiagnostic } from './mermaid.js'
import { unmappedDiagnostic } from './recolor.js'
import type { Engine, RenderRequest, RenderedDiagram } from './engine.js'

export interface DiagramTask {
  lang: FenceLanguage
  code: string
  line: number
  node: Code
}

/** 渲染结果挂在 Code 节点的 data 上，组装器取这里 */
export interface DiagramData {
  svg?: string
  /** 渲染失败时的占位信息（ADR-0028：出产物但退出码 1） */
  failed?: { reason: string }
}

export function collectDiagrams(ast: Root): DiagramTask[] {
  const tasks: DiagramTask[] = []

  const walk = (node: RootContent): void => {
    if (node.type === 'code') {
      const lang = (node.lang ?? '').trim()
      if (lang !== '' && isFenceLanguage(lang)) {
        tasks.push({
          lang,
          code: node.value,
          line: node.position?.start.line ?? 1,
          node,
        })
      }
    }
    const children = 'children' in node ? (node.children as RootContent[] | undefined) : undefined
    if (children) for (const child of children) walk(child)
  }

  for (const child of ast.children) walk(child)
  return tasks
}

export interface RenderOptions {
  cache?: Cache
  engines?: Engine[]
  timeoutMs?: number
}

export interface RenderReport {
  diagnostics: Diagnostic[]
  /** 渲染了几张、命中缓存几张 —— 给 --verbose 的耗时归因用 */
  rendered: number
  cached: number
  failed: number
}

export async function renderDiagrams(
  ast: Root,
  options: RenderOptions = {},
): Promise<RenderReport> {
  const tasks = collectDiagrams(ast)
  const report: RenderReport = { diagnostics: [], rendered: 0, cached: 0, failed: 0 }
  if (tasks.length === 0) return report

  const cache = options.cache ?? createCache()
  const engines =
    options.engines ??
    [createMermaidEngine(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs })]

  // 按引擎分组：一个引擎一次拿到它全部的图（批量比逐张快一倍多）
  const byEngine = new Map<Engine, DiagramTask[]>()
  for (const task of tasks) {
    const engine = engines.find((e) => e.langs.includes(task.lang))
    if (!engine) {
      report.failed += 1
      setData(task, { failed: { reason: `没有引擎认领 ${task.lang}` } })
      report.diagnostics.push(
        diagnostic('DIAG-301', 'error', `没有装能画 ${task.lang} 的引擎`, {
          start: { line: task.line, column: 1 },
          hint: `跑 pamphlet doctor 看各引擎的安装状态`,
        }),
      )
      continue
    }
    const list = byEngine.get(engine)
    if (list) list.push(task)
    else byEngine.set(engine, [task])
  }

  for (const [engine, engineTasks] of byEngine) {
    const probe = await engine.probe()
    if (!probe.available) {
      report.failed += engineTasks.length
      for (const task of engineTasks) {
        setData(task, { failed: { reason: `${engine.name} 引擎没装` } })
        report.diagnostics.push(
          diagnostic('DIAG-301', 'error', `渲染 ${task.lang} 图表需要 ${engine.name} 引擎`, {
            start: { line: task.line, column: 1 },
            hint: probe.hint,
          }),
        )
      }
      continue
    }

    // 先查缓存，只把没命中的送去渲染
    const pending: { task: DiagramTask; key: string }[] = []
    for (const task of engineTasks) {
      const key = cacheKey(task.code, engine.name, engineVersionOf(engine), engine.fingerprint)
      const hit = await cache.get(key)
      if (hit !== undefined) {
        report.cached += 1
        setData(task, { svg: hit.svg })
        // 命中缓存也要报诊断。少了这一步就是「图从缓存来 = 换漏的颜色没人告诉你」，
        // 而那正好是这套哨兵机制唯一要防的事。
        report.diagnostics.push(...diagnose(engine.name, hit, task))
        continue
      }
      pending.push({ task, key })
    }
    if (pending.length === 0) continue

    const requests: RenderRequest[] = pending.map(({ task }) => ({
      code: task.code,
      line: task.line,
    }))
    const results = await engine.render(requests)

    for (const [index, result] of results.entries()) {
      const entry = pending[index]
      if (!entry) continue
      const { task, key } = entry

      if ('code' in result) {
        report.failed += 1
        report.diagnostics.push(result)
        setData(task, { failed: { reason: result.message } })
        continue
      }

      report.rendered += 1
      setData(task, { svg: result.svg })
      await cache.set(key, result)
      report.diagnostics.push(...diagnose(engine.name, result, task))
    }
  }

  report.diagnostics.sort((a, b) => (a.start?.line ?? 0) - (b.start?.line ?? 0))
  return report
}

/** 一张画出来的图该报的诊断。渲染路径和缓存路径共用，这样两条路不会说不一样的话。 */
function diagnose(engine: string, rendered: RenderedDiagram, task: DiagramTask): Diagnostic[] {
  const out: Diagnostic[] = []
  const size = sizeDiagnostic(Buffer.byteLength(rendered.svg, 'utf8'), task.line)
  if (size) out.push(size)
  const unmapped = unmappedDiagnostic(engine, rendered.unmapped, { line: task.line, column: 1 })
  if (unmapped) out.push(unmapped)
  return out
}

function setData(task: DiagramTask, data: DiagramData): void {
  const node = task.node as Code & { data?: DiagramData }
  node.data = { ...node.data, ...data }
}

/** 引擎版本进缓存键——升级引擎后不能命中旧图 */
function engineVersionOf(engine: Engine): string {
  return engine.name === 'mermaid' ? mermaidVersion() : 'unknown'
}

let cachedMermaidVersion: string | undefined
function mermaidVersion(): string {
  if (cachedMermaidVersion) return cachedMermaidVersion
  try {
    // 版本号从依赖自己的 package.json 读，不硬编码——否则升级 mermaid 后会命中旧缓存
    const require = createRequire(import.meta.url)
    const pkg = require('mermaid/package.json') as { version?: string }
    cachedMermaidVersion = pkg.version ?? 'unknown'
  } catch {
    cachedMermaidVersion = 'unknown'
  }
  return cachedMermaidVersion
}

export { createCache, createNullCache, cacheKey } from './cache.js'
export { recolor } from './recolor.js'
export { DIAGRAM_TOKENS, SENTINELS, CSS_VARIABLE, FALLBACK } from './tokens.js'
export { createMermaidEngine } from './mermaid.js'
export type { Engine, RenderRequest, RenderedDiagram } from './engine.js'
