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
  /**
   * 这个引擎**喂给渲染器的配置**的指纹。进缓存键。
   *
   * 少了它就会出这种事：改了主题色配置、重新编译，拿到的还是旧图，
   * 而且因为走的是缓存路径，连「颜色换漏了」的诊断都一起消失。
   * 换句话说，工具活着不等于它的数据活着。
   */
  fingerprint: string
  /** 这个引擎需要的可选依赖装了没有；没装时给出安装办法 */
  probe(): Promise<{ available: true } | { available: false; hint: string }>
  /**
   * 渲染一张。**每个引擎都要实现这一个**。
   *
   * 「一次一张」是基础形状，因为实测下来它对六个新引擎都是对的：
   * 它们没有「每次调用的往返」这回事，开销全压在一次性初始化上，
   * 之后每张 0–112ms（Graphviz 0ms、WaveDrom 1ms、MathJax 3ms、
   * bytefield 3ms、Vega-Lite 4ms、d2 112ms）。
   */
  renderOne(request: RenderRequest): Promise<RenderedDiagram | Diagnostic>
  /**
   * 一次渲一批。**可选能力**，只有真能从中受益的引擎才实现。
   *
   * 目前只有 Mermaid：它每次调用都要和浏览器来回一趟，实测一次传 3 张 455ms，
   * 逐张是 3 × 364 = 1092ms。省的是那个往返，不是并行度——所以这条收益
   * **只对 Mermaid 成立**，别的引擎实现它是白写的复杂度。
   */
  renderBatch?(requests: RenderRequest[]): Promise<(RenderedDiagram | Diagnostic)[]>
  /**
   * 收尾。有需要的引擎才实现。
   *
   * d2 必须有：它把渲染跑在 worker 线程里，不 `dispose()` 的话
   * 那个 `MessagePort` 会一直吊着事件循环，进程不退出（实测 15 秒后仍活着）。
   */
  dispose?(): Promise<void>
}

/** 渲染一批：能批量就批量，不能就逐张。调用方不必关心引擎是哪一种。 */
export async function renderAll(
  engine: Engine,
  requests: RenderRequest[],
): Promise<(RenderedDiagram | Diagnostic)[]> {
  if (requests.length === 0) return []
  if (engine.renderBatch) return engine.renderBatch(requests)
  return Promise.all(requests.map((request) => engine.renderOne(request)))
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
