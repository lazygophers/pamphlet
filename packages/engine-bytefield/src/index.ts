/**
 * bytefield-svg 引擎：画 ` ```bytefield ` 围栏的位域图。
 *
 * 位域图就是「一个协议报文里，哪几个字节是什么意思」那种一格一格的图。
 * Mermaid 完全没有这个能力。它是七个引擎里体积最小的（2.1MB，纯 JS）。
 *
 * 换色靠 `defattrs` 覆盖它的预设样式——实测有效，但有 7 处线换不掉：
 * `draw-line` 的默认值 `#000000` 写死在源码里，而 `draw-gap` / `draw-bottom`
 * 画那几条线时不透传属性，DSL 层够不着。`#000000` 已经在主包的别名表里映到
 * 文字色，所以它仍然跟着主题变，只是语义偏了（边框线用了文字色）。
 * 要精确得给上游提 PR，不值得为此拖住这一版。
 */

import {
  SENTINELS,
  diagnostic,
  pinIntrinsicSize,
  recolor,
  type Diagnostic,
  type Engine,
  type RenderRequest,
  type RenderedDiagram,
} from '@nekoleapuki/pamphlet-cli/engine-kit'

/**
 * 喂给它的一段前缀，把预设样式改成哨兵色。
 *
 * 注意 `:plain` / `:hex` / `:math` / `:row-header` 这几个**必须显式给 `:fill`**：
 * 默认情况下 `<text>` 完全没有 fill 属性，靠 SVG 的初始值（黑）出字——
 * 那样换色抓不到、也不报，暗色下就是一片看不见的黑字。
 */
const SENTINEL_PRELUDE = [
  `(defattrs :plain {:font-family "sans-serif" :font-size 14 :fill "${SENTINELS.text}"})`,
  `(defattrs :math {:font-family "serif" :font-style "italic" :fill "${SENTINELS.text}"})`,
  `(defattrs :hex {:font-family "monospace" :fill "${SENTINELS.muted}"})`,
  `(defattrs :row-header {:font-family "sans-serif" :font-size 11 :fill "${SENTINELS.muted}"})`,
  `(defattrs :border-unrelated {:stroke "${SENTINELS.line}" :stroke-width 1})`,
  `(defattrs :border-related {:stroke "${SENTINELS.line}" :stroke-width 1 :stroke-dasharray "1,1"})`,
  `(def svg-attrs {:xmlns "http://www.w3.org/2000/svg" :style "background:${SENTINELS.bg}"})`,
].join('\n')

type Generate = (source: string) => string

let generate: Promise<Generate> | undefined

async function getGenerator(): Promise<Generate> {
  generate ??= import('bytefield-svg').then(
    (module) => (module as unknown as { default: Generate }).default,
  )
  return generate
}

export function createEngine(): Engine {
  return {
    name: 'bytefield',
    langs: ['bytefield'],
    fingerprint: `bytefield-${Object.values(SENTINELS).join('')}`.slice(0, 24),

    async probe() {
      try {
        await import('bytefield-svg')
      } catch {
        return {
          available: false,
          hint: '装一次就好：npm i -D @nekoleapuki/pamphlet-engine-bytefield（2.1MB，纯 JS，不需要浏览器）',
        }
      }
      return { available: true }
    },

    async renderOne(request: RenderRequest): Promise<RenderedDiagram | Diagnostic> {
      try {
        const render = await getGenerator()
        const svg = render(`${SENTINEL_PRELUDE}\n${request.code}`)
        const recolored = recolor(pinIntrinsicSize(svg))
        return { svg: recolored.svg, unmapped: recolored.unmapped }
      } catch (error) {
        return diagnostic(
          'DIAG-303',
          'error',
          `bytefield 画不出这张图：${error instanceof Error ? error.message : String(error)}`,
          {
            start: { line: request.line, column: 1 },
            hint: '`(draw-bottom)` 必须写在最后，否则最下面那条边不画；语法见 https://bytefield-svg.deepsymmetry.org',
          },
        )
      }
    },
  }
}
