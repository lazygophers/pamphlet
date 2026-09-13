/**
 * Graphviz 引擎：画 ` ```dot ` 围栏。
 *
 * 它是七个引擎里最省的一个——WASM 2.1MB，不需要浏览器也不需要 Java，
 * 实测 50 节点的图中位 3.5ms（Mermaid 是 364ms）。补的缺口是**节点多的图**：
 * 依赖关系、调用链、网络拓扑动辄几十个节点，Mermaid 排到后面会开始压线。
 *
 * 换色走和别的引擎同一套哨兵机制（ADR-0016），但注入方式是 Graphviz 特有的：
 * 见下面 `withSentinels`。
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

/** `graph x {`、`digraph "名字" {`、`strict digraph {`——图头那一行，用来找插入点 */
const GRAPH_HEADER = /^\s*(?:strict\s+)?(?:di)?graph\s*(?:"[^"]*"|[A-Za-z_][\w]*)?\s*\{/

/**
 * 把哨兵色注入成图的**默认**配色，不改作者写的任何一个字符。
 *
 * 三个实测踩出来的坑，都在这段代码里体现：
 *
 * 1. **不能直接找第一个 `{`**：注释里的花括号会让它插错位置（静默零命中），
 *    图名里的花括号会直接把图源变成语法错误。所以先让 Graphviz 自己
 *    `read(src).toDot()` 规范化一遍（实测 0.18ms），拿到的图头形状是固定的。
 * 2. **不能用 `setDefault*Attr` 那条 API**：图源里只要有任何 `[color=…]`，
 *    cgraph 会把已存在的节点写成 `color=""`，描边回落成黑色——**静默丢色**。
 * 3. **哨兵必须带双引号**：`fillcolor=#ff0002` 不带引号是 `syntax error`。
 */
function withSentinels(dot: string): string {
  const header = GRAPH_HEADER.exec(dot)
  if (!header) return dot
  const defaults = [
    `  bgcolor="${SENTINELS.bg}";`,
    `  node [style=filled fillcolor="${SENTINELS.fill}" color="${SENTINELS.line}" fontcolor="${SENTINELS.text}"];`,
    `  edge [color="${SENTINELS.line}" fontcolor="${SENTINELS.muted}"];`,
    `  graph [fontcolor="${SENTINELS.text}"];`,
  ].join('\n')
  const at = header.index + header[0].length
  return `${dot.slice(0, at)}\n${defaults}${dot.slice(at)}`
}

interface GraphvizModule {
  Graphviz: {
    load: () => Promise<{
      layout: (source: string, format: string, engine: string) => string
      read: (source: string) => { toDot: () => string }
    }>
  }
}

type Graphviz = Awaited<ReturnType<GraphvizModule['Graphviz']['load']>>

/**
 * WASM 实例是**进程内单例**：`load()` 实测 28ms，每张图重来一次等于白付。
 * 和 Mermaid 的浏览器一样惰性——没有 ` ```dot ` 围栏就永远不加载。
 */
let loading: Promise<Graphviz> | undefined

async function getGraphviz(): Promise<Graphviz> {
  loading ??= (async () => {
    const module = (await import('@hpcc-js/wasm-graphviz')) as unknown as GraphvizModule
    return module.Graphviz.load()
  })()
  return loading
}

export interface GraphvizOptions {
  timeoutMs?: number
  /** 布局算法。`dot` 是分层布局，节点多的图靠它 */
  layout?: string
}

export function createEngine(options: GraphvizOptions = {}): Engine {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const layout = options.layout ?? 'dot'

  return {
    name: 'graphviz',
    langs: ['dot'],
    // 注入的哨兵和布局算法都决定输出，所以它们进缓存键
    fingerprint: `${layout}-${Object.values(SENTINELS).join('')}`.slice(0, 24),

    async probe() {
      try {
        await import('@hpcc-js/wasm-graphviz')
      } catch {
        return {
          available: false,
          hint: '装一次就好：npm i -D @nekoleapuki/pamphlet-engine-graphviz（WASM 2.1MB，不需要浏览器）',
        }
      }
      return { available: true }
    },

    // 只实现基础层：Graphviz 没有「每次调用的往返」那回事，实测第二张起 0ms，
    // 批量对它是白写的复杂度（那个设计是给 Mermaid 的浏览器往返用的）
    async renderOne(request: RenderRequest): Promise<RenderedDiagram | Diagnostic> {
      const graphviz = await getGraphviz()
      try {
        const canonical = graphviz.read(request.code).toDot()
        const svg = await withTimeout(
          Promise.resolve(graphviz.layout(withSentinels(canonical), 'svg', layout)),
          timeoutMs,
          () => new Error(`渲染超过 ${timeoutMs}ms`),
        )
        const recolored = recolor(pinIntrinsicSize(svg))
        return { svg: recolored.svg, unmapped: recolored.unmapped }
      } catch (error) {
        return diagnostic(
          'DIAG-303',
          'error',
          `Graphviz 画不出这张图：${error instanceof Error ? error.message : String(error)}`,
          {
            start: { line: request.line, column: 1 },
            hint: '把图源贴到 https://dreampuf.github.io/GraphvizOnline 上定位，那里的报错更具体',
          },
        )
      }
    },
  }
}
