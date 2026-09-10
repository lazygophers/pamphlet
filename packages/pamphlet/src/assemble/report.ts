/**
 * 体积归因报告（ADR-0011）。
 *
 * 不设体积门槛，改成把体积**摊开给作者看**：产物有多大、大在哪一项。
 * 所以第一条要求是**各项之和等于总字节数**——分项必须是互不重叠、合起来铺满整个产物的
 * 若干段文本，不能有「算不清的剩余」，否则报告就变成一份看不出去处的清单。
 */

import { gzipSync } from 'node:zlib'

export interface SizePart {
  name: string
  bytes: number
  /** gzip 后的字节数：产物走 HTTP 时的真实体积，本地双击打开时无意义但仍有参考价值 */
  gzipBytes: number
}

export interface SizeReport {
  total: number
  gzipTotal: number
  /** 按贡献降序，字节数为 0 的分项不出现 */
  parts: SizePart[]
}

export function sizeReport(html: string, pieces: readonly { name: string; text: string }[]): SizeReport {
  const parts = pieces
    .map(({ name, text }) => ({
      name,
      bytes: Buffer.byteLength(text, 'utf8'),
      gzipBytes: text === '' ? 0 : gzipSync(text).byteLength,
    }))
    .filter((part) => part.bytes > 0)
    .sort((a, b) => b.bytes - a.bytes)

  return {
    total: Buffer.byteLength(html, 'utf8'),
    gzipTotal: gzipSync(html).byteLength,
    parts,
  }
}

/** 从 haystack 里去掉每段文本的第一次出现，剩下的就是没被归因的那部分 */
export function removeOnce(haystack: string, needles: readonly string[]): string {
  let rest = haystack
  for (const needle of needles) {
    if (needle === '') continue
    const at = rest.indexOf(needle)
    if (at >= 0) rest = rest.slice(0, at) + rest.slice(at + needle.length)
  }
  return rest
}
