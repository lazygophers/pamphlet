/**
 * `pamphlet serve`：本地预览。源文档改了就重新编译、页面自己刷新。
 *
 * 用 Node 自带的 http + fs.watch，不引入任何开发服务器依赖——
 * 要伺候的只有一个 HTML 和一条 SSE（Server-Sent Events，服务器单向推消息的标准做法，
 * 浏览器侧就是一行 `new EventSource(...)`），够不上一个框架。
 *
 * `startServer` 起了就返回，「等到 Ctrl+C」是命令行的事（见 serveUntilInterrupt）。
 * 这样测试能拿到真实端口、连上去、再关掉，不必去猜进程里有哪些句柄。
 */

import { createServer, type ServerResponse } from 'node:http'
import { watch } from 'node:fs'
import process from 'node:process'
import { compileFile, type CompileOptions } from './compile.js'
import { formatDiagnostic } from './diagnostics.js'

export const RELOAD_PATH = '/__pamphlet_reload'

export interface RunningServer {
  port: number
  close(): Promise<void>
}

export async function startServer(
  path: string,
  port: number,
  options: CompileOptions = {},
): Promise<RunningServer> {
  const clients = new Set<ServerResponse>()
  let html = ''

  const rebuild = async (): Promise<void> => {
    try {
      const result = await compileFile(path, { ...options, liveReload: true })
      html = result.html
      for (const d of result.diagnostics) {
        process.stderr.write(`${formatDiagnostic(d, { path, source: result.source, color: false })}\n\n`)
      }
    } catch (error) {
      // 编译崩了不能让服务跟着退：作者存到一半的文件常常是不合法的，
      // 把错误摆在页面上、等下一次保存就好。
      const message = error instanceof Error ? error.message : String(error)
      html = `<!doctype html><meta charset="utf-8"><pre>${message.replace(/</g, '&lt;')}</pre>`
      process.stderr.write(`${message}\n`)
    }
  }

  await rebuild()

  const server = createServer((request, response) => {
    if (request.url === RELOAD_PATH) {
      response.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
      })
      // 先推一条注释行（SSE 里以 `:` 开头的行是注释）。
      // 不推的话响应头会一直压在 Node 的缓冲里，客户端连「连上了」都不知道。
      response.write(': connected\n\n')
      clients.add(response)
      request.on('close', () => clients.delete(response))
      return
    }
    response.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    })
    response.end(html)
  })

  await new Promise<void>((resolve) => server.listen(port, resolve))
  const address = server.address()
  const actual = typeof address === 'object' && address !== null ? address.port : port

  const watcher = watch(path, () => {
    void rebuild().then(() => {
      for (const client of clients) client.write('data: reload\n\n')
    })
  })

  return {
    port: actual,
    close: async () => {
      watcher.close()
      for (const client of clients) client.end()
      await new Promise<void>((resolve) => server.close(() => resolve()))
    },
  }
}

/** 命令行用的形态：起服务、报地址、一直跑到 Ctrl+C */
export async function serveUntilInterrupt(
  path: string,
  port: number,
  options: CompileOptions = {},
): Promise<number> {
  const running = await startServer(path, port, options)
  process.stdout.write(`预览地址 http://localhost:${running.port}\n按 Ctrl+C 停止\n`)

  await new Promise<void>((resolve) => {
    process.once('SIGINT', resolve)
    process.once('SIGTERM', resolve)
  })

  await running.close()
  return 0
}
