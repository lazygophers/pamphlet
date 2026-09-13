/**
 * 外部命令引擎（ADR-0007）：图源走标准输入进，SVG 走标准输出出。
 *
 * 这条路存在的理由是**不公开 JS 接口**：第三方想接自己的渲染器，只要有一个
 * 命令行程序就行，不需要在构建期跑第三方 JavaScript，也就不需要插件沙箱和
 * 信任模型。配置因此永远只是数据。
 *
 * 官方的 PlantUML 引擎就是走这一条——它是一个 jar，不是 npm 包，本来也没有
 * 别的路可走。让它当第一个用户是有意的：给一个用户造专属抽象最容易做错，
 * 而这条通用机制本来就在计划里。
 */

import { spawn } from 'node:child_process'
import { diagnostic, type Diagnostic } from '../diagnostics.js'
import {
  DEFAULT_TIMEOUT_MS,
  type Engine,
  type RenderRequest,
  type RenderedDiagram,
} from './engine.js'
import { recolor } from './recolor.js'
import { pinIntrinsicSize } from './pin-size.js'

export interface CommandEngineOptions {
  /** 引擎名，出现在诊断里 */
  name: string
  /** 它认领的围栏语言 */
  langs: readonly string[]
  /** 要跑的命令，第一个元素是程序名 */
  command: readonly string[]
  /** 进缓存键的配置指纹 */
  fingerprint?: string
  timeoutMs?: number
  /** 没装时怎么说。缺引擎会让整次构建失败，所以这句话要能直接照做 */
  probe?: () => Promise<{ available: true } | { available: false; hint: string }>
}

interface CommandResult {
  stdout: string
  stderr: string
  code: number | null
}

/**
 * 跑一次命令，把图源喂进去、把 SVG 收回来。
 *
 * 超时后 kill：外部进程和浏览器那条路不一样——这里是我们自己 spawn 的，
 * 杀得掉，所以不用忍受「超时只是不再等」那个坑。
 */
function run(
  command: readonly string[],
  input: string,
  timeoutMs: number,
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const [program, ...args] = command
    if (program === undefined) {
      reject(new Error('命令是空的'))
      return
    }

    const child = spawn(program, args, { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error(`渲染超过 ${timeoutMs}ms`))
    }, timeoutMs)

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => (stdout += chunk))
    child.stderr.on('data', (chunk: string) => (stderr += chunk))
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ stdout, stderr, code })
    })

    child.stdin.on('error', () => undefined)
    child.stdin.end(input, 'utf8')
  })
}

export function createCommandEngine(options: CommandEngineOptions): Engine {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  return {
    name: options.name,
    langs: options.langs,
    fingerprint: options.fingerprint ?? options.command.join(' ').slice(0, 24),

    probe:
      options.probe ??
      (async () => ({
        available: false as const,
        hint: `装上 ${options.command[0] ?? '那个程序'} 之后再试`,
      })),

    async renderOne(request: RenderRequest): Promise<RenderedDiagram | Diagnostic> {
      const fail = (message: string, hint: string): Diagnostic =>
        diagnostic('DIAG-303', 'error', message, {
          start: { line: request.line, column: 1 },
          hint,
        })

      let result: CommandResult
      try {
        result = await run(options.command, request.code, timeoutMs)
      } catch (error) {
        return fail(
          `${options.name} 跑不起来：${error instanceof Error ? error.message : String(error)}`,
          `确认 ${options.command[0] ?? ''} 在 PATH 里；跑 pamphlet doctor 看各引擎的状态`,
        )
      }

      if (result.code !== 0) {
        // stderr 可能很长，只留第一行——完整的错误让作者自己跑那条命令去看
        const first = result.stderr.trim().split('\n')[0] ?? `退出码 ${result.code}`
        return fail(`${options.name} 画不出这张图：${first}`, '把图源单独喂给那个命令，能看到完整报错')
      }

      const svg = result.stdout.trim()
      if (!svg.startsWith('<svg') && !svg.includes('<svg')) {
        return fail(
          `${options.name} 没有吐出 SVG`,
          '外部命令引擎的约定是：图源走标准输入进、SVG 走标准输出出',
        )
      }

      const recolored = recolor(pinIntrinsicSize(svg))
      return { svg: recolored.svg, unmapped: recolored.unmapped }
    },
  }
}
