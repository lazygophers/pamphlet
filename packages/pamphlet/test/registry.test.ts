/**
 * 这个仓库只用 npm 官方源，三个包管理器各钉一次。
 *
 * 为什么要三份配置：它们读的文件互不相同，一份盖不住另外两个。
 *
 * | 工具 | 读哪个文件 |
 * |---|---|
 * | npm / npx / pnpm | `.npmrc` |
 * | Yarn 2+（Berry） | `.yarnrc.yml`（**不读** `.npmrc`） |
 * | Yarn 1（classic） | `.yarnrc`（既不读 `.npmrc` 也不读 `.yarnrc.yml`） |
 *
 * 为什么值得写一条测试看着几个配置文件：镜像站带来的失败**报错指向的原因是错的**。
 * 刚发布完去核验时，镜像给的是「没有这个版本」——包其实已经在官方源上了。
 * 照着那条报错查，会去翻发布流程而不是翻源地址。
 *
 * 发布这条路更不能走镜像：镜像只读，也不认账号的登录。
 */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const OFFICIAL = 'https://registry.npmjs.org/'
const MIRROR = /npmmirror|taobao|cnpmjs|mirrors\./i

const read = (name: string): string =>
  readFileSync(new URL(`../../../${name}`, import.meta.url), 'utf8')

/** 只看没被注释掉的那些行 */
const directives = (text: string): string[] =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))

describe('npm / npx / pnpm 读的 .npmrc', () => {
  const lines = directives(read('.npmrc'))

  it('钉在官方源上', () => {
    expect(lines).toContain(`registry=${OFFICIAL}`)
  })

  it('没有任何一条指向镜像站', () => {
    expect(lines.filter((line) => MIRROR.test(line))).toEqual([])
  })

  it('也没有把某个作用域单独指到别处', () => {
    // `@scope:registry=...` 会绕过上面那条总的 registry
    expect(lines.filter((line) => /^@[^:]+:registry=/.test(line))).toEqual([])
  })
})

describe('Yarn 2+ 读的 .yarnrc.yml', () => {
  const text = read('.yarnrc.yml')
  const lines = directives(text)

  it('钉在官方源上', () => {
    expect(lines).toContain(`npmRegistryServer: "${OFFICIAL}"`)
  })

  it('没有任何一条指向镜像站', () => {
    expect(lines.filter((line) => MIRROR.test(line))).toEqual([])
  })

  it('没有 npmScopes 把某个作用域指到别处', () => {
    // npmScopes 下面可以给单个作用域再写一个 npmRegistryServer，绕过上面那条
    expect(text).not.toMatch(/^npmScopes:/m)
  })
})

describe('Yarn 1 读的 .yarnrc', () => {
  const lines = directives(read('.yarnrc'))

  it('钉在官方源上', () => {
    expect(lines).toContain(`registry "${OFFICIAL}"`)
  })

  it('没有任何一条指向镜像站', () => {
    expect(lines.filter((line) => MIRROR.test(line))).toEqual([])
  })
})
