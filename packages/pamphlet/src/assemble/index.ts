/**
 * 组装器：AST → 一本 pamphlet。施工图 docs/spec-assembler.md 已完工删除。
 *
 * 不碰硬盘：读资源靠 options.readAsset，写文件是 CLI 的事。
 */

import { createHash } from 'node:crypto'
import { assembleRuntime, LIVE_RELOAD } from '@nekoleapuki/pamphlet-runtime'
import type { Heading } from 'mdast'
import type { ParseResult } from '../parse.js'
import type { Diagnostic } from '../diagnostics.js'
import { embedAssets } from './assets.js'
import { embedFont, type FontSource } from './fonts.js'
import { removeOnce, sizeReport, type SizeReport } from './report.js'
import type { DiagramData } from '../diagrams/index.js'
import { createContext, escapeHtml, plainText, renderRoot } from './html.js'
import { renderToc } from './toc.js'
import { LIGHT, DARK, styleSheet, type ThemeTokens } from './theme.js'

export interface AssembleOptions {
  readAsset?: (path: string) => Promise<Uint8Array>
  basePath?: string
  light?: ThemeTokens
  dark?: ThemeTokens
  assetLimitBytes?: number
  embedSource?: boolean
  /** 指定一个字体文件，子集化后内嵌进产物 */
  font?: FontSource
  /** 只给 `pamphlet serve` 用：产物里多一段「源文档改了就重新加载」 */
  liveReload?: boolean
}

export const SOURCE_MARKER = 'pamphlet:source v1'

const SOURCE_PATTERN = /<!-- pamphlet:source v1 ([A-Za-z0-9+/=]+) -->/

/**
 * 从一本 pamphlet 反解出源文档。`pamphlet extract` 就是它。
 * 找不到那条注释时报错——静默返回空字符串会让人以为源文档是空的。
 */
export function extract(html: string): string {
  const match = SOURCE_PATTERN.exec(html)
  if (!match?.[1]) {
    throw new Error('这份产物没有内嵌源文档（编译时可能用了 --no-embed-source）')
  }
  return Buffer.from(match[1], 'base64').toString('utf8')
}

export interface AssembleResult {
  html: string
  diagnostics: Diagnostic[]
  report: SizeReport
}

export async function assemble(
  parsed: ParseResult,
  options: AssembleOptions = {},
): Promise<AssembleResult> {
  const diagnostics: Diagnostic[] = []
  const ctx = createContext()

  // 资源要先内嵌好，渲染正文时才有 data URI 可查
  const embedded = await embedAssets(parsed.ast, {
    ...(options.readAsset ? { readAsset: options.readAsset } : {}),
    ...(options.assetLimitBytes === undefined ? {} : { limitBytes: options.assetLimitBytes }),
  })
  diagnostics.push(...embedded.diagnostics)
  for (const [url, uri] of embedded.assets) ctx.assets.set(url, uri)
  for (const [url, reason] of embedded.failed) ctx.assetFailures.set(url, reason)

  const body = renderRoot(parsed.ast, ctx)
  // 目录必须在正文渲染之后算——那时才知道有哪些标题、哪些是 Tab 生成的
  const toc = renderToc(ctx, parsed.frontmatter.toc)
  if (toc.enabled) ctx.features.add('toc')
  const title = documentTitle(parsed)
  const lang = parsed.frontmatter.lang ?? 'zh-CN'

  // 字体要等正文渲染完才能子集化——只有这时才知道产物里到底出现了哪些字
  const font = await embedFont(options.font, `${title}${body}`, options.readAsset)
  diagnostics.push(...font.diagnostics)
  const family = font.css === '' ? undefined : options.font?.family
  const withFont = (tokens: ThemeTokens): ThemeTokens =>
    family === undefined
      ? tokens
      : { ...tokens, 'font-sans': `"${family}", ${tokens['font-sans']}` }

  const styleText = styleSheet(
    ctx.features,
    withFont(options.light ?? LIGHT),
    withFont(options.dark ?? DARK),
  )
  const css = font.css + styleText

  // ADR-0017 的严格先后：先拼出运行时（内容一变哈希就变），再算哈希，最后写进 CSP。
  // 这三步不能并行，也不能换顺序。
  const base = assembleRuntime(ctx.features)
  const script =
    options.liveReload === true ? [base, LIVE_RELOAD].filter((part) => part !== '').join('\n') : base
  const csp = contentSecurityPolicy(script, options.liveReload === true)

  const parts = [
    '<!doctype html>',
    `<html lang="${escapeHtml(lang)}">`,
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<meta http-equiv="Content-Security-Policy" content="${escapeHtml(csp)}">`,
    '<meta name="color-scheme" content="dark light">',
    `<title>${escapeHtml(title)}</title>`,
    `<style>${css}</style>`,
    '</head>',
    '<body>',
    `<main class="pf-doc">${toc.html}${body}</main>`,
    ...(script === '' ? [] : [`<script>${script}</script>`]),
    '</body>',
    '</html>',
  ]

  // 源文档存进一条 HTML 注释（ADR-0014）：注释是产物里唯一「不被执行、
  // 不被 CSP 管、不被消毒器碰」的容器，而这段东西是给 extract 命令读的，
  // 不需要浏览器参与。base64 顺带解决了源文里含 `-->` 会截断注释的问题。
  let sourceComment = ''
  if (options.embedSource !== false) {
    const encoded = Buffer.from(parsed.source, 'utf8').toString('base64')
    sourceComment = `<!-- ${SOURCE_MARKER} ${encoded} -->`
    parts.push(sourceComment)
  }

  const html = `${parts.join('\n')}\n`

  // 分项必须互不重叠、合起来铺满整个产物，「骨架」是减掉所有分项后**真的剩下**的那段文本
  const svgText = diagramSvgs(parsed.ast).join('')
  const imageText = [...embedded.assets.values()]
    .flatMap((uri) => Array(occurrences(body, uri)).fill(uri) as string[])
    .join('')
  const bodyText = removeOnce(body, [...diagramSvgs(parsed.ast), ...embedded.assets.values()])
  const report = sizeReport(html, [
    { name: '字体', text: font.css },
    { name: '内嵌图片', text: imageText },
    { name: '图表 SVG', text: svgText },
    { name: '正文 HTML', text: bodyText },
    { name: '样式', text: styleText },
    { name: '运行时', text: script },
    { name: '源文档注释', text: sourceComment },
    { name: '骨架', text: removeOnce(html, [css, body, script, sourceComment]) },
  ])

  return { html, diagnostics, report }
}

/** 图表管线渲染好的 SVG 都挂在 code 节点的 data 上 */
function diagramSvgs(ast: ParseResult['ast']): string[] {
  const found: string[] = []
  const walk = (node: { type: string; children?: unknown[]; data?: DiagramData }): void => {
    if (node.type === 'code' && node.data?.svg) found.push(node.data.svg)
    for (const child of (node.children ?? []) as typeof node[]) walk(child)
  }
  walk(ast as never)
  return found
}

function occurrences(haystack: string, needle: string): number {
  let count = 0
  let at = haystack.indexOf(needle)
  while (at >= 0) {
    count += 1
    at = haystack.indexOf(needle, at + needle.length)
  }
  return count
}

/**
 * 产物的 CSP（ADR-0017）。没有脚本时 `script-src` 写 `'none'`——
 * 那比留一个空的哈希清单更明确。
 *
 * nonce 在静态文件场景必然不可用（规范要求每次响应唯一，静态文件没有「每次响应」），
 * 所以只有哈希这一条路。实测确认 `file://` 下 meta CSP 生效、哈希白名单双向都对。
 */
function contentSecurityPolicy(script: string, liveReload = false): string {
  const scriptSrc =
    script === ''
      ? "'none'"
      : `'sha256-${createHash('sha256').update(script, 'utf8').digest('base64')}'`
  return [
    "default-src 'none'",
    'img-src data:',
    'font-src data:',
    "style-src 'unsafe-inline'",
    `script-src ${scriptSrc}`,
    // serve 下要允许那一条 EventSource 连回本地服务；正式产物里没有这一项
    ...(liveReload ? ["connect-src 'self'"] : []),
  ].join('; ')
}

function documentTitle(parsed: ParseResult): string {
  if (parsed.frontmatter.title !== undefined) return parsed.frontmatter.title
  const heading = parsed.ast.children.find(
    (node): node is Heading => node.type === 'heading' && node.depth === 1,
  )
  const text = heading ? plainText(heading.children).trim() : ''
  return text === '' ? 'pamphlet' : text
}

export { LIGHT, DARK, styleSheet, type ThemeTokens } from './theme.js'
