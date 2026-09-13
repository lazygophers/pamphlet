/**
 * PlantUML 引擎：画 ` ```plantuml ` 围栏的 UML 图。
 *
 * 它和另外六个不是一类东西：**不是 npm 包，是一个 jar，而且要 Java ≥ 11**。
 * 所以它不自己实现渲染，而是走主包那条「外部命令」的通用路（ADR-0007）——
 * 图源走标准输入进、SVG 走标准输出出。让它当那条路的第一个真实用户是有意的：
 * 给一个用户造专属抽象最容易做错。
 *
 * 它补的是真 UML（组件图、用例图、活动图）和真 C4 分层，Mermaid 的 `C4Context`
 * 只有最外一层。
 *
 * jar 选 **`plantuml-lgpl`**：它不内嵌 GraphViz，而 Pamphlet 本来就单独接
 * Graphviz，内嵌那份是重复的。义务只有一条——在文档里注明用了 PlantUML
 * 且它以 LGPL 分发。
 */

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createCommandEngine, type Engine } from '@nekoleapuki/pamphlet-cli/engine-kit'

const run = promisify(execFile)

/** jar 放在哪：环境变量优先，其次假设它在当前目录 */
function jarPath(): string {
  return process.env['PLANTUML_JAR'] ?? 'plantuml.jar'
}

async function hasJava(): Promise<boolean> {
  try {
    // `java -version` 写的是 stderr，不是 stdout——这里只关心它跑不跑得起来
    await run('java', ['-version'])
    return true
  } catch {
    return false
  }
}

export function createEngine(options: { timeoutMs?: number } = {}): Engine {
  return createCommandEngine({
    name: 'plantuml',
    langs: ['plantuml'],
    // `-tsvg` 出 SVG，`-pipe` 是「stdin 进 stdout 出」，
    // `-Djava.awt.headless=true` 不带的话它在 Unix 上会去找 X11 图形库
    command: [
      'java',
      '-Djava.awt.headless=true',
      '-jar',
      jarPath(),
      '-tsvg',
      '-pipe',
      '-charset',
      'UTF-8',
    ],
    fingerprint: `plantuml-svg-${jarPath()}`.slice(0, 24),
    ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),

    /**
     * 两件事都要查，而且要分得开——不然作者拿到的是 `spawn` 的原始报错，
     * 那种报错指向的原因通常是错的。
     */
    async probe() {
      if (!(await hasJava())) {
        return {
          available: false,
          hint: 'PlantUML 要 Java ≥ 11。装好 Java 之后再跑一次（七个引擎里只有它要）',
        }
      }
      try {
        await run('java', ['-Djava.awt.headless=true', '-jar', jarPath(), '-version'])
      } catch {
        return {
          available: false,
          hint: `找不到 ${jarPath()}。从 https://plantuml.com/download 下 plantuml-lgpl 那个 jar，放好之后用 PLANTUML_JAR 指向它`,
        }
      }
      return { available: true }
    },
  })
}
