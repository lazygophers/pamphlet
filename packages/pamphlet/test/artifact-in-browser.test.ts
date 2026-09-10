/**
 * 三条核心承诺的浏览器层凭据：CSP 认哈希、零外部请求、无 JavaScript 也能读。
 *
 * 这三条都不是字符串断言能证明的——「哈希算对了」和「浏览器真的肯执行」是两件事，
 * 「产物里没有 http:// 」和「打开时一个请求都不发」也是两件事。所以这里开真浏览器。
 */

import { mkdtemp, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser } from 'playwright'
import { parse } from '../src/parse.js'
import { assemble } from '../src/assemble/index.js'

const TABS = [
  '# 订单系统',
  '',
  '::::tabs',
  ':::tab[甲方案]',
  '甲的内容',
  ':::',
  ':::tab[乙方案]',
  '乙的内容',
  ':::',
  '::::',
  '',
].join('\n')

let browser: Browser
let dir: string

beforeAll(async () => {
  browser = await chromium.launch()
  dir = await mkdtemp(join(tmpdir(), 'pamphlet-browser-'))
}, 120_000)

afterAll(async () => {
  // 关浏览器要等 Chromium 进程真的退出；整套并行跑时它抢不到 CPU，默认 10 秒不够
  await browser?.close()
}, 60_000)

/** 把产物写成真文件再用 file:// 打开——这就是用户双击时发生的事 */
async function open(html: string, name: string): Promise<string> {
  const file = join(dir, name)
  await writeFile(file, html, 'utf8')
  return pathToFileURL(file).href
}

describe('CSP 认哈希（ADR-0017）', () => {
  it('运行时脚本被执行，额外注入的内联脚本被拦', async () => {
    const { html } = await assemble(parse(TABS))
    // 注入一段 CSP 白名单之外的脚本：它的哈希不在清单里，浏览器必须拒绝执行
    const tampered = html.replace('</body>', '<script>window.__pfEvil=1</script></body>')
    const page = await browser.newPage()
    const violations: string[] = []
    page.on('console', (message) => {
      if (/Content Security Policy/i.test(message.text())) violations.push(message.text())
    })
    await page.goto(await open(tampered, 'csp.html'))

    // 运行时跑起来了：只有 tabs 片段执行过才会有这个标记
    await page.waitForSelector('[data-pf-tabs][data-pf-ready]', { timeout: 10_000 })
    expect(await page.locator('.pf-tab-button').count()).toBe(2)
    // 注入的那段没跑
    expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).__pfEvil)).toBeUndefined()
    expect(violations.length).toBeGreaterThan(0)
    await page.close()
  }, 60_000)

  it('运行时脚本改一个字节，浏览器就不再执行它', async () => {
    const { html } = await assemble(parse(TABS))
    // 只动脚本正文，不动 CSP 里的哈希 —— 哈希对不上，整段运行时都不该跑
    const broken = html.replace('var __pfQueue=[];', 'var __pfQueue=[] ;')
    const page = await browser.newPage()
    await page.goto(await open(broken, 'csp-broken.html'))
    expect(await page.locator('.pf-tab-button').count()).toBe(0)
    await page.close()
  }, 60_000)
})

describe('零外部请求', () => {
  const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
    'base64',
  )
  const FONT = '/System/Library/Fonts/Supplemental/Arial Unicode.ttf'

  it('内嵌图片、内嵌字体、图表 SVG 全在产物里时，打开产物发 0 个请求', async () => {
    const source = ['# 标题', '', '![一张图](./a.png)', '', '正文。', ''].join('\n')
    const parsed = parse(source)
    // 图表管线的产物就是挂在 code 节点上的 SVG，这里直接给一段等价的
    parsed.ast.children.push({
      type: 'code',
      lang: 'mermaid',
      value: 'graph TD; A-->B',
      data: { svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>甲</text></svg>' },
    } as never)

    const { html } = await assemble(parsed, {
      readAsset: async (path) => (path === FONT ? new Uint8Array(readFileSync(path)) : new Uint8Array(PNG)),
      ...(existsSync(FONT) ? { font: { family: 'Pamphlet Sans', path: FONT } } : {}),
    })
    expect(html).toContain('data:image/png;base64,')
    if (existsSync(FONT)) expect(html).toContain('data:font/woff2;base64,')

    const url = await open(html, 'offline.html')
    const page = await browser.newPage()
    const extra: string[] = []
    page.on('request', (request) => {
      if (request.url() !== url) extra.push(request.url())
    })
    await page.goto(url)
    await page.waitForLoadState('load')
    // 字体是懒加载的：要等它真的被用到才会发请求，所以先让它上场
    await page.evaluate(() => document.fonts.ready)
    expect(extra).toEqual([])
    await page.close()
  }, 60_000)
})

describe('无 JavaScript 降级（ADR-0015）', () => {
  it('禁用 JavaScript 时面板内容全可见、标题是真标题、按 id 能跳', async () => {
    const { html } = await assemble(parse(TABS))
    const url = await open(html, 'nojs.html')
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(url)

    // 两个面板的内容都看得见，没有一个被藏起来
    expect(await page.getByText('甲的内容').isVisible()).toBe(true)
    expect(await page.getByText('乙的内容').isVisible()).toBe(true)
    // 没有按钮（那是运行时才加的），标题仍是真标题元素
    expect(await page.locator('.pf-tab-button').count()).toBe(0)
    expect(await page.locator('h2.pf-tab-title').count()).toBe(2)
    const ids = await page.locator('h2.pf-tab-title').evaluateAll((nodes) =>
      nodes.map((node) => node.id),
    )
    expect(ids).toEqual(['甲方案', '乙方案'])

    // 按 id 跳过去：目标标题进入视口
    await page.goto(`${url}#${encodeURIComponent('乙方案')}`)
    const box = await page.locator('#乙方案').boundingBox()
    const viewport = page.viewportSize()
    expect(box).not.toBeNull()
    expect(box?.y).toBeGreaterThanOrEqual(0)
    expect(box?.y).toBeLessThan(viewport?.height ?? 0)
    await context.close()
  }, 60_000)
})
