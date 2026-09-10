/**
 * 资源内嵌：本地图片 → data URI。
 *
 * 「自包含」是这个项目的核心承诺，所以远程资源直接报错而不是静默下载——
 * 不给绕过开关，就不会有人不小心产出一个需要联网的产物。
 */

import type { Image, Root, RootContent } from 'mdast'
import { diagnostic, type Diagnostic } from '../diagnostics.js'

/** base64 编码会让体积膨胀 33.3%（RFC 2045 §6.8、RFC 4648 §4） */
export const DEFAULT_ASSET_LIMIT_BYTES = 2 * 1024 * 1024

const MIME_BY_EXTENSION: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  ico: 'image/x-icon',
}

export interface EmbedOptions {
  readAsset?: (path: string) => Promise<Uint8Array>
  limitBytes?: number
}

export interface EmbedResult {
  /** 原路径 → data URI */
  assets: Map<string, string>
  /**
   * 内嵌不成功的资源（远程、读不到、超限）。渲染层必须用它把原路径挡在产物之外——
   * 产物里留一个外链就等于打破「自包含」，即使 CSP 会在打开时拦住它。
   */
  failed: Map<string, string>
  diagnostics: Diagnostic[]
  /** 每个资源内嵌后的字节数，供体积归因报告用 */
  bytes: Map<string, number>
}

function collectImages(ast: Root): Image[] {
  const images: Image[] = []
  const walk = (node: RootContent): void => {
    if (node.type === 'image') images.push(node)
    const children = 'children' in node ? (node.children as RootContent[] | undefined) : undefined
    if (children) for (const child of children) walk(child)
  }
  for (const child of ast.children) walk(child)
  return images
}

function mimeOf(url: string): string {
  const extension = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(url)?.[1]?.toLowerCase()
  return (extension && MIME_BY_EXTENSION[extension]) ?? 'application/octet-stream'
}

export async function embedAssets(ast: Root, options: EmbedOptions = {}): Promise<EmbedResult> {
  const limit = options.limitBytes ?? DEFAULT_ASSET_LIMIT_BYTES
  const assets = new Map<string, string>()
  const failed = new Map<string, string>()
  const bytes = new Map<string, number>()
  const diagnostics: Diagnostic[] = []
  const seen = new Set<string>()

  for (const image of collectImages(ast)) {
    const url = image.url
    if (seen.has(url)) continue
    seen.add(url)

    const at = {
      line: image.position?.start.line ?? 1,
      column: image.position?.start.column ?? 1,
    }

    // 作者自己已经内嵌好的，原样放过
    if (url.startsWith('data:')) continue

    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
      diagnostics.push(
        diagnostic('EMB-403', 'error', `不能引用远程资源：${url}`, {
          start: at,
          hint: '把它下载到本地再引用——一本 pamphlet 打开时不向网络要任何东西',
        }),
      )
      failed.set(url, '这是一个远程资源，没有内嵌进产物')
      continue
    }

    if (!options.readAsset) {
      diagnostics.push(
        diagnostic('EMB-402', 'error', `读不到 ${url}`, {
          start: at,
          hint: '调用方没有提供读取资源的办法（命令行下通常意味着路径不对）',
        }),
      )
      failed.set(url, '读不到这个文件')
      continue
    }

    let data: Uint8Array
    try {
      data = await options.readAsset(url)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      diagnostics.push(
        diagnostic('EMB-402', 'error', `读不到 ${url}：${message}`, {
          start: at,
          hint: '检查路径是否相对于源文档所在目录',
        }),
      )
      failed.set(url, '读不到这个文件')
      continue
    }

    if (data.byteLength > limit) {
      diagnostics.push(
        diagnostic(
          'EMB-401',
          'error',
          `${url} 有 ${Math.round(data.byteLength / 1024)}KB，超过上限 ${Math.round(limit / 1024)}KB`,
          {
            start: at,
            hint: '压一下再放进来（PNG 试 pngquant --quality=70），或者改用图表围栏画成 SVG；也可以用 --limit 抬高上限',
          },
        ),
      )
      failed.set(url, `这张图 ${Math.round(data.byteLength / 1024)}KB，超过上限没有内嵌`)
      continue
    }

    const base64 = Buffer.from(data).toString('base64')
    const uri = `data:${mimeOf(url)};base64,${base64}`
    assets.set(url, uri)
    bytes.set(url, uri.length)
  }

  return { assets, failed, diagnostics, bytes }
}
