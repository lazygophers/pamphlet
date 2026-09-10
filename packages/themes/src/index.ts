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
  /** 一句话说清它长什么样，`pamphlet doctor` 之类的地方要列出来 */
  label: string
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

// ── notebook ─────────────────────────────────────────────────────────────
// 横线笔记本。纸底色、横格线、便签式提示块、手写感的衬线标题。
// 横格线用 repeating-linear-gradient 画，不引任何图片——自包含照旧成立。

const notebookLight: ThemeTokens = {
  bg: '#fbf7ec',
  'bg-subtle': '#f3ecd9',
  fg: '#2f2a20',
  'fg-muted': '#7a7059',
  primary: '#1f6f8b',
  border: '#ddd2b8',
  info: '#1f6f8b',
  tip: '#4a7c37',
  warn: '#b5761f',
  danger: '#b4432e',
  'font-sans': SANS,
  'font-mono': MONO,
  ...METRICS,
  'line-height': '2',
  radius: '2px',
}

const notebookDark: ThemeTokens = {
  ...notebookLight,
  bg: '#211d17',
  'bg-subtle': '#2a251d',
  fg: '#ece3d1',
  'fg-muted': '#a0977f',
  primary: '#6fb6cd',
  border: '#3a3328',
  info: '#6fb6cd',
  tip: '#8cbf72',
  warn: '#dda44f',
  danger: '#e0785f',
}

const notebookCss = `
/* 横格纸：一条 32px 的重复渐变，配合 line-height 2 让文字正好坐在线上 */
body{background-image:repeating-linear-gradient(to bottom,transparent 0,transparent 31px,var(--pf-border) 31px,var(--pf-border) 32px);background-attachment:local}
.pf-doc{max-width:68rem;background:none}
h1,h2,h3{font-family:${SERIF};font-weight:600}
h1{border-bottom:2px solid var(--pf-primary);padding-bottom:var(--pf-space-2);display:inline-block}
h2{color:var(--pf-primary)}
/* 提示块做成便签：整块底色、右上角折角、轻微倾斜 */
.pf-callout{border-left:none;border:1px solid var(--pf-border);background:var(--pf-bg-subtle);box-shadow:2px 2px 0 var(--pf-border);position:relative}
.pf-callout-title{font-family:${SERIF};font-weight:700}
.pf-callout-info{background:color-mix(in oklch,var(--pf-info) 10%,var(--pf-bg-subtle))}
.pf-callout-tip{background:color-mix(in oklch,var(--pf-tip) 10%,var(--pf-bg-subtle))}
.pf-callout-warn{background:color-mix(in oklch,var(--pf-warn) 12%,var(--pf-bg-subtle))}
.pf-callout-danger{background:color-mix(in oklch,var(--pf-danger) 10%,var(--pf-bg-subtle))}
/* Tab 做成索引标签 */
.pf-tab-list{gap:var(--pf-space-1);border-bottom:2px solid var(--pf-border)}
.pf-tab-button{background:var(--pf-bg-subtle);border:1px solid var(--pf-border);border-bottom:none;border-radius:var(--pf-radius) var(--pf-radius) 0 0;font-family:${SERIF}}
.pf-tab-button[aria-selected="true"]{background:var(--pf-bg);border-bottom:2px solid var(--pf-bg);margin-bottom:-2px}
.pf-collapse{background:var(--pf-bg-subtle);box-shadow:2px 2px 0 var(--pf-border)}
.pf-collapse>summary{font-family:${SERIF}}
/* 步骤改成手绘感的圆圈：描边不填色 */
.pf-steps li::before{background:var(--pf-bg);color:var(--pf-primary);border:2px solid var(--pf-primary);font-family:${SERIF};font-weight:700}
.pf-toc{border:1px solid var(--pf-border);box-shadow:2px 2px 0 var(--pf-border)}
blockquote{background:var(--pf-bg-subtle);padding:var(--pf-space-2) var(--pf-space-3);border-left-width:4px}
`.trim()

// ── receipt ──────────────────────────────────────────────────────────────
// 小票 / 发票。全等宽、窄栏、虚线分隔、居中标题。

const receiptLight: ThemeTokens = {
  bg: '#f5f4f0',
  'bg-subtle': '#ebe9e3',
  fg: '#1c1c1a',
  'fg-muted': '#6e6d68',
  primary: '#1c1c1a',
  border: '#9c9a93',
  info: '#3a5a80',
  tip: '#3d6b45',
  warn: '#8a6320',
  danger: '#96322a',
  'font-sans': MONO,
  'font-mono': MONO,
  ...METRICS,
  'line-height': '1.6',
  radius: '0px',
}

const receiptDark: ThemeTokens = {
  ...receiptLight,
  bg: '#17171a',
  'bg-subtle': '#1f1f23',
  fg: '#e4e3de',
  'fg-muted': '#94938d',
  primary: '#e4e3de',
  border: '#4a4a50',
}

const receiptCss = `
.pf-doc{max-width:48rem;padding:var(--pf-space-4) var(--pf-space-4);background:var(--pf-bg);border-left:1px dashed var(--pf-border);border-right:1px dashed var(--pf-border)}
h1,h2,h3{text-align:center;font-weight:700;letter-spacing:.12em;text-transform:uppercase;font-size:1.05rem}
h1{font-size:1.35rem;border-top:1px dashed var(--pf-border);border-bottom:1px dashed var(--pf-border);padding:var(--pf-space-2) 0}
h2::before,h2::after{content:" ── "}
/* 提示块做成虚线框加方括号标题 */
.pf-callout{border:1px dashed var(--pf-border);border-left-width:1px;background:none;border-radius:0}
.pf-callout-title{text-align:center;letter-spacing:.1em;text-transform:uppercase;font-size:.85em}
.pf-callout-title::before{content:"[ "}.pf-callout-title::after{content:" ]"}
/* Tab 做成方括号切换 */
.pf-tab-list{border-bottom:1px dashed var(--pf-border);justify-content:center}
.pf-tab-button{border-bottom:none;font-size:.85em;letter-spacing:.06em;text-transform:uppercase}
.pf-tab-button[aria-selected="true"]::before{content:"› "}
.pf-collapse{border:1px dashed var(--pf-border);border-radius:0}
/* 步骤改成方框序号 */
.pf-steps li::before{border-radius:0;background:none;color:var(--pf-fg);border:1px solid var(--pf-border);font-size:.75em}
.pf-toc{background:none;border-top:1px dashed var(--pf-border);border-bottom:1px dashed var(--pf-border);border-radius:0}
table{font-size:.9em}
th,td{border:none;border-bottom:1px dashed var(--pf-border);padding-left:0}
th{background:none;text-transform:uppercase;letter-spacing:.06em;font-size:.8em}
pre{border:1px dashed var(--pf-border);background:none}
`.trim()

// ── glass ────────────────────────────────────────────────────────────────
// 玻璃拟态。彩色光晕背景 + 半透明磨砂面板。
// backdrop-filter 不被支持时会退化成普通半透明底色——内容照常可读。

const glassLight: ThemeTokens = {
  bg: '#eef1f8',
  'bg-subtle': '#ffffff',
  fg: '#1b1f2a',
  'fg-muted': '#5c6478',
  primary: '#5b5bd6',
  border: '#ffffff',
  info: '#3b74d6',
  tip: '#2f9e6b',
  warn: '#c98a1b',
  danger: '#d64545',
  'font-sans': SANS,
  'font-mono': MONO,
  ...METRICS,
  radius: '16px',
}

const glassDark: ThemeTokens = {
  ...glassLight,
  bg: '#0f1220',
  'bg-subtle': '#1a1f33',
  fg: '#e8ebf5',
  'fg-muted': '#9aa2bd',
  primary: '#8f8ff5',
  border: '#2b3350',
  info: '#6b9ef0',
  tip: '#4fc38c',
  warn: '#e0aa45',
  danger: '#f07070',
}

const glassCss = `
/* 光晕背景：三团径向渐变，纯 CSS，不引图片 */
body{background-image:radial-gradient(60rem 40rem at 12% -10%,color-mix(in oklch,var(--pf-primary) 28%,transparent),transparent 60%),radial-gradient(50rem 34rem at 88% 8%,color-mix(in oklch,var(--pf-info) 24%,transparent),transparent 60%),radial-gradient(46rem 30rem at 50% 110%,color-mix(in oklch,var(--pf-tip) 18%,transparent),transparent 60%);background-attachment:fixed}
.pf-doc{max-width:76rem;margin-top:var(--pf-space-4);margin-bottom:var(--pf-space-4);padding:var(--pf-space-4);background:color-mix(in oklch,var(--pf-bg-subtle) 62%,transparent);backdrop-filter:blur(20px) saturate(140%);border:1px solid color-mix(in oklch,var(--pf-border) 45%,transparent);border-radius:calc(var(--pf-radius) * 1.5);box-shadow:0 24px 60px -20px rgba(10,14,30,.35)}
h1,h2,h3{letter-spacing:-.02em}
/* 面板类元素统一磨砂 */
.pf-callout,.pf-collapse,pre,blockquote{background:color-mix(in oklch,var(--pf-bg-subtle) 55%,transparent);backdrop-filter:blur(12px);border:1px solid color-mix(in oklch,var(--pf-border) 40%,transparent);border-radius:var(--pf-radius)}
.pf-callout{border-left-width:1px}
.pf-callout-info{box-shadow:inset 3px 0 0 var(--pf-info)}
.pf-callout-tip{box-shadow:inset 3px 0 0 var(--pf-tip)}
.pf-callout-warn{box-shadow:inset 3px 0 0 var(--pf-warn)}
.pf-callout-danger{box-shadow:inset 3px 0 0 var(--pf-danger)}
/* Tab 做成胶囊，选中的一颗浮起来 */
.pf-tab-list{border-bottom:none;gap:var(--pf-space-1);padding:var(--pf-space-1);background:color-mix(in oklch,var(--pf-bg-subtle) 45%,transparent);border-radius:999px;display:inline-flex}
.pf-tab-button{border-bottom:none;border-radius:999px;padding:var(--pf-space-1) var(--pf-space-3)}
.pf-tab-button[aria-selected="true"]{background:var(--pf-bg-subtle);box-shadow:0 4px 14px -4px rgba(10,14,30,.4)}
.pf-steps li::before{box-shadow:0 4px 12px -4px color-mix(in oklch,var(--pf-primary) 70%,transparent)}
table{border-collapse:separate;border-spacing:0;border-radius:var(--pf-radius);overflow:hidden}
th{background:color-mix(in oklch,var(--pf-bg-subtle) 70%,transparent)}
`.trim()


// ══ 候选方向（等用户选定后再决定去留）════════════════════════════════════

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


export const THEMES: Record<string, Theme> = {
  default: {
    name: 'default',
    label: '通用中性：GitHub 那套色，最不抢内容',
    light: defaultLight,
    dark: defaultDark,
    css: '',
  },
  minimal: {
    name: 'minimal',
    label: '极简：黑白灰、窄栏、衬线标题、大留白',
    light: minimalLight,
    dark: minimalDark,
    css: minimalCss,
  },
  'tech-dark': {
    name: 'tech-dark',
    label: '技术风：等宽标题、方角、青色强调',
    light: techLight,
    dark: techDark,
    css: techCss,
  },
  notebook: {
    name: 'notebook',
    label: '笔记本：纸底色、横格线、便签式提示块',
    light: notebookLight,
    dark: notebookDark,
    css: notebookCss,
  },
  receipt: {
    name: 'receipt',
    label: '小票：全等宽、窄栏、虚线分隔、居中标题',
    light: receiptLight,
    dark: receiptDark,
    css: receiptCss,
  },
  editorial: {
    name: 'editorial',
    label: '编辑部：大号衬线标题、章节编号、细分隔线，像杂志内页',
    light: editorialLight,
    dark: editorialDark,
    css: editorialCss,
  },
  console: {
    name: 'console',
    label: '控制台：等宽为骨、高密度、状态色，像一块盯着看的面板',
    light: consoleLight,
    dark: consoleDark,
    css: consoleCss,
  },
  paper: {
    name: 'paper',
    label: '学术：窄正文列 + 边注、编号标题、无圆角，像一篇论文',
    light: paperLight,
    dark: paperDark,
    css: paperCss,
  },
  glass: {
    name: 'glass',
    label: '玻璃拟态：光晕背景、磨砂面板、胶囊 Tab',
    light: glassLight,
    dark: glassDark,
    css: glassCss,
  },
}

/** 内置主题名。**发布之后就是公共契约**，只能加不能改（ADR-0001） */
export const BUILTIN_THEMES = Object.keys(THEMES)

export const DEFAULT_THEME = 'default'
