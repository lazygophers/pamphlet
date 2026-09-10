/**
 * 源文档 → AST + 诊断。
 * 这一层不产出 HTML——带 HTML 输出的版本会在它之后接上组装器。
 */

import { fromMarkdown } from 'mdast-util-from-markdown'
import { directive } from 'micromark-extension-directive'
import { directiveFromMarkdown } from 'mdast-util-directive'
import { gfm } from 'micromark-extension-gfm'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { frontmatter } from 'micromark-extension-frontmatter'
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter'
import type { Root, RootContent, Yaml } from 'mdast'

import type { Frontmatter } from './ast.js'
import { isDirective, validateDirective, type AnyDirective } from './directives.js'
import { diagnostic, type Diagnostic, type Point } from './diagnostics.js'
import { parseFrontmatter } from './frontmatter.js'
import { findUnclosedDirectives } from './unclosed.js'

export interface ParseResult {
  ast: Root
  frontmatter: Frontmatter
  diagnostics: Diagnostic[]
  /** 原始源文本。组装器要它做源文档内嵌（ADR-0014）；
   *  放在这里而不是让调用方另传，是为了不可能出现「源文与 AST 不是同一份」。 */
  source: string
}

export function parse(source: string): ParseResult {
  // 未闭合检测必须在解析之前——解析器会把它悄悄补上（ADR-0035）
  const diagnostics: Diagnostic[] = findUnclosedDirectives(source)

  const ast = fromMarkdown(source, {
    extensions: [gfm(), directive(), frontmatter(['yaml'])],
    mdastExtensions: [gfmFromMarkdown(), directiveFromMarkdown(), frontmatterFromMarkdown(['yaml'])],
  })

  const yamlNode = ast.children.find((node): node is Yaml => node.type === 'yaml')
  let parsedFrontmatter: Frontmatter = {}
  if (yamlNode) {
    // yaml 节点从 `---` 那一行开始，而 yamlText 的第一行是它的下一行
    const start: Point = { line: (yamlNode.position?.start.line ?? 1) + 1, column: 1 }
    const result = parseFrontmatter(yamlNode.value, start)
    parsedFrontmatter = result.frontmatter
    diagnostics.push(...result.diagnostics)
  }

  diagnostics.push(...validateTree(ast))

  // 按位置排序：作者从上往下读文档，诊断也该从上往下出现
  diagnostics.sort((a, b) => {
    const lineDiff = (a.start?.line ?? 0) - (b.start?.line ?? 0)
    return lineDiff !== 0 ? lineDiff : (a.start?.column ?? 0) - (b.start?.column ?? 0)
  })

  return { ast, frontmatter: parsedFrontmatter, diagnostics, source }
}

/** 遍历整棵树，校验指令用法与图表围栏语言名 */
function validateTree(ast: Root): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  const walk = (node: RootContent, ancestors: AnyDirective[]): void => {
    // 图表围栏在这里不报任何东西：渲染归图表管线管，
    // 引擎没装、画不出来、颜色换不掉都由 DIAG-3xx 负责报
    if (isDirective(node)) diagnostics.push(...validateDirective(node, ancestors))

    const children = 'children' in node ? (node.children as RootContent[] | undefined) : undefined
    if (!children) return
    const nextAncestors = isDirective(node) ? [...ancestors, node] : ancestors
    for (const child of children) walk(child, nextAncestors)
  }

  for (const child of ast.children) walk(child, [])
  return diagnostics
}
