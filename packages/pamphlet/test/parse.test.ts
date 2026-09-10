import { describe, expect, it } from 'vitest'
import { parse } from '../src/parse.js'

const codes = (source: string) => parse(source).diagnostics.map((d) => d.code)

describe('CommonMark 超集：任何合法 Markdown 都是合法源文档', () => {
  it('普通 Markdown 没有任何诊断', () => {
    const source = ['# 标题', '', '一段**正文**和 [链接](https://example.com)。', '', '- 甲', '- 乙'].join('\n')
    expect(parse(source).diagnostics).toEqual([])
  })

  it('GFM 表格与任务列表可用', () => {
    const source = ['| 甲 | 乙 |', '| --- | --- |', '| 1 | 2 |', '', '- [x] 完成', '- [ ] 待办'].join('\n')
    const result = parse(source)
    expect(result.diagnostics).toEqual([])
    expect(JSON.stringify(result.ast)).toContain('"table"')
  })

  it('裸 HTML 原样保留成 html 节点（ADR-0021）', () => {
    const result = parse('H<sub>2</sub>O 是水。\n')
    expect(result.diagnostics).toEqual([])
    expect(JSON.stringify(result.ast)).toContain('"html"')
  })

  it('没有语言标记的代码块不报任何东西', () => {
    expect(codes('```\nplain\n```\n')).toEqual([])
  })

  it('非图表语言的代码块只当语法高亮', () => {
    expect(codes('```ts\nconst a = 1\n```\n')).toEqual([])
  })
})

describe('tabs / tab（ADR-0013）', () => {
  it('嵌套写法合法', () => {
    const source = ['::::tabs', ':::tab[部署视图]', '甲', ':::', ':::tab[成本视图]', '乙', ':::', '::::'].join('\n')
    expect(parse(source).diagnostics).toEqual([])
  })

  it('tab 放在 tabs 外面报错', () => {
    const source = [':::tab[孤立]', '内容', ':::'].join('\n')
    const diagnostics = parse(source).diagnostics
    expect(diagnostics.map((d) => d.code)).toContain('DIR-202')
    expect(diagnostics.find((d) => d.code === 'DIR-202')?.hint).toContain('::::tabs')
  })

  it('tab 少了标题报错', () => {
    const source = ['::::tabs', ':::tab', '内容', ':::', '::::'].join('\n')
    expect(parse(source).diagnostics.map((d) => d.code)).toContain('DIR-204')
  })

  it('tabs 里没有 tab 报错', () => {
    const source = ['::::tabs', '只有正文', '::::'].join('\n')
    expect(parse(source).diagnostics.map((d) => d.code)).toContain('DIR-204')
  })

  it('未闭合与用法错误可以同时报出来', () => {
    const source = ['::::tabs', ':::tab', '内容', ':::'].join('\n')
    const reported = new Set(parse(source).diagnostics.map((d) => d.code))
    expect(reported.has('DIR-203')).toBe(true)
    expect(reported.has('DIR-204')).toBe(true)
  })
})

describe('未知指令（DIR-201 警告，不中断）', () => {
  it('`:::callout warn` 这种写法根本不是指令，所以只是普通文字', () => {
    // 指令语法是 :::name[label]{attrs}，名字后面不允许跟没有括号包裹的自由文本。
    // 原设计文档里的 `:::callout warn` 和 `:::tab 甲 | 乙` 犯的是同一个错。
    // 现在正确的写法是四个独立的指令名（ADR-0024 修订版）。
    const result = parse([':::callout warn', '注意幂等性。', ':::'].join('\n'))
    expect(result.diagnostics).toEqual([])
    expect(JSON.stringify(result.ast)).not.toContain('containerDirective')
  })

  it('打错字时提示最接近的名字', () => {
    const source = [':::calout', '内容', ':::'].join('\n')
    const diagnostics = parse(source).diagnostics
    expect(diagnostics[0]?.code).toBe('DIR-201')
    expect(diagnostics[0]?.hint).toContain('callout')
  })

  it('离得太远就不硬猜', () => {
    const source = [':::zzzzzzzz', '内容', ':::'].join('\n')
    expect(parse(source).diagnostics[0]?.hint).toBeUndefined()
  })
})

describe('图表围栏（ADR-0019）', () => {
  it('引擎原生名被认出来，本版本给「还不渲染」的警告', () => {
    const diagnostics = parse('```mermaid\nsequenceDiagram\n  A->>B: hi\n```\n').diagnostics
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.code).toBe('DOC-104')
    expect(diagnostics[0]?.severity).toBe('warning')
  })

  it('八种引擎名全部认识', () => {
    for (const lang of ['mermaid', 'd2', 'dot', 'math', 'vega-lite', 'wavedrom', 'bytefield', 'plantuml']) {
      expect(codes(`\`\`\`${lang}\nx\n\`\`\`\n`)).toEqual(['DOC-104'])
    }
  })

  it('删掉的旧别名不再被认作图表', () => {
    for (const lang of ['seq', 'flow', 'state', 'arch']) {
      expect(codes(`\`\`\`${lang}\nx\n\`\`\`\n`)).toEqual([])
    }
  })
})

describe('frontmatter 接进解析结果', () => {
  it('读出字段，并把诊断定位到出问题那个字段所在的行', () => {
    const source = ['---', 'spec: 2', 'title: 甲', '---', '', '正文'].join('\n')
    const result = parse(source)
    expect(result.frontmatter.title).toBe('甲')
    const error = result.diagnostics.find((d) => d.code === 'DOC-101')
    // 指向 `spec: 2` 那一行，而不是 `---`
    expect(error?.start).toEqual({ line: 2, column: 1 })
    expect(error?.end).toEqual({ line: 2, column: 5 })
  })

  it('诊断按行号从上往下排序', () => {
    const source = [
      '---',
      'diagrams: mermaid',
      '---',
      '',
      '::::tabs',
      ':::tab',
      '内容',
      ':::',
      '::::',
      '',
      ':::zzz',
      ':::',
    ].join('\n')
    const lines = parse(source).diagnostics.map((d) => d.start?.line ?? 0)
    expect(lines).toEqual([...lines].sort((a, b) => a - b))
  })
})

describe('指令的其余形态', () => {
  it('把 tabs 写成独立指令（两个冒号）时报错', () => {
    const diagnostics = parse('::tabs\n').diagnostics
    expect(diagnostics.map((d) => d.code)).toContain('DIR-202')
    expect(diagnostics.find((d) => d.code === 'DIR-202')?.message).toContain('容器指令')
  })

  it('把 tab 写成行内指令时报错', () => {
    const diagnostics = parse('一段话里夹一个 :tab[甲] 试试。\n').diagnostics
    expect(diagnostics.map((d) => d.code)).toContain('DIR-202')
  })

  it('tab 的标题是空方括号时算缺少标题', () => {
    const source = ['::::tabs', ':::tab[]', '内容', ':::', '::::'].join('\n')
    expect(parse(source).diagnostics.map((d) => d.code)).toContain('DIR-204')
  })

  it('tabs 里夹了 steps 时 steps 本身合法（它不要求父节点）', () => {
    const source = ['::::tabs', ':::tab[甲]', '内容', ':::', ':::steps', '1. 一', ':::', '::::'].join('\n')
    expect(parse(source).diagnostics).toEqual([])
  })

  it('tab 嵌在 tab 里也报位置错误', () => {
    const source = [
      ':::::tabs',
      '::::tab[外]',
      ':::tab[内]',
      '内容',
      ':::',
      '::::',
      ':::::',
    ].join('\n')
    expect(parse(source).diagnostics.map((d) => d.code)).toContain('DIR-202')
  })
})

describe('解析的其余分支', () => {
  it('没有 frontmatter 时 frontmatter 是空对象', () => {
    expect(parse('# 标题\n').frontmatter).toEqual({})
  })

  it('无语言标记的代码块不产生任何诊断', () => {
    expect(parse('```\n随便什么\n```\n').diagnostics).toEqual([])
  })

  it('非图表语言的代码块也不产生诊断（那是语法高亮）', () => {
    expect(parse('```ts\nconst a = 1\n```\n').diagnostics).toEqual([])
  })

  it('同一行上的多条诊断按列排序', () => {
    const { diagnostics } = parse(':::tabs\n:::\n')
    const columns = diagnostics.filter((d) => d.start?.line === 1).map((d) => d.start?.column ?? 0)
    expect(columns).toEqual([...columns].sort((a, b) => a - b))
  })

  it('结果里带着原始源文本，供组装器做源文档内嵌', () => {
    const source = '# 标题\n\n正文\n'
    expect(parse(source).source).toBe(source)
  })
})
