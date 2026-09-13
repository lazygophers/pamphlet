/**
 * WaveDrom 引擎：画 ` ```wavedrom ` 围栏的数字波形图。
 *
 * 波形图就是「时钟和信号在时间上的高低变化」那种图，硬件文档和协议文档里
 * 到处都是。Mermaid 完全没有这个能力。
 *
 * **它的换色和别的引擎都不一样**：颜色不是参数，是编译进皮肤文件的一段
 * `<style>` + CSS class（实测 `skins/default.js` 里写着 `.warning{fill:#f6b900}`
 * 这种）。没有「传色值」的 API，所以这里的做法是：渲染完在输出的 `<style>`
 * 块里把那些十六进制换成哨兵，再交给统一的换色。
 *
 * 另外两件事在主包里已经处理过，这里只做说明：
 *  - 波形砖块是 `<use xlink:href="#000">` 引用 `<g id="000">`，那个 `#000`
 *    是**元素编号不是颜色**，换色现在会跳过 href（不跳过实测毁掉 7/42 个引用）
 *  - 背景 `fill:white` 是 CSS 具名色，写死在渲染器模板里，换色现在认具名色
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
 * 皮肤里那些写死的颜色 → 哨兵。
 *
 * 语义三色（警告黄、错误红、成功绿）**故意留着不换**：红黄绿在深浅两种主题下
 * 本来就该是红黄绿，换成主题色反而看不懂。它们会作为「认不出的颜色」被报出来，
 * 这是明知的——真要闭嘴得在主包的别名表里认领，那是另一回事。
 */
const SKIN_COLORS: Record<string, string> = {
  '#000': SENTINELS.text,
  '#0041c4': SENTINELS.accent,
  '#888': SENTINELS.muted,
  '#aaa': SENTINELS.muted,
  '#fff': SENTINELS.bg,
  // 8 档数据波形的填充色：比我们的 token 多，所以钉死成两档交替，
  // 保证暗色下仍分得开，而不是八种颜色各自撞主题
  '#ffffb4': SENTINELS.fill,
  '#ffe0b9': SENTINELS.fill,
  '#b9e0ff': SENTINELS.fill,
  '#ccfdfe': SENTINELS.fill,
  '#cdfdc5': SENTINELS.fill,
  '#f0c1fb': SENTINELS.fill,
  '#f5c2c0': SENTINELS.fill,
}

/**
 * 皮肤色换成哨兵。两个地方都要换：
 *  - `<style>` 块（皮肤自带的那份）
 *  - 内联的 `style="stroke:#0041c4"`（分组框、标记线这些写死在渲染器源码里，
 *    `lib/render-groups.js` / `lib/render-marks.js` / `lib/arc-shape.js`）
 *
 * 都只碰 `style` 里的色值，不碰 `<use href="#000">` 那些**元素编号**。
 */
function sentinelise(hex: string): string {
  return SKIN_COLORS[hex.toLowerCase()] ?? hex
}

function sentineliseStyles(svg: string): string {
  const styled = svg.replace(/<style[^>]*>[\s\S]*?<\/style>/g, (block) =>
    block.replace(/#[0-9a-fA-F]{3,8}\b/g, sentinelise),
  )
  return styled.replace(/style="([^"]*)"/g, (whole, body: string) => {
    const replaced = body.replace(/#[0-9a-fA-F]{3,8}\b/g, sentinelise)
    return replaced === body ? whole : `style="${replaced}"`
  })
}

interface WaveDrom {
  renderAny: (index: number, source: unknown, skin: unknown) => unknown
}
interface Onml {
  stringify: (tree: unknown) => string
}

let libraries: Promise<{ wavedrom: WaveDrom; onml: Onml; skin: unknown }> | undefined

async function getLibraries(): Promise<{ wavedrom: WaveDrom; onml: Onml; skin: unknown }> {
  libraries ??= (async () => {
    const [wavedrom, onml, skin] = await Promise.all([
      import('wavedrom'),
      import('onml'),
      import('wavedrom/skins/default.js'),
    ])
    return {
      wavedrom: (wavedrom as unknown as { default?: WaveDrom }).default ?? (wavedrom as unknown as WaveDrom),
      onml: (onml as unknown as { default?: Onml }).default ?? (onml as unknown as Onml),
      skin: (skin as unknown as { default?: unknown }).default ?? skin,
    }
  })()
  return libraries
}

/** WaveJSON 是宽松 JSON（键不加引号），标准 `JSON.parse` 吃不下 */
function parseWaveJson(source: string): unknown {
  // eslint-disable-next-line no-new-func
  return new Function(`"use strict";return (${source});`)() as unknown
}

export function createEngine(): Engine {
  return {
    name: 'wavedrom',
    langs: ['wavedrom'],
    fingerprint: `wd-${Object.keys(SKIN_COLORS).length}-${Object.values(SENTINELS).join('')}`.slice(0, 24),

    async probe() {
      try {
        await import('wavedrom')
      } catch {
        return {
          available: false,
          hint: '装一次就好：npm i -D @nekoleapuki/pamphlet-engine-wavedrom（3.3MB，纯 JS，不需要浏览器）',
        }
      }
      return { available: true }
    },

    async renderOne(request: RenderRequest): Promise<RenderedDiagram | Diagnostic> {
      try {
        const { wavedrom, onml, skin } = await getLibraries()
        const source = parseWaveJson(request.code)
        const tree = wavedrom.renderAny(0, source, skin)
        const svg = sentineliseStyles(onml.stringify(tree))
        const recolored = recolor(pinIntrinsicSize(svg))
        return { svg: recolored.svg, unmapped: recolored.unmapped }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return diagnostic('DIAG-303', 'error', `WaveDrom 画不出这张图：${message}`, {
          start: { line: request.line, column: 1 },
          hint: '围栏里是一段 WaveJSON，例如 { signal: [{ name: "clk", wave: "p...." }] }',
        })
      }
    },
  }
}
