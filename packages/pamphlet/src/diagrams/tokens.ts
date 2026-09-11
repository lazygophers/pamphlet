/**
 * 图表颜色的哨兵机制。
 *
 * 为什么需要它：图表引擎输出的 SVG 里颜色是硬编码的（实测 Mermaid 与 d2 都是，
 * 都没有 currentColor、没有 var()、没有 @media）。ADR-0016 的做法是构建期把这些
 * 色值替换成带兜底值的 CSS 变量，于是切主题不必重新渲染图表。
 *
 * 怎么保证不漏：渲染时先把一组**现实中不会出现的哨兵色**当作引擎的主题色喂进去，
 * 再在输出里把哨兵换成对应的 CSS 变量。这样「哪个颜色对应哪个 token」不靠人维护一张表，
 * 而是渲染前就定好的。输出里出现非哨兵的色值 = 引擎有硬编码，给一条警告把它报出来。
 *
 * 只处理十六进制写法。为了让这一条成立，喂进去的哨兵必须是十六进制——
 * 实测证明这样能把引擎输出里的 CSS 具名色（`fill:black`）挤掉。
 */

/** 图表专用的六个 token（docs/zh/reference/theme-tokens.md 的图表层） */
export const DIAGRAM_TOKENS = [
  'bg',
  'line',
  'fill',
  'text',
  'accent',
  'muted',
] as const
export type DiagramToken = (typeof DIAGRAM_TOKENS)[number]

/**
 * 哨兵色值。取 `#ff00xx` 这一段是因为它是刺眼的洋红，
 * 真实图表里不会有人用，肉眼一看就知道是漏替换了。
 */
export const SENTINELS: Record<DiagramToken, string> = {
  bg: '#ff0001',
  line: '#ff0002',
  fill: '#ff0003',
  text: '#ff0004',
  accent: '#ff0005',
  muted: '#ff0006',
}

export const CSS_VARIABLE: Record<DiagramToken, string> = {
  bg: '--pf-diagram-bg',
  line: '--pf-diagram-line',
  fill: '--pf-diagram-fill',
  text: '--pf-diagram-text',
  accent: '--pf-diagram-accent',
  muted: '--pf-diagram-muted',
}

/** 兜底值：变量没定义或替换漏掉时用它，保证图至少还是能看的 */
export const FALLBACK: Record<DiagramToken, string> = {
  bg: '#ffffff',
  line: '#d0d7de',
  fill: '#f6f8fa',
  text: '#1f2328',
  accent: '#2d6cdf',
  muted: '#656d76',
}

const SENTINEL_TO_TOKEN = new Map<string, DiagramToken>(
  DIAGRAM_TOKENS.map((token) => [SENTINELS[token].toLowerCase(), token]),
)

export function tokenOfSentinel(hex: string): DiagramToken | undefined {
  return SENTINEL_TO_TOKEN.get(hex.toLowerCase())
}

/**
 * 引擎硬编码的色值。
 *
 * 黑与白语义明确，直接归到文字色与底色。下面那几个灰是 Mermaid 写死在
 * 各图种样式表里的**字符串**，不是主题变量——钉不住，只能在这里认领
 * （实测于 mermaid@11.17.2：类图的 `#666` `#999` `#eaeaea`、
 * 状态图的 `#e0e0e0`、连线标记的 `rgba(185,185,185,1)`）。
 *
 * 代价说在前面：这张表是按色值认的，作者自己在图里写 `#999` 也会被换掉。
 * 这是已有的取舍（`#000` / `#fff` 一直如此）——换错色只是颜色不同，
 * 不换的后果是暗色底上一行看不见的字。
 */
export const HARDCODED_ALIASES: Record<string, DiagramToken> = {
  '#000': 'text',
  '#000000': 'text',
  '#fff': 'bg',
  '#ffffff': 'bg',
  '#666': 'muted',
  '#666666': 'muted',
  '#999': 'muted',
  '#999999': 'muted',
  '#777': 'muted',
  '#777777': 'muted',
  '#b9b9b9': 'line',
  '#dedede': 'line',
  '#e0e0e0': 'fill',
  '#eaeaea': 'fill',
  '#efefef': 'fill',
  // base 主题自己的 primaryColor，某些图种绕过 themeVariables 直接读它
  '#fff4dd': 'fill',
  // C4 图里关系文字与边界框的兜底色，写死在渲染器里
  '#444444': 'muted',
  // 架构图默认图标本身是一段写死颜色的 SVG，连图标带这个蓝一起塞进输出
  '#087ebf': 'accent',
}
