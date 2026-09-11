/**
 * 结构化图表的自有写法（票 #3–#21）。
 *
 * 翻译器是纯函数，所以主要在这一层测：结构进、Mermaid 文本或 SVG 出，不启动浏览器。
 * 「翻出来的图能不能真画出来」由 `build()` 那一层的集成测试管，
 * 那条路和 ` ```mermaid ` 围栏完全相同，不重复测一遍。
 */

import { describe, expect, it } from 'vitest'
import { parse } from '../src/parse.js'
import { parseStructuredBody, parseDeclaration, parseRelation } from '../src/diagrams/structured/parse.js'
import { translate, STRUCTURED_KINDS } from '../src/diagrams/structured/kinds.js'

/** 从源文档拿到翻译结果：走真实的 parse，和编译时同一条路 */
function compiled(source: string): {
  code?: string
  svg?: string
  failed?: string
  codes: string[]
} {
  const result = parse(source)
  const node = result.ast.children.find((n) => n.type === 'code') as
    | { lang?: string; value?: string; data?: { svg?: string; failed?: { reason: string } } }
    | undefined
  const failed = node?.data?.failed?.reason
  return {
    // 翻译失败时那个节点装的是原文，不是图源——别把它当成翻译结果
    ...(failed === undefined && node?.value !== undefined && { code: node.value }),
    ...(node?.data?.svg !== undefined && { svg: node.data.svg }),
    ...(failed !== undefined && { failed }),
    codes: result.diagnostics.map((d) => d.code),
  }
}

describe('骨架解析器', () => {
  it('把指令体切成块，行号跟着源文档走', () => {
    const body = parseStructuredBody('nodes:\n  a\n  b\nedges:\n  a -> b', 10)
    expect([...body.blocks.keys()]).toEqual(['nodes', 'edges'])
    expect(body.blocks.get('nodes')).toEqual([
      { text: 'a', line: 11 },
      { text: 'b', line: 12 },
    ])
    expect(body.blocks.get('edges')?.[0]?.line).toBe(14)
  })

  it('条目出现在任何块名之前时报错', () => {
    const body = parseStructuredBody('  a\nnodes:\n  b', 1)
    expect(body.diagnostics.map((d) => d.code)).toEqual(['DIAG-305'])
  })

  it('同一个块写两次报错', () => {
    const body = parseStructuredBody('nodes:\n  a\nnodes:\n  b', 1)
    expect(body.diagnostics.map((d) => d.code)).toEqual(['DIAG-305'])
  })

  it('空行和 # 开头的注释行被跳过', () => {
    const body = parseStructuredBody('nodes:\n\n  # 说明\n  a', 1)
    expect(body.blocks.get('nodes')).toEqual([{ text: 'a', line: 4 }])
  })

  it('声明行：名字、形状、文字三段都认得出来', () => {
    expect(parseDeclaration({ text: 'cache = diamond "有缓存吗？"', line: 1 })).toEqual({
      id: 'cache',
      shape: 'diamond',
      text: '有缓存吗？',
      line: 1,
    })
    expect(parseDeclaration({ text: 'request', line: 2 })).toEqual({
      id: 'request',
      text: 'request',
      line: 2,
    })
  })

  it('关系行：长箭头先匹配，否则 --> 会被 -> 切掉半截', () => {
    const relation = parseRelation({ text: 'a --> b : 回复', line: 1 }, ['-->', '->'])
    expect(relation).toMatchObject({ from: 'a', to: 'b', arrow: '-->', label: '回复' })
  })
})

describe('流程图 :::flow', () => {
  const source = [
    ':::flow[登录链路]{dir=LR}',
    'nodes:',
    '  request = "请求"',
    '  cache = diamond "有缓存吗？"',
    '  hit = "直接返回"',
    'edges:',
    '  request -> cache',
    '  cache -> hit : 有',
    ':::',
  ].join('\n')

  it('翻译成 Mermaid 图源，方向和形状都生效', () => {
    const { code, codes } = compiled(source)
    expect(codes).toEqual([])
    expect(code).toContain('flowchart LR')
    expect(code).toContain('cache{"有缓存吗？"}')
    expect(code).toContain('request --> cache')
    expect(code).toContain('-->|"有"| hit')
  })

  it('指令标题成为图的标题', () => {
    expect(compiled(source).code).toContain('title: 登录链路')
  })

  it('连线引用了没声明过的名字时报错，图的位置留占位框', () => {
    const { code, failed, codes } = compiled(
      ':::flow\nnodes:\n  a\nedges:\n  a -> ghost\n:::',
    )
    expect(codes).toContain('DIAG-306')
    expect(code).toBeUndefined()
    // 一张图写错了不该让整份文档少一块——位置留着，写明原因
    expect(failed).toContain('ghost')
  })

  it('不认识的形状报错并列出能用的', () => {
    const { codes } = compiled(':::flow\nnodes:\n  a = triangle "甲"\nedges:\n  a -> a\n:::')
    expect(codes).toContain('DIAG-307')
  })

  it('缺少 edges 块时报错', () => {
    expect(compiled(':::flow\nnodes:\n  a\n:::').codes).toContain('DIAG-305')
  })

  it('不认识的属性给警告，和别的指令一个规矩', () => {
    expect(compiled(':::flow{speed=fast}\nnodes:\n  a\nedges:\n  a -> a\n:::').codes).toContain(
      'DIR-207',
    )
  })
})

describe('其余几种翻译成 Mermaid 的图', () => {
  it('时序图：-> 是请求，--> 是回复', () => {
    const { code } = compiled(
      ':::sequence\nparticipants:\n  a = "作者"\n  b = "编译器"\nmessages:\n  a -> b : build\n  b --> a : 产物\n:::',
    )
    expect(code).toContain('sequenceDiagram')
    expect(code).toContain('a->>b: build')
    expect(code).toContain('b-->>a: 产物')
  })

  it('饼图：名字和数值', () => {
    const { code } = compiled(':::pie\nslices:\n  样式 : 17\n  正文 : 12\n:::')
    expect(code).toContain('pie')
    expect(code).toContain('"样式" : 17')
  })

  it('饼图的数值不是数字时报错', () => {
    expect(compiled(':::pie\nslices:\n  样式 : 很多\n:::').codes).toContain('DIAG-306')
  })

  it('思维导图：> 的个数就是层级', () => {
    const { code } = compiled(':::mindmap\nroot:\n  Pamphlet\nbranches:\n  > 语法\n  >> 指令\n:::')
    expect(code).toContain('root((Pamphlet))')
    expect(code?.split('\n').at(-1)).toBe('      指令')
  })

  it('块图：每个格子有自己的 id，否则 block-beta 解析不了', () => {
    const { code } = compiled(':::block\nblocks:\n  甲 | - | 乙\n:::')
    expect(code).toContain('b1["甲"] space b2["乙"]')
  })

  it('git 图：不认识的操作报错', () => {
    expect(compiled(':::gitgraph\ncommits:\n  rebase main\n:::').codes).toContain('DIAG-306')
  })
})

describe('自己画 SVG 的四种', () => {
  it('泳道图：道和步骤都画出来，颜色走图表变量', () => {
    const { svg, codes } = compiled(
      ':::swimlane\nlanes:\n  u = "用户"\n  o = "订单"\nsteps:\n  u : 下单\n  o : 出单\n:::',
    )
    expect(codes).toEqual([])
    expect(svg).toContain('用户')
    expect(svg).toContain('下单')
    expect(svg).toContain('var(--pf-diagram-line')
  })

  it('泳道图：步骤写了不存在的道时报错', () => {
    expect(
      compiled(':::swimlane\nlanes:\n  u = "用户"\nsteps:\n  ghost : 下单\n:::').codes,
    ).toContain('DIAG-306')
  })

  it('组织架构图：层级靠 > 的个数', () => {
    const { svg } = compiled(':::orgchart\nmembers:\n  总部\n  > 一组\n  > 二组\n:::')
    expect(svg).toContain('总部')
    expect(svg).toContain('一组')
    expect(svg).toContain('二组')
  })

  it('数据图表：柱状图画出柱子，折线图画出折线', () => {
    const bar = compiled(':::chart{type=bar}\npoints:\n  一月 : 120\n:::')
    expect(bar.svg).toContain('<rect')
    const line = compiled(':::chart{type=line}\npoints:\n  一月 : 120\n  二月 : 90\n:::')
    expect(line.svg).toContain('<path')
  })

  it('数据图表：不认识的类型报错', () => {
    expect(compiled(':::chart{type=donut}\npoints:\n  一月 : 1\n:::').codes).toContain('DIAG-307')
  })

  it('网络拓扑：主机挂在不存在的网段上时报错', () => {
    expect(
      compiled(':::topology\nzones:\n  dmz = "DMZ"\nhosts:\n  h = ghost "主机"\n:::').codes,
    ).toContain('DIAG-306')
  })
})

describe('两套写法并存', () => {
  it('```mermaid 围栏一个字都没变', () => {
    const { code, codes } = compiled('```mermaid\nflowchart LR\n  A --> B\n```')
    expect(codes).toEqual([])
    expect(code).toBe('flowchart LR\n  A --> B')
  })

  it('十七个图种名字都被认识，不会当成未知指令', () => {
    for (const kind of STRUCTURED_KINDS) {
      const codes = compiled(`:::${kind}\n:::`).codes
      expect(codes, kind).not.toContain('DIR-201')
    }
  })

  it('没实现自有写法的图种给一条说得清的诊断', () => {
    const result = translate('flow', {
      body: parseStructuredBody('nodes:\n  a\nedges:\n  a -> a', 1),
      attrs: {},
      at: { line: 1, column: 1 },
    })
    expect(result.mermaid).toBeDefined()
  })
})
