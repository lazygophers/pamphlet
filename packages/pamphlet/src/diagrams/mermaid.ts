/**
 * Mermaid 引擎。走 mermaid-isomorphic（官方方案，内部是 Playwright + Chromium）。
 *
 * 浏览器是**惰性启动的进程内单例**：第一次真的需要渲染时才拉起来，
 * 之后整个进程共用；进程退出时随之关闭，不暴露显式的关闭接口。
 * 这样 `build`（跑完就退）与 `serve`（进程常驻）共用同一套代码——
 * 差别只在进程活多久，而那不是渲染层该关心的事。
 *
 * 纯文本文档永远不会拉起浏览器（实测冷启动 733ms，白付很浪费）。
 */

import { diagnostic, type Diagnostic } from '../diagnostics.js'
import {
  DEFAULT_TIMEOUT_MS,
  SVG_SIZE_WARN_BYTES,
  withTimeout,
  type Engine,
  type RenderRequest,
  type RenderedDiagram,
} from './engine.js'
import { recolor } from './recolor.js'
import { SENTINELS } from './tokens.js'

/**
 * 把哨兵色当主题色喂给 Mermaid。两个作用：
 *  1. 输出里的颜色变成可识别的哨兵，替换时不必靠猜；
 *  2. 实测证明喂十六进制能把 Mermaid 输出里的 CSS 具名色（`fill:black`）挤掉——
 *     而只替十六进制是已定的策略，具名色漏掉的后果是暗色下看不见的文字。
 */
const THEME_VARIABLES = {
  primaryColor: SENTINELS.fill,
  primaryTextColor: SENTINELS.text,
  primaryBorderColor: SENTINELS.line,
  secondaryColor: SENTINELS.fill,
  tertiaryColor: SENTINELS.bg,
  background: SENTINELS.bg,
  mainBkg: SENTINELS.fill,
  lineColor: SENTINELS.line,
  textColor: SENTINELS.text,
  nodeTextColor: SENTINELS.text,
  actorBkg: SENTINELS.fill,
  actorBorder: SENTINELS.line,
  actorTextColor: SENTINELS.text,
  actorLineColor: SENTINELS.line,
  signalColor: SENTINELS.line,
  signalTextColor: SENTINELS.text,
  labelBoxBkgColor: SENTINELS.fill,
  labelBoxBorderColor: SENTINELS.line,
  labelTextColor: SENTINELS.text,
  loopTextColor: SENTINELS.text,
  noteBkgColor: SENTINELS.fill,
  noteTextColor: SENTINELS.text,
  noteBorderColor: SENTINELS.line,
  activationBkgColor: SENTINELS.accent,
  activationBorderColor: SENTINELS.line,
  sequenceNumberColor: SENTINELS.bg,
  altBackground: SENTINELS.bg,
  clusterBkg: SENTINELS.bg,
  clusterBorder: SENTINELS.line,
  edgeLabelBackground: SENTINELS.bg,
  titleColor: SENTINELS.text,
} as const

type MermaidRenderer = (
  diagrams: readonly string[],
  options?: { mermaidConfig?: Record<string, unknown> },
) => Promise<
  ({ status: 'fulfilled'; value: { svg: string } } | { status: 'rejected'; reason: unknown })[]
>

/** 进程内单例，惰性初始化 */
let renderer: MermaidRenderer | undefined

async function getRenderer(): Promise<MermaidRenderer> {
  if (renderer) return renderer
  const mod: unknown = await import('mermaid-isomorphic')
  const create = (mod as { createMermaidRenderer?: () => MermaidRenderer }).createMermaidRenderer
  if (typeof create !== 'function') {
    throw new Error('mermaid-isomorphic 没有导出 createMermaidRenderer')
  }
  renderer = create()
  return renderer
}

export interface MermaidOptions {
  timeoutMs?: number
  /** 只给测试用：替掉真实的渲染器，免得为了测超时与失败分支真去卡一个浏览器 */
  renderer?: MermaidRenderer
}

export function createMermaidEngine(options: MermaidOptions = {}): Engine {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const resolveRenderer = options.renderer
    ? async (): Promise<MermaidRenderer> => options.renderer as MermaidRenderer
    : getRenderer

  return {
    name: 'mermaid',
    langs: ['mermaid'],

    async probe() {
      try {
        await import('mermaid-isomorphic')
      } catch {
        return {
          available: false,
          hint: '装一次就好：npm i -g mermaid-isomorphic playwright && npx playwright install chromium（首次约 150MB）',
        }
      }
      return { available: true }
    },

    async render(requests: RenderRequest[]) {
      if (requests.length === 0) return []

      let results: Awaited<ReturnType<MermaidRenderer>>
      try {
        const render = await resolveRenderer()
        results = await withTimeout(
          render(
            requests.map((r) => r.code),
            { mermaidConfig: { theme: 'base', themeVariables: THEME_VARIABLES } },
          ),
          timeoutMs,
          () => new Error(`渲染超过 ${timeoutMs / 1000} 秒`),
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        // 整批失败（浏览器起不来、超时）：每张图各给一条诊断，别只报一条让人猜是哪张
        return requests.map((r) =>
          diagnostic('DIAG-303', 'error', `mermaid 渲染失败：${message}`, {
            start: { line: r.line, column: 1 },
            hint: '这张图会以占位框的形式出现在产物里，构建仍然会失败（退出码 1）',
          }),
        )
      }

      return results.map((result, index) => {
        const request = requests[index]
        const at = { line: request?.line ?? 1, column: 1 }

        if (result.status === 'rejected') {
          const message = String(
            (result.reason as { message?: unknown })?.message ?? result.reason,
          ).split('\n')[0]
          return diagnostic('DIAG-303', 'error', `mermaid 画不出这张图：${message}`, {
            start: at,
            hint: '检查图源的语法；在 https://mermaid.live 上贴进去能更快定位',
          })
        }

        const { svg, unmapped } = recolor(result.value.svg)
        return { svg, unmapped } satisfies RenderedDiagram
      })
    },
  }
}

export function sizeDiagnostic(bytes: number, line: number): Diagnostic | undefined {
  if (bytes <= SVG_SIZE_WARN_BYTES) return undefined
  return diagnostic(
    'DIAG-302',
    'warning',
    `这张图的 SVG 有 ${Math.round(bytes / 1024)}KB`,
    {
      start: { line, column: 1 },
      hint: '图太大通常意味着节点太多，读者也看不清；考虑拆成几张',
    },
  )
}
