import { describe, expect, it } from 'vitest'
import { parseFrontmatter } from '../src/frontmatter.js'

const START = { line: 1, column: 1 }
const codes = (source: string) => parseFrontmatter(source, START).diagnostics.map((d) => d.code)

describe('frontmatter', () => {
  it('空 frontmatter 没有诊断', () => {
    const result = parseFrontmatter('', START)
    expect(result.frontmatter).toEqual({})
    expect(result.diagnostics).toEqual([])
  })

  it('认识的字段都读进来', () => {
    const result = parseFrontmatter(
      ['spec: 1', 'title: 订单系统方案', 'theme: tech-dark', 'lang: zh-CN'].join('\n'),
      START,
    )
    expect(result.frontmatter).toEqual({
      spec: 1,
      title: '订单系统方案',
      theme: 'tech-dark',
      lang: 'zh-CN',
    })
    expect(result.diagnostics).toEqual([])
  })

  it('spec 高于编译器支持时报错（ADR-0010）', () => {
    const result = parseFrontmatter('spec: 2', START)
    const error = result.diagnostics.find((d) => d.code === 'DOC-101')
    expect(error?.severity).toBe('error')
    expect(error?.message).toContain('spec 2')
    expect(error?.hint).toContain('npm i -g pamphlet@latest')
  })

  it('spec 不填等于不做检查', () => {
    expect(codes('title: 无 spec')).toEqual([])
  })

  it('spec 低于当前版本正常通过', () => {
    expect(codes('spec: 1')).toEqual([])
  })

  it('未知字段给警告而不是错误', () => {
    const result = parseFrontmatter('diagrams: mermaid', START)
    const warning = result.diagnostics.find((d) => d.code === 'DOC-102')
    expect(warning?.severity).toBe('warning')
    expect(result.frontmatter).toEqual({})
  })

  it('非法 YAML 报 DOC-103', () => {
    expect(codes('title: [未闭合')).toEqual(['DOC-103'])
  })

  it('toc 可以写成布尔', () => {
    const result = parseFrontmatter('toc: true', START)
    expect(result.frontmatter.toc).toEqual({ enable: true })
  })

  it('toc 结构化配置', () => {
    const result = parseFrontmatter(
      ['toc:', '  enable: true', '  deep: 2', '  skipTabs: false'].join('\n'),
      START,
    )
    expect(result.frontmatter.toc).toEqual({ enable: true, deep: 2, skipTabs: false })
    expect(result.diagnostics).toEqual([])
  })

  it('toc.position: side 报「尚未实现」而不是静默降级（ADR-0022）', () => {
    const result = parseFrontmatter(['toc:', '  position: side'].join('\n'), START)
    const error = result.diagnostics.find((d) => d.code === 'DOC-104')
    expect(error?.severity).toBe('error')
    expect(result.frontmatter.toc?.position).toBeUndefined()
  })

  it('toc.deep 越界报错', () => {
    expect(codes(['toc:', '  deep: 9'].join('\n'))).toEqual(['DOC-103'])
  })

  it('engines 声明在本版本给警告（还不渲染图表）', () => {
    const result = parseFrontmatter(
      ['engines:', '  graphviz:', '    langs: [dot]', '    command: [dot, -Tsvg]'].join('\n'),
      START,
    )
    const warning = result.diagnostics.find((d) => d.code === 'DOC-104')
    expect(warning?.severity).toBe('warning')
  })

  it('字段类型不对报错', () => {
    expect(codes('title: 123')).toEqual(['DOC-103'])
    expect(codes('spec: "1"')).toEqual(['DOC-103'])
  })
})

describe('frontmatter 的边界路径', () => {
  it('frontmatter 是数组时报错', () => {
    expect(codes('- 甲\n- 乙')).toEqual(['DOC-103'])
  })

  it('frontmatter 是纯量时报错', () => {
    expect(codes('就一句话')).toEqual(['DOC-103'])
  })

  it('toc 是数字时报错', () => {
    expect(codes('toc: 3')).toEqual(['DOC-103'])
  })

  it('toc 里未知字段给警告', () => {
    const result = parseFrontmatter(['toc:', '  sticky: true'].join('\n'), START)
    expect(result.diagnostics.map((d) => d.code)).toEqual(['DOC-102'])
    expect(result.frontmatter.toc).toEqual({})
  })

  it('toc.position 是别的值时报错', () => {
    expect(codes(['toc:', '  position: floating'].join('\n'))).toEqual(['DOC-103'])
  })

  it('toc.position: top 正常通过', () => {
    const result = parseFrontmatter(['toc:', '  position: top'].join('\n'), START)
    expect(result.frontmatter.toc?.position).toBe('top')
    expect(result.diagnostics).toEqual([])
  })

  it('toc.enable 不是布尔时报错', () => {
    expect(codes(['toc:', '  enable: 甲'].join('\n'))).toEqual(['DOC-103'])
  })

  it('toc.skipTabs 读得进来', () => {
    const result = parseFrontmatter(['toc:', '  skipTabs: true'].join('\n'), START)
    expect(result.frontmatter.toc?.skipTabs).toBe(true)
  })

  it('engines 不是对象时报错', () => {
    expect(codes('engines: mermaid')).toEqual(['DOC-103'])
  })

  it('theme / lang 类型不对分别报错', () => {
    expect(codes('theme: 1')).toEqual(['DOC-103'])
    expect(codes('lang: [zh]')).toEqual(['DOC-103'])
  })

  it('找不到键所在行时退回 frontmatter 起始位置', () => {
    // 这一条走的是 keyLocator 的兜底分支：键名在正文里匹配不到
    const result = parseFrontmatter('{ spec: 2 }', START)
    const error = result.diagnostics.find((d) => d.code === 'DOC-101')
    expect(error?.start).toEqual(START)
  })
})
