/**
 * 内置主题。独立成包的理由（ADR-0031）：它是**纯数据**，
 * 使用者可能只想要一套主题而不装整个编译器。
 *
 * 三层结构见 ADR-0020 与 docs/zh/reference/theme-tokens.md：
 * 语义层（18 个）→ 元素层（30+ 个，默认从语义层派生）→ 作者只写想改的。
 * 派生只能一层：元素层不得引用元素层。
 *
 * token 清单已经定稿，但 token 文件本身随 HTML 输出一起到位（第 8-9 周）。
 */

/** 语义层的 18 个 token 名，是整套主题的根 */
export const SEMANTIC_TOKENS = [
  'bg',
  'bg-subtle',
  'fg',
  'fg-muted',
  'primary',
  'border',
  'info',
  'tip',
  'warn',
  'danger',
  'font-sans',
  'font-mono',
  'space-1',
  'space-2',
  'space-3',
  'space-4',
  'line-height',
  'radius',
] as const

export type SemanticToken = (typeof SEMANTIC_TOKENS)[number]

/** 内置主题名 */
export const BUILTIN_THEMES = ['default', 'tech-dark', 'minimal'] as const
export type BuiltinTheme = (typeof BUILTIN_THEMES)[number]
