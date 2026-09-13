/**
 * Vega-Lite 引擎：画 ` ```vega-lite ` 围栏里那段 JSON。
 *
 * Mermaid 也有柱状折线（`xychart-beta`），但它的颜色由引擎自己算，既不是哨兵
 * 又躲过替换，每次都报 `DIAG-304`——Pamphlet 自研 `:::chart` 就是因为这个。
 * 这个引擎补的是更复杂的图表：散点、面积、热力、分面。
 *
 * **用库不用 `vega-cli`**：后者会拖进 `canvas`（19MB，要本地编译的原生模块，
 * CI 里最常装不上的那类），而我们只要 SVG。
 */

import {
  DEFAULT_TIMEOUT_MS,
  SENTINELS,
  diagnostic,
  pinIntrinsicSize,
  recolor,
  withTimeout,
  type Diagnostic,
  type Engine,
  type RenderRequest,
  type RenderedDiagram,
} from '@nekoleapuki/pamphlet-cli/engine-kit'

/**
 * 色阶**不能拿哨兵当端点**。
 *
 * 六个哨兵只差最后一位、在同一条直线上，连续色阶两端设成两个哨兵时，Vega
 * 插出来的中间色正好落在其它哨兵上（实测 `rgb(255,0,2)`…`rgb(255,0,5)`）——
 * 那样会**换错色而且一条诊断都不报**。所以色阶在这里钉死一套固定色，
 * 照 Mermaid 的 `pie1..pie12` 先例；这几个值由主包的别名表认领。
 */
const RAMP = ['#2d6cdf', '#4b82e4', '#6a98e9', '#88aeee', '#a7c4f3', '#c5daf8']

/**
 * 六档颜色对应的 config 字段。
 *
 * `config.legend.gradientStrokeColor` **必须补**：不补的话它的默认值 `lightGray`
 * 会原样进输出（实测变成 `stroke="#ddd"`），直接是一条 `DIAG-304`。
 */
const CONFIG = {
  background: SENTINELS.bg,
  view: { stroke: SENTINELS.line },
  mark: { color: SENTINELS.accent },
  arc: { fill: SENTINELS.accent },
  area: { fill: SENTINELS.accent },
  line: { stroke: SENTINELS.accent },
  path: { stroke: SENTINELS.accent },
  point: { stroke: SENTINELS.accent },
  symbol: { fill: SENTINELS.accent },
  rect: { fill: SENTINELS.fill },
  bar: { fill: SENTINELS.accent },
  rule: { stroke: SENTINELS.line },
  text: { fill: SENTINELS.text },
  title: { color: SENTINELS.text, subtitleColor: SENTINELS.muted },
  header: { titleColor: SENTINELS.text, labelColor: SENTINELS.muted },
  axis: {
    domainColor: SENTINELS.line,
    gridColor: SENTINELS.line,
    tickColor: SENTINELS.line,
    labelColor: SENTINELS.muted,
    titleColor: SENTINELS.text,
  },
  legend: {
    labelColor: SENTINELS.muted,
    titleColor: SENTINELS.text,
    gradientStrokeColor: SENTINELS.line,
  },
  range: { category: [SENTINELS.accent, ...RAMP], ramp: RAMP, heatmap: RAMP, ordinal: RAMP },
}

interface VegaLite {
  compile: (spec: unknown, options: { config: unknown }) => { spec: unknown }
}
interface Vega {
  parse: (spec: unknown) => unknown
  View: new (runtime: unknown, options: { renderer: string }) => { toSVG: () => Promise<string> }
}

let libraries: Promise<{ vega: Vega; vegaLite: VegaLite }> | undefined

async function getLibraries(): Promise<{ vega: Vega; vegaLite: VegaLite }> {
  libraries ??= (async () => {
    const [vega, vegaLite] = await Promise.all([import('vega'), import('vega-lite')])
    return { vega: vega as unknown as Vega, vegaLite: vegaLite as unknown as VegaLite }
  })()
  return libraries
}

export function createEngine(options: { timeoutMs?: number } = {}): Engine {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  return {
    name: 'vega-lite',
    langs: ['vega-lite'],
    fingerprint: `vl-${JSON.stringify(CONFIG).length}-${Object.values(SENTINELS).join('')}`.slice(0, 24),

    async probe() {
      try {
        await import('vega-lite')
      } catch {
        return {
          available: false,
          hint: '装一次就好：npm i -D @nekoleapuki/pamphlet-engine-vega-lite（约 26MB，纯 JS，不需要浏览器）',
        }
      }
      return { available: true }
    },

    async renderOne(request: RenderRequest): Promise<RenderedDiagram | Diagnostic> {
      try {
        const { vega, vegaLite } = await getLibraries()
        const spec: unknown = JSON.parse(request.code)
        const compiled = vegaLite.compile(spec, { config: CONFIG })
        const view = new vega.View(vega.parse(compiled.spec), { renderer: 'none' })
        const svg = await withTimeout(view.toSVG(), timeoutMs, () => new Error(`渲染超过 ${timeoutMs}ms`))
        const recolored = recolor(pinIntrinsicSize(svg))
        return { svg: recolored.svg, unmapped: recolored.unmapped }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return diagnostic('DIAG-303', 'error', `Vega-Lite 画不出这张图：${message}`, {
          start: { line: request.line, column: 1 },
          hint: '围栏里是一段 Vega-Lite 的 JSON；数据直接写在 data.values 里，引用外部 URL 在自包含产物里取不到',
        })
      }
    },
  }
}
