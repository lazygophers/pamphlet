#!/usr/bin/env node
/**
 * 命令行。
 *   pamphlet build   <路径...>   编译成单文件 HTML
 *   pamphlet serve   <路径>      本地预览，源文档改了就重新加载
 *   pamphlet lint    <路径...>   只检查语法、报诊断
 *   pamphlet ast     <路径>      把源文档转成 AST JSON 打印出来
 *   pamphlet extract <产物>      从产物反解出源文档
 *   pamphlet doctor              各图表引擎装了没有
 *
 * 退出码：0 成功 / 1 编译错误 / 2 参数或用法错误 / 3 环境缺失
 */

import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { glob } from 'node:fs/promises'
import { dirname, relative } from 'node:path'
import process from 'node:process'
import { parse } from './parse.js'
import { artifactPath, compileFile } from './compile.js'
import { extract } from './assemble/index.js'
import { createMermaidEngine } from './diagrams/mermaid.js'
import { STRUCTURED_KINDS, SELF_DRAWN_KINDS } from './diagrams/structured/index.js'
import { ENGINE_PACKAGES, loadEnginePackages } from './diagrams/packages.js'
import { serveUntilInterrupt } from './serve.js'
import { countBySeverity, formatDiagnostic, type FileReport } from './diagnostics.js'
import type { SizeReport } from './assemble/report.js'

const USAGE = `pamphlet — 把一份 Markdown 编译成自包含的单文件 HTML

用法
  pamphlet build   <路径...> [选项]   编译成单文件 HTML
  pamphlet serve   <路径>    [选项]   本地预览，源文档改了就重新加载
  pamphlet lint    <路径...> [选项]   检查语法并报诊断
  pamphlet ast     <路径>    [选项]   输出 AST JSON
  pamphlet extract <产物.html>        从产物反解出源文档
  pamphlet doctor                     各图表引擎装了没有

选项
  -o <路径>              产物写到哪（只在编译单份时可用）
  --theme <名字>         换一套主题，压过 frontmatter 里的 theme
                         十二套，见 pamphlet 文档站的「内置主题」
  --font <字体文件>      内嵌这个字体，只留文档用到的字
  --verbose              编译后打印体积归因
  --no-embed-source      产物里不内嵌源文档（extract 就用不了了）
  --port <端口>          serve 的端口，缺省 4321
  --format json          结构化输出，给 CI 和编辑器用
  --fail-on-warn         把警告也当成失败
  --continue-on-error    某份文档出错后继续处理剩下的
  --no-color             不上色
  -h, --help             这份说明

路径可以是通配符，由 pamphlet 自己展开（不依赖 shell），所以要加引号：
  pamphlet build "docs/**/*.md"
注意：不做任何默认排除。写 "**/*.md" 会连 node_modules 里的第三方文档一起检查。`

interface Options {
  format: 'human' | 'json'
  failOnWarn: boolean
  continueOnError: boolean
  color: boolean
  verbose: boolean
  embedSource: boolean
  out?: string
  font?: string
  theme?: string
  port: number
}

const COMMANDS = ['build', 'serve', 'lint', 'ast', 'extract', 'doctor'] as const
type Command = (typeof COMMANDS)[number]

export async function run(argv: string[]): Promise<number> {
  const [command, ...rest] = argv

  if (command === undefined || command === '-h' || command === '--help') {
    process.stdout.write(`${USAGE}\n`)
    return command === undefined ? 2 : 0
  }
  if (!(COMMANDS as readonly string[]).includes(command)) {
    process.stderr.write(`未知命令 ${command}\n\n${USAGE}\n`)
    return 2
  }

  const { patterns, options } = parseArgs(rest)

  if (command === 'doctor') return await runDoctor()

  if (patterns.length === 0) {
    process.stderr.write(`${command} 需要至少一个文件路径\n\n${USAGE}\n`)
    return 2
  }

  if (command === 'extract') return await runExtract(patterns[0] as string)

  const paths = await expand(patterns)
  if (paths.length === 0) {
    process.stderr.write(`没有文件匹配：${patterns.join(' ')}\n`)
    return 2
  }

  if (command === 'ast') {
    if (paths.length > 1) {
      process.stderr.write(`ast 一次只接一个文件，匹配到了 ${paths.length} 个\n`)
      return 2
    }
    return await runAst(paths[0] as string, options)
  }

  if (command === 'serve') {
    if (paths.length > 1) {
      process.stderr.write(`serve 一次只预览一个文件，匹配到了 ${paths.length} 个\n`)
      return 2
    }
    return await serveUntilInterrupt(paths[0] as string, options.port, compileOptions(options))
  }

  if (command === 'build') {
    if (options.out !== undefined && paths.length > 1) {
      process.stderr.write(`-o 只能配一份文档，匹配到了 ${paths.length} 个\n`)
      return 2
    }
    return await runBuild(paths, options)
  }

  return await runLint(paths, options)
}

function compileOptions(options: Options): {
  font?: string
  theme?: string
  embedSource: boolean
} {
  return {
    ...(options.font === undefined ? {} : { font: options.font }),
    ...(options.theme === undefined ? {} : { theme: options.theme }),
    embedSource: options.embedSource,
  }
}

function parseArgs(argv: string[]): { patterns: string[]; options: Options } {
  const options: Options = {
    format: 'human',
    failOnWarn: false,
    continueOnError: false,
    color: process.stdout.isTTY === true && process.env.NO_COLOR === undefined,
    verbose: false,
    embedSource: true,
    port: 4321,
  }
  const patterns: string[] = []

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--format') {
      const value = argv[i + 1]
      if (value === 'json' || value === 'human') options.format = value
      i += 1
      continue
    }
    if (arg === '-o' || arg === '--out') {
      const value = argv[i + 1]
      if (value !== undefined) options.out = value
      i += 1
      continue
    }
    if (arg === '--theme') {
      const value = argv[i + 1]
      if (value !== undefined) options.theme = value
      i += 1
      continue
    }
    if (arg === '--font') {
      const value = argv[i + 1]
      if (value !== undefined) options.font = value
      i += 1
      continue
    }
    if (arg === '--port') {
      const value = Number(argv[i + 1])
      if (Number.isInteger(value)) options.port = value
      i += 1
      continue
    }
    if (arg === '--verbose') { options.verbose = true; continue }
    if (arg === '--no-embed-source') { options.embedSource = false; continue }
    if (arg === '--fail-on-warn') { options.failOnWarn = true; continue }
    if (arg === '--continue-on-error') { options.continueOnError = true; continue }
    if (arg === '--no-color') { options.color = false; continue }
    if (arg !== undefined && !arg.startsWith('-')) patterns.push(arg)
  }

  return { patterns, options }
}

/** 通配符由自己展开，不依赖 shell（ADR-0023）。不做任何默认排除。 */
async function expand(patterns: string[]): Promise<string[]> {
  const found = new Set<string>()
  for (const pattern of patterns) {
    if (!pattern.includes('*')) {
      found.add(pattern)
      continue
    }
    for await (const entry of glob(pattern)) found.add(entry)
  }
  return [...found].sort()
}

/**
 * 编译。图没画出来时仍然写出产物、同时退出 1（ADR-0028）——
 * 产物里那张图的位置留一个说明性的占位框，作者能看到其余部分是对的。
 */
async function runBuild(paths: string[], options: Options): Promise<number> {
  const reports: FileReport[] = []
  const sources = new Map<string, string>()
  let failed = false

  for (const path of paths) {
    const result = await compileFile(path, compileOptions(options))
    sources.set(path, result.source)
    reports.push({ path, diagnostics: result.diagnostics })

    const target = options.out ?? artifactPath(path)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, result.html, 'utf8')
    process.stdout.write(`${relative(process.cwd(), target)}  ${kb(result.report.total)}\n`)
    if (options.verbose) printSizes(result.report)

    if (result.diagnostics.some((d) => d.severity === 'error')) {
      failed = true
      if (!options.continueOnError) break
    }
  }

  printDiagnostics(reports, sources, options, process.stderr)
  const { errors, warnings } = countBySeverity(reports)
  if (errors > 0 || failed) return 1
  if (options.failOnWarn && warnings > 0) return 1
  return 0
}

/** 体积归因（ADR-0011）：不设门槛，把体积摊开给作者看 */
function printSizes(report: SizeReport): void {
  process.stdout.write(`  体积 ${kb(report.total)}（gzip ${kb(report.gzipTotal)}）\n`)
  for (const part of report.parts) {
    const share = Math.round((part.bytes / report.total) * 100)
    process.stdout.write(
      `    ${part.name.padEnd(12)} ${kb(part.bytes).padStart(9)}  gzip ${kb(part.gzipBytes).padStart(9)}  ${share}%\n`,
    )
  }
}

function kb(bytes: number): string {
  return bytes < 1024 ? `${bytes}B` : `${(bytes / 1024).toFixed(1)}KB`
}

async function runExtract(path: string): Promise<number> {
  const html = await readFile(path, 'utf8')
  try {
    process.stdout.write(extract(html))
    return 0
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    return 1
  }
}

/**
 * 每个引擎装了没有、怎么装。缺任何一个都退出 3（环境缺失）。
 *
 * Mermaid 内置在主包；其余每种围栏语言各住在一个引擎包里，用到哪个装哪个，
 * 所以这里把「没装」也列出来并给安装命令——不列的话，作者只有在真的写了
 * 那种围栏、整次构建失败之后才知道。
 */
async function runDoctor(): Promise<number> {
  const engines = [createMermaidEngine()]
  let missing = 0
  for (const engine of engines) {
    const probe = await engine.probe()
    if (probe.available) {
      process.stdout.write(`✓ ${engine.name}（${engine.langs.join('、')}）\n`)
    } else {
      missing += 1
      process.stdout.write(`✗ ${engine.name}（${engine.langs.join('、')}）：${probe.hint}\n`)
    }
  }

  const langs = Object.keys(ENGINE_PACKAGES) as (keyof typeof ENGINE_PACKAGES)[]
  const loaded = await loadEnginePackages(langs)
  for (const engine of loaded.engines) {
    const probe = await engine.probe()
    if (probe.available) {
      process.stdout.write(`✓ ${engine.name}（${engine.langs.join('、')}）\n`)
    } else {
      missing += 1
      process.stdout.write(`✗ ${engine.name}（${engine.langs.join('、')}）：${probe.hint}\n`)
    }
  }
  for (const gap of loaded.missing) {
    // 没装不算「环境坏了」——它是这一版的常态，所以不计进退出码，只把装法说清楚
    process.stdout.write(`· ${gap.lang}：没装 ${gap.package}，要用就跑 ${gap.install}\n`)
  }
  // 结构化写法是指令不是引擎，但作者关心的是同一个问题：这张图我现在画不画得出来
  const selfDrawn = new Set<string>(SELF_DRAWN_KINDS)
  const viaMermaid = STRUCTURED_KINDS.filter((kind) => !selfDrawn.has(kind))
  process.stdout.write(
    `\n结构化写法（:::flow 这一路）共 ${STRUCTURED_KINDS.length} 种：\n` +
      `  翻译成 Mermaid 图源的 ${viaMermaid.length} 种：${viaMermaid.join(' / ')}\n` +
      `  自己出 SVG、不需要引擎的 ${SELF_DRAWN_KINDS.length} 种：${SELF_DRAWN_KINDS.join(' / ')}\n`,
  )

  return missing > 0 ? 3 : 0
}

async function runAst(path: string, options: Options): Promise<number> {
  const source = await readFile(path, 'utf8')
  const result = parse(source)
  const errors = result.diagnostics.filter((d) => d.severity === 'error')

  process.stdout.write(
    `${JSON.stringify(
      { path, frontmatter: result.frontmatter, ast: result.ast, diagnostics: result.diagnostics },
      null,
      2,
    )}\n`,
  )

  if (options.format === 'human' && result.diagnostics.length > 0) {
    for (const d of result.diagnostics) {
      process.stderr.write(`${formatDiagnostic(d, { path, source, color: options.color })}\n\n`)
    }
  }
  return errors.length > 0 ? 1 : 0
}

async function runLint(paths: string[], options: Options): Promise<number> {
  const reports: FileReport[] = []
  const failed: string[] = []
  const sources = new Map<string, string>()

  for (const path of paths) {
    let source: string
    try {
      source = await readFile(path, 'utf8')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      process.stderr.write(`读不到 ${path}：${message}\n`)
      failed.push(path)
      if (!options.continueOnError) return 1
      continue
    }
    sources.set(path, source)
    const { diagnostics } = parse(source)
    reports.push({ path, diagnostics })
    const hasError = diagnostics.some((d) => d.severity === 'error')
    if (hasError) {
      failed.push(path)
      if (!options.continueOnError) break
    }
  }

  if (options.format === 'json') {
    process.stdout.write(`${JSON.stringify({ reports, failed }, null, 2)}\n`)
  } else {
    printDiagnostics(reports, sources, options, process.stdout)
  }

  const { errors, warnings } = countBySeverity(reports)
  if (options.format === 'human') {
    // 「通过」= 处理完且没有错误的；读不到的文件只进失败名单，不参与通过数
    const passed = reports.filter((r) => !r.diagnostics.some((d) => d.severity === 'error')).length
    printSummary(passed, failed, errors, warnings)
  }

  if (errors > 0) return 1
  if (options.failOnWarn && warnings > 0) return 1
  return 0
}

/** 诊断按文件分组，每组带文件头（ADR-0023） */
function printDiagnostics(
  reports: FileReport[],
  sources: Map<string, string>,
  options: Options,
  stream: NodeJS.WritableStream,
): void {
  for (const report of reports) {
    if (report.diagnostics.length === 0) continue
    stream.write(`${report.path}\n`)
    for (const d of report.diagnostics) {
      const source = sources.get(report.path) ?? ''
      const text = formatDiagnostic(d, { path: report.path, source, color: options.color })
      stream.write(`${text.split('\n').map((line) => `  ${line}`).join('\n')}\n\n`)
    }
  }
}

/** 汇总行永远打印——静默的成功会让人怀疑它到底跑了没有 */
function printSummary(passed: number, failed: string[], errors: number, warnings: number): void {
  process.stdout.write(`${'─'.repeat(46)}\n`)
  const parts = [`${passed} 份通过`]
  if (failed.length > 0) parts.push(`${failed.length} 份失败`)
  if (errors > 0) parts.push(`${errors} 条错误`)
  if (warnings > 0) parts.push(`${warnings} 条警告`)
  process.stdout.write(`${parts.join('，')}\n`)
  if (failed.length > 0) process.stdout.write(`失败：${failed.join('、')}\n`)
}
