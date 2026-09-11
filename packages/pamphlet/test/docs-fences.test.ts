/**
 * 文档站里示例代码块的反引号个数。
 *
 * 一个例子要展示另一个代码块时，外层围栏必须比内层长——但只需要长一个。
 * 写成十二个套九个也能编译，读者看到的却是九个反引号，照着抄进自己的文档就不对了。
 * 这条测试盯着这件事：外层最多四个，内层最多三个。
 *
 * 唯一的例外是「代码块里套代码块」那一页，它讲的就是三层嵌套，五个是内容本身。
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const REPO = join(import.meta.dirname, '..', '..', '..')
const ROOTS = ['docs/zh', 'docs/en', 'skills', 'examples']
/** 这一页讲的就是三层嵌套，五个反引号是内容本身 */
const EXEMPT = ['write/blocks/code.md']

function markdownFiles(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) out.push(...markdownFiles(path))
    else if (name.endsWith('.md')) out.push(path)
  }
  return out
}

const files = ROOTS.flatMap((root) => markdownFiles(join(REPO, root))).filter(
  (path) => !EXEMPT.some((tail) => path.endsWith(tail)),
)

describe('文档里的围栏不许比需要的更长', () => {
  it('扫到了文档', () => {
    expect(files.length).toBeGreaterThan(20)
  })

  it.each(files.map((path) => path.slice(REPO.length + 1)))('%s', (relative) => {
    const lines = readFileSync(join(REPO, relative), 'utf8').split('\n')
    const tooLong = lines
      .map((line, index) => ({ line, at: index + 1 }))
      .filter(({ line }) => /^`{5,}/.test(line))
      .map(({ line, at }) => `${at}: ${line.slice(0, 20)}`)
    expect(tooLong).toEqual([])
  })
})
