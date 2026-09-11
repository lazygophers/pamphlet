/**
 * `skills/` 是给 AI 读的说明书，用 `npx skills add lazygophers/pamphlet` 装。
 *
 * 它里面有几份附件是**从源码生成**的（主题清单、token 清单、诊断码表），
 * 而且**必须提交进版本库**——`skills add` 直接从 git 仓库拉文件，不跑任何构建。
 *
 * 这两件事凑在一起就有一个天然的失效：改了源码、忘了重跑生成，
 * 说明书照旧是旧的，构建和测试全绿，而读它的模型会照着旧的干活。
 * 这份测试就盯这一件事：磁盘上那几份文件必须和现在的源码一致。
 *
 * 红了怎么办：跑 `pnpm skills:sync`，把改动一起提交。
 */

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// @ts-expect-error 生成脚本是 .mjs，没有类型声明；测试复用它是为了不把生成逻辑写第二遍
import { generated } from '../scripts/skills-sync.mjs'

const repoFile = (relative: string): string =>
  fileURLToPath(new URL(`../../../${relative}`, import.meta.url))

const SKILLS_DIR = repoFile('skills')

describe('生成出来的那几份附件', () => {
  const expected = generated() as Record<string, string>

  it.each(Object.keys(expected))('%s 和源码一致', (path) => {
    expect(readFileSync(repoFile(path), 'utf8')).toBe(expected[path])
  })
})

describe('每一份 skill 的 SKILL.md', () => {
  const names = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

  it('三份都在', () => {
    expect(names.sort()).toEqual(['pamphlet-best-practices', 'pamphlet-syntax', 'pamphlet-theme'])
  })

  it.each(names)('%s 的 frontmatter 认得出来', (name) => {
    const text = readFileSync(repoFile(`skills/${name}/SKILL.md`), 'utf8')

    // 开头第一行不是 `---` 的话，整个文件会被当成正文，frontmatter 静默失效
    expect(text.startsWith('---\n')).toBe(true)

    const frontmatter = text.slice(4, text.indexOf('\n---\n', 3))
    // 名字必须和目录名一致：装进去之后调用它用的是这个名字
    expect(frontmatter).toContain(`name: ${name}`)
    // description 决定模型什么时候会想起这份说明书，缺了它等于装了也没人用
    expect(frontmatter).toMatch(/^description: \S/m)
  })
})
