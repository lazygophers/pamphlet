/**
 * 把图的自然尺寸钉在 SVG 上。
 *
 * Mermaid 输出 `width="100%"` 加一条行内 `max-width`，意思是「随容器缩放」。
 * 但它的标签装在 `<foreignObject>` 里，而 foreignObject 的内容不跟着 SVG 缩放——
 * 图一旦被压到自然宽度以下，标签就被裁掉字（实测窄栏主题里「查数据库」变成「查数」）。
 *
 * 所以这里把宽高改成 viewBox 里的确切像素值，并删掉那条行内 max-width。
 * 结果是图不再缩小；放不下时由 `.pf-diagram` 的 `overflow-x:auto` 横向滚动。
 * 横向滚动是可见的代价，缺字不是——静默少字作者不会发现，读者却少看了内容。
 */

const VIEW_BOX = /\bviewBox="\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*"/
const PERCENT_WIDTH = /\bwidth="100%"/
const MAX_WIDTH = /\s*max-width\s*:\s*[^;"]+;?/

export function pinIntrinsicSize(svg: string): string {
  const open = /<svg\b[^>]*>/.exec(svg)
  if (!open) return svg

  const tag = open[0]
  const box = VIEW_BOX.exec(tag)
  // 没有 viewBox 就没有算尺寸的依据，不猜
  if (!box?.[1] || !box[2]) return svg
  if (!PERCENT_WIDTH.test(tag)) return svg

  let pinned = tag.replace(PERCENT_WIDTH, `width="${box[1]}" height="${box[2]}"`)
  pinned = pinned.replace(MAX_WIDTH, '')
  // 删掉唯一一条声明后剩下的空 style 属性，别留 style=""
  pinned = pinned.replace(/\s*style="\s*"/, '')

  return svg.slice(0, open.index) + pinned + svg.slice(open.index + tag.length)
}
