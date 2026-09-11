/**
 * Pamphlet 的 AST 是 mdast 的超集：mdast 原生节点全部保留，
 * 额外认识容器指令与图表围栏。
 *
 * 0.x 期间 AST 结构不稳定（ADR-0006），所以这里的类型不对外承诺兼容。
 */

import type { Root as MdastRoot, RootContent } from 'mdast'

/**
 * 全部容器指令。语法规则见 ADR-0038：
 * `[label]` 永远是给读者看的**指令标题**，`{attrs}` 永远是给编译器看的参数。
 */
export const KNOWN_DIRECTIVES = [
  'tabs',
  'tab',
  'collapse',
  'steps',
  'reveal',
  'info',
  'tip',
  'warn',
  'danger',
] as const
export type KnownDirective = (typeof KNOWN_DIRECTIVES)[number]

/** 四种提示块（ADR-0024）。`callout` 是它们的统称，不是指令名。 */
export const CALLOUT_DIRECTIVES = ['info', 'tip', 'warn', 'danger'] as const
export type CalloutDirective = (typeof CALLOUT_DIRECTIVES)[number]

export function isCallout(name: string): name is CalloutDirective {
  return (CALLOUT_DIRECTIVES as readonly string[]).includes(name)
}

/** 指令标题必填的那两个：没有它就没法点开或切换 */
export const LABEL_REQUIRED = ['tab', 'collapse'] as const

/** `:::reveal{effect=…}` 认识的效果名，缺省 fade-up */
export const REVEAL_EFFECTS = ['fade-up', 'fade-in', 'slide-left', 'slide-right'] as const
export type RevealEffect = (typeof REVEAL_EFFECTS)[number]
export const DEFAULT_REVEAL_EFFECT: RevealEffect = 'fade-up'

/** 每个指令认识的属性名。不在表里的属性给诊断，而不是静默忽略。 */
export const DIRECTIVE_ATTRIBUTES: Record<KnownDirective, readonly string[]> = {
  tabs: [],
  tab: ['default'],
  collapse: ['open'],
  steps: [],
  reveal: ['effect'],
  info: [],
  tip: [],
  warn: [],
  danger: [],
}

/** 图表围栏认领的语言名，全部是引擎原生名（ADR-0019）。 */
export const FENCE_LANGUAGES = [
  'mermaid',
  'd2',
  'dot',
  'math',
  'vega-lite',
  'wavedrom',
  'bytefield',
  'plantuml',
] as const
export type FenceLanguage = (typeof FENCE_LANGUAGES)[number]

export function isFenceLanguage(lang: string): lang is FenceLanguage {
  return (FENCE_LANGUAGES as readonly string[]).includes(lang)
}

export function isKnownDirective(name: string): name is KnownDirective {
  return (KNOWN_DIRECTIVES as readonly string[]).includes(name)
}

/** frontmatter 的目录配置（ADR-0022） */
export interface TocConfig {
  enable?: boolean
  /** 收到第几级标题 */
  deep?: number
  /** 目录是否跳过 Tab 生成的标题，默认 true */
  skipTabs?: boolean
  /** side = 常驻侧边菜单（缺省，桌面优先）；top = 目录放在正文开头 */
  position?: 'top' | 'side'
}

/** 声明式自定义引擎（ADR-0007、ADR-0030）：图源走 stdin，SVG 走 stdout */
export interface EngineDeclaration {
  langs: string[]
  command?: string[]
  http?: string
}

/** frontmatter 里认识的全部字段（ADR-0030：没有配置文件，配置只在这里） */
export interface Frontmatter {
  /** 这份文档要求的最低编译器语法版本；不填等于不做检查（ADR-0010） */
  spec?: number
  title?: string
  theme?: string
  lang?: string
  toc?: TocConfig
  engines?: Record<string, EngineDeclaration>
}

export const FRONTMATTER_KEYS: readonly (keyof Frontmatter)[] = [
  'spec',
  'title',
  'theme',
  'lang',
  'toc',
  'engines',
]

export const TOC_KEYS: readonly (keyof TocConfig)[] = ['enable', 'deep', 'skipTabs', 'position']

/** 本编译器支持的语法版本 */
export const SUPPORTED_SPEC = 1

export type PamphletRoot = MdastRoot
export type PamphletContent = RootContent
