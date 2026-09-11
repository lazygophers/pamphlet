/**
 * 这个仓库只用 npm 官方源，由根目录的 `.npmrc` 钉住。
 *
 * 为什么值得写一条测试看着一个配置文件：镜像站带来的失败**报错指向的原因是错的**。
 * 刚发布完去核验时，镜像给的是「没有这个版本」——包其实已经在官方源上了。
 * 照着那条报错查，会去翻发布流程而不是翻源地址。
 *
 * 发布这条路更不能走镜像：镜像只读，也不认账号的登录。
 */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const npmrc = readFileSync(new URL('../../../.npmrc', import.meta.url), 'utf8')

/** 只看没被注释掉的那些行 */
const directives = npmrc
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line !== '' && !line.startsWith('#'))

describe('包源', () => {
  it('钉在 npm 官方源上', () => {
    expect(directives).toContain('registry=https://registry.npmjs.org/')
  })

  it('没有任何一条指向镜像站', () => {
    const mirrors = directives.filter((line) => /npmmirror|taobao|cnpmjs|registry\.npm\.taobao/i.test(line))
    expect(mirrors).toEqual([])
  })

  it('也没有把某个作用域单独指到别处', () => {
    // `@scope:registry=...` 会绕过上面那条总的 registry
    const scoped = directives.filter((line) => /^@[^:]+:registry=/.test(line))
    expect(scoped).toEqual([])
  })
})
