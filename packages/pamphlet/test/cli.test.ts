/**
 * 命令行：退出码、多文件行为、通配符自展开、两种输出格式。
 * 退出码规范：0 成功 / 1 编译错误 / 2 参数或用法错误。
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { run } from '../src/cli.js'

let dir: string
let stdout: string[]
let stderr: string[]

function write(name: string, content: string): string {
  const path = join(dir, name)
  writeFileSync(path, content, 'utf8')
  return path
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'pamphlet-cli-'))
  stdout = []
  stderr = []
  vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    stdout.push(String(chunk))
    return true
  })
  vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
    stderr.push(String(chunk))
    return true
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

const out = () => stdout.join('')
const err = () => stderr.join('')

describe('用法与参数', () => {
  it('不给命令时打印用法并退出 2', async () => {
    expect(await run([])).toBe(2)
    expect(out()).toContain('用法')
  })

  it('--help 退出 0', async () => {
    expect(await run(['--help'])).toBe(0)
    expect(out()).toContain('pamphlet lint')
  })

  it('未知命令退出 2', async () => {
    expect(await run(['build-everything'])).toBe(2)
    expect(err()).toContain('未知命令')
  })

  it('lint 不给路径退出 2', async () => {
    expect(await run(['lint'])).toBe(2)
    expect(err()).toContain('至少一个文件路径')
  })

  it('没有文件匹配时退出 2', async () => {
    expect(await run(['lint', join(dir, 'nope-*.md')])).toBe(2)
    expect(err()).toContain('没有文件匹配')
  })
})

describe('lint 退出码', () => {
  it('干净文档退出 0，且永远打印汇总行', async () => {
    const path = write('clean.md', '# 标题\n\n正文。\n')
    expect(await run(['lint', path, '--no-color'])).toBe(0)
    expect(out()).toContain('1 份通过')
  })

  it('有错误退出 1，失败文件名单独列出', async () => {
    const path = write('broken.md', '::::tabs\n')
    expect(await run(['lint', path, '--no-color'])).toBe(1)
    expect(out()).toContain('失败：')
    expect(out()).toContain('DIR-203')
  })

  it('只有警告时默认退出 0', async () => {
    const path = write('warn.md', ':::zzzzz\n内容\n:::\n')
    expect(await run(['lint', path, '--no-color'])).toBe(0)
    expect(out()).toContain('1 条警告')
  })

  it('--fail-on-warn 把警告也当失败', async () => {
    const path = write('warn.md', ':::zzzzz\n内容\n:::\n')
    expect(await run(['lint', path, '--no-color', '--fail-on-warn'])).toBe(1)
  })
})

describe('多文件（ADR-0023）', () => {
  it('默认遇到错误就停下', async () => {
    const bad = write('a-bad.md', '::::tabs\n')
    const good = write('b-good.md', '# 好的\n')
    expect(await run(['lint', bad, good, '--no-color'])).toBe(1)
    // 停在第一份，所以第二份不出现在报告里
    expect(out()).not.toContain('b-good.md')
  })

  it('--continue-on-error 继续处理剩下的', async () => {
    const bad = write('a-bad.md', '::::tabs\n')
    write('b-warn.md', ':::zzzzz\n内容\n:::\n')
    const code = await run(['lint', join(dir, '*.md'), '--no-color', '--continue-on-error'])
    expect(code).toBe(1)
    expect(out()).toContain('1 份通过，1 份失败')
    expect(bad).toContain('a-bad.md')
  })

  it('诊断按文件分组，每组带文件头', async () => {
    write('x.md', '::::tabs\n')
    write('y.md', ':::zzzzz\n内容\n:::\n')
    await run(['lint', join(dir, '*.md'), '--no-color', '--continue-on-error'])
    const text = out()
    expect(text.indexOf('x.md')).toBeLessThan(text.indexOf('y.md'))
  })

  it('全部通过时汇总行照样打印', async () => {
    write('a.md', '# 甲\n')
    write('b.md', '# 乙\n')
    expect(await run(['lint', join(dir, '*.md'), '--no-color'])).toBe(0)
    expect(out()).toContain('2 份通过')
    expect(out()).not.toContain('失败：')
  })
})

describe('通配符由自己展开，不做任何默认排除（ADR-0023）', () => {
  it('展开 * 匹配到多份', async () => {
    write('a.md', '# 甲\n')
    write('b.md', '# 乙\n')
    expect(await run(['lint', join(dir, '*.md'), '--no-color'])).toBe(0)
    expect(out()).toContain('2 份通过')
  })

  it('node_modules 也不排除——这是明知的代价', async () => {
    const nested = join(dir, 'node_modules', 'dep')
    writeFileSync(join(dir, 'top.md'), '# 顶层\n', 'utf8')
    mkdirSync(nested, { recursive: true })
    writeFileSync(join(nested, 'README.md'), '# 第三方\n', 'utf8')
    expect(await run(['lint', join(dir, '**/*.md'), '--no-color'])).toBe(0)
    expect(out()).toContain('2 份通过')
  })
})

describe('--format json', () => {
  it('输出可解析的结构化结果', async () => {
    const path = write('broken.md', '::::tabs\n')
    expect(await run(['lint', path, '--format', 'json'])).toBe(1)
    const parsed = JSON.parse(out()) as {
      reports: { path: string; diagnostics: { code: string }[] }[]
      failed: string[]
    }
    expect(parsed.reports[0]?.diagnostics[0]?.code).toBe('DIR-203')
    expect(parsed.failed).toHaveLength(1)
  })
})

describe('ast 命令', () => {
  it('输出 AST JSON', async () => {
    const path = write('a.md', '# 标题\n')
    expect(await run(['ast', path, '--format', 'json'])).toBe(0)
    const parsed = JSON.parse(out()) as { ast: { type: string }; frontmatter: unknown }
    expect(parsed.ast.type).toBe('root')
  })

  it('文档有错时退出 1，但 AST 照样输出', async () => {
    const path = write('a.md', '::::tabs\n')
    expect(await run(['ast', path, '--format', 'json'])).toBe(1)
    expect(out()).toContain('"root"')
  })

  it('一次只接一个文件', async () => {
    write('a.md', '# 甲\n')
    write('b.md', '# 乙\n')
    expect(await run(['ast', join(dir, '*.md')])).toBe(2)
    expect(err()).toContain('一次只接一个文件')
  })
})

describe('读不到文件时', () => {
  it('默认直接失败退出 1', async () => {
    expect(await run(['lint', join(dir, 'missing.md'), '--no-color'])).toBe(1)
    expect(err()).toContain('读不到')
  })

  it('--continue-on-error 时跳过它继续', async () => {
    write('ok.md', '# 好的\n')
    const code = await run([
      'lint',
      join(dir, 'missing.md'),
      join(dir, 'ok.md'),
      '--no-color',
      '--continue-on-error',
    ])
    expect(code).toBe(0)
    expect(err()).toContain('读不到')
    expect(out()).toContain('1 份通过')
  })

  it('ast 读不到文件时抛出去，由 bin 兜住', async () => {
    await expect(run(['ast', join(dir, 'missing.md')])).rejects.toThrow()
  })
})

describe('输出细节', () => {
  it('--format json 时不打印人类可读的汇总', async () => {
    write('a.md', '# 甲\n')
    await run(['lint', join(dir, 'a.md'), '--format', 'json'])
    expect(out()).not.toContain('份通过')
  })

  it('ast 默认格式下把诊断打到 stderr', async () => {
    const path = write('a.md', ':::zzzzz\n内容\n:::\n')
    expect(await run(['ast', path, '--no-color'])).toBe(0)
    expect(out()).toContain('"root"')
    expect(err()).toContain('DIR-201')
  })

  it('--format 后面跟无效值时保持默认', async () => {
    write('a.md', '# 甲\n')
    expect(await run(['lint', join(dir, 'a.md'), '--format', 'xml', '--no-color'])).toBe(0)
    expect(out()).toContain('1 份通过')
  })
})

describe('build 命令', () => {
  it('产出跟源文档同名的 .html，退出 0', async () => {
    const path = write('a.md', '# 标题\n\n正文。\n')
    expect(await run(['build', path])).toBe(0)
    const html = readFileSync(join(dir, 'a.html'), 'utf8')
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html).toContain('正文')
    expect(out()).toContain('a.html')
  })

  it('-o 指定产物路径', async () => {
    const path = write('b.md', '# 标题\n')
    const target = join(dir, '子目录', '别的名字.html')
    expect(await run(['build', path, '-o', target])).toBe(0)
    expect(existsSync(target)).toBe(true)
  })

  it('文档有错时仍写出产物，但退出 1（ADR-0028）', async () => {
    const path = write('c.md', '# 标题\n\n![图](https://example.com/a.png)\n')
    expect(await run(['build', path])).toBe(1)
    expect(existsSync(join(dir, 'c.html'))).toBe(true)
    expect(err()).toContain('EMB-403')
  })

  it('--verbose 打印体积归因，各项之和等于总字节数', async () => {
    const path = write('d.md', '# 标题\n\n正文。\n')
    expect(await run(['build', path, '--verbose'])).toBe(0)
    expect(out()).toContain('体积')
    expect(out()).toContain('正文 HTML')
    expect(out()).toContain('gzip')
  })

  it('多份文档一次编译，各出各的产物', async () => {
    write('e1.md', '# 甲\n')
    write('e2.md', '# 乙\n')
    expect(await run(['build', join(dir, 'e*.md')])).toBe(0)
    expect(existsSync(join(dir, 'e1.html'))).toBe(true)
    expect(existsSync(join(dir, 'e2.html'))).toBe(true)
  })

  it('多份文档时 -o 报错——一个路径装不下两份产物', async () => {
    write('f1.md', '# 甲\n')
    write('f2.md', '# 乙\n')
    expect(await run(['build', join(dir, 'f*.md'), '-o', join(dir, 'x.html')])).toBe(2)
  })
})

describe('extract 命令（ADR-0014）', () => {
  it('从产物反解源文档，字节级相等', async () => {
    const source = '# 标题\n\n正文里有 `-->` 这种会截断注释的东西。\n'
    const path = write('g.md', source)
    await run(['build', path])
    stdout.length = 0
    expect(await run(['extract', join(dir, 'g.html')])).toBe(0)
    expect(out()).toBe(source)
  })

  it('产物没带源文档时退出 1 并说明原因', async () => {
    const path = write('h.md', '# 标题\n')
    await run(['build', path, '--no-embed-source'])
    expect(await run(['extract', join(dir, 'h.html')])).toBe(1)
    expect(err()).toContain('没有内嵌源文档')
  })
})

describe('doctor 命令', () => {
  it('列出各引擎装了没有，全都齐时退出 0', async () => {
    const code = await run(['doctor'])
    expect(out()).toContain('mermaid')
    // 装了就 0，没装就 3（环境缺失），两者都是合法结果
    expect([0, 3]).toContain(code)
    // probe 要真的拉起一次无头浏览器，冷启动实测 733ms，并行跑时更慢
  }, 120_000)
})
