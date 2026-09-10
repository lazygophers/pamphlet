/**
 * 对比度检查：唯一能自动接住「暗色主题下某处文字看不见」的手段。
 *
 * 为什么必须有它：纯文本快照发现不了颜色语义错误。实测踩过一次——
 * Mermaid 的 `<style>` 里写 `fill:black`（CSS 具名色），只替换十六进制时漏掉它，
 * 结果暗色下框内文字和背景同色。快照只会显示「`fill:black` 还是 `fill:black`」，一切正常。
 *
 * 这层测试真的启动无头浏览器（图表渲染本来就需要它，不引入新依赖），
 * 所以比其它测试慢。实测：浏览器冷启动 733ms，之后每张图 364ms。
 */

import { describe, expect, it } from 'vitest'
import { chromium, type Browser } from 'playwright'
import { createMermaidEngine } from '../src/diagrams/mermaid.js'
import { CSS_VARIABLE, FALLBACK, type DiagramToken } from '../src/diagrams/tokens.js'

const THEMES = {
  亮色: {
    bg: '#ffffff',
    fill: '#f6f8fa',
    line: '#d0d7de',
    text: '#1f2328',
    accent: '#2d6cdf',
    muted: '#656d76',
  },
  暗色: {
    bg: '#0d1117',
    fill: '#161b22',
    line: '#30363d',
    text: '#e6edf3',
    accent: '#58a6ff',
    muted: '#9198a1',
  },
} satisfies Record<string, Record<DiagramToken, string>>

const DIAGRAMS = {
  时序图: `sequenceDiagram
  用户->>网关: POST /orders
  网关->>订单服务: 创建订单
  Note right of 网关: 一条备注
  订单服务-->>用户: 201`,
  流程图: `flowchart TD
  A[下单] --> B{库存够?}
  B -->|够| C[预扣]
  B -->|不够| D[拒单]`,
  状态图: `stateDiagram-v2
  [*] --> 待支付
  待支付 --> 已支付: 支付成功
  待支付 --> 已取消: 超时
  已支付 --> [*]`,
}

function page(svg: string, theme: Record<DiagramToken, string>): string {
  const vars = (Object.keys(theme) as DiagramToken[])
    .map((token) => `${CSS_VARIABLE[token]}:${theme[token]};`)
    .join('')
  return `<!doctype html><html><head><meta charset="utf-8"><style>
:root{${vars}}
body{margin:0;background:${theme.bg}}
</style></head><body>${svg}</body></html>`
}

/** WCAG 的相对亮度 */
function luminance(rgb: [number, number, number]): number {
  const channel = (value: number): number => {
    const v = value / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2])
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

function parseRgb(value: string): [number, number, number] | undefined {
  const match = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(value)
  if (!match) return undefined
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

/** 把页面里每个文字节点的实际填充色取出来 */
async function textFills(browser: Browser, html: string): Promise<{ text: string; fill: string }[]> {
  const p = await browser.newPage()
  try {
    await p.setContent(html)
    await p.waitForTimeout(50)
    return await p.evaluate(() => {
      const out: { text: string; fill: string }[] = []
      // 只看**真正画出字的那个元素**。Mermaid 会把 class="actor" 同时加在 <text> 容器
      // 和它的矩形上，而容器的 fill 被子 <tspan> 覆盖、不影响可见文字——
      // 把容器也算进来会得到一个假的失败。
      for (const node of document.querySelectorAll('text, tspan, .nodeLabel, .edgeLabel')) {
        const content = (node.textContent ?? '').trim()
        if (content === '') continue
        if (node.querySelector('tspan')) continue // 有 tspan 子元素 = 它只是容器
        const style = window.getComputedStyle(node)
        const fill = style.fill && style.fill !== 'none' ? style.fill : style.color
        out.push({ text: content, fill })
      }
      return out
    })
  } finally {
    await p.close()
  }
}

describe('图表文字在亮暗两套主题下都要读得清', () => {
  it(
    '三种图 × 两套主题，每个文字节点的对比度都 ≥ 4.5:1',
    async () => {
      const engine = createMermaidEngine()
      const probe = await engine.probe()
      expect(probe.available, '这层测试需要 mermaid-isomorphic 与 playwright').toBe(true)

      const names = Object.keys(DIAGRAMS) as (keyof typeof DIAGRAMS)[]
      const results = await engine.render(
        names.map((name, index) => ({ code: DIAGRAMS[name], line: index + 1 })),
      )

      const browser = await chromium.launch()
      const failures: string[] = []
      try {
        for (const [index, result] of results.entries()) {
          const name = names[index] ?? String(index)
          expect('svg' in result, `${name} 应该渲染成功`).toBe(true)
          if (!('svg' in result)) continue

          for (const [themeName, theme] of Object.entries(THEMES)) {
            const fills = await textFills(browser, page(result.svg, theme))
            expect(fills.length, `${name} / ${themeName} 应该有文字节点`).toBeGreaterThan(0)

            const background = parseRgb(`rgb(${hexToRgb(theme.bg).join(',')})`)
            if (!background) continue

            for (const { text, fill } of fills) {
              const rgb = parseRgb(fill)
              if (!rgb) continue
              const ratio = contrast(rgb, background)
              if (ratio < 4.5) {
                failures.push(
                  `${name} / ${themeName}：「${text}」对比度只有 ${ratio.toFixed(2)}:1（填充色 ${fill}）`,
                )
              }
            }
          }
        }
      } finally {
        await browser.close()
      }

      expect(failures, failures.join('\n')).toEqual([])
    },
    120_000,
  )
})

describe('替换漏掉时对比度检查确实会失败（反向验证）', () => {
  it('把文字色写死成黑色、放在暗底上时，检查必须报出来', async () => {
    const browser = await chromium.launch()
    try {
      // 模拟那次真实的失败：fill:black 没被替换
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60">
        <style>text{fill:black}</style>
        <text x="10" y="30">看不见的字</text>
      </svg>`
      const fills = await textFills(browser, page(svg, THEMES.暗色))
      expect(fills).toHaveLength(1)
      const rgb = parseRgb(fills[0]?.fill ?? '')
      expect(rgb).toBeDefined()
      const ratio = contrast(rgb as [number, number, number], hexToRgb(THEMES.暗色.bg))
      expect(ratio).toBeLessThan(4.5)
    } finally {
      await browser.close()
    }
  }, 60_000)

  it('换成主题变量之后同一段文字就合格了', async () => {
    const browser = await chromium.launch()
    try {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60">
        <style>text{fill:var(${CSS_VARIABLE.text}, ${FALLBACK.text})}</style>
        <text x="10" y="30">看得见的字</text>
      </svg>`
      const fills = await textFills(browser, page(svg, THEMES.暗色))
      const rgb = parseRgb(fills[0]?.fill ?? '')
      const ratio = contrast(rgb as [number, number, number], hexToRgb(THEMES.暗色.bg))
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    } finally {
      await browser.close()
    }
  }, 60_000)
})

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ]
}
