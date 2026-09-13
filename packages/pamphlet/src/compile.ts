/**
 * 一份 Markdown → 一本 pamphlet 的完整管线：读文件 → 解析 → 画图 → 组装。
 *
 * 这里是唯一碰硬盘的一层。parse / renderDiagrams / assemble 三段都不读写文件，
 * 所以它们能在测试里喂内存输入；把「路径」这件事收在这一个模块里。
 */

import { readFile } from 'node:fs/promises'
import { basename, dirname, extname, resolve } from 'node:path'
import { parse } from './parse.js'
import { renderDiagrams } from './diagrams/index.js'
import { assemble, type AssembleResult } from './assemble/index.js'
import { selectTheme } from './theme-select.js'
import type { Diagnostic } from './diagnostics.js'

export interface CompileOptions {
  /** 字体文件路径，子集化后内嵌 */
  font?: string
  /** 只给 serve 用 */
  liveReload?: boolean
  /** 单张图的渲染超时 */
  timeoutMs?: number
  /** 单个资源的字节上限 */
  assetLimitBytes?: number
  embedSource?: boolean
  /** `--theme`，压过 frontmatter 里的 `theme:`（ADR-0046） */
  theme?: string
}

export interface CompileResult extends AssembleResult {
  path: string
  source: string
}

export async function compileFile(path: string, options: CompileOptions = {}): Promise<CompileResult> {
  const source = await readFile(path, 'utf8')
  const parsed = parse(source)
  const diagnostics: Diagnostic[] = [...parsed.diagnostics]

  const theme = selectTheme({
    ...(options.theme === undefined ? {} : { cli: options.theme }),
    ...(parsed.frontmatter.theme === undefined ? {} : { frontmatter: parsed.frontmatter.theme }),
  })
  diagnostics.push(...theme.diagnostics)

  const diagrams = await renderDiagrams(parsed.ast, {
    ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),
    ...(parsed.frontmatter.engines === undefined
      ? {}
      : { declared: parsed.frontmatter.engines }),
  })
  diagnostics.push(...diagrams.diagnostics)

  // 资源路径相对源文档所在目录，这跟 Markdown 在 GitHub 上的解释一致
  const base = dirname(resolve(path))
  const assembled = await assemble(
    { ...parsed, diagnostics: [] },
    {
      readAsset: async (asset) => new Uint8Array(await readFile(resolve(base, asset))),
      light: theme.theme.light,
      dark: theme.theme.dark,
      themeCss: theme.theme.css,
      ...(options.font === undefined
        ? {}
        : { font: { family: fontFamily(options.font), path: resolve(base, options.font) } }),
      ...(options.liveReload === undefined ? {} : { liveReload: options.liveReload }),
      ...(options.assetLimitBytes === undefined ? {} : { assetLimitBytes: options.assetLimitBytes }),
      ...(options.embedSource === undefined ? {} : { embedSource: options.embedSource }),
    },
  )

  return {
    ...assembled,
    diagnostics: [...diagnostics, ...assembled.diagnostics],
    path,
    source,
  }
}

/** 字体的 CSS 名字取文件名——比让作者再写一遍 --font-family 少一个参数 */
function fontFamily(path: string): string {
  return basename(path, extname(path))
}

/** 产物路径：跟源文档同名，扩展名换成 .html */
export function artifactPath(path: string): string {
  return path.replace(/\.md$/i, '') + '.html'
}
