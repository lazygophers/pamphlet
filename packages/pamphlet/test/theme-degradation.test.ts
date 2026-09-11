/**
 * 每一套内置主题都必须守住同一条底线：**关掉 JavaScript 内容一个字不丢**（ADR-0015）。
 *
 * 主题能改布局（ADR-0046），所以这条承诺不再是「组装器保证一次」就完事——
 * 任何一套主题的 CSS 写错一行（比如给 `.pf-tab[hidden]` 加了个 display 规则、
 * 或者把 `.pf-collapse` 的高度写死），都能单独把它捅破。所以逐套开浏览器验。
 *
 * 字号也一起钉住：主题可以随便改版式，但正文不许被改到 14px 以下。
 */

import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser } from 'playwright'
import { BUILTIN_THEMES, THEMES } from '@nekoleapuki/pamphlet-themes'
import { parse } from '../src/parse.js'
import { assemble } from '../src/assemble/index.js'

const SOURCE = [
  '# 主题降级',
  '',
  '这是一段正文，用来量字号。',
  '',
  '::::tabs',
  ':::tab[甲方案]{default}',
  '甲的内容',
  ':::',
  ':::tab[乙方案]',
  '乙的内容',
  ':::',
  '::::',
  '',
  ':::collapse[折起来的细节]',
  '折叠块里的内容',
  ':::',
  '',
].join('\n')

let browser: Browser
let dir: string
const pages = new Map<string, string>()

beforeAll(async () => {
  browser = await chromium.launch()
  dir = await mkdtemp(join(tmpdir(), 'pamphlet-theme-'))
  const parsed = parse(SOURCE)
  for (const name of BUILTIN_THEMES) {
    const theme = THEMES[name]
    const { html } = await assemble(parsed, {
      light: theme.light,
      dark: theme.dark,
      themeCss: theme.css,
    })
    const path = join(dir, `${name}.html`)
    await writeFile(path, html, 'utf8')
    pages.set(name, pathToFileURL(path).href)
  }
}, 120_000)

afterAll(async () => {
  await browser?.close()
}, 60_000)

describe.each(BUILTIN_THEMES)('主题 %s', (name) => {
  it('关掉 JavaScript 时两个 Tab 的内容都看得见', async () => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(pages.get(name)!)
    const visible = await page.locator('body').innerText()
    expect(visible).toContain('甲的内容')
    expect(visible).toContain('乙的内容')
    await context.close()
  })

  it('关掉 JavaScript 时折叠块降级成原生 details，内容还在', async () => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(pages.get(name)!)
    // 收起状态的 details 不出现在 innerText 里，但内容必须在 DOM 里
    expect(await page.locator('details').first().textContent()).toContain('折叠块里的内容')
    await context.close()
  })

  it('正文字号不低于 14px', async () => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(pages.get(name)!)
    const size = await page
      .locator('.pf-doc > p')
      .first()
      .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))
    expect(size).toBeGreaterThanOrEqual(14)
    await context.close()
  })

  it('有 JavaScript 时只显示选中的那个面板，点另一个能切过去', async () => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(pages.get(name)!)
    await page.waitForTimeout(200)

    const before = await page.locator('body').innerText()
    expect(before).toContain('甲的内容')
    expect(before).not.toContain('乙的内容')

    await page.locator('.pf-tab-button', { hasText: '乙方案' }).click()
    await page.waitForTimeout(150)
    expect(await page.locator('body').innerText()).toContain('乙的内容')
    await context.close()
  })
})
