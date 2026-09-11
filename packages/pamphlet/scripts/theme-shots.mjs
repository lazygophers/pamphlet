#!/usr/bin/env node
/**
 * 文档站「内置主题」那一页的每套主题两份产物——一张截图 + 一份可以点开的样例，
 * 全部由这个脚本从**真实编译**产出。
 *
 * 截图给的是第一屏的长相，样例给的是完整一篇：Tab 真能点、折叠块真能展开、
 * 侧边菜单真能跟着滚。挑主题的人光看一张静态图判断不了这些。
 * 两份产物出自**同一次编译**，所以它们不可能对不上。
 *
 * 手工截图那条路每一步都能漏：新增一套主题没人补图、改了样式没人重截、
 * 文件名打错只会得到一个裂图——而这三种失败都不会有任何东西报错。
 * 所以主题清单（`BUILTIN_THEMES`）是唯一的真相来源，图跟着它走。
 *
 * 产物不进版本库，由 `pnpm docs:build` 现编（同 ADR-0029 对示例产物的处理）：
 * 版本库里放二进制意味着每改一次主题就永久多存一份 1MB 的旧图，
 * 而这些图的正确性完全取决于「有没有人记得重跑」——正是这条 ticket 要消灭的东西。
 * 代价是文档站构建要有 Chromium；没有就在这里失败，而不是发出一页裂图。
 */

import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { BUILTIN_THEMES } from '@nekoleapuki/pamphlet-themes'
// 走包声明的那个入口（package.json 的 `exports` 只有 `.`），不越过包边界去摸 dist 里的模块：
// 内部文件怎么拆是包自己的事，深进去引一个没导出的路径，改一次内部结构就断
import { compileFile } from '../dist/index.js'

/**
 * 拿示例文档当样本，是因为主题之间的差别正落在它里面这些东西上：
 * 图表、Tab、折叠块、四种提示块、代码块、表格、侧边菜单。
 * 换一份只有正文的源文档，十二张图会长得几乎一样。
 */
const SOURCE = fileURLToPath(new URL('../../../examples/demo.md', import.meta.url))
const OUT_DIR = fileURLToPath(new URL('../../../docs/public/themes', import.meta.url))

/** 与文档站上的展示尺寸一致：宽到能看出侧边菜单与正文宽度的差别，高到能看见第一屏 */
const VIEWPORT = { width: 1440, height: 950 }

// 整个目录先清空再重建：删掉一套主题时，它的图和样例都不该留在站上
await rm(OUT_DIR, { recursive: true, force: true })
await mkdir(OUT_DIR, { recursive: true })

const browser = await chromium.launch()
// 减少动效：截图不该拍到某个正在淡入的元素
const context = await browser.newContext({ viewport: VIEWPORT, reducedMotion: 'reduce' })
const page = await context.newPage()

try {
  for (const name of BUILTIN_THEMES) {
    // 走的是 CLI 编译单份文档时走的同一条路（`compileFile`），不是另一套简化管线
    const { html, diagnostics } = await compileFile(SOURCE, { theme: name })
    const errors = diagnostics.filter((d) => d.severity === 'error')
    if (errors.length > 0) {
      throw new Error(`${name}: 编译报错 ${errors.map((d) => `${d.code} ${d.message}`).join('; ')}`)
    }

    // 样例直接落在站点的静态目录里，截图就拍它本人——不再先写临时文件再拍、拍完删掉。
    // 站上点开的那一份和图里那一份因此是同一个文件，不存在「图是新的、样例是旧的」
    const sample = join(OUT_DIR, `${name}.html`)
    await writeFile(sample, html, 'utf8')
    await page.goto(pathToFileURL(sample).href)
    await page.screenshot({ path: join(OUT_DIR, `${name}.png`) })
    console.log(`themes/${name}.png + themes/${name}.html`)
  }
} finally {
  await browser.close()
}

console.log(`${BUILTIN_THEMES.length} 套主题的截图与样例 → docs/public/themes/`)
