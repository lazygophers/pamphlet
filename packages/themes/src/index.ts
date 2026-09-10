/**
 * 内置主题。独立成包的理由（ADR-0031）：它是**纯数据**，
 * 使用者可能只想要一套主题而不装整个编译器——所以这个包不依赖编译器。
 *
 * 一套主题两部分（ADR-0046）：
 * - `light` / `dark`：18 个语义 token 的值，管配色、字体、间距、圆角
 * - `css`：追加在基础版式之后的一段样式，管布局和各指令的形态
 *
 * `css` 是「追加覆盖」而不是「整份替换」，所以主题只写想改的那几条，
 * 没写到的地方自动沿用基础版式——包括无 JavaScript 时的降级行为（ADR-0015）。
 * 那条降级承诺对每一套主题都成立，不是可以拿来换视觉效果的东西。
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

/** 一套配色：18 个 token 各一个值 */
export type ThemeTokens = Record<SemanticToken, string>

export interface Theme {
  /** frontmatter 的 `theme:` 和 CLI 的 `--theme` 填的就是它 */
  name: string
  /** 一句话说清它适合哪一类文档，诊断提示和文档站都从这里取（ADR-0047） */
  label: string
  /**
   * `label` 的英文版。文档站是双语的，而诊断只说中文——
   * 两边都指着同一条数据，就必须两种语言都在这条数据里（ADR-0047）。
   */
  labelEn: string
  light: ThemeTokens
  dark: ThemeTokens
  /** 追加在基础版式之后的样式。空字符串表示这套主题只换配色 */
  css: string
}

const SANS =
  '"PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei", "Source Han Sans SC", "Noto Sans CJK SC", sans-serif'
const MONO = 'ui-monospace, "SF Mono", Consolas, monospace'
const SERIF =
  '"Songti SC", "Source Han Serif SC", "Noto Serif CJK SC", Georgia, "Times New Roman", serif'

/** 间距、行高、圆角这几档大多数主题不动，抽出来免得每套抄一遍 */
const METRICS = {
  'space-1': '4px',
  'space-2': '8px',
  'space-3': '16px',
  'space-4': '32px',
  'line-height': '1.75',
  radius: '6px',
} as const

// ── default ──────────────────────────────────────────────────────────────
// GitHub 那套中性色。它是缺省值，所以要最不容易出错、最不抢内容。

const defaultLight: ThemeTokens = {
  bg: '#ffffff',
  'bg-subtle': '#f6f8fa',
  fg: '#1f2328',
  'fg-muted': '#656d76',
  primary: '#2d6cdf',
  border: '#d0d7de',
  info: '#0969da',
  tip: '#1a7f37',
  warn: '#9a6700',
  danger: '#cf222e',
  'font-sans': SANS,
  'font-mono': MONO,
  ...METRICS,
}

const defaultDark: ThemeTokens = {
  ...defaultLight,
  bg: '#0d1117',
  'bg-subtle': '#161b22',
  fg: '#e6edf3',
  'fg-muted': '#9198a1',
  primary: '#58a6ff',
  border: '#30363d',
  info: '#4493f8',
  tip: '#3fb950',
  warn: '#d29922',
  danger: '#f85149',
}

// ── minimal ──────────────────────────────────────────────────────────────
// 只有黑白灰和一条细线。窄栏、大留白、衬线标题。

const minimalLight: ThemeTokens = {
  ...defaultLight,
  bg: '#fdfdfc',
  'bg-subtle': '#f4f4f2',
  fg: '#1a1a18',
  'fg-muted': '#78786f',
  primary: '#1a1a18',
  border: '#e0e0dc',
  info: '#5a5a52',
  tip: '#3f6b4a',
  warn: '#8a6a2a',
  danger: '#9a3b32',
  radius: '0px',
  'line-height': '1.85',
}

const minimalDark: ThemeTokens = {
  ...minimalLight,
  bg: '#141412',
  'bg-subtle': '#1d1d1a',
  fg: '#eceae4',
  'fg-muted': '#9a9a90',
  primary: '#eceae4',
  border: '#2e2e2a',
}

const minimalCss = `
.pf-doc{max-width:56rem;padding:calc(var(--pf-space-4) * 2) var(--pf-space-4)}
h1,h2,h3{font-family:${SERIF};font-weight:500;letter-spacing:.01em}
h1{font-size:2.4rem;margin-bottom:var(--pf-space-4)}
h2{font-size:1.5rem;border-top:1px solid var(--pf-border);padding-top:var(--pf-space-3);margin-top:calc(var(--pf-space-4) * 1.5)}
a{text-decoration:underline;text-underline-offset:.2em}
/* 提示块退成一条左线加一行小标题，不要底色 */
.pf-callout{background:none;border-left-width:1px;border-radius:0;padding:var(--pf-space-2) 0 var(--pf-space-2) var(--pf-space-3)}
.pf-callout-title{font-family:${SERIF};font-weight:500;font-size:.95em}
/* Tab 用小型大写字母的文字按钮，不要下划线条 */
.pf-tab-list{border-bottom:1px solid var(--pf-border);gap:var(--pf-space-3)}
.pf-tab-button{padding:var(--pf-space-2) 0;font-size:.85em;letter-spacing:.08em;text-transform:uppercase}
.pf-collapse{border:none;border-top:1px solid var(--pf-border);border-radius:0;padding-left:0;padding-right:0}
/* 步骤改成左侧细线加数字，不要实心圆 */
.pf-steps li::before{background:none;color:var(--pf-fg-muted);border:1px solid var(--pf-border);border-radius:0;font-size:.7em}
.pf-toc{background:none;border-top:1px solid var(--pf-border);border-bottom:1px solid var(--pf-border);border-radius:0;padding:var(--pf-space-3) 0}
table{font-size:.92em}
th{background:none;border-bottom:2px solid var(--pf-border);font-weight:500}
td,th{border-left:none;border-right:none}
`.trim()

// ── tech-dark ────────────────────────────────────────────────────────────
// 暗色技术风。等宽标题、方角、锐利的强调色。

const techDark: ThemeTokens = {
  bg: '#0b0e14',
  'bg-subtle': '#131721',
  fg: '#d3d8e0',
  'fg-muted': '#7b8496',
  primary: '#4dd0e1',
  border: '#232a38',
  info: '#4dd0e1',
  tip: '#7ee081',
  warn: '#ffb454',
  danger: '#ff6b6b',
  'font-sans': SANS,
  'font-mono': MONO,
  ...METRICS,
  radius: '3px',
  'line-height': '1.7',
}

const techLight: ThemeTokens = {
  ...techDark,
  bg: '#f7f9fb',
  'bg-subtle': '#eef2f6',
  fg: '#1b2230',
  'fg-muted': '#5b6577',
  primary: '#0e7c8a',
  border: '#d3dae3',
  info: '#0e7c8a',
  tip: '#2f7d3a',
  warn: '#a56a10',
  danger: '#c0392b',
}

const techCss = `
.pf-doc{max-width:84rem}
h1,h2,h3,h4{font-family:var(--pf-font-mono);font-weight:600;letter-spacing:-.01em}
h2::before{content:"## ";color:var(--pf-primary);opacity:.55}
h3::before{content:"### ";color:var(--pf-primary);opacity:.4}
/* 提示块做成整块底色加顶部标记条，四种颜色分得开 */
.pf-callout{border-left:none;border-top:2px solid var(--pf-border);background:var(--pf-bg-subtle);border-radius:0 0 var(--pf-radius) var(--pf-radius)}
.pf-callout-title{font-family:var(--pf-font-mono);font-size:.8em;letter-spacing:.1em;text-transform:uppercase}
.pf-callout-info{border-top-color:var(--pf-info)}.pf-callout-info .pf-callout-title{color:var(--pf-info)}
.pf-callout-tip{border-top-color:var(--pf-tip)}.pf-callout-tip .pf-callout-title{color:var(--pf-tip)}
.pf-callout-warn{border-top-color:var(--pf-warn)}.pf-callout-warn .pf-callout-title{color:var(--pf-warn)}
.pf-callout-danger{border-top-color:var(--pf-danger)}.pf-callout-danger .pf-callout-title{color:var(--pf-danger)}
/* Tab 做成方形胶囊 */
.pf-tab-list{border-bottom:1px solid var(--pf-border);gap:0}
.pf-tab-button{font-family:var(--pf-font-mono);font-size:.85em;border:1px solid transparent;border-bottom:none;margin-bottom:-1px}
.pf-tab-button[aria-selected="true"]{background:var(--pf-bg-subtle);border-color:var(--pf-border);border-bottom-color:var(--pf-bg-subtle)}
.pf-collapse{background:var(--pf-bg-subtle);border-color:var(--pf-border)}
.pf-collapse>summary{font-family:var(--pf-font-mono);font-size:.9em}
.pf-steps li::before{border-radius:3px;font-family:var(--pf-font-mono);background:var(--pf-bg-subtle);color:var(--pf-primary);border:1px solid var(--pf-primary)}
pre{border:1px solid var(--pf-border)}
th{font-family:var(--pf-font-mono);font-size:.85em;letter-spacing:.05em;text-transform:uppercase}
`.trim()

// ── editorial ────────────────────────────────────────────────────────────
// 编辑部。大号衬线标题、章节数字、细分隔线、单一强调色，像一本杂志的内页。

const editorialLight: ThemeTokens = {
  bg: '#fffefb',
  'bg-subtle': '#f6f3ec',
  fg: '#191713',
  'fg-muted': '#6f6a60',
  primary: '#9a2b1f',
  border: '#e2ddd2',
  info: '#3a5f8a',
  tip: '#3f6b45',
  warn: '#8a6320',
  danger: '#9a2b1f',
  'font-sans': SANS,
  'font-mono': MONO,
  ...METRICS,
  'line-height': '1.8',
  radius: '0px',
}

const editorialDark: ThemeTokens = {
  ...editorialLight,
  bg: '#16140f',
  'bg-subtle': '#1f1c16',
  fg: '#f0ebe0',
  'fg-muted': '#a09889',
  primary: '#e2705d',
  border: '#2f2b23',
  info: '#7ba3d0',
  tip: '#83b58a',
  danger: '#e2705d',
}

const editorialCss = `
.pf-layout{grid-template-columns:14rem minmax(0,1fr);gap:calc(var(--pf-space-4) * 2);max-width:80rem}
h1{font-family:${SERIF};font-size:3.2rem;font-weight:400;line-height:1.1;letter-spacing:-.02em;margin-bottom:var(--pf-space-4)}
h1::after{content:"";display:block;width:4rem;border-top:3px solid var(--pf-primary);margin-top:var(--pf-space-3)}
h2{font-family:${SERIF};font-size:1.9rem;font-weight:400;counter-increment:pf-h2;border-top:1px solid var(--pf-border);padding-top:var(--pf-space-3);margin-top:calc(var(--pf-space-4) * 1.6)}
h2::before{content:counter(pf-h2,decimal-leading-zero);display:block;font-family:${MONO};font-size:.7rem;letter-spacing:.2em;color:var(--pf-primary);margin-bottom:var(--pf-space-2)}
h3{font-family:${SERIF};font-weight:600;font-size:1.25rem}
body{counter-reset:pf-h2}
.pf-doc>p:first-of-type{font-family:${SERIF};font-size:1.2rem;color:var(--pf-fg-muted)}
/* 提示块：整块换成一段带左侧标签的旁注 */
.pf-callout{background:none;border:none;border-left:1px solid var(--pf-border);padding:var(--pf-space-1) 0 var(--pf-space-1) var(--pf-space-4);position:relative}
.pf-callout-title{font-family:${MONO};font-size:.68rem;letter-spacing:.18em;text-transform:uppercase;color:var(--pf-primary);font-weight:400}
.pf-callout-info .pf-callout-title{color:var(--pf-info)}
.pf-callout-tip .pf-callout-title{color:var(--pf-tip)}
.pf-callout-warn .pf-callout-title{color:var(--pf-warn)}
.pf-callout-danger .pf-callout-title{color:var(--pf-danger)}
.pf-callout::before{content:"";position:absolute;left:-1px;top:0;width:1px;height:2.2rem;background:var(--pf-primary)}
/* Tab 做成报头式的横排小标题 */
.pf-tab-list{border-bottom:2px solid var(--pf-fg);gap:var(--pf-space-4)}
.pf-tab-button{padding:var(--pf-space-2) 0;font-family:${MONO};font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;border-bottom:none}
.pf-tab-button[aria-selected="true"]{color:var(--pf-primary)}
.pf-steps li::before{background:none;border:1px solid var(--pf-primary);color:var(--pf-primary);font-family:${SERIF};font-size:.85em}
.pf-collapse{border:none;border-top:1px solid var(--pf-border);padding-left:0;padding-right:0}
.pf-collapse>summary{font-family:${MONO};font-size:.72rem;letter-spacing:.16em;text-transform:uppercase}
blockquote{border-left:none;font-family:${SERIF};font-size:1.35rem;line-height:1.5;text-align:center;padding:var(--pf-space-4) var(--pf-space-4);border-top:1px solid var(--pf-border);border-bottom:1px solid var(--pf-border);color:var(--pf-fg)}
th{background:none;border:none;border-bottom:2px solid var(--pf-fg);font-family:${MONO};font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;font-weight:400}
td{border:none;border-bottom:1px solid var(--pf-border)}
.pf-toc-side a{font-family:${MONO};font-size:.72rem;letter-spacing:.08em;text-transform:uppercase}
`.trim()

// ── console ──────────────────────────────────────────────────────────────
// 控制台。等宽为骨、高密度、状态色，像一块盯着看的面板。

const consoleDark: ThemeTokens = {
  bg: '#0a0a0b',
  'bg-subtle': '#141416',
  fg: '#e4e4e7',
  'fg-muted': '#8a8a93',
  primary: '#f0f0f2',
  border: '#26262b',
  info: '#5b9cf8',
  tip: '#3fd68c',
  warn: '#f2b544',
  danger: '#f2585b',
  'font-sans': MONO,
  'font-mono': MONO,
  ...METRICS,
  'line-height': '1.65',
  radius: '4px',
}

const consoleLight: ThemeTokens = {
  ...consoleDark,
  bg: '#fcfcfd',
  'bg-subtle': '#f2f2f4',
  fg: '#18181b',
  'fg-muted': '#6b6b74',
  primary: '#18181b',
  border: '#e2e2e6',
  info: '#2563c9',
  tip: '#12885a',
  warn: '#a3701a',
  danger: '#c8353a',
}

const consoleCss = `
.pf-layout{grid-template-columns:13rem minmax(0,1fr);gap:0;max-width:90rem}
.pf-toc-side{border-right:1px solid var(--pf-border);padding-right:var(--pf-space-3)}
.pf-toc-side a{font-size:.78rem;border-radius:0;border-left:2px solid transparent;padding-left:var(--pf-space-2)}
.pf-toc-side a:hover{border-left-color:var(--pf-info);background:var(--pf-bg-subtle)}
.pf-layout .pf-doc{padding-left:var(--pf-space-4)}
h1{font-size:1.9rem;font-weight:600;letter-spacing:-.02em}
h2{font-size:1.1rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--pf-fg-muted);border-bottom:1px solid var(--pf-border);padding-bottom:var(--pf-space-2)}
h3{font-size:.95rem;font-weight:600}
/* 提示块：左侧一条状态色 + 一个方括号标签，密度优先 */
.pf-callout{background:var(--pf-bg-subtle);border-left:2px solid var(--pf-border);border-radius:0 var(--pf-radius) var(--pf-radius) 0;padding:var(--pf-space-2) var(--pf-space-3);font-size:.9em}
.pf-callout-title{font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;font-weight:700}
.pf-callout-info{border-left-color:var(--pf-info)}.pf-callout-info .pf-callout-title{color:var(--pf-info)}
.pf-callout-tip{border-left-color:var(--pf-tip)}.pf-callout-tip .pf-callout-title{color:var(--pf-tip)}
.pf-callout-warn{border-left-color:var(--pf-warn)}.pf-callout-warn .pf-callout-title{color:var(--pf-warn)}
.pf-callout-danger{border-left-color:var(--pf-danger)}.pf-callout-danger .pf-callout-title{color:var(--pf-danger)}
.pf-callout-title::before{content:"[ "}.pf-callout-title::after{content:" ]"}
/* Tab 做成分段控件 */
.pf-tab-list{border-bottom:none;gap:0;background:var(--pf-bg-subtle);border:1px solid var(--pf-border);border-radius:var(--pf-radius);padding:2px;display:inline-flex}
.pf-tab-button{border-bottom:none;border-radius:calc(var(--pf-radius) - 2px);font-size:.82rem;padding:var(--pf-space-1) var(--pf-space-3)}
.pf-tab-button[aria-selected="true"]{background:var(--pf-bg);box-shadow:0 1px 2px rgba(0,0,0,.25)}
.pf-steps li{margin-bottom:var(--pf-space-2)}
.pf-steps li::before{border-radius:var(--pf-radius);width:20px;height:20px;font-size:.7em;background:var(--pf-bg-subtle);color:var(--pf-fg-muted);border:1px solid var(--pf-border)}
.pf-collapse{background:var(--pf-bg-subtle);padding:var(--pf-space-2) var(--pf-space-3)}
.pf-collapse>summary{font-size:.85rem;text-transform:uppercase;letter-spacing:.08em}
table{font-size:.85em}
th{font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--pf-fg-muted);font-weight:600}
th,td{padding:var(--pf-space-1) var(--pf-space-2);border-color:var(--pf-border)}
pre{border:1px solid var(--pf-border);font-size:.85em}
blockquote{border-left-width:2px;font-size:.9em}
`.trim()

// ── paper ────────────────────────────────────────────────────────────────
// 学术。窄正文列 + 宽边注区、编号标题、无圆角，像一篇排好版的论文。

const paperLight: ThemeTokens = {
  bg: '#fffffd',
  'bg-subtle': '#f7f7f4',
  fg: '#111111',
  'fg-muted': '#666660',
  primary: '#0b4f9e',
  border: '#dededa',
  info: '#0b4f9e',
  tip: '#2f6b3f',
  warn: '#8a6510',
  danger: '#a32b21',
  'font-sans': SERIF,
  'font-mono': MONO,
  ...METRICS,
  'line-height': '1.72',
  radius: '0px',
}

const paperDark: ThemeTokens = {
  ...paperLight,
  bg: '#121212',
  'bg-subtle': '#1b1b1b',
  fg: '#ececea',
  'fg-muted': '#9a9a94',
  primary: '#7fb0ea',
  border: '#2c2c2c',
  info: '#7fb0ea',
  tip: '#7cb98c',
  warn: '#d3a445',
  danger: '#e0736a',
}

const paperCss = `
.pf-layout{grid-template-columns:13rem minmax(0,44rem) minmax(0,1fr);gap:var(--pf-space-4);max-width:82rem}
.pf-layout .pf-doc{padding-top:calc(var(--pf-space-4) * 1.5)}
h1{font-size:2.1rem;font-weight:600;line-height:1.25}
h2{font-size:1.3rem;font-weight:600;counter-increment:pf-sec;margin-top:calc(var(--pf-space-4) * 1.4)}
h2::before{content:counter(pf-sec) ". ";color:var(--pf-fg-muted);font-weight:400}
h3{font-size:1.05rem;font-weight:600;font-style:italic}
body{counter-reset:pf-sec}
/* 提示块做成边注：跳出正文列，贴在右边 */
.pf-callout{background:none;border:none;border-left:2px solid var(--pf-border);padding:0 0 0 var(--pf-space-3);font-size:.88em;color:var(--pf-fg-muted)}
.pf-callout-title{font-weight:600;font-style:italic;color:var(--pf-fg)}
.pf-callout-info{border-left-color:var(--pf-info)}
.pf-callout-tip{border-left-color:var(--pf-tip)}
.pf-callout-warn{border-left-color:var(--pf-warn)}
.pf-callout-danger{border-left-color:var(--pf-danger)}
@media (min-width:72rem){.pf-callout{grid-column:3;width:20rem;margin-left:var(--pf-space-4)}}
/* Tab：编号式，像论文里的图注切换 */
.pf-tab-list{border-bottom:1px solid var(--pf-fg);gap:var(--pf-space-3)}
.pf-tab-button{border-bottom:none;font-style:italic;font-size:.92em;padding:var(--pf-space-1) 0}
.pf-tab-button[aria-selected="true"]{text-decoration:underline;text-underline-offset:.35em;text-decoration-thickness:2px}
.pf-steps li::before{border-radius:0;background:none;border:none;color:var(--pf-fg-muted);font-style:italic;justify-content:start}
.pf-collapse{border:none;border-top:1px solid var(--pf-border);padding-left:0;padding-right:0}
.pf-collapse>summary{font-style:italic;font-weight:600}
blockquote{border-left:none;padding:0 var(--pf-space-4);font-style:italic}
table{font-size:.9em}
th{background:none;border:none;border-top:1.5px solid var(--pf-fg);border-bottom:1px solid var(--pf-fg);font-weight:600}
td{border:none}
tbody tr:last-child td{border-bottom:1.5px solid var(--pf-fg)}
pre{background:var(--pf-bg-subtle);border-left:2px solid var(--pf-border);font-size:.86em}
.pf-toc-side{font-size:.86em}
.pf-toc-side a{font-style:italic}
`.trim()


// ══ 按文档类型分的主题 ══════════════════════════════════════════════════
// 判据是「这一套对应哪一类真实文档」，不是「这一套好不好看」。
// 只换配色的不算一套主题——两套并排如果只有颜色不同，就该合并。

// ── fiction ──────────────────────────────────────────────────────────────
// 小说、随笔、叙事章节。为长时间连续阅读排的版：窄栏、首行缩进、
// 段间不留空、场景分隔用居中的三点。侧边菜单退到最淡，不抢注意力。

const fictionLight: ThemeTokens = {
  bg: '#faf6ef',
  'bg-subtle': '#f2ece1',
  fg: '#26221c',
  'fg-muted': '#7d7568',
  primary: '#7a4a2b',
  border: '#e0d8c9',
  info: '#5a6b7d',
  tip: '#4f6b4a',
  warn: '#8a6a2a',
  danger: '#8f3b30',
  'font-sans': SERIF,
  'font-mono': MONO,
  ...METRICS,
  'line-height': '1.95',
  radius: '0px',
}

const fictionDark: ThemeTokens = {
  ...fictionLight,
  bg: '#1a1714',
  'bg-subtle': '#221e1a',
  fg: '#e6ded1',
  'fg-muted': '#9a9083',
  primary: '#c99062',
  border: '#332d26',
  danger: '#d4796b',
}

const fictionCss = `
.pf-layout{grid-template-columns:11rem minmax(0,38rem);justify-content:center;gap:calc(var(--pf-space-4) * 2);max-width:60rem}
.pf-layout .pf-doc{padding-top:calc(var(--pf-space-4) * 2)}
h1{font-size:2.3rem;font-weight:400;text-align:center;letter-spacing:.08em;margin-bottom:calc(var(--pf-space-4) * 1.5)}
h1::after{content:"";display:block;width:3rem;border-top:1px solid var(--pf-border);margin:var(--pf-space-3) auto 0}
h2{font-size:1.25rem;font-weight:400;text-align:center;letter-spacing:.12em;margin-top:calc(var(--pf-space-4) * 2)}
h3{font-size:1.05rem;font-weight:400;font-style:italic}
/* 中文小说的排法：段落首行缩进两字，段间不再留空 */
.pf-doc p{text-indent:2em;margin-bottom:0}
.pf-doc>p:first-of-type{text-indent:0}
.pf-doc>p:first-of-type::first-letter{font-size:2.6em;float:left;line-height:1;padding:.08em .12em 0 0;color:var(--pf-primary)}
/* 场景分隔线换成居中的三点 */
hr{border:none;text-align:center;margin:calc(var(--pf-space-4) * 1.2) 0}
hr::before{content:"· · ·";letter-spacing:.6em;color:var(--pf-fg-muted)}
/* 提示块变成作者旁白：缩进、小一号、不加框 */
.pf-callout{background:none;border:none;padding:var(--pf-space-2) var(--pf-space-4);font-size:.94em;color:var(--pf-fg-muted);font-style:italic}
.pf-callout p{text-indent:0}
.pf-callout-title{font-style:normal;font-size:.8em;letter-spacing:.14em;color:var(--pf-primary)}
blockquote{border-left:none;text-align:center;font-style:italic;padding:var(--pf-space-3) var(--pf-space-4);color:var(--pf-fg-muted)}
blockquote p{text-indent:0}
.pf-tab-list{border-bottom:1px solid var(--pf-border);justify-content:center;gap:var(--pf-space-4)}
.pf-tab-button{border-bottom:none;font-style:italic}
.pf-tab-button[aria-selected="true"]{color:var(--pf-primary)}
.pf-collapse{border:none;border-top:1px solid var(--pf-border);padding-left:0;padding-right:0}
.pf-steps li::before{background:none;border:none;color:var(--pf-fg-muted);font-style:italic}
.pf-steps li{padding-left:var(--pf-space-4)}
.pf-toc-side{font-size:.8em}
.pf-toc-side a{color:var(--pf-fg-muted);text-align:right;font-style:italic}
table{font-size:.9em}
`.trim()

// ── manual ───────────────────────────────────────────────────────────────
// 技术文档、参考手册、API 说明。代码块是主角：给它色条和呼吸空间；
// 标题带锚点标记方便深链；表格斑马纹，长表格扫得动。

const manualLight: ThemeTokens = {
  bg: '#ffffff',
  'bg-subtle': '#f5f7fa',
  fg: '#16202b',
  'fg-muted': '#5f6b7a',
  primary: '#0b6bcb',
  border: '#dde3ea',
  info: '#0b6bcb',
  tip: '#127a4b',
  warn: '#9a6a12',
  danger: '#c02a35',
  'font-sans': SANS,
  'font-mono': MONO,
  ...METRICS,
  'line-height': '1.72',
  radius: '5px',
}

const manualDark: ThemeTokens = {
  ...manualLight,
  bg: '#0f141a',
  'bg-subtle': '#161d26',
  fg: '#dbe3ec',
  'fg-muted': '#8b97a6',
  primary: '#5aa9f5',
  border: '#232d39',
  info: '#5aa9f5',
  tip: '#4bc98a',
  warn: '#d9a441',
  danger: '#e8656f',
}

const manualCss = `
.pf-layout{grid-template-columns:16rem minmax(0,1fr);max-width:88rem;gap:var(--pf-space-4)}
.pf-toc-side{border-right:1px solid var(--pf-border)}
.pf-toc-side a{border-radius:0;border-left:2px solid transparent}
.pf-toc-side a:hover{border-left-color:var(--pf-primary)}
h1{font-size:2.1rem;font-weight:700;letter-spacing:-.02em}
h2{font-size:1.4rem;font-weight:650;border-bottom:1px solid var(--pf-border);padding-bottom:var(--pf-space-2)}
h2::after{content:" #";color:var(--pf-primary);opacity:0;font-weight:400}
h2:hover::after{opacity:.5}
h3{font-size:1.08rem;font-weight:650;color:var(--pf-fg)}
/* 代码块是主角：左侧一条主色、更大的内边距 */
pre{border:1px solid var(--pf-border);border-left:3px solid var(--pf-primary);padding:var(--pf-space-3) var(--pf-space-4)}
code{border:1px solid var(--pf-border)}
pre code{border:none}
/* 提示块：整块淡底 + 左侧色条，四种分得开 */
.pf-callout{border-left-width:4px;padding:var(--pf-space-3) var(--pf-space-4)}
.pf-callout-title{font-size:.82rem;letter-spacing:.06em;text-transform:uppercase}
.pf-callout-info{background:color-mix(in oklch,var(--pf-info) 8%,var(--pf-bg-subtle))}
.pf-callout-tip{background:color-mix(in oklch,var(--pf-tip) 8%,var(--pf-bg-subtle))}
.pf-callout-warn{background:color-mix(in oklch,var(--pf-warn) 10%,var(--pf-bg-subtle))}
.pf-callout-danger{background:color-mix(in oklch,var(--pf-danger) 8%,var(--pf-bg-subtle))}
/* Tab 做成文件夹标签：长表格里切换实现语言常用 */
.pf-tab-list{gap:0;border-bottom:1px solid var(--pf-border)}
.pf-tab-button{border:1px solid transparent;border-bottom:none;border-radius:var(--pf-radius) var(--pf-radius) 0 0;margin-bottom:-1px;font-size:.9em}
.pf-tab-button[aria-selected="true"]{background:var(--pf-bg-subtle);border-color:var(--pf-border);border-bottom-color:var(--pf-bg-subtle);font-weight:600}
/* 长表格要扫得动：斑马纹 + 表头吸顶 */
tbody tr:nth-child(even){background:var(--pf-bg-subtle)}
th{position:sticky;top:0;z-index:1;font-size:.85em;letter-spacing:.04em}
td,th{padding:var(--pf-space-2) var(--pf-space-3)}
.pf-steps li::before{border-radius:var(--pf-radius)}
`.trim()

// ── prd ──────────────────────────────────────────────────────────────────
// 需求文档。每一节是一条可被引用的需求：编号、验收清单、优先级。
// 任务列表放大成真正能看的验收项，提示块变成「约束」。

const prdLight: ThemeTokens = {
  bg: '#fdfdfe',
  'bg-subtle': '#f4f5f9',
  fg: '#1b1d29',
  'fg-muted': '#646a80',
  primary: '#4b40c4',
  border: '#e0e2ec',
  info: '#3a6fd8',
  tip: '#1f8a5b',
  warn: '#9c6a10',
  danger: '#c33346',
  'font-sans': SANS,
  'font-mono': MONO,
  ...METRICS,
  radius: '8px',
}

const prdDark: ThemeTokens = {
  ...prdLight,
  bg: '#101119',
  'bg-subtle': '#181a25',
  fg: '#e6e7f0',
  'fg-muted': '#9297ad',
  primary: '#9b90ff',
  border: '#262939',
  info: '#7aa5f0',
  tip: '#4cc78d',
  warn: '#dba63f',
  danger: '#f0697c',
}

const prdCss = `
.pf-layout{grid-template-columns:16rem minmax(0,1fr);max-width:82rem}
h1{font-size:2.2rem;font-weight:700;letter-spacing:-.02em}
body{counter-reset:pf-req}
/* 每个二级标题是一条需求：带编号徽章 */
h2{counter-increment:pf-req;font-size:1.35rem;font-weight:650;display:flex;align-items:center;gap:var(--pf-space-3);margin-top:calc(var(--pf-space-4) * 1.4)}
h2::before{content:"R" counter(pf-req,decimal-leading-zero);flex:none;font-family:var(--pf-font-mono);font-size:.72rem;letter-spacing:.06em;color:var(--pf-primary);background:color-mix(in oklch,var(--pf-primary) 12%,transparent);border:1px solid color-mix(in oklch,var(--pf-primary) 30%,transparent);border-radius:999px;padding:.25em .7em}
h3{font-size:1.05rem;font-weight:650;color:var(--pf-fg-muted);text-transform:uppercase;letter-spacing:.06em}
/* 提示块 = 约束条款，整块卡片 */
.pf-callout{border-left:none;border:1px solid var(--pf-border);box-shadow:0 1px 2px rgba(20,22,40,.05);padding:var(--pf-space-3) var(--pf-space-4)}
.pf-callout-title{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase}
.pf-callout-info{border-color:color-mix(in oklch,var(--pf-info) 40%,var(--pf-border))}.pf-callout-info .pf-callout-title{color:var(--pf-info)}
.pf-callout-tip{border-color:color-mix(in oklch,var(--pf-tip) 40%,var(--pf-border))}.pf-callout-tip .pf-callout-title{color:var(--pf-tip)}
.pf-callout-warn{border-color:color-mix(in oklch,var(--pf-warn) 45%,var(--pf-border));background:color-mix(in oklch,var(--pf-warn) 7%,var(--pf-bg-subtle))}.pf-callout-warn .pf-callout-title{color:var(--pf-warn)}
.pf-callout-danger{border-color:color-mix(in oklch,var(--pf-danger) 45%,var(--pf-border));background:color-mix(in oklch,var(--pf-danger) 6%,var(--pf-bg-subtle))}.pf-callout-danger .pf-callout-title{color:var(--pf-danger)}
/* 验收清单：把任务列表放大成真的能看的东西 */
.pf-doc input[type="checkbox"]{width:1.05em;height:1.05em;margin-right:.5em;accent-color:var(--pf-primary);vertical-align:-.12em}
.pf-doc li:has(> input[type="checkbox"]){list-style:none;margin-left:-1.4em;padding:var(--pf-space-1) 0;border-bottom:1px dashed var(--pf-border)}
/* Tab 做成分段控件：不同角色 / 不同场景来回切 */
.pf-tab-list{border-bottom:none;gap:var(--pf-space-1);background:var(--pf-bg-subtle);border-radius:999px;padding:3px;display:inline-flex}
.pf-tab-button{border-bottom:none;border-radius:999px;font-size:.88em;font-weight:600}
.pf-tab-button[aria-selected="true"]{background:var(--pf-bg);color:var(--pf-primary);box-shadow:0 1px 3px rgba(20,22,40,.12)}
.pf-steps li::before{border-radius:999px;font-weight:700}
.pf-collapse{border-radius:var(--pf-radius);background:var(--pf-bg-subtle)}
table{border-collapse:separate;border-spacing:0;border:1px solid var(--pf-border);border-radius:var(--pf-radius);overflow:hidden}
th,td{border:none;border-bottom:1px solid var(--pf-border)}
tbody tr:last-child td{border-bottom:none}
th{font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:var(--pf-fg-muted)}
td:first-child{font-weight:600}
`.trim()

// ── architecture ─────────────────────────────────────────────────────────
// 系统设计文档。图是主角：给它最宽的画布、边框和图注位；
// 引用块变成「决策记录」，表格是三线表，适合摆取舍对比。

const architectureLight: ThemeTokens = {
  bg: '#fcfcfb',
  'bg-subtle': '#f1f2ef',
  fg: '#1a1c1a',
  'fg-muted': '#61665f',
  primary: '#136b5f',
  border: '#dcdedb',
  info: '#2f5f8a',
  tip: '#136b5f',
  warn: '#8d6516',
  danger: '#a83a2c',
  'font-sans': SANS,
  'font-mono': MONO,
  ...METRICS,
  radius: '2px',
}

const architectureDark: ThemeTokens = {
  ...architectureLight,
  bg: '#101312',
  'bg-subtle': '#171b1a',
  fg: '#e3e7e3',
  'fg-muted': '#939a92',
  primary: '#4fbfab',
  border: '#242927',
  info: '#6ea3d8',
  tip: '#4fbfab',
  warn: '#d3a44f',
  danger: '#e0705f',
}

const architectureCss = `
.pf-layout{grid-template-columns:15rem minmax(0,1fr);max-width:94rem;gap:var(--pf-space-4)}
h1{font-size:2rem;font-weight:600;letter-spacing:-.01em}
body{counter-reset:pf-sec}
h2{counter-increment:pf-sec;font-size:1.3rem;font-weight:600;border-left:3px solid var(--pf-primary);padding-left:var(--pf-space-3);margin-top:calc(var(--pf-space-4) * 1.3)}
h2::before{content:"§" counter(pf-sec) "  ";color:var(--pf-primary);font-weight:400}
h3{font-size:1.05rem;font-weight:600}
/* 图是主角：给它边框、底色和更大的上下留白 */
.pf-diagram{border:1px solid var(--pf-border);background:var(--pf-bg-subtle);padding:var(--pf-space-4);margin:var(--pf-space-4) 0;border-radius:var(--pf-radius)}
/* 引用块 = 决策记录 */
blockquote{border-left:3px solid var(--pf-primary);background:var(--pf-bg-subtle);padding:var(--pf-space-3) var(--pf-space-4);color:var(--pf-fg)}
blockquote::before{content:"决策";display:block;font-family:var(--pf-font-mono);font-size:.68rem;letter-spacing:.16em;color:var(--pf-primary);margin-bottom:var(--pf-space-1)}
.pf-callout{border-left-width:3px;background:none;border-top:1px solid var(--pf-border);border-bottom:1px solid var(--pf-border);border-radius:0;padding:var(--pf-space-3)}
.pf-callout-title{font-family:var(--pf-font-mono);font-size:.72rem;letter-spacing:.12em;text-transform:uppercase}
.pf-callout-info .pf-callout-title{color:var(--pf-info)}
.pf-callout-tip .pf-callout-title{color:var(--pf-tip)}
.pf-callout-warn .pf-callout-title{color:var(--pf-warn)}
.pf-callout-danger .pf-callout-title{color:var(--pf-danger)}
/* 取舍对比用三线表 */
th{background:none;border:none;border-top:2px solid var(--pf-fg);border-bottom:1px solid var(--pf-fg);font-weight:600;font-size:.88em}
td{border:none;border-bottom:1px solid var(--pf-border)}
tbody tr:last-child td{border-bottom:2px solid var(--pf-fg)}
.pf-tab-list{border-bottom:1px solid var(--pf-border);gap:var(--pf-space-2)}
.pf-tab-button{border-bottom:2px solid transparent;font-size:.9em;font-weight:600}
.pf-steps li::before{border-radius:2px;background:var(--pf-primary)}
.pf-collapse{border-radius:var(--pf-radius)}
.pf-toc-side a{border-radius:0}
`.trim()

// ── blueprint ────────────────────────────────────────────────────────────
// 详细设计文档。极高密度：三级编号、紧凑表格、等宽标题，
// 一屏尽量多放字段。给「一条条对着实现」的人看的。

const blueprintLight: ThemeTokens = {
  bg: '#fbfbfc',
  'bg-subtle': '#eef0f3',
  fg: '#15181d',
  'fg-muted': '#5c626c',
  primary: '#2b4c7e',
  border: '#d8dbe1',
  info: '#2b4c7e',
  tip: '#1f7350',
  warn: '#8a6414',
  danger: '#b23a3a',
  'font-sans': SANS,
  'font-mono': MONO,
  ...METRICS,
  'line-height': '1.6',
  'space-3': '12px',
  'space-4': '24px',
  radius: '2px',
}

const blueprintDark: ThemeTokens = {
  ...blueprintLight,
  bg: '#0e1116',
  'bg-subtle': '#151a21',
  fg: '#dfe3e9',
  'fg-muted': '#8d95a1',
  primary: '#7aa5dd',
  border: '#222831',
  info: '#7aa5dd',
  tip: '#4cb98a',
  warn: '#d0a447',
  danger: '#e0706f',
}

const blueprintCss = `
.pf-layout{grid-template-columns:17rem minmax(0,1fr);max-width:92rem;gap:var(--pf-space-3)}
.pf-toc-side{border-right:1px solid var(--pf-border);font-size:.82em}
.pf-toc-side a{padding:2px var(--pf-space-2);border-radius:0}
/* 三级编号：1 / 1.1 / 1.1.1，对着实现时能准确指出是哪一条 */
body{counter-reset:b2}
h1{font-size:1.7rem;font-weight:700;font-family:var(--pf-font-mono);letter-spacing:-.02em}
h2{counter-increment:b2;counter-reset:b3;font-size:1.15rem;font-weight:700;font-family:var(--pf-font-mono);border-bottom:2px solid var(--pf-border);padding-bottom:var(--pf-space-1);margin-top:var(--pf-space-4)}
h2::before{content:counter(b2) ". ";color:var(--pf-primary)}
h3{counter-increment:b3;counter-reset:b4;font-size:.98rem;font-weight:700;font-family:var(--pf-font-mono)}
h3::before{content:counter(b2) "." counter(b3) " ";color:var(--pf-fg-muted)}
h4{counter-increment:b4;font-size:.9rem;font-family:var(--pf-font-mono)}
h4::before{content:counter(b2) "." counter(b3) "." counter(b4) " ";color:var(--pf-fg-muted)}
/* 字段表要密：小字号、窄内边距、首列等宽 */
table{font-size:.82em}
th,td{padding:3px var(--pf-space-2);border-color:var(--pf-border)}
th{background:var(--pf-bg-subtle);font-family:var(--pf-font-mono);font-size:.74rem;letter-spacing:.04em;text-transform:uppercase}
td:first-child{font-family:var(--pf-font-mono);white-space:nowrap}
.pf-callout{border-left-width:3px;padding:var(--pf-space-2) var(--pf-space-3);font-size:.9em;border-radius:0}
.pf-callout-title{font-family:var(--pf-font-mono);font-size:.72rem;letter-spacing:.08em;text-transform:uppercase}
.pf-callout-info .pf-callout-title{color:var(--pf-info)}
.pf-callout-tip .pf-callout-title{color:var(--pf-tip)}
.pf-callout-warn .pf-callout-title{color:var(--pf-warn)}
.pf-callout-danger .pf-callout-title{color:var(--pf-danger)}
.pf-tab-list{border-bottom:1px solid var(--pf-border);gap:0}
.pf-tab-button{font-family:var(--pf-font-mono);font-size:.8em;padding:var(--pf-space-1) var(--pf-space-3);border:1px solid transparent;border-bottom:none;margin-bottom:-1px}
.pf-tab-button[aria-selected="true"]{background:var(--pf-bg-subtle);border-color:var(--pf-border);border-bottom-color:var(--pf-bg-subtle)}
.pf-steps li{margin-bottom:var(--pf-space-1)}
.pf-steps li::before{border-radius:2px;width:18px;height:18px;font-size:.68em;background:var(--pf-bg-subtle);color:var(--pf-primary);border:1px solid var(--pf-border)}
pre{font-size:.82em;padding:var(--pf-space-2) var(--pf-space-3);border:1px solid var(--pf-border)}
.pf-collapse{padding:var(--pf-space-1) var(--pf-space-3);border-radius:0}
`.trim()

// ── incident ─────────────────────────────────────────────────────────────
// 故障报告、复盘。时间线是骨架：步骤变成带竖线的时间轴，
// danger / warn 最醒目，顶部的影响面表格一眼看完。

const incidentLight: ThemeTokens = {
  bg: '#fffdfd',
  'bg-subtle': '#f7f2f2',
  fg: '#1c1718',
  'fg-muted': '#6c6163',
  primary: '#b3261e',
  border: '#e6dcdc',
  info: '#2f5f8a',
  tip: '#20744c',
  warn: '#a06a10',
  danger: '#b3261e',
  'font-sans': SANS,
  'font-mono': MONO,
  ...METRICS,
  radius: '4px',
}

const incidentDark: ThemeTokens = {
  ...incidentLight,
  bg: '#141010',
  'bg-subtle': '#1d1717',
  fg: '#eae2e2',
  'fg-muted': '#a29494',
  primary: '#f2776b',
  border: '#2d2323',
  info: '#79a6d4',
  tip: '#4fb583',
  warn: '#d9a94a',
  danger: '#f2776b',
}

const incidentCss = `
.pf-layout{grid-template-columns:15rem minmax(0,1fr);max-width:84rem}
h1{font-size:2rem;font-weight:700}
h1::before{content:"事故报告";display:block;font-family:var(--pf-font-mono);font-size:.7rem;letter-spacing:.2em;color:var(--pf-danger);margin-bottom:var(--pf-space-2)}
h2{font-size:1.25rem;font-weight:700;border-left:4px solid var(--pf-danger);padding-left:var(--pf-space-3)}
h3{font-size:1.02rem;font-weight:650}
/* 步骤 = 时间轴：左边一条竖线，节点是实心圆 */
.pf-steps{border-left:2px solid var(--pf-border);margin-left:10px;padding-left:var(--pf-space-4)}
.pf-steps li{padding-left:var(--pf-space-3)}
.pf-steps li::before{left:calc(var(--pf-space-4) * -1 - 11px);width:12px;height:12px;top:.45em;background:var(--pf-danger);color:transparent;border:2px solid var(--pf-bg);box-shadow:0 0 0 2px var(--pf-danger)}
/* 严重的两种提示块要压过一切 */
.pf-callout{border-left-width:4px;padding:var(--pf-space-3) var(--pf-space-4)}
.pf-callout-title{font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;font-weight:700}
.pf-callout-danger{background:color-mix(in oklch,var(--pf-danger) 10%,var(--pf-bg-subtle));border-color:var(--pf-danger)}
.pf-callout-danger .pf-callout-title{color:var(--pf-danger)}
.pf-callout-warn{background:color-mix(in oklch,var(--pf-warn) 12%,var(--pf-bg-subtle))}
.pf-callout-warn .pf-callout-title{color:var(--pf-warn)}
.pf-callout-info .pf-callout-title{color:var(--pf-info)}
.pf-callout-tip .pf-callout-title{color:var(--pf-tip)}
/* 影响面表格：首列是字段名，等宽对齐 */
th{background:var(--pf-bg-subtle);font-size:.8rem;letter-spacing:.06em;text-transform:uppercase;color:var(--pf-fg-muted)}
td:first-child{font-weight:600}
td:not(:first-child){font-family:var(--pf-font-mono);font-size:.92em}
.pf-tab-list{border-bottom:2px solid var(--pf-border);gap:var(--pf-space-3)}
.pf-tab-button{border-bottom:2px solid transparent;font-weight:600;font-size:.9em;margin-bottom:-2px}
.pf-tab-button[aria-selected="true"]{border-bottom-color:var(--pf-danger);color:var(--pf-danger)}
.pf-collapse{border-left:3px solid var(--pf-border)}
blockquote{border-left-width:4px;background:var(--pf-bg-subtle);padding:var(--pf-space-3) var(--pf-space-4)}
.pf-toc-side a{border-left:2px solid transparent;border-radius:0}
.pf-toc-side a:hover{border-left-color:var(--pf-danger)}
`.trim()


export const THEMES: Record<string, Theme> = {
  default: {
    name: 'default',
    label: '通用中性：GitHub 那套色，最不抢内容',
    labelEn: "Anything: GitHub's neutral palette, the least likely to compete with your content",
    light: defaultLight,
    dark: defaultDark,
    css: '',
  },
  minimal: {
    name: 'minimal',
    label: '极简：黑白灰、窄栏、衬线标题、大留白',
    labelEn:
      'Short pieces and one-pagers: black, white and grey, a narrow column, serif headings, generous whitespace',
    light: minimalLight,
    dark: minimalDark,
    css: minimalCss,
  },
  'tech-dark': {
    name: 'tech-dark',
    label: '技术风：等宽标题、方角、青色强调',
    labelEn: 'Technical content, dark by preference: monospace headings, sharp corners, a cyan accent',
    light: techLight,
    dark: techDark,
    css: techCss,
  },
  editorial: {
    name: 'editorial',
    label: '编辑部：大号衬线标题、章节编号、细分隔线，像杂志内页',
    labelEn:
      'Formal proposals: a large serif display, numbered sections, hairline rules — a magazine spread',
    light: editorialLight,
    dark: editorialDark,
    css: editorialCss,
  },
  console: {
    name: 'console',
    label: '控制台：等宽为骨、高密度、状态色，像一块盯着看的面板',
    labelEn:
      'Runbooks and dashboard docs: monospace throughout, dense, status colours — a panel you keep an eye on',
    light: consoleLight,
    dark: consoleDark,
    css: consoleCss,
  },
  paper: {
    name: 'paper',
    label: '学术：窄正文列 + 边注、编号标题、无圆角，像一篇论文',
    labelEn:
      'Research notes: a narrow column with margin notes, numbered headings, square corners — a paper',
    light: paperLight,
    dark: paperDark,
    css: paperCss,
  },
  fiction: {
    name: 'fiction',
    label: '小说：窄栏、首行缩进、段间不留空，为连续阅读排的版',
    labelEn:
      'Novel chapters: a narrow column, first-line indents, no gap between paragraphs — set for continuous reading',
    light: fictionLight,
    dark: fictionDark,
    css: fictionCss,
  },
  manual: {
    name: 'manual',
    label: '技术文档：代码块是主角、表头吸顶、斑马纹长表格',
    labelEn: 'Technical docs: code blocks lead, sticky table headers, zebra-striped long tables',
    light: manualLight,
    dark: manualDark,
    css: manualCss,
  },
  prd: {
    name: 'prd',
    label: '需求文档：每节一条带编号的需求、验收清单、约束卡片',
    labelEn:
      'Product requirements: one numbered requirement per section, acceptance checklists, constraint cards',
    light: prdLight,
    dark: prdDark,
    css: prdCss,
  },
  architecture: {
    name: 'architecture',
    label: '系统设计：图占最宽画布、引用块是决策记录、三线表摆取舍',
    labelEn:
      'System design: the widest canvas for diagrams, block quotes as decision records, booktabs for trade-offs',
    light: architectureLight,
    dark: architectureDark,
    css: architectureCss,
  },
  blueprint: {
    name: 'blueprint',
    label: '详细设计：三级编号、紧凑字段表、等宽标题，密度优先',
    labelEn:
      'Detailed design: three-level numbering, tight field tables, monospace headings — density first',
    light: blueprintLight,
    dark: blueprintDark,
    css: blueprintCss,
  },
  incident: {
    name: 'incident',
    label: '故障报告：步骤变时间轴、危险色压过一切、影响面表格',
    labelEn:
      'Incident reports: steps become a timeline, danger outranks everything else, an impact table',
    light: incidentLight,
    dark: incidentDark,
    css: incidentCss,
  },
}

/** 内置主题名。**发布之后就是公共契约**，只能加不能改（ADR-0001） */
export const BUILTIN_THEMES = Object.keys(THEMES)

export const DEFAULT_THEME = 'default'
