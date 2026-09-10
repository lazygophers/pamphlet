/**
 * 选哪一套主题。优先级：CLI 的 `--theme` > frontmatter 的 `theme:` > 缺省（ADR-0046）。
 *
 * CLI 压过 frontmatter，是因为命令行是「这一次编译」的意图，
 * 而 frontmatter 是「这份文档一贯的样子」——一次性的意图应该能盖过长期设定。
 */

import { THEMES, DEFAULT_THEME, BUILTIN_THEMES, type Theme } from '@nekoleapuki/pamphlet-themes'
import { diagnostic, type Diagnostic } from './diagnostics.js'

export interface ThemeSelection {
  theme: Theme
  diagnostics: Diagnostic[]
}

export function selectTheme(options: { cli?: string; frontmatter?: string }): ThemeSelection {
  const requested = options.cli ?? options.frontmatter
  if (requested === undefined) return { theme: THEMES[DEFAULT_THEME]!, diagnostics: [] }

  const theme = THEMES[requested]
  if (theme) return { theme, diagnostics: [] }

  // 退回 default 而不是中断编译：主题错了只影响长相，内容照样是对的。
  // 但仍然是 error 而不是 warning——静默换一套主题会让你以为它生效了。
  return {
    theme: THEMES[DEFAULT_THEME]!,
    diagnostics: [
      diagnostic('DOC-106', 'error', `没有叫 ${requested} 的主题`, {
        hint: `能用的是：${BUILTIN_THEMES.join(' / ')}`,
      }),
    ],
  }
}
