/**
 * `pamphlet serve`：预览页面能拿到、源文档改了会重新编译、SSE 端点形状对。
 * 端口传 0 让操作系统分配，测试之间不抢端口。
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  RELOAD_PATH,
  serveUntilInterrupt,
  startServer,
  type RunningServer,
} from '../src/serve.js'

let dir: string
let running: RunningServer | undefined

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'pamphlet-serve-'))
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
})

afterEach(async () => {
  await running?.close()
  running = undefined
  vi.restoreAllMocks()
})

async function start(name: string, source: string): Promise<{ path: string; port: number }> {
  const path = join(dir, name)
  writeFileSync(path, source, 'utf8')
  running = await startServer(path, 0)
  return { path, port: running.port }
}

describe('serve', () => {
  it('返回编译好的产物，且带上 live reload 那一段', async () => {
    const { port } = await start('a.md', '# 标题\n\n正文。\n')

    const response = await fetch(`http://localhost:${port}/`)
    const html = await response.text()
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(html).toContain('正文')
    expect(html).toContain(RELOAD_PATH)
    // live reload 那条 EventSource 要连回本地服务，CSP 必须放行
    expect(html).toContain("connect-src 'self'")
  }, 30_000)

  it('源文档改了以后再取，拿到的是新内容', async () => {
    const { path, port } = await start('b.md', '# 旧标题\n')
    expect(await (await fetch(`http://localhost:${port}/`)).text()).toContain('旧标题')

    writeFileSync(path, '# 新标题\n', 'utf8')
    // 重编译是文件事件驱动的，没有固定耗时——轮询到出现为止，别用死等的毫秒数
    let html = ''
    for (let i = 0; i < 300 && !html.includes('新标题'); i += 1) {
      await delay(50)
      html = await (await fetch(`http://localhost:${port}/`)).text()
    }
    expect(html).toContain('新标题')
  }, 30_000)

  it('连着改两次，页面停在最后那一版而不是先写完的那一版', async () => {
    // 连按两下保存会触发两次 watch 回调。两个 rebuild 并发跑时，`html` 归谁看谁后写完——
    // 先保存的那一版完全可能后写完，页面就停在旧内容上。排队之后才有「最后一次说了算」
    const { path, port } = await start('c.md', '# 第 0 版\n')
    expect(await (await fetch(`http://localhost:${port}/`)).text()).toContain('第 0 版')

    writeFileSync(path, '# 第 1 版\n', 'utf8')
    writeFileSync(path, '# 第 2 版\n', 'utf8')

    let html = ''
    for (let i = 0; i < 300 && !html.includes('第 2 版'); i += 1) {
      await delay(50)
      html = await (await fetch(`http://localhost:${port}/`)).text()
    }
    expect(html).toContain('第 2 版')
    // 再等一会儿，确认没有一个迟到的 rebuild 把旧版本写回去
    await delay(300)
    expect(await (await fetch(`http://localhost:${port}/`)).text()).toContain('第 2 版')
  }, 30_000)

  it('SSE 端点用 text/event-stream 应答', async () => {
    const { port } = await start('c.md', '# 标题\n')

    const controller = new AbortController()
    const response = await fetch(`http://localhost:${port}${RELOAD_PATH}`, {
      signal: controller.signal,
    })
    expect(response.headers.get('content-type')).toBe('text/event-stream')
    controller.abort()
  }, 30_000)
})

describe('serve 的失败路径', () => {
  it('源文档读不到时把错误摆在页面上，服务不退', async () => {
    const path = join(dir, 'gone.md')
    writeFileSync(path, '# 在\n', 'utf8')
    running = await startServer(path, 0)

    // 删掉源文件再改一次同名文件，逼 watcher 触发一次注定失败的重编译
    rmSync(path)
    writeFileSync(path, 'x', 'utf8')
    rmSync(path)

    // 服务必须还活着；页面要么是旧内容要么是错误页，两者都算「没退」
    let status = 0
    for (let i = 0; i < 100; i += 1) {
      await delay(50)
      status = (await fetch(`http://localhost:${running.port}/`)).status
      if (status === 200) break
    }
    expect(status).toBe(200)
  }, 30_000)
})

describe('serveUntilInterrupt', () => {
  it('报出预览地址，收到 SIGINT 后干净退出', async () => {
    const path = join(dir, 'i.md')
    writeFileSync(path, '# 甲\n', 'utf8')
    const lines: string[] = []
    vi.mocked(process.stdout.write).mockImplementation((chunk) => {
      lines.push(String(chunk))
      return true
    })

    const finished = serveUntilInterrupt(path, 0)
    // 等它把地址打出来，说明服务已经在听了
    for (let i = 0; i < 200 && lines.join('').includes('预览地址') === false; i += 1) {
      await delay(10)
    }
    expect(lines.join('')).toContain('预览地址 http://localhost:')

    process.emit('SIGINT')
    expect(await finished).toBe(0)
  }, 30_000)
})

describe('serve 把诊断写到 stderr', () => {
  it('源文档有诊断时逐条打出来，页面照常应答', async () => {
    const lines: string[] = []
    vi.mocked(process.stderr.write).mockImplementation((chunk) => {
      lines.push(String(chunk))
      return true
    })
    // 远程图片会报 EMB-403
    const { port } = await start('warned.md', '# 甲\n\n![图](https://example.com/a.png)\n')
    expect(lines.join('')).toContain('EMB-403')
    expect((await fetch(`http://localhost:${port}/`)).status).toBe(200)
  }, 30_000)
})
