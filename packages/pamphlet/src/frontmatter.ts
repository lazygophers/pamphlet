/**
 * frontmatter 解析与校验。
 * 没有配置文件（ADR-0030），所以这里是全部配置的唯一入口。
 */

import { parse as parseYaml } from 'yaml'
import {
  FRONTMATTER_KEYS,
  SUPPORTED_SPEC,
  TOC_KEYS,
  type Frontmatter,
  type TocConfig,
} from './ast.js'
import { diagnostic, type Diagnostic, type Point } from './diagnostics.js'

export interface FrontmatterResult {
  frontmatter: Frontmatter
  diagnostics: Diagnostic[]
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 把 frontmatter 里某个顶层键的位置算出来——诊断指向 `---` 那一行没有用，
 * 作者要的是「哪个字段写错了」。
 */
function keyLocator(yamlText: string, start: Point) {
  const lines = yamlText.split('\n')
  return (key: string): Point => {
    const index = lines.findIndex((line) => new RegExp(`^\\s*${key}\\s*:`).test(line))
    if (index === -1) return start
    const line = lines[index] ?? ''
    return { line: start.line + index, column: line.length - line.trimStart().length + 1 }
  }
}

/**
 * @param yamlText frontmatter 的正文（不含 `---` 那两行）
 * @param start yamlText 第一行在源文档里的位置
 */
export function parseFrontmatter(yamlText: string, start: Point): FrontmatterResult {
  const diagnostics: Diagnostic[] = []
  const locate = keyLocator(yamlText, start)

  let raw: unknown
  try {
    raw = parseYaml(yamlText)
  } catch (error) {
    const message = error instanceof Error ? error.message.split('\n')[0] : String(error)
    return {
      frontmatter: {},
      diagnostics: [
        diagnostic('DOC-103', 'error', `frontmatter 不是合法的 YAML：${message}`, {
          start,
          hint: '检查缩进和冒号后面的空格；YAML 对缩进敏感',
        }),
      ],
    }
  }

  if (raw === null || raw === undefined) return { frontmatter: {}, diagnostics }

  if (!isPlainObject(raw)) {
    return {
      frontmatter: {},
      diagnostics: [
        diagnostic('DOC-103', 'error', 'frontmatter 必须是一组 `键: 值`', { start }),
      ],
    }
  }

  const frontmatter: Frontmatter = {}

  for (const [key, value] of Object.entries(raw)) {
    const at = locate(key)
    const span = { start: at, end: { line: at.line, column: at.column + key.length } }
    if (!(FRONTMATTER_KEYS as readonly string[]).includes(key)) {
      diagnostics.push(
        diagnostic('DOC-102', 'warning', `frontmatter 里有未知字段 ${key}，已忽略`, {
          ...span,
          hint: `本版本认识的字段：${FRONTMATTER_KEYS.join(' / ')}`,
        }),
      )
      continue
    }

    switch (key) {
      case 'spec': {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          diagnostics.push(
            diagnostic('DOC-103', 'error', 'spec 必须是整数', {
              ...span,
              hint: 'spec 声明这份文档要求的最低编译器语法版本；不填等于不做检查',
            }),
          )
          break
        }
        frontmatter.spec = value
        if (value > SUPPORTED_SPEC) {
          diagnostics.push(
            diagnostic(
              'DOC-101',
              'error',
              `这份文档要求 spec ${value}，当前编译器只支持 spec ${SUPPORTED_SPEC}`,
              { ...span, hint: '升级 pamphlet：npm i -g pamphlet@latest' },
            ),
          )
        }
        break
      }
      case 'title':
      case 'theme':
      case 'lang': {
        if (typeof value !== 'string') {
          diagnostics.push(diagnostic('DOC-103', 'error', `${key} 必须是字符串`, span))
          break
        }
        frontmatter[key] = value
        break
      }
      case 'toc': {
        const result = parseToc(value, at)
        diagnostics.push(...result.diagnostics)
        if (result.toc) frontmatter.toc = result.toc
        break
      }
      case 'engines': {
        if (!isPlainObject(value)) {
          diagnostics.push(diagnostic('DOC-103', 'error', 'engines 必须是一组引擎声明', span))
          break
        }
        diagnostics.push(
          diagnostic('DOC-104', 'warning', '本版本还不渲染图表，engines 声明暂时不起作用', {
            ...span,
            hint: '图表渲染会在带 HTML 输出的版本里到位',
          }),
        )
        break
      }
    }
  }

  return { frontmatter, diagnostics }
}

function parseToc(value: unknown, start: Point): { toc?: TocConfig; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = []

  if (typeof value === 'boolean') return { toc: { enable: value }, diagnostics }

  if (!isPlainObject(value)) {
    return {
      diagnostics: [
        diagnostic('DOC-103', 'error', 'toc 必须是 true/false 或一组配置', {
          start,
          hint: '例如：toc:\\n  enable: true\\n  deep: 2',
        }),
      ],
    }
  }

  const toc: TocConfig = {}
  for (const [key, item] of Object.entries(value)) {
    if (!(TOC_KEYS as readonly string[]).includes(key)) {
      diagnostics.push(
        diagnostic('DOC-102', 'warning', `toc 里有未知字段 ${key}，已忽略`, {
          start,
          hint: `toc 认识的字段：${TOC_KEYS.join(' / ')}`,
        }),
      )
      continue
    }
    if (key === 'deep') {
      if (typeof item !== 'number' || !Number.isInteger(item) || item < 1 || item > 6) {
        diagnostics.push(
          diagnostic('DOC-103', 'error', 'toc.deep 必须是 1 到 6 之间的整数', { start }),
        )
        continue
      }
      toc.deep = item
      continue
    }
    if (key === 'position') {
      if (item !== 'top' && item !== 'side') {
        diagnostics.push(
          diagnostic('DOC-103', 'error', "toc.position 只能是 top 或 side", { start }),
        )
        continue
      }
      if (item === 'side') {
        // 报「尚未实现」而不是静默降级为 top（ADR-0022）
        diagnostics.push(
          diagnostic('DOC-104', 'error', 'toc.position: side（粘性侧边栏）尚未实现', {
            start,
            hint: '暂时用 position: top，目录会放在正文开头',
          }),
        )
        continue
      }
      toc.position = item
      continue
    }
    if (typeof item !== 'boolean') {
      diagnostics.push(diagnostic('DOC-103', 'error', `toc.${key} 必须是 true 或 false`, { start }))
      continue
    }
    toc[key as 'enable' | 'skipTabs'] = item
  }

  return { toc, diagnostics }
}
