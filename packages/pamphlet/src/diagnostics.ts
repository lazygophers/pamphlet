/**
 * 诊断：编译器发给作者的一条消息，带位置、原因和修复建议。
 * 码不编码严重程度（ADR-0027）——严重程度是独立字段，可被 --fail-on-warn 改变。
 */

export type Severity = 'error' | 'warning'

/** 码段：DOC 文档与语法 · DIR 指令 · DIAG 图表引擎 · EMB 资源内嵌 */
export type DiagnosticCode =
  | 'DOC-101' // spec 高于编译器支持的版本
  | 'DOC-102' // frontmatter 里有未知字段
  | 'DOC-103' // frontmatter 不是合法 YAML
  | 'DOC-104' // frontmatter 字段值合法但本版本未实现
  | 'DOC-105' // 用了脚注，本版本不支持
  | 'DOC-106' // 指定的主题名不存在
  | 'DIR-201' // 未知指令
  | 'DIR-202' // 指令用错了位置或形态
  | 'DIR-203' // 指令未闭合
  | 'DIR-204' // 指令缺少必需的部分
  | 'DIR-205' // 同一组里出现了多个只能有一个的标记
  | 'DIR-206' // 属性值不在允许的取值里
  | 'DIR-207' // 这个指令不认识这个属性
  | 'DIAG-301' // 渲染这种图表需要的引擎没装
  | 'DIAG-302' // 单张图的 SVG 过大
  | 'DIAG-303' // 渲染超时或失败
  | 'DIAG-304' // 引擎输出里有硬编码色值，换不成主题变量
  | 'DIAG-305' // 结构化图表的块写错了（缺块、重复、条目不在块里）
  | 'DIAG-306' // 结构化图表的连线写错了（不是一条连线、引用了没声明的名字）
  | 'DIAG-307' // 结构化图表用了不认识的形状
  | 'DIAG-308' // 这种图的自有写法还没实现
  | 'EMB-401' // 单个资源超过字节上限
  | 'EMB-402' // 读不到这个资源
  | 'EMB-403' // 引用了远程资源，自包含不允许
  | 'EMB-404' // 这种字体格式不能子集化（.ttc 字体集合）

export interface Point {
  /** 1 起 */ line: number
  /** 1 起 */ column: number
}

export interface Diagnostic {
  code: DiagnosticCode
  severity: Severity
  message: string
  /** 修复建议：要么是一条能直接跑的命令，要么是一句能直接照做的话 */
  hint?: string
  start?: Point
  end?: Point
  docUrl?: string
}

/**
 * 诊断码表所在的页面。每个码是这一页上的一个锚点。
 *
 * 原先写的是 `https://pamphlet.dev/diagnostics/`——那个域名不存在，
 * 于是每条诊断底下都挂着一个点开必然 404 的链接（ADR-0037 要求它指向文档站的稳定 URL）。
 */
export const DOC_BASE = 'https://lazygophers.github.io/pamphlet/reference/diagnostics.html#'

export function diagnostic(
  code: DiagnosticCode,
  severity: Severity,
  message: string,
  extra: Omit<Diagnostic, 'code' | 'severity' | 'message'> = {},
): Diagnostic {
  return { code, severity, message, docUrl: `${DOC_BASE}${code.toLowerCase()}`, ...extra }
}

const RESET = '[0m'
const BOLD = '[1m'
const DIM = '[2m'
const RED = '[31m'
const YELLOW = '[33m'
const BLUE = '[34m'

interface FormatOptions {
  /** 源文档路径，出现在 `--> path:line:col` 里 */
  path: string
  /** 源文档全文，用来切出出错那一行 */
  source: string
  color: boolean
}

/** 人类可读格式：带源码片段、修复建议、文档链接 */
export function formatDiagnostic(d: Diagnostic, options: FormatOptions): string {
  const { path, source, color } = options
  const paint = (code: string, text: string) => (color ? `${code}${text}${RESET}` : text)

  /**
   * 建议可以是多行的（DOC-106 要一行一套地列出十二套主题）。
   * 续行按 `= ` 的宽度往里缩，整段就挂在同一个 `=` 底下——
   * 顶到最左边的话，每一行看起来都像另一条独立的诊断。
   */
  const hintLines = (hint: string, gutter: string, marker: string) => {
    const [first = '', ...rest] = hint.split('\n')
    return [`${gutter}${marker} ${first}`, ...rest.map((line) => `${gutter}  ${line}`)]
  }

  const severityColor = d.severity === 'error' ? RED : YELLOW
  const head = `${paint(severityColor + BOLD, `${d.severity}[${d.code}]`)} ${d.message}`
  const lines: string[] = [head]

  if (d.start) {
    const gutterWidth = String(d.start.line).length
    const pad = ' '.repeat(gutterWidth)
    const arrow = paint(BLUE + BOLD, '-->')
    lines.push(`${pad} ${arrow} ${path}:${d.start.line}:${d.start.column}`)

    const sourceLine = source.split('\n')[d.start.line - 1]
    if (sourceLine !== undefined) {
      const bar = paint(BLUE + BOLD, '|')
      const endColumn = d.end && d.end.line === d.start.line ? d.end.column : d.start.column + 1
      const caretCount = Math.max(1, endColumn - d.start.column)
      lines.push(`${pad} ${bar}`)
      lines.push(`${paint(BLUE + BOLD, String(d.start.line))} ${bar} ${sourceLine}`)
      lines.push(
        `${pad} ${bar} ${' '.repeat(d.start.column - 1)}${paint(severityColor, '^'.repeat(caretCount))}`,
      )
      lines.push(`${pad} ${bar}`)
    }
    if (d.hint) lines.push(...hintLines(d.hint, `${pad} `, paint(BLUE + BOLD, '=')))
    if (d.docUrl) lines.push(`${pad} ${paint(DIM, d.docUrl)}`)
  } else {
    if (d.hint) lines.push(...hintLines(d.hint, '  ', '='))
    if (d.docUrl) lines.push(`  ${paint(DIM, d.docUrl)}`)
  }

  return lines.join('\n')
}

/** 一份文档的诊断结果 */
export interface FileReport {
  path: string
  diagnostics: Diagnostic[]
}

export function countBySeverity(reports: FileReport[]): { errors: number; warnings: number } {
  let errors = 0
  let warnings = 0
  for (const report of reports) {
    for (const d of report.diagnostics) {
      if (d.severity === 'error') errors += 1
      else warnings += 1
    }
  }
  return { errors, warnings }
}
