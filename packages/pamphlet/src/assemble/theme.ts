/**
 * 主题变量与版式样式。三层结构见 ADR-0020 与 docs/zh/reference/theme-tokens.md：
 * 语义层是根，元素层默认从语义层派生，派生只能一层。
 */

export interface ThemeTokens {
  bg: string
  'bg-subtle': string
  fg: string
  'fg-muted': string
  primary: string
  border: string
  info: string
  tip: string
  warn: string
  danger: string
  'font-sans': string
  'font-mono': string
  'space-1': string
  'space-2': string
  'space-3': string
  'space-4': string
  'line-height': string
  radius: string
}

export const LIGHT: ThemeTokens = {
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
  'font-sans':
    '"PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei", "Source Han Sans SC", "Noto Sans CJK SC", sans-serif',
  'font-mono': 'ui-monospace, "SF Mono", Consolas, monospace',
  'space-1': '4px',
  'space-2': '8px',
  'space-3': '16px',
  'space-4': '32px',
  'line-height': '1.75',
  radius: '6px',
}

export const DARK: ThemeTokens = {
  ...LIGHT,
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

function variables(tokens: ThemeTokens): string {
  return (Object.keys(tokens) as (keyof ThemeTokens)[])
    .map((key) => `--pf-${key}:${tokens[key]};`)
    .join('')
}

/** 元素层：只引用语义层，不引用别的元素层（ADR-0020） */
const ELEMENT_LAYER = `
--pf-link:var(--pf-primary);
--pf-code-bg:var(--pf-bg-subtle);
--pf-table-border:var(--pf-border);
--pf-table-header-bg:var(--pf-bg-subtle);
--pf-quote-border:var(--pf-border);
--pf-quote-fg:var(--pf-fg-muted);
--pf-tab-active-border:var(--pf-primary);
--pf-tab-inactive-fg:var(--pf-fg-muted);
--pf-step-marker-bg:var(--pf-primary);
--pf-step-marker-fg:var(--pf-bg);
--pf-diagram-bg:var(--pf-bg);
--pf-diagram-line:var(--pf-border);
--pf-diagram-fill:var(--pf-bg-subtle);
--pf-diagram-text:var(--pf-fg);
--pf-diagram-accent:var(--pf-primary);
--pf-diagram-muted:var(--pf-fg-muted);
`.replace(/\n/g, '')

/** 版式。只覆盖真的会用到的元素，不做通用重置。 */
const BASE_CSS = `
*{box-sizing:border-box}
body{margin:0;background:var(--pf-bg);color:var(--pf-fg);font-family:var(--pf-font-sans);line-height:var(--pf-line-height);-webkit-text-size-adjust:100%}
.pf-doc{max-width:52rem;margin:0 auto;padding:var(--pf-space-4) var(--pf-space-3)}
h1,h2,h3,h4,h5,h6{line-height:1.35;margin:var(--pf-space-4) 0 var(--pf-space-2)}
p,ul,ol,blockquote,table,figure,pre{margin:0 0 var(--pf-space-3)}
a{color:var(--pf-link)}
code{font-family:var(--pf-font-mono);font-size:.9em;background:var(--pf-code-bg);padding:.15em .35em;border-radius:calc(var(--pf-radius) / 2)}
pre{background:var(--pf-code-bg);padding:var(--pf-space-3);border-radius:var(--pf-radius);overflow-x:auto}
pre code{background:none;padding:0}
blockquote{border-left:3px solid var(--pf-quote-border);color:var(--pf-quote-fg);padding-left:var(--pf-space-3)}
table{border-collapse:collapse;width:100%}
th,td{border:1px solid var(--pf-table-border);padding:var(--pf-space-2) var(--pf-space-3);text-align:left}
th{background:var(--pf-table-header-bg)}
img{max-width:100%;height:auto}
hr{border:none;border-top:1px solid var(--pf-border);margin:var(--pf-space-4) 0}
.pf-diagram{margin:var(--pf-space-3) 0;overflow-x:auto}
.pf-diagram svg{max-width:100%;height:auto}
.pf-diagram-failed{border:1px dashed var(--pf-danger);padding:var(--pf-space-3);border-radius:var(--pf-radius);color:var(--pf-danger)}
.pf-callout{border-left:3px solid var(--pf-border);background:var(--pf-bg-subtle);padding:var(--pf-space-3);border-radius:var(--pf-radius);margin:0 0 var(--pf-space-3)}
.pf-callout>:last-child{margin-bottom:0}
.pf-callout-title{font-weight:600;margin-top:0}
.pf-callout-info{border-left-color:var(--pf-info)}
.pf-callout-tip{border-left-color:var(--pf-tip)}
.pf-callout-warn{border-left-color:var(--pf-warn)}
.pf-callout-danger{border-left-color:var(--pf-danger)}
.pf-asset-missing{display:inline-block;border:1px dashed var(--pf-danger);color:var(--pf-danger);padding:var(--pf-space-1) var(--pf-space-2);border-radius:var(--pf-radius);font-size:.9em}
`.trim()

/** 无 JavaScript 时的样子：面板全部展开，标题就是普通小节标题（ADR-0015） */
const FEATURE_CSS: Record<string, string> = {
  tabs: `
.pf-tabs{margin:0 0 var(--pf-space-3)}
.pf-tab{margin:0 0 var(--pf-space-3)}
[data-pf-tabs][data-pf-ready] .pf-tab-title{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
[data-pf-tabs][data-pf-ready] .pf-tab[hidden]{display:none}
.pf-tab-list{display:flex;gap:var(--pf-space-1);border-bottom:1px solid var(--pf-border);margin-bottom:var(--pf-space-3)}
.pf-tab-button{appearance:none;background:none;border:none;border-bottom:2px solid transparent;color:var(--pf-tab-inactive-fg);font:inherit;padding:var(--pf-space-2) var(--pf-space-3);cursor:pointer}
.pf-tab-button[aria-selected="true"]{color:var(--pf-fg);border-bottom-color:var(--pf-tab-active-border)}
`,
  collapse: `
.pf-collapse{border:1px solid var(--pf-border);border-radius:var(--pf-radius);padding:var(--pf-space-2) var(--pf-space-3);margin:0 0 var(--pf-space-3)}
.pf-collapse>summary{cursor:pointer;font-weight:600}
`,
  steps: `
.pf-steps ol{list-style:none;padding-left:0;counter-reset:pf-step}
.pf-steps li{counter-increment:pf-step;position:relative;padding-left:var(--pf-space-4);margin-bottom:var(--pf-space-3)}
.pf-steps li::before{content:counter(pf-step);position:absolute;left:0;top:0;width:24px;height:24px;border-radius:50%;background:var(--pf-step-marker-bg);color:var(--pf-step-marker-fg);display:grid;place-items:center;font-size:.8em}
`,
  reveal: `
.pf-reveal{transition:opacity .4s ease,transform .4s ease}
[data-pf-reveal][data-pf-pending]{opacity:0}
[data-pf-reveal="fade-up"][data-pf-pending]{transform:translateY(12px)}
[data-pf-reveal="slide-left"][data-pf-pending]{transform:translateX(-16px)}
[data-pf-reveal="slide-right"][data-pf-pending]{transform:translateX(16px)}
@media (prefers-reduced-motion:reduce){.pf-reveal{transition:none}[data-pf-reveal][data-pf-pending]{opacity:1;transform:none}}
`,
  theme: `
.pf-theme-toggle{position:fixed;top:var(--pf-space-3);right:var(--pf-space-3);appearance:none;background:var(--pf-bg-subtle);color:var(--pf-fg);border:1px solid var(--pf-border);border-radius:var(--pf-radius);padding:var(--pf-space-1) var(--pf-space-2);font:inherit;cursor:pointer}
`,
  'diagram-zoom': `
.pf-diagram[data-pf-zoom]{cursor:grab}
.pf-diagram[data-pf-zoom]:active{cursor:grabbing}
`,
  // 目录不是运行时特性（纯静态），但它的样式同样按需——不开目录的文档里一个字节都没有
  toc: `
.pf-toc{background:var(--pf-bg-subtle);border-radius:var(--pf-radius);padding:var(--pf-space-3) var(--pf-space-4);margin:0 0 var(--pf-space-4)}
.pf-toc ol{margin:0;padding-left:var(--pf-space-4)}
.pf-toc>ol{padding-left:var(--pf-space-3)}
`,
}

export function styleSheet(features: ReadonlySet<string>, light = LIGHT, dark = DARK): string {
  const featureCss = [...features]
    .sort()
    .map((feature) => FEATURE_CSS[feature] ?? '')
    .join('')
  return [
    `:root{${variables(light)}${ELEMENT_LAYER}}`,
    `@media (prefers-color-scheme:dark){:root{${variables(dark)}}}`,
    `:root[data-pf-theme="dark"]{${variables(dark)}}`,
    `:root[data-pf-theme="light"]{${variables(light)}}`,
    BASE_CSS,
    featureCss.trim(),
  ]
    .filter((part) => part !== '')
    .join('\n')
}
