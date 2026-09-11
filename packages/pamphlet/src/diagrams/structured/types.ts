/** 翻译器的输入输出。单独一个文件，免得 kinds.ts 和 svg.ts 互相 import 成环 */

import type { Diagnostic, Point } from '../../diagnostics.js'
import type { StructuredBody } from './parse.js'

export interface TranslateInput {
  body: StructuredBody
  /** `[指令标题]`，成为图的标题 */
  label?: string
  attrs: Record<string, string | null | undefined>
  /** 指令开头的位置，块缺失这类诊断指到这里 */
  at: Point
}

export interface TranslateResult {
  /** 翻译出来的 Mermaid 图源；翻译不出来时是 undefined */
  mermaid?: string
  /** 自己画的那四种图直接给 SVG，不经过 Mermaid */
  svg?: string
  diagnostics: Diagnostic[]
}
