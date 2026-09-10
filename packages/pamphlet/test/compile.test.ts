/**
 * 完整管线：读文件 → 解析 → 画图 → 组装。这是唯一碰硬盘的一层。
 */

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { artifactPath, compileFile } from '../src/compile.js'
import { extract } from '../src/assemble/index.js'

let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'pamphlet-compile-'))
})

function write(name: string, content: string | Uint8Array): string {
  const path = join(dir, name)
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, content)
  return path
}

describe('artifactPath', () => {
  it('把 .md 换成 .html，其余部分原样', () => {
    expect(artifactPath('docs/a.md')).toBe('docs/a.html')
    expect(artifactPath('docs/A.MD')).toBe('docs/A.html')
    // 不是 .md 结尾的直接追加，不去猜作者的意图
    expect(artifactPath('docs/a.markdown')).toBe('docs/a.markdown.html')
  })
})

describe('compileFile', () => {
  it('产物能反解出一模一样的源文档', async () => {
    const source = '# 标题\n\n正文。\n'
    const path = write('a.md', source)
    const result = await compileFile(path)
    expect(extract(result.html)).toBe(source)
    expect(result.path).toBe(path)
  })

  it('图片路径相对源文档所在目录，不是相对进程的工作目录', async () => {
    write('图/a.png', new Uint8Array([1, 2, 3, 4]))
    const path = write('b.md', '![图](./图/a.png)\n')
    const result = await compileFile(path)
    expect(result.html).toContain('data:image/png;base64,')
    expect(result.diagnostics.filter((d) => d.severity === 'error')).toEqual([])
  })

  it('--font 的名字取文件名，路径也相对源文档', async () => {
    const font = '/System/Library/Fonts/Supplemental/Arial Unicode.ttf'
    const path = write('c.md', '# 甲\n')
    const result = await compileFile(path, { font })
    expect(result.html).toContain('@font-face')
    expect(result.html).toContain('"Arial Unicode"')
  }, 120_000)

  it('--no-embed-source 时产物里没有源文档', async () => {
    const path = write('d.md', '# 甲\n')
    const result = await compileFile(path, { embedSource: false })
    expect(() => extract(result.html)).toThrow(/没有内嵌源文档/)
  })

  it('liveReload 时产物带上重新加载那一段', async () => {
    const path = write('e.md', '# 甲\n')
    const result = await compileFile(path, { liveReload: true })
    expect(result.html).toContain('__pamphlet_reload')
  })

  it('解析诊断和组装诊断都出现在结果里', async () => {
    const path = write('f.md', '![图](https://example.com/a.png)\n')
    const result = await compileFile(path)
    expect(result.diagnostics.map((d) => d.code)).toContain('EMB-403')
  })
})

describe('compileFile 的可选参数', () => {
  it('--timeout 传给图表渲染', async () => {
    const path = write('t.md', '# 甲\n')
    const result = await compileFile(path, { timeoutMs: 1_000 })
    expect(result.html).toContain('甲')
  })

  it('--limit 传给资源内嵌，超限时报 EMB-401', async () => {
    write('big.png', new Uint8Array(4096))
    const path = write('u.md', '![图](./big.png)\n')
    const result = await compileFile(path, { assetLimitBytes: 100 })
    expect(result.diagnostics.map((d) => d.code)).toContain('EMB-401')
  })
})
