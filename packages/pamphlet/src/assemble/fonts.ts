/**
 * 字体子集化：只把文档真的用到的那些字打进产物。
 *
 * 中文字体整份是 10~20MB 量级，全塞进单文件 HTML 不现实；
 * 但一篇文档通常只用到一两千个字，子集下来是几十 KB。
 * 所以「自包含 + 指定字体」这两件事只有靠子集化才同时成立。
 */

import subsetFont from 'subset-font'
import { diagnostic, type Diagnostic } from '../diagnostics.js'

export interface FontSource {
  /** CSS 里的 font-family 名字 */
  family: string
  /** 字体文件路径，交给 readAsset 去读 */
  path: string
}

export interface FontResult {
  /** `@font-face` 规则；没有字体或子集化失败时是空串 */
  css: string
  /** 内嵌进产物的字节数，供体积归因报告用 */
  bytes: number
  diagnostics: Diagnostic[]
}

const EMPTY: FontResult = { css: '', bytes: 0, diagnostics: [] }

/** TrueType Collection 的文件头（Apple 的 TrueType 参考手册：'ttcf'） */
const TTC_MAGIC = [0x74, 0x74, 0x63, 0x66]

function isCollection(path: string, data: Uint8Array): boolean {
  if (path.toLowerCase().endsWith('.ttc')) return true
  return TTC_MAGIC.every((byte, index) => data[index] === byte)
}

export async function embedFont(
  font: FontSource | undefined,
  /** 产物里会出现的文字，用来决定留哪些字 */
  text: string,
  readAsset?: (path: string) => Promise<Uint8Array>,
): Promise<FontResult> {
  if (!font) return EMPTY

  if (!readAsset) {
    return {
      ...EMPTY,
      diagnostics: [
        diagnostic('EMB-402', 'error', `读不到字体 ${font.path}`, {
          hint: '调用方没有提供读取文件的办法（命令行下通常意味着路径不对）',
        }),
      ],
    }
  }

  let data: Uint8Array
  try {
    data = await readAsset(font.path)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ...EMPTY,
      diagnostics: [
        diagnostic('EMB-402', 'error', `读不到字体 ${font.path}：${message}`, {
          hint: '检查路径是否相对于源文档所在目录',
        }),
      ],
    }
  }

  if (isCollection(font.path, data)) {
    return {
      ...EMPTY,
      diagnostics: [
        diagnostic('EMB-404', 'error', `${font.path} 是一个字体集合（.ttc），不能直接子集化`, {
          hint: '先拆出单个字面再引用，例如 fonttools 的 `fonttools ttLib.ttCollection -y 0 -o 单个字面.ttf 集合.ttc`',
        }),
      ],
    }
  }

  // 去重只是为了少传字符：subset-font 自己也会去重，但一篇长文的字符串可能有几十万字
  const wanted = [...new Set(text)].join('')

  let subset: Buffer
  try {
    subset = await subsetFont(Buffer.from(data), wanted, { targetFormat: 'woff2' })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ...EMPTY,
      diagnostics: [
        diagnostic('EMB-404', 'error', `${font.path} 子集化失败：${message}`, {
          hint: '确认它是 ttf / otf / woff / woff2 中的一种单字面字体文件',
        }),
      ],
    }
  }

  const uri = `data:font/woff2;base64,${subset.toString('base64')}`
  // font-display:swap —— 字体在产物里就是 data URI，本来不会有加载延迟，
  // 但浏览器解码 woff2 仍要时间，swap 保证这段时间里字是可读的而不是空白。
  const css = `@font-face{font-family:"${font.family}";font-display:swap;src:url(${uri}) format("woff2")}`
  return { css, bytes: uri.length, diagnostics: [] }
}
