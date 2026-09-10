/**
 * 指令语法（ADR-0038）：`[label]` 是给读者看的标题，`{attrs}` 是给编译器看的参数。
 */

import { describe, expect, it } from 'vitest'
import { parse } from '../src/parse.js'
import { CALLOUT_DIRECTIVES, REVEAL_EFFECTS } from '../src/ast.js'

const codes = (source: string) => parse(source).diagnostics.map((d) => d.code)
const find = (source: string, code: string) =>
  parse(source).diagnostics.find((d) => d.code === code)

describe('四种提示块（ADR-0024 修订版：四个指令名，不是 callout{type=}）', () => {
  it('四个名字全部合法，标题可选', () => {
    for (const name of CALLOUT_DIRECTIVES) {
      expect(codes([`:::${name}`, '正文', ':::'].join('\n'))).toEqual([])
      expect(codes([`:::${name}[带标题]`, '正文', ':::'].join('\n'))).toEqual([])
    }
  })

  it('`callout` 本身不再是指令名', () => {
    expect(codes([':::callout[甲]', '正文', ':::'].join('\n'))).toEqual(['DIR-201'])
  })

  it('提示块不接受属性', () => {
    const d = find([':::warn{type=danger}', '正文', ':::'].join('\n'), 'DIR-207')
    expect(d?.severity).toBe('warning')
    expect(d?.hint).toContain('不接受任何属性')
  })

  it('打错字时的提示会说明四种提示块', () => {
    expect(find([':::warnn', '正文', ':::'].join('\n'), 'DIR-201')?.hint).toContain(
      'info / tip / warn / danger',
    )
  })
})

describe('collapse：标题必填', () => {
  it('有标题时合法', () => {
    expect(codes([':::collapse[高级参数]', '内容', ':::'].join('\n'))).toEqual([])
  })

  it('没标题报错，并说明为什么必填', () => {
    const d = find([':::collapse', '内容', ':::'].join('\n'), 'DIR-204')
    expect(d?.severity).toBe('error')
    expect(d?.hint).toContain('<details>')
  })

  it('认识 open 属性', () => {
    expect(codes([':::collapse[甲]{open}', '内容', ':::'].join('\n'))).toEqual([])
  })

  it('不认识的属性给警告并列出认识的', () => {
    expect(find([':::collapse[甲]{closed}', '内容', ':::'].join('\n'), 'DIR-207')?.hint).toContain(
      'open',
    )
  })
})

describe('steps：不接受属性，里面必须有有序列表', () => {
  it('有有序列表时合法', () => {
    expect(codes([':::steps', '1. 提交订单', '2. 库存预扣', ':::'].join('\n'))).toEqual([])
  })

  it('里面只有段落时报错', () => {
    const d = find([':::steps', '就一段话', ':::'].join('\n'), 'DIR-204')
    expect(d?.severity).toBe('error')
    expect(d?.hint).toContain('浏览器算')
  })

  it('无序列表不算', () => {
    expect(codes([':::steps', '- 甲', '- 乙', ':::'].join('\n'))).toEqual(['DIR-204'])
  })

  it('带属性时给警告', () => {
    expect(codes([':::steps{auto}', '1. 甲', ':::'].join('\n'))).toEqual(['DIR-207'])
  })
})

describe('reveal：效果放属性', () => {
  it('缺省不写属性时合法', () => {
    expect(codes([':::reveal', '内容', ':::'].join('\n'))).toEqual([])
  })

  it('四种效果名全部认识', () => {
    for (const effect of REVEAL_EFFECTS) {
      expect(codes([`:::reveal{effect=${effect}}`, '内容', ':::'].join('\n'))).toEqual([])
    }
  })

  it('不认识的效果名报错并列出可用的', () => {
    const d = find([':::reveal{effect=explode}', '内容', ':::'].join('\n'), 'DIR-206')
    expect(d?.severity).toBe('error')
    expect(d?.hint).toContain('fade-up')
  })
})

describe('tab 的 {default} 标记（同组只能有一个）', () => {
  const tabs = (marks: string[]) =>
    [
      '::::tabs',
      ...marks.flatMap((mark, index) => [`:::tab[方案${index}]${mark}`, '内容', ':::']),
      '::::',
    ].join('\n')

  it('都不标时合法（选中第一个）', () => {
    expect(codes(tabs(['', '']))).toEqual([])
  })

  it('标一个时合法', () => {
    expect(codes(tabs(['', '{default}']))).toEqual([])
  })

  it('标两个时报错，位置指向第二个', () => {
    const result = parse(tabs(['{default}', '{default}']))
    const errors = result.diagnostics.filter((d) => d.code === 'DIR-205')
    expect(errors).toHaveLength(1)
    expect(errors[0]?.severity).toBe('error')
    expect(errors[0]?.start?.line).toBe(5)
  })

  it('标三个时报两条（第一个之后的都报）', () => {
    expect(codes(tabs(['{default}', '{default}', '{default}']))).toEqual([
      'DIR-205',
      'DIR-205',
    ])
  })

  it('tabs 自己不接受 default', () => {
    const source = ['::::tabs{default}', ':::tab[甲]', '内容', ':::', '::::'].join('\n')
    expect(codes(source)).toEqual(['DIR-207'])
  })
})

describe('class 与 id 是 directive 语法原生的，任何指令都能带', () => {
  it('不给未知属性警告', () => {
    expect(codes([':::info{#note .highlight}', '正文', ':::'].join('\n'))).toEqual([])
  })
})

describe('撞上别的工具的写法时给指路的提示', () => {
  const hint = (name: string) => find([`:::${name}`, '正文', ':::'].join('\n'), 'DIR-201')?.hint

  it('Docusaurus 的 note / warning / caution / important 都被指到对应的名字', () => {
    expect(hint('note')).toContain('info')
    expect(hint('warning')).toContain('warn')
    expect(hint('caution')).toContain('warn')
    expect(hint('important')).toContain('danger')
  })

  it('早期设计稿里的 callout 被指到四个名字', () => {
    expect(hint('callout')).toContain('info / tip / warn / danger')
  })

  it('details / accordion 被指到 collapse', () => {
    expect(hint('details')).toContain('collapse')
    expect(hint('accordion')).toContain('collapse')
  })

  it('tabset 被指到 tabs', () => {
    expect(hint('tabset')).toContain('tabs')
  })

  it('打错这些别名也能猜到（编辑距离 ≤ 2）', () => {
    expect(hint('calout')).toContain('info / tip / warn / danger')
    expect(hint('warnin')).toContain('warn')
  })

  it('离得太远的名字不硬猜', () => {
    expect(hint('zzzzzzzzzz')).toBeUndefined()
  })
})

describe('拼错指令名时的提示', () => {
  it('别的工具的名字指向对应的 Pamphlet 名字', () => {
    const cases: [string, string][] = [
      ['note', 'info'],
      ['warning', 'warn'],
      ['caution', 'warn'],
      ['important', 'danger'],
      ['details', 'collapse'],
      ['accordion', 'collapse'],
      ['tabset', 'tabs'],
    ]
    for (const [wrong, right] of cases) {
      const hint = parse(`:::${wrong}\n正文\n:::\n`).diagnostics.find(
        (d) => d.code === 'DIR-201',
      )?.hint
      expect(hint, `${wrong} 应该指向 ${right}`).toContain(right)
    }
  })

  it('只差一两个字母的拼错也能猜出来', () => {
    const hint = parse(':::colapse[甲]\n正文\n:::\n').diagnostics.find(
      (d) => d.code === 'DIR-201',
    )?.hint
    expect(hint).toContain('collapse')
  })

  it('差得太远时不硬猜', () => {
    const hint = parse(':::xyzzy\n正文\n:::\n').diagnostics.find((d) => d.code === 'DIR-201')?.hint
    expect(hint ?? '').not.toContain('是不是想写')
  })
})
