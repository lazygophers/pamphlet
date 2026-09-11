/**
 * 结构化图表指令 → 图表围栏。
 *
 * 这一步放在解析之后、图表管线之前：把 `:::flow` 这样的指令节点**原地换成**
 * 一个 ` ```mermaid ` 代码节点。换完之后整条管线（收集、缓存、渲染、换色、
 * 体积警告、失败占位）一个字都不用改——自有写法和围栏写法从这里开始就是同一条路。
 *
 * 为什么读原文而不是读 mdast 节点：指令体会被当成 Markdown 解析，
 * `nodes:` 底下缩进两格的那几行会被折进一个段落，取回来的文本和作者写的不一样。
 * 按位置从源文档里切原文，行号也才能和作者看到的对上。
 */

import type { Root, RootContent, Code } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import type { DiagramData } from '../index.js'
import type { Diagnostic } from '../../diagnostics.js'
import { diagnostic } from '../../diagnostics.js'
import { parseStructuredBody } from './parse.js'
import {
  isStructuredKind,
  STRUCTURED_ATTRIBUTES,
  translate,
  type StructuredKind,
} from './kinds.js'

export {
  STRUCTURED_KINDS,
  STRUCTURED_ATTRIBUTES,
  SELF_DRAWN_KINDS,
  isStructuredKind,
} from './kinds.js'
export type { StructuredKind } from './kinds.js'

/**
 * 把树里所有结构化图表指令换成 mermaid 围栏节点。
 * 翻译不出来的原地留下，并给诊断——文档照常编译，那张图的位置留占位框。
 */
export function expandStructuredDiagrams(ast: Root, source: string): Diagnostic[] {
  const lines = source.split('\n')
  const diagnostics: Diagnostic[] = []

  const walk = (parent: { children: RootContent[] }): void => {
    parent.children.forEach((node, index) => {
      if (node.type === 'containerDirective' && isStructuredKind(node.name)) {
        const replaced = expandOne(node as ContainerDirective, node.name, lines, diagnostics)
        if (replaced) parent.children[index] = replaced
        return
      }
      if ('children' in node && Array.isArray((node as { children: unknown }).children)) {
        walk(node as { children: RootContent[] })
      }
    })
  }

  walk(ast)
  return diagnostics
}

function expandOne(
  node: ContainerDirective,
  kind: StructuredKind,
  lines: readonly string[],
  diagnostics: Diagnostic[],
): Code | undefined {
  const start = node.position?.start
  const end = node.position?.end
  if (!start || !end) return undefined

  // 指令体是开头 `:::` 那行的下一行，到结尾 `:::` 那行的上一行
  const bodyFirstLine = start.line + 1
  const bodyLastLine = end.line - 1
  const body = lines.slice(bodyFirstLine - 1, bodyLastLine).join('\n')

  const attrs = (node.attributes ?? {}) as Record<string, string | null | undefined>
  const known = STRUCTURED_ATTRIBUTES[kind]
  for (const name of Object.keys(attrs)) {
    // class 与 id 是 directive 语法原生的，别处也不报，这里保持一致
    if (name === 'class' || name === 'id' || known.includes(name)) continue
    diagnostics.push(
      diagnostic('DIR-207', 'warning', `${kind} 不认识属性 ${name}，已忽略`, {
        start: { line: start.line, column: start.column },
        hint: known.length === 0 ? `${kind} 不接受任何属性` : `它认识的是：${known.join(' / ')}`,
      }),
    )
  }

  const parsed = parseStructuredBody(body, bodyFirstLine)
  const label = labelOf(node)
  const result = translate(kind, {
    body: parsed,
    attrs,
    at: { line: start.line, column: start.column },
    ...(label !== undefined && { label }),
  })
  diagnostics.push(...result.diagnostics)

  // 自己画的那四种：SVG 已经好了，挂在 data 上直接内联。
  // 语言名故意不是围栏语言，图表管线就不会再去渲染它一遍
  if (result.svg !== undefined) {
    return codeNode(node, 'pf-svg', '', { svg: result.svg })
  }

  // 翻译不出来时也换成一个节点：那张图的位置留占位框写明原因，
  // 指令节点留在树里会被后面的校验当成未知指令，再多报一条没用的 DIR-201
  if (result.mermaid === undefined) {
    const reason =
      result.diagnostics.find((d) => d.severity === 'error')?.message ?? `${kind} 写错了`
    return codeNode(node, 'pf-svg', body, { failed: { reason } })
  }

  return codeNode(node, 'mermaid', result.mermaid)
}

/**
 * 造一个替换用的代码节点。`data` 走图表管线那份 `DiagramData`，
 * 组装器取的就是它——这里断言一次，别处不再手搓 `as Code`。
 */
function codeNode(
  node: ContainerDirective,
  lang: string,
  value: string,
  data?: DiagramData,
): Code {
  return {
    type: 'code',
    lang,
    value,
    position: node.position,
    ...(data !== undefined && { data: data as Code['data'] }),
  }
}

/** 指令标题：mdast 把它放在带 directiveLabel 的第一个子节点里 */
function labelOf(node: ContainerDirective): string | undefined {
  const first = node.children[0]
  if (!first || first.type !== 'paragraph') return undefined
  const data = first.data as { directiveLabel?: boolean } | undefined
  if (!data?.directiveLabel) return undefined
  const text = first.children
    .map((child) => ('value' in child ? String(child.value) : ''))
    .join('')
    .trim()
  return text === '' ? undefined : text
}
