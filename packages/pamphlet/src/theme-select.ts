/**
 * 选哪一套主题。优先级：CLI 的 `--theme` > frontmatter 的 `theme:` > 缺省（ADR-0046）。
 *
 * CLI 压过 frontmatter，是因为命令行是「这一次编译」的意图，
 * 而 frontmatter 是「这份文档一贯的样子」——一次性的意图应该能盖过长期设定。
 */

import {
  THEMES,
  DEFAULT_THEME,
  BUILTIN_THEMES,
  isThemeName,
  type Theme,
} from '@nekoleapuki/pamphlet-themes'
import { diagnostic, type Diagnostic } from './diagnostics.js'

export interface ThemeSelection {
  theme: Theme
  diagnostics: Diagnostic[]
}

/** 名字排成一列，说明才对得齐；主题名都是 ASCII，`padEnd` 数出来的宽度就是终端宽度 */
const NAME_WIDTH = Math.max(...BUILTIN_THEMES.map((name) => name.length)) + 2

/**
 * 十二套主题挤成一行没人读得完，所以一套一行、名字对齐成一列。
 * 每行后面跟着这套主题的用途说明——作者要的不是「有哪些名字」，
 * 是「我这份文档该写哪个」，光有名字他还得去翻文档。
 *
 * 只印中文：编译器的诊断全是中文的，单挑主题说明用英文会得到半中半英的一句（ADR-0047）。
 */
function availableThemes(): string {
  return [
    `能用的是这 ${BUILTIN_THEMES.length} 套：`,
    ...BUILTIN_THEMES.map((name) => `  ${name.padEnd(NAME_WIDTH)}${THEMES[name].purpose.zh}`),
  ].join('\n')
}

export function selectTheme(options: { cli?: string; frontmatter?: string }): ThemeSelection {
  const requested = options.cli ?? options.frontmatter
  if (requested === undefined) return { theme: THEMES[DEFAULT_THEME], diagnostics: [] }

  if (isThemeName(requested)) return { theme: THEMES[requested], diagnostics: [] }

  // 退回 default 而不是中断编译：主题错了只影响长相，内容照样是对的。
  // 但仍然是 error 而不是 warning——静默换一套主题会让你以为它生效了。
  return {
    theme: THEMES[DEFAULT_THEME],
    diagnostics: [
      diagnostic('DOC-106', 'error', `没有叫 ${requested} 的主题`, {
        hint: availableThemes(),
      }),
    ],
  }
}
