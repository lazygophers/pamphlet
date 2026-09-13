/**
 * d2 引擎：画 ` ```d2 ` 围栏的架构图。
 *
 * 它换来的是**更强的自动布局**：节点一多，Mermaid 的连线开始互相压，d2 还排得开。
 * 代价是体积——解包 91.4MB，七个引擎里最大的一个。正因为它大，
 * 「一个引擎一个包」这件事在它身上最划算：不装它的人一个字节都不多。
 *
 * **包名有坑**：官方从 `@terrastruct/d2` 改名到 `@d2lang/d2`，而**旧包名没打
 * deprecated 标记**，装错了不会有任何警告。旧包没有 `dispose()`、渲染完进程
 * 不退出（实测 15 秒后仍活着）、并发三张会整个挂死。这里只认新包。
 */

import {
  DEFAULT_TIMEOUT_MS,
  SENTINELS,
  diagnostic,
  pinIntrinsicSize,
  recolor,
  withTimeout,
  type Diagnostic,
  type Engine,
  type RenderRequest,
  type RenderedDiagram,
} from '@nekoleapuki/pamphlet-cli/engine-kit'

interface D2Instance {
  compile: (input: { fs: { index: string }; options?: Record<string, unknown> }) => Promise<{
    diagram: unknown
    renderOptions?: Record<string, unknown>
  }>
  render: (diagram: unknown, options?: Record<string, unknown>) => Promise<string>
  dispose?: () => Promise<void> | void
}

let instance: Promise<D2Instance> | undefined

/**
 * 整个进程共用一个实例。实测：首张 302ms、之后 4–15ms，而且单实例连渲 100 张
 * 活跃资源恒为 1、内存不涨——所以「每渲一张漏一个」那个担心是不成立的，
 * 真正要做的只是收尾时 dispose 一次。
 */
async function getD2(): Promise<D2Instance> {
  instance ??= (async () => {
    const module = (await import('@d2lang/d2')) as unknown as { D2: new () => D2Instance }
    return new module.D2()
  })()
  return instance
}

/**
 * 哨兵从 `theme-overrides` 喂进去。d2 的主题是一组带名字的色槽：
 * `B1`–`B6` 是主色阶（标题、边框、填充），`AA2`/`AA4`/`AA5` 和 `AB4`/`AB5`
 * 是两组强调色，`N1`–`N7` 是中性色阶（文字、线、底）。
 *
 * 注意**不要把相邻的槽喂成不同哨兵又指望它们不混**：d2 会在某些形状上
 * 自己调亮调暗，调过的值和别的哨兵分不开——所以同一类的槽喂同一个哨兵。
 */
const SENTINEL_VARS = `vars: {
  d2-config: {
    theme-overrides: {
      B1: "${SENTINELS.line}"
      B2: "${SENTINELS.line}"
      B3: "${SENTINELS.fill}"
      B4: "${SENTINELS.fill}"
      B5: "${SENTINELS.fill}"
      B6: "${SENTINELS.fill}"
      AA2: "${SENTINELS.accent}"
      AA4: "${SENTINELS.fill}"
      AA5: "${SENTINELS.fill}"
      AB4: "${SENTINELS.fill}"
      AB5: "${SENTINELS.fill}"
      N1: "${SENTINELS.text}"
      N2: "${SENTINELS.text}"
      N3: "${SENTINELS.muted}"
      N4: "${SENTINELS.line}"
      N5: "${SENTINELS.line}"
      N6: "${SENTINELS.fill}"
      N7: "${SENTINELS.bg}"
    }
  }
}
`

export function createEngine(options: { timeoutMs?: number } = {}): Engine {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  return {
    name: 'd2',
    langs: ['d2'],
    fingerprint: `d2-${Object.values(SENTINELS).join('')}`.slice(0, 24),

    async probe() {
      try {
        await import('@d2lang/d2')
      } catch {
        return {
          available: false,
          hint: '装一次就好：npm i -D @nekoleapuki/pamphlet-engine-d2（解包约 91MB，是七个引擎里最大的）',
        }
      }
      return { available: true }
    },

    async renderOne(request: RenderRequest): Promise<RenderedDiagram | Diagnostic> {
      try {
        const d2 = await getD2()
        const svg = await withTimeout(
          (async () => {
            const compiled = await d2.compile({ fs: { index: `${SENTINEL_VARS}${request.code}` } })
            return d2.render(compiled.diagram, compiled.renderOptions)
          })(),
          timeoutMs,
          () => new Error(`渲染超过 ${timeoutMs}ms`),
        )
        const recolored = recolor(pinIntrinsicSize(svg))
        return { svg: recolored.svg, unmapped: recolored.unmapped }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return diagnostic('DIAG-303', 'error', `d2 画不出这张图：${message}`, {
          start: { line: request.line, column: 1 },
          hint: '把图源贴到 https://play.d2lang.com 上定位；容器里的形状要用点号引用（外层.内层 -> 另一个）',
        })
      }
    },

    /**
     * **这一步不能省**：d2 把渲染跑在 worker 线程里，不 dispose 的话那个
     * `MessagePort` 一直吊着事件循环，`build` 编完了进程也不退出（实测 15 秒后仍活着）。
     */
    async dispose() {
      if (instance === undefined) return
      const d2 = await instance
      await d2.dispose?.()
      instance = undefined
    },
  }
}
