import { describe, expect, it } from 'vitest'
import { findUnclosedDirectives } from '../src/unclosed.js'

describe('未闭合指令检测', () => {
  it('闭合完整时没有诊断', () => {
    const source = ['::::tabs', ':::tab[甲]', '内容', ':::', '::::'].join('\n')
    expect(findUnclosedDirectives(source)).toEqual([])
  })

  it('少写外层闭合时报错，位置指向开启那一行', () => {
    const source = ['# 标题', '', '::::tabs', ':::tab[甲]', '内容', ':::'].join('\n')
    const diagnostics = findUnclosedDirectives(source)
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.code).toBe('DIR-203')
    expect(diagnostics[0]?.severity).toBe('error')
    expect(diagnostics[0]?.start).toEqual({ line: 3, column: 1 })
    expect(diagnostics[0]?.message).toContain('tabs')
  })

  it('少写内层闭合时，报的是内层那个', () => {
    const source = ['::::tabs', ':::tab[甲]', '内容', '::::'].join('\n')
    const diagnostics = findUnclosedDirectives(source)
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.start).toEqual({ line: 2, column: 1 })
    expect(diagnostics[0]?.message).toContain('tab')
  })

  it('代码块里的 ::: 是内容，不算指令', () => {
    const source = ['```markdown', ':::tab[这是在讲语法]', '```', ''].join('\n')
    expect(findUnclosedDirectives(source)).toEqual([])
  })

  it('四反引号包住三反引号时也不误判', () => {
    const source = ['````markdown', '```', ':::callout warn', '```', '````'].join('\n')
    expect(findUnclosedDirectives(source)).toEqual([])
  })

  it('波浪线代码围栏同样生效', () => {
    const source = ['~~~text', ':::steps', '~~~'].join('\n')
    expect(findUnclosedDirectives(source)).toEqual([])
  })

  it('多个未闭合各报一条', () => {
    const source = ['::::tabs', ':::tab[甲]'].join('\n')
    const diagnostics = findUnclosedDirectives(source)
    expect(diagnostics).toHaveLength(2)
    expect(diagnostics.map((d) => d.start?.line)).toEqual([1, 2])
  })

  it('闭合栅栏的冒号数不少于开启的才算闭合', () => {
    // ::: 关不掉 ::::（闭合冒号数必须 >= 开启）
    const source = ['::::tabs', '内容', ':::'].join('\n')
    expect(findUnclosedDirectives(source)).toHaveLength(1)
  })

  it('诊断带修复建议', () => {
    const [diagnostic] = findUnclosedDirectives('::::tabs\n')
    expect(diagnostic?.hint).toContain('::::')
    expect(diagnostic?.docUrl).toContain('dir-203')
  })
})

describe('未闭合检测的其余分支', () => {
  it('空文档没有诊断', () => {
    expect(findUnclosedDirectives('')).toEqual([])
  })

  it('缩进的指令也认（最多三个空格）', () => {
    const diagnostics = findUnclosedDirectives('   :::collapse[甲]\n')
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.start).toEqual({ line: 1, column: 4 })
  })

  it('孤立的闭合栅栏不会让栈变成负数', () => {
    expect(findUnclosedDirectives(':::\n:::\n:::\n')).toEqual([])
  })

  it('冒号后面跟非字母时名字为空但仍然报未闭合', () => {
    const diagnostics = findUnclosedDirectives(':::{#id}\n')
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.code).toBe('DIR-203')
  })

  it('代码围栏没闭合时，它后面的 ::: 全部算在代码块里', () => {
    expect(findUnclosedDirectives('```\n:::tabs\n')).toEqual([])
  })

  it('闭合栅栏冒号数多于开启时也能关掉', () => {
    expect(findUnclosedDirectives(':::collapse[甲]\n内容\n::::\n')).toEqual([])
  })

  it('未闭合的多条按行号从上往下排', () => {
    const source = [':::::a', '::::b', ':::c'].join('\n')
    const lines = findUnclosedDirectives(source).map((d) => d.start?.line)
    expect(lines).toEqual([1, 2, 3])
  })
})

describe('代码围栏让 ::: 失效的那几种边界', () => {
  it('波浪线围栏同样让里面的 ::: 变成内容', () => {
    expect(findUnclosedDirectives('~~~\n:::tabs\n~~~\n')).toEqual([])
  })

  it('围栏里出现另一种记号时不算闭合', () => {
    // ``` 开的块，里面一行 ~~~ 只是内容，:::tabs 仍在代码块里
    expect(findUnclosedDirectives('```\n~~~\n:::tabs\n```\n')).toEqual([])
  })

  it('闭合围栏比开启的长也算闭合', () => {
    expect(findUnclosedDirectives('```\n代码\n`````\n:::tabs\n')).toHaveLength(1)
  })

  it('带语言标记的一行不能当闭合围栏', () => {
    // 第二个 ```ts 是内容不是闭合，所以 :::tabs 仍在代码块里
    expect(findUnclosedDirectives('```ts\n```ts\n:::tabs\n')).toEqual([])
  })

  it('闭合栅栏比任何一层都短时，谁也关不掉', () => {
    // `::` 只有两个冒号，关不掉 `::::tabs`
    const found = findUnclosedDirectives('::::tabs\n内容\n::\n')
    expect(found).toHaveLength(1)
    expect(found[0]?.start?.line).toBe(1)
  })

  it('多余的闭合栅栏不会把栈弄崩', () => {
    expect(findUnclosedDirectives(':::info\n正文\n:::\n:::\n')).toEqual([])
  })
})
