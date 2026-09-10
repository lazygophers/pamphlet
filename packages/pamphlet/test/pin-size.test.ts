/**
 * 图的自然尺寸必须钉在 SVG 上。
 *
 * Mermaid 输出的是 `width="100%"` 加一条行内 `max-width`，意思是「随容器缩放」。
 * 而它的标签装在 `<foreignObject>` 里——SVG 一旦被压到自然宽度以下，
 * 浏览器会把标签**裁掉字**（实测窄栏主题里「查数据库」变成「查数」）。
 *
 * 静默少字比图画不出来更坏：作者不会发现，读者看到的是一张缺字的图。
 */

import { describe, expect, it } from 'vitest'
import { pinIntrinsicSize } from '../src/diagrams/pin-size.js'

const MERMAID_SVG =
  '<svg id="mermaid-0" width="100%" xmlns="http://www.w3.org/2000/svg" class="flowchart"' +
  ' style="max-width: 904.71875px;" viewBox="0 0 904.71875 147.359375" role="graphics-document">' +
  '<g></g></svg>'

describe('钉住图的自然尺寸', () => {
  it('把 width="100%" 换成 viewBox 里的实际宽度', () => {
    const out = pinIntrinsicSize(MERMAID_SVG)
    expect(out).toContain('width="904.71875"')
    expect(out).not.toContain('width="100%"')
  })

  it('顺带补上高度，浏览器才不必靠比例反算', () => {
    expect(pinIntrinsicSize(MERMAID_SVG)).toContain('height="147.359375"')
  })

  it('删掉行内的 max-width——那正是把图压小的那一条', () => {
    const out = pinIntrinsicSize(MERMAID_SVG)
    expect(out).not.toContain('max-width')
  })

  it('viewBox 保留，缩放和无障碍属性都要靠它', () => {
    expect(pinIntrinsicSize(MERMAID_SVG)).toContain('viewBox="0 0 904.71875 147.359375"')
  })

  it('行内样式里的其它声明不受影响', () => {
    const svg = '<svg width="100%" style="max-width: 100px; background: red;" viewBox="0 0 100 50"></svg>'
    const out = pinIntrinsicSize(svg)
    expect(out).toContain('background: red')
    expect(out).not.toContain('max-width')
  })

  it('没有 viewBox 就原样返回——没有依据可算，不猜', () => {
    const svg = '<svg width="100%" style="max-width: 10px;"></svg>'
    expect(pinIntrinsicSize(svg)).toBe(svg)
  })

  it('本来就写了确切宽度的引擎输出不动它', () => {
    const svg = '<svg width="300" height="200" viewBox="0 0 300 200"></svg>'
    expect(pinIntrinsicSize(svg)).toBe(svg)
  })

  it('只动第一个 svg 标签，图里嵌套的 svg 不碰', () => {
    const svg =
      '<svg width="100%" viewBox="0 0 200 100"><svg width="100%" viewBox="0 0 10 10"></svg></svg>'
    const out = pinIntrinsicSize(svg)
    expect(out).toContain('<svg width="200" height="100" viewBox="0 0 200 100">')
    expect(out).toContain('<svg width="100%" viewBox="0 0 10 10">')
  })
})
