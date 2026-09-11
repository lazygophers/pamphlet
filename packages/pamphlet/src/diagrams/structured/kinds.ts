/**
 * 十七种结构化图表：每一种把「声明块 + 关系块」翻译成 Mermaid 图源。
 *
 * 翻译器一律是纯函数（结构进、文本出），不碰浏览器也不碰硬盘——
 * 所以它们能被单独测，测的时候不启动 Chromium。
 *
 * ADR-0019 原先否决过自有写法；这一套是它被推翻之后的实现，
 * ` ```mermaid ` 围栏永久保留，两套并存。
 */

import { diagnostic, type Diagnostic } from '../../diagnostics.js'
import type { TranslateInput, TranslateResult } from './types.js'
import { renderChart, renderOrgchart, renderSwimlane, renderTopology } from './svg.js'
import {
  parseDeclaration,
  parseRelation,
  requireBlock,
  unknownTargets,
  type Declaration,
  type Entry,
  type Relation,
} from './parse.js'

/** 十七个图表指令名 */
export const STRUCTURED_KINDS = [
  'flow',
  'sequence',
  'state',
  'class',
  'er',
  'gantt',
  'pie',
  'architecture',
  'c4',
  'dataflow',
  'mindmap',
  'gitgraph',
  'block',
  'swimlane',
  'topology',
  'chart',
  'orgchart',
] as const
export type StructuredKind = (typeof STRUCTURED_KINDS)[number]

export function isStructuredKind(name: string): name is StructuredKind {
  return (STRUCTURED_KINDS as readonly string[]).includes(name)
}

/** 每种图认识的属性名。不在表里的给诊断，和别的指令一个规矩 */
export const STRUCTURED_ATTRIBUTES: Record<StructuredKind, readonly string[]> = {
  flow: ['dir'],
  sequence: [],
  state: ['dir'],
  class: ['dir'],
  er: [],
  gantt: ['axis'],
  pie: [],
  architecture: [],
  c4: [],
  dataflow: ['dir'],
  mindmap: [],
  gitgraph: [],
  block: ['columns'],
  swimlane: ['dir'],
  topology: [],
  chart: ['type'],
  orgchart: [],
}

const DIRECTIONS: Record<string, string> = {
  LR: 'LR',
  RL: 'RL',
  TD: 'TD',
  TB: 'TB',
  BT: 'BT',
}

function direction(attrs: TranslateInput['attrs'], fallback: string): string {
  const raw = typeof attrs['dir'] === 'string' ? attrs['dir'].toUpperCase() : ''
  return DIRECTIONS[raw] ?? fallback
}

/** Mermaid 的标签里不能直接出现引号和方括号 */
function safe(text: string): string {
  return text.replace(/["[\]{}|]/g, ' ').trim()
}

const FLOW_SHAPES: Record<string, [string, string]> = {
  box: ['[', ']'],
  round: ['(', ')'],
  stadium: ['([', '])'],
  diamond: ['{', '}'],
  cylinder: ['[(', ')]'],
  circle: ['((', '))'],
}

function flowNode(declaration: Declaration): string {
  const [open, close] = FLOW_SHAPES[declaration.shape ?? 'box'] ?? FLOW_SHAPES['box']!
  return `${declaration.id}${open}"${safe(declaration.text)}"${close}`
}

function shapeDiagnostics(declarations: readonly Declaration[]): Diagnostic[] {
  const known = Object.keys(FLOW_SHAPES)
  return declarations
    .filter((d) => d.shape !== undefined && !(d.shape in FLOW_SHAPES))
    .map((d) =>
      diagnostic('DIAG-307', 'error', `不认识的形状 ${d.shape ?? ''}`, {
        start: { line: d.line, column: 1 },
        hint: `能用的是：${known.join(' / ')}`,
      }),
    )
}

/** 流程图 / 数据流图 / 状态图这一路共用的「声明 + 连线」骨架 */
function graphLike(
  input: TranslateInput,
  config: {
    declBlock: string
    relBlock: string
    header: (dir: string) => string
    renderNode: (declaration: Declaration) => string
    renderEdge: (relation: Relation) => string
    defaultDir: string
    checkShapes?: boolean
  },
): TranslateResult {
  const diagnostics: Diagnostic[] = [...input.body.diagnostics]
  const decl = requireBlock(input.body, config.declBlock, input.at)
  const rel = requireBlock(input.body, config.relBlock, input.at)
  diagnostics.push(...decl.diagnostics, ...rel.diagnostics)

  const declarations = decl.entries.map(parseDeclaration)
  if (config.checkShapes !== false) diagnostics.push(...shapeDiagnostics(declarations))

  const relations: Relation[] = []
  for (const entry of rel.entries) {
    const parsed = parseRelation(entry, ['-->', '->'])
    if (!parsed) {
      diagnostics.push(
        diagnostic('DIAG-306', 'error', '这一行不是一条连线', {
          start: { line: entry.line, column: 1 },
          hint: '写成 甲 -> 乙，要标签就再加 : 标签',
        }),
      )
      continue
    }
    relations.push(parsed)
  }
  diagnostics.push(...unknownTargets(relations, new Set(declarations.map((d) => d.id))))

  if (diagnostics.some((d) => d.severity === 'error')) return { diagnostics }

  const lines = [
    config.header(direction(input.attrs, config.defaultDir)),
    ...declarations.map((d) => `  ${config.renderNode(d)}`),
    ...relations.map((r) => `  ${config.renderEdge(r)}`),
  ]
  return { mermaid: lines.join('\n'), diagnostics }
}

function flowEdge(relation: Relation): string {
  const label = relation.label === undefined ? '' : `|"${safe(relation.label)}"|`
  return `${relation.from} -->${label} ${relation.to}`
}

const TRANSLATORS: Partial<Record<StructuredKind, (input: TranslateInput) => TranslateResult>> = {
  swimlane: renderSwimlane,
  topology: renderTopology,
  chart: renderChart,
  orgchart: renderOrgchart,

  flow: (input) =>
    graphLike(input, {
      declBlock: 'nodes',
      relBlock: 'edges',
      header: (dir) => `flowchart ${dir}`,
      renderNode: flowNode,
      renderEdge: flowEdge,
      defaultDir: 'TD',
    }),

  // 数据流图就是流程图的一种用法：形状区分外部角色 / 处理 / 存储
  dataflow: (input) =>
    graphLike(input, {
      declBlock: 'nodes',
      relBlock: 'flows',
      header: (dir) => `flowchart ${dir}`,
      renderNode: flowNode,
      renderEdge: flowEdge,
      defaultDir: 'LR',
    }),

  state: (input) =>
    graphLike(input, {
      declBlock: 'states',
      relBlock: 'transitions',
      header: () => 'stateDiagram-v2',
      renderNode: (d) => (d.id === d.text ? `${d.id}` : `${d.id} : ${safe(d.text)}`),
      renderEdge: (r) =>
        `${r.from} --> ${r.to}${r.label === undefined ? '' : ` : ${safe(r.label)}`}`,
      defaultDir: 'TD',
      checkShapes: false,
    }),

  class: (input) =>
    graphLike(input, {
      declBlock: 'classes',
      relBlock: 'relations',
      header: () => 'classDiagram',
      renderNode: (d) => `class ${d.id}`,
      renderEdge: (r) =>
        `${r.from} --> ${r.to}${r.label === undefined ? '' : ` : ${safe(r.label)}`}`,
      defaultDir: 'TD',
      checkShapes: false,
    }),


  sequence: (input) => {
    const diagnostics: Diagnostic[] = [...input.body.diagnostics]
    const decl = requireBlock(input.body, 'participants', input.at)
    const rel = requireBlock(input.body, 'messages', input.at)
    diagnostics.push(...decl.diagnostics, ...rel.diagnostics)

    const declarations = decl.entries.map(parseDeclaration)
    const relations: Relation[] = []
    for (const entry of rel.entries) {
      // `-->` 是虚线回复，`->` 是实线请求——时序图里这两条语义不同
      const parsed = parseRelation(entry, ['-->', '->'])
      if (!parsed) {
        diagnostics.push(
          diagnostic('DIAG-306', 'error', '这一行不是一条消息', {
            start: { line: entry.line, column: 1 },
            hint: '写成 甲 -> 乙 : 消息内容；回复用 甲 --> 乙 : 内容',
          }),
        )
        continue
      }
      relations.push(parsed)
    }
    diagnostics.push(...unknownTargets(relations, new Set(declarations.map((d) => d.id))))
    if (diagnostics.some((d) => d.severity === 'error')) return { diagnostics }

    const lines = [
      'sequenceDiagram',
      ...declarations.map((d) => `  participant ${d.id} as ${safe(d.text)}`),
      ...relations.map(
        (r) =>
          `  ${r.from}${r.arrow === '-->' ? '-->>' : '->>'}${r.to}: ${safe(r.label ?? '')}`,
      ),
    ]
    return { mermaid: lines.join('\n'), diagnostics }
  },

  gantt: (input) => {
    const diagnostics: Diagnostic[] = [...input.body.diagnostics]
    const sections = requireBlock(input.body, 'sections', input.at)
    const tasks = requireBlock(input.body, 'tasks', input.at)
    diagnostics.push(...sections.diagnostics, ...tasks.diagnostics)
    if (diagnostics.some((d) => d.severity === 'error')) return { diagnostics }

    // 任务行：`阶段 : 名字 : 起 : 长度`，起可以是 after 某个任务
    const bySection = new Map<string, string[]>()
    for (const entry of tasks.entries) {
      const parts = entry.text.split(':').map((s) => s.trim())
      if (parts.length < 3) {
        diagnostics.push(
          diagnostic('DIAG-306', 'error', '这一行不是一条任务', {
            start: { line: entry.line, column: 1 },
            hint: '写成 阶段 : 任务名 : 开始 : 时长，例如 设计 : 定方案 : 2026-03-02 : 5d',
          }),
        )
        continue
      }
      const [section, name, ...rest] = parts as [string, string, ...string[]]
      const list = bySection.get(section) ?? []
      list.push(`  ${name} :${rest.join(', ')}`)
      bySection.set(section, list)
    }
    if (diagnostics.some((d) => d.severity === 'error')) return { diagnostics }

    const axis = typeof input.attrs['axis'] === 'string' ? input.attrs['axis'] : '%m-%d'
    const lines = ['gantt', '  dateFormat YYYY-MM-DD', `  axisFormat ${axis}`]
    for (const entry of sections.entries) {
      const name = parseDeclaration(entry).text
      lines.push(`  section ${safe(name)}`)
      lines.push(...(bySection.get(entry.text.split('=')[0]?.trim() ?? entry.text) ?? []))
    }
    return { mermaid: lines.join('\n'), diagnostics }
  },

  pie: (input) => {
    const diagnostics: Diagnostic[] = [...input.body.diagnostics]
    const slices = requireBlock(input.body, 'slices', input.at)
    diagnostics.push(...slices.diagnostics)
    const rows: string[] = []
    for (const entry of slices.entries) {
      const at = entry.text.lastIndexOf(':')
      const value = at === -1 ? NaN : Number(entry.text.slice(at + 1).trim())
      if (at === -1 || Number.isNaN(value)) {
        diagnostics.push(
          diagnostic('DIAG-306', 'error', '这一行不是一块扇区', {
            start: { line: entry.line, column: 1 },
            hint: '写成 名字 : 数值，例如 图表 SVG : 48',
          }),
        )
        continue
      }
      rows.push(`  "${safe(entry.text.slice(0, at).trim())}" : ${value}`)
    }
    if (diagnostics.some((d) => d.severity === 'error')) return { diagnostics }
    return { mermaid: ['pie', ...rows].join('\n'), diagnostics }
  },

  mindmap: (input) => {
    const diagnostics: Diagnostic[] = [...input.body.diagnostics]
    const root = requireBlock(input.body, 'root', input.at)
    const branches = requireBlock(input.body, 'branches', input.at)
    diagnostics.push(...root.diagnostics, ...branches.diagnostics)
    if (diagnostics.some((d) => d.severity === 'error')) return { diagnostics }

    // 分支靠 `>` 的个数表示层级：`> 语法` 是一层，`>> 指令` 是两层
    const lines = ['mindmap', `  root((${safe(parseDeclaration(root.entries[0]!).text)}))`]
    for (const entry of branches.entries) {
      const depth = /^>+/.exec(entry.text)?.[0].length ?? 1
      const text = entry.text.replace(/^>+/, '').trim()
      lines.push(`${'  '.repeat(depth + 1)}${safe(text)}`)
    }
    return { mermaid: lines.join('\n'), diagnostics }
  },

  gitgraph: (input) => {
    const diagnostics: Diagnostic[] = [...input.body.diagnostics]
    const commits = requireBlock(input.body, 'commits', input.at)
    diagnostics.push(...commits.diagnostics)
    if (diagnostics.some((d) => d.severity === 'error')) return { diagnostics }

    // 每行一条操作：`commit 名字` / `branch 名字` / `checkout 名字` / `merge 名字`
    const lines = ['gitGraph']
    for (const entry of commits.entries) {
      const [verb, ...rest] = entry.text.split(/\s+/)
      const arg = rest.join(' ').trim()
      if (verb === 'commit') lines.push(`  commit id: "${safe(arg)}"`)
      else if (verb === 'branch' || verb === 'checkout' || verb === 'merge')
        lines.push(`  ${verb} ${arg}`)
      else
        diagnostics.push(
          diagnostic('DIAG-306', 'error', `不认识的操作 ${verb ?? ''}`, {
            start: { line: entry.line, column: 1 },
            hint: '能用的是：commit 名字 / branch 名字 / checkout 名字 / merge 名字',
          }),
        )
    }
    if (diagnostics.some((d) => d.severity === 'error')) return { diagnostics }
    return { mermaid: lines.join('\n'), diagnostics }
  },

  block: (input) => {
    const diagnostics: Diagnostic[] = [...input.body.diagnostics]
    const blocks = requireBlock(input.body, 'blocks', input.at)
    diagnostics.push(...blocks.diagnostics)
    if (diagnostics.some((d) => d.severity === 'error')) return { diagnostics }

    const columns = Number(input.attrs['columns'] ?? 3)
    // 每个格子要有自己的 id：block-beta 不接受没有 id 的 `["文字"]`
    let cellIndex = 0
    const rows = blocks.entries.map((entry) =>
      entry.text
        .split('|')
        .map((cell) => {
          const text = cell.trim()
          if (text === '' || text === '-') return 'space'
          cellIndex += 1
          return `b${cellIndex}["${safe(text)}"]`
        })
        .join(' '),
    )
    return {
      mermaid: ['block-beta', `  columns ${Number.isNaN(columns) ? 3 : columns}`, ...rows.map((r) => `  ${r}`)].join('\n'),
      diagnostics,
    }
  },

  architecture: (input) => {
    const diagnostics: Diagnostic[] = [...input.body.diagnostics]
    const services = requireBlock(input.body, 'services', input.at)
    const links = requireBlock(input.body, 'links', input.at)
    diagnostics.push(...services.diagnostics, ...links.diagnostics)
    if (diagnostics.some((d) => d.severity === 'error')) return { diagnostics }

    // 服务行：`id = 图标 "文字"`，图标名直接透给 Mermaid
    const declarations = services.entries.map(parseDeclaration)
    const relations: Relation[] = []
    for (const entry of links.entries) {
      const parsed = parseRelation(entry, ['--', '->'])
      if (!parsed) {
        diagnostics.push(
          diagnostic('DIAG-306', 'error', '这一行不是一条连线', {
            start: { line: entry.line, column: 1 },
            hint: '写成 甲 -- 乙',
          }),
        )
        continue
      }
      relations.push(parsed)
    }
    diagnostics.push(...unknownTargets(relations, new Set(declarations.map((d) => d.id))))
    if (diagnostics.some((d) => d.severity === 'error')) return { diagnostics }

    const lines = [
      'architecture-beta',
      ...declarations.map((d) => `  service ${d.id}(${d.shape ?? 'server'})[${safe(d.text)}]`),
      ...relations.map((r) => `  ${r.from}:R -- L:${r.to}`),
    ]
    return { mermaid: lines.join('\n'), diagnostics }
  },

  c4: (input) => {
    const diagnostics: Diagnostic[] = [...input.body.diagnostics]
    const actors = requireBlock(input.body, 'actors', input.at)
    const relations = requireBlock(input.body, 'relations', input.at)
    diagnostics.push(...actors.diagnostics, ...relations.diagnostics)
    if (diagnostics.some((d) => d.severity === 'error')) return { diagnostics }

    // 角色行：`id = 类型 "文字"`，类型是 person / system / external
    const KIND: Record<string, string> = {
      person: 'Person',
      system: 'System',
      external: 'System_Ext',
    }
    const declarations = actors.entries.map(parseDeclaration)
    for (const d of declarations) {
      if (d.shape !== undefined && !(d.shape in KIND)) {
        diagnostics.push(
          diagnostic('DIAG-307', 'error', `不认识的角色类型 ${d.shape}`, {
            start: { line: d.line, column: 1 },
            hint: `能用的是：${Object.keys(KIND).join(' / ')}`,
          }),
        )
      }
    }
    const parsedRelations: Relation[] = []
    for (const entry of relations.entries) {
      const parsed = parseRelation(entry, ['->'])
      if (!parsed) {
        diagnostics.push(
          diagnostic('DIAG-306', 'error', '这一行不是一条关系', {
            start: { line: entry.line, column: 1 },
            hint: '写成 甲 -> 乙 : 做什么',
          }),
        )
        continue
      }
      parsedRelations.push(parsed)
    }
    diagnostics.push(...unknownTargets(parsedRelations, new Set(declarations.map((d) => d.id))))
    if (diagnostics.some((d) => d.severity === 'error')) return { diagnostics }

    const lines = [
      'C4Context',
      ...declarations.map(
        (d) => `  ${KIND[d.shape ?? 'system']}(${d.id}, "${safe(d.text)}")`,
      ),
      ...parsedRelations.map(
        (r) => `  Rel(${r.from}, ${r.to}, "${safe(r.label ?? '')}")`,
      ),
    ]
    return { mermaid: lines.join('\n'), diagnostics }
  },

  er: (input) =>
    graphLike(input, {
      declBlock: 'entities',
      relBlock: 'relations',
      header: () => 'erDiagram',
      renderNode: () => '',
      renderEdge: (r) =>
        `${r.from} ||--o{ ${r.to} : ${safe(r.label ?? 'relates')}`,
      defaultDir: 'TD',
      checkShapes: false,
    }),
}

/** 吃 Mermaid frontmatter `title:` 的图种。别的图种加上它会解析失败 */
const TITLE_SUPPORTED = new Set<StructuredKind>([
  'flow',
  'dataflow',
  'sequence',
  'state',
  'class',
  'er',
  'pie',
  'gantt',
])

export function translate(kind: StructuredKind, input: TranslateInput): TranslateResult {
  const translator = TRANSLATORS[kind]
  if (!translator) {
    return {
      diagnostics: [
        diagnostic('DIAG-308', 'error', `${kind} 的自有写法还没实现`, {
          start: input.at,
          hint: `这一版先实现了 ${Object.keys(TRANSLATORS).join(' / ')}；其余的先用 \`\`\`mermaid 围栏写`,
        }),
      ],
    }
  }
  const result = translator(input)
  if (result.mermaid === undefined || input.label === undefined) return result
  if (!TITLE_SUPPORTED.has(kind)) return result
  // 指令标题成为图的标题，走 Mermaid 的 frontmatter 写法。
  // 不是每种图都吃这一套——block-beta 加上它会直接解析失败，所以按图种放行
  return { ...result, mermaid: `---\ntitle: ${safe(input.label)}\n---\n${result.mermaid}` }
}

/** 声明块里一条都没有时，调用方拿这个做兜底诊断 */
export function emptyEntries(entries: readonly Entry[]): boolean {
  return entries.length === 0
}

export type { TranslateInput, TranslateResult } from './types.js'
