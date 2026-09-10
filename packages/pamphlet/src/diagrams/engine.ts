/**
 * 图表引擎的内部抽象。**不是公共扩展点**——按 ADR-0007，用户加自己的引擎
 * 只能走声明式外部命令，不通过 JS 接口。所以这个形状可以随时改。
 */

import type { Diagnostic } from '../diagnostics.js'

export interface RenderRequest {
  /** 图源，就是围栏里那段文本 */
  code: string
  /** 这段图源在源文档里的位置，用于诊断 */
  line: number
}

export interface RenderedDiagram {
  svg: string
  /** 引擎硬编码、没能换成主题变量的色值 */
  unmapped: string[]
}

export interface Engine {
  /** 引擎名，出现在诊断里 */
  name: string
  /** 它认领的围栏语言 */
  langs: readonly string[]
  /** 这个引擎需要的可选依赖装了没有；没装时给出安装办法 */
  probe(): Promise<{ available: true } | { available: false; hint: string }>
  /**
   * 一次渲染一批。批量是有意的：实测一次传 3 张 455ms，
   * 逐张是 3 × 364 = 1092ms——瓶颈不在并行度，而在每次调用的往返。
   */
  render(requests: RenderRequest[]): Promise<(RenderedDiagram | Diagnostic)[]>
}

/** 单张 SVG 超过这个字节数给警告（DIAG-302） */
export const SVG_SIZE_WARN_BYTES = 200 * 1024

/**
 * 渲染超时。实测：第 1 张含浏览器冷启动 733ms，之后 364ms，40 节点大图 412ms。
 * 10 秒 ≈ 实测最坏值的 13 倍，够宽松到不误杀，又不至于让人干等。
 * 原先 30 秒那个数字没有实测依据（见 ADR-0033 的修订）。
 */
export const DEFAULT_TIMEOUT_MS = 10_000

/**
 * 注意：超时只是**不再等**，并不能取消底层渲染——无头浏览器那边还在跑。
 * 所以超时后要把被抛下的那个 promise 的失败吞掉，否则它稍后失败会变成
 * unhandled rejection，在 `serve` 这种长期进程里会一直冒出来。
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  onTimeout: () => Error,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      void promise.catch(() => undefined)
      reject(onTimeout())
    }, ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error instanceof Error ? error : new Error(String(error)))
      },
    )
  })
}
