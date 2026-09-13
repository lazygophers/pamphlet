/**
 * 图表渲染缓存（ADR-0026：放系统临时目录，用户仓库永远干净）。
 *
 * 缓存键 = 哈希(图源 + 引擎名 + 引擎版本 + 哨兵表版本 + 引擎配置指纹)。
 * 带引擎版本是必须的——否则升级 Mermaid 后会命中旧图；
 * 带哨兵表版本是因为改了颜色映射就得重渲；
 * 带引擎配置指纹是因为**喂给引擎的主题变量也决定输出**，
 * 少了它，改完配置重新编译拿到的还是旧图（实测踩过）。
 *
 * 存的是 `{svg, unmapped}` 而不是光一个 SVG：`unmapped`（换不掉的硬编码色）
 * 是这张图的属性，跟图一起进缓存才不会「命中缓存 = 诊断消失」。
 */

import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { SENTINELS } from './tokens.js'
import type { RenderedDiagram } from './engine.js'

/**
 * 后处理管线的版本。缓存里存的是**后处理之后**的 SVG，所以改了换色或尺寸规则，
 * 旧缓存就是过期的——不把它算进键里，改动对已经缓存过的图完全不生效
 * （实测：接上尺寸钉定之后，缓存命中的图仍然是旧的 width="100%"）。
 * 改后处理行为时把这个数字加一。
 */
const POST_PROCESS_VERSION = '10'

/** 哨兵表变了就得让旧缓存失效，所以把它算进键里 */
const SENTINEL_FINGERPRINT = createHash('sha256')
  .update(JSON.stringify(SENTINELS))
  .digest('hex')
  .slice(0, 8)

export function cacheKey(
  code: string,
  engine: string,
  engineVersion: string,
  engineFingerprint: string,
): string {
  return createHash('sha256')
    .update(
      `${engine} ${engineVersion} ${POST_PROCESS_VERSION} ${SENTINEL_FINGERPRINT} ${engineFingerprint} ${code}`,
    )
    .digest('hex')
}

export interface Cache {
  get(key: string): Promise<RenderedDiagram | undefined>
  set(key: string, value: RenderedDiagram): Promise<void>
  readonly dir: string
}

export function createCache(dir = join(tmpdir(), 'pamphlet-cache')): Cache {
  let ready: Promise<void> | undefined

  const ensure = (): Promise<void> => {
    ready ??= mkdir(dir, { recursive: true }).then(() => undefined)
    return ready
  }

  return {
    dir,
    async get(key) {
      try {
        const raw = await readFile(join(dir, `${key}.json`), 'utf8')
        const parsed = JSON.parse(raw) as RenderedDiagram
        // 缓存文件是可能被别人动过的，格式对不上就当没命中，重渲一次即可
        if (typeof parsed?.svg !== 'string' || !Array.isArray(parsed.unmapped)) return undefined
        return parsed
      } catch {
        return undefined
      }
    },
    async set(key, value) {
      // 缓存写失败（目录建不出来、磁盘满、只读文件系统）不该让编译失败——
      // 它只是让下一次构建慢一点。建目录也要包在里面。
      try {
        await ensure()
        await writeFile(join(dir, `${key}.json`), JSON.stringify(value), 'utf8')
      } catch {
        // 让下一次 set 再试一遍建目录，而不是永久记住这次失败
        ready = undefined
      }
    },
  }
}

/** `--no-cache` 用的空实现，省掉调用方到处判空 */
export function createNullCache(): Cache {
  return {
    dir: '(未启用)',
    async get() {
      return undefined
    },
    async set() {
      /* 什么都不做 */
    },
  }
}
