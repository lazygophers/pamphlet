/**
 * 四种 Mermaid 画不了的图，自己算布局、自己画 SVG。
 *
 * 为什么不翻译成 Mermaid：泳道、网络拓扑、柱状折线、组织架构这四种，
 * Mermaid 要么根本没有、要么画出来是另一回事（`xychart-beta` 的颜色不跟主题走）。
 * 没有可翻译的目标，只能自己出 SVG。
 *
 * 颜色一律用那六个图表变量，和引擎产出的图**同一套**，所以换主题时它们一起变；
 * 这里不走哨兵替换那条路——哨兵是用来抓「引擎输出里的硬编码色」的，
 * 而这些 SVG 是我们自己写的，直接写变量名即可。
 *
 * 文字宽度按字符估算，不量真实字体：中日韩字符算一个字宽，其余算 0.55。
 * 估得准不准只影响框的宽窄，不影响正确性，而换来的是**不需要浏览器**。
 */

import { diagnostic, type Diagnostic } from '../../diagnostics.js'
import { parseDeclaration, parseRelations, requireBlock } from './parse.js'
import type { TranslateInput, TranslateResult } from './types.js'

const FONT = 14
const PAD_X = 12
const PAD_Y = 8
const LINE = 'var(--pf-diagram-line, #d0d7de)'
const FILL = 'var(--pf-diagram-fill, #f6f8fa)'
const TEXT = 'var(--pf-diagram-text, #1f2328)'
const ACCENT = 'var(--pf-diagram-accent, #2d6cdf)'
const MUTED = 'var(--pf-diagram-muted, #656d76)'
const BG = 'var(--pf-diagram-bg, #ffffff)'

const WIDE = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-￯]/

/** 一段文字有多宽（像素）。中日韩字符一个字宽，其余 0.55 */
export function textWidth(text: string, size = FONT): number {
  let units = 0
  for (const ch of text) units += WIDE.test(ch) ? 1 : 0.55
  return Math.ceil(units * size)
}

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * 包一层 `<svg>`。给了指令标题就在顶上留一条 26px 的横带写标题，
 * 图本身整体下移那么多——各渲染器的坐标因此不用改。
 */
function svg(width: number, height: number, body: string, title?: string): string {
  const band = title === undefined ? 0 : 26
  const total = height + band
  const heading =
    title === undefined
      ? ''
      : `<text x="12" y="17" fill="${TEXT}" font-size="15">${escape(title)}</text>`
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${total}" ` +
    `width="${width}" height="${total}" font-family="inherit" font-size="${FONT}">` +
    `<rect width="${width}" height="${total}" fill="${BG}"/>${heading}` +
    `<g transform="translate(0 ${band})">${body}</g></svg>`
  )
}

function box(
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  options: { fill?: string; stroke?: string; radius?: number } = {},
): string {
  const fill = options.fill ?? FILL
  const stroke = options.stroke ?? LINE
  const r = options.radius ?? 4
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>` +
    `<text x="${x + w / 2}" y="${y + h / 2}" fill="${TEXT}" text-anchor="middle" ` +
    `dominant-baseline="central">${escape(label)}</text>`
  )
}

function arrow(x1: number, y1: number, x2: number, y2: number, label?: string): string {
  const head = `<path d="M${x2} ${y2} l-7 -4 l0 8 z" fill="${LINE}"/>`
  const line = `<line x1="${x1}" y1="${y1}" x2="${x2 - 7}" y2="${y2}" stroke="${LINE}" stroke-width="1.5"/>`
  if (label === undefined) return line + head
  const mid = (x1 + x2) / 2
  return (
    line +
    head +
    `<text x="${mid}" y="${y1 - 6}" fill="${MUTED}" font-size="12" text-anchor="middle">${escape(label)}</text>`
  )
}

/** 泳道图：一条道一行，步骤按声明顺序从左往右排 */
export function renderSwimlane(input: TranslateInput): TranslateResult {
  const diagnostics: Diagnostic[] = [...input.body.diagnostics]
  const lanes = requireBlock(input.body, 'lanes', input.at)
  const steps = requireBlock(input.body, 'steps', input.at)
  diagnostics.push(...lanes.diagnostics, ...steps.diagnostics)
  if (diagnostics.some((d) => d.severity === 'error')) return { diagnostics }

  const laneList = lanes.entries.map(parseDeclaration)
  // 步骤行：`道名 : 步骤文字`
  const placed: { lane: number; text: string }[] = []
  for (const entry of steps.entries) {
    const at = entry.text.indexOf(':')
    if (at === -1) {
      diagnostics.push(
        diagnostic('DIAG-306', 'error', '这一行不是一个步骤', {
          start: { line: entry.line, column: 1 },
          hint: '写成 道名 : 这一步做什么',
        }),
      )
      continue
    }
    const laneId = entry.text.slice(0, at).trim()
    const index = laneList.findIndex((l) => l.id === laneId)
    if (index === -1) {
      diagnostics.push(
        diagnostic('DIAG-306', 'error', `没有叫 ${laneId} 的道`, {
          start: { line: entry.line, column: 1 },
          hint: `已经声明的道：${laneList.map((l) => l.id).join(' / ')}`,
        }),
      )
      continue
    }
    placed.push({ lane: index, text: entry.text.slice(at + 1).trim() })
  }
  if (diagnostics.some((d) => d.severity === 'error')) return { diagnostics }

  const laneLabelWidth = Math.max(...laneList.map((l) => textWidth(l.text)), 60) + PAD_X * 2
  const stepWidths = placed.map((p) => textWidth(p.text) + PAD_X * 2)
  const gap = 32
  const boxHeight = FONT + PAD_Y * 2 + 6
  const laneHeight = boxHeight + 24
  const width =
    laneLabelWidth + stepWidths.reduce((sum, w) => sum + w + gap, 0) + gap
  const height = laneList.length * laneHeight + 16

  const parts: string[] = []
  laneList.forEach((lane, index) => {
    const y = 8 + index * laneHeight
    parts.push(
      `<rect x="0" y="${y}" width="${width}" height="${laneHeight}" fill="${index % 2 === 0 ? FILL : BG}" stroke="${LINE}"/>`,
      `<text x="${PAD_X}" y="${y + laneHeight / 2}" fill="${MUTED}" dominant-baseline="central">${escape(lane.text)}</text>`,
    )
  })

  let x = laneLabelWidth + gap / 2
  placed.forEach((step, index) => {
    const w = stepWidths[index] ?? 80
    const y = 8 + step.lane * laneHeight + (laneHeight - boxHeight) / 2
    parts.push(box(x, y, w, boxHeight, step.text, { fill: BG }))
    const previous = placed[index - 1]
    if (previous !== undefined) {
      const prevY = 8 + previous.lane * laneHeight + laneHeight / 2
      parts.push(arrow(x - gap, prevY, x, y + boxHeight / 2))
    }
    x += w + gap
  })

  return { svg: svg(width, height, parts.join(''), input.label), diagnostics }
}

/** 网络拓扑图：网段一个框，主机排在框里，链路连主机 */
export function renderTopology(input: TranslateInput): TranslateResult {
  const diagnostics: Diagnostic[] = [...input.body.diagnostics]
  const zones = requireBlock(input.body, 'zones', input.at)
  const hosts = requireBlock(input.body, 'hosts', input.at)
  const links = input.body.blocks.get('links') ?? []
  diagnostics.push(...zones.diagnostics, ...hosts.diagnostics)
  if (diagnostics.some((d) => d.severity === 'error')) return { diagnostics }

  const zoneList = zones.entries.map(parseDeclaration)
  // 主机行：`id = 网段 "文字"`，形状位置放网段名
  const hostList = hosts.entries.map(parseDeclaration)
  for (const host of hostList) {
    if (host.shape !== undefined && !zoneList.some((z) => z.id === host.shape)) {
      diagnostics.push(
        diagnostic('DIAG-306', 'error', `没有叫 ${host.shape} 的网段`, {
          start: { line: host.line, column: 1 },
          hint: `已经声明的网段：${zoneList.map((z) => z.id).join(' / ')}`,
        }),
      )
    }
  }
  const { relations, diagnostics: linkDiagnostics } = parseRelations(
    links,
    ['--', '->'],
    '这一行不是一条链路',
    '写成 甲 -- 乙，要标端口就再加 : 标签',
  )
  diagnostics.push(...linkDiagnostics)
  if (diagnostics.some((d) => d.severity === 'error')) return { diagnostics }

  const boxHeight = FONT + PAD_Y * 2 + 4
  const gapY = 20
  const zonePadding = 16
  const positions = new Map<string, { x: number; y: number; w: number }>()
  const parts: string[] = []
  let y = 12
  let maxWidth = 0

  for (const zone of zoneList) {
    const members = hostList.filter((h) => h.shape === zone.id)
    const widths = members.map((m) => textWidth(m.text) + PAD_X * 2)
    const inner = widths.reduce((sum, w) => sum + w + 16, 0) + 16
    const zoneWidth = Math.max(inner, textWidth(zone.text) + PAD_X * 2 + 32)
    const zoneHeight = boxHeight + zonePadding * 2 + 14
    parts.push(
      `<rect x="12" y="${y}" width="${zoneWidth}" height="${zoneHeight}" rx="6" fill="none" stroke="${LINE}" stroke-dasharray="5 4"/>`,
      `<text x="${20}" y="${y + 14}" fill="${MUTED}" font-size="12">${escape(zone.text)}</text>`,
    )
    let x = 28
    members.forEach((member, index) => {
      const w = widths[index] ?? 80
      const boxY = y + 22 + zonePadding / 2
      parts.push(box(x, boxY, w, boxHeight, member.text))
      positions.set(member.id, { x, y: boxY + boxHeight / 2, w })
      x += w + 16
    })
    maxWidth = Math.max(maxWidth, zoneWidth + 24)
    y += zoneHeight + gapY
  }

  for (const relation of relations) {
    const from = positions.get(relation.from)
    const to = positions.get(relation.to)
    if (!from || !to) continue
    parts.push(
      `<line x1="${from.x + from.w / 2}" y1="${from.y}" x2="${to.x + to.w / 2}" y2="${to.y}" stroke="${ACCENT}" stroke-width="1.5"/>`,
    )
    if (relation.label !== undefined) {
      parts.push(
        `<text x="${(from.x + to.x) / 2 + 8}" y="${(from.y + to.y) / 2}" fill="${MUTED}" font-size="12">${escape(relation.label)}</text>`,
      )
    }
  }

  return { svg: svg(Math.max(maxWidth, 240), y, parts.join(''), input.label), diagnostics }
}

/** 数据图表：柱状或折线 */
export function renderChart(input: TranslateInput): TranslateResult {
  const diagnostics: Diagnostic[] = [...input.body.diagnostics]
  const points = requireBlock(input.body, 'points', input.at)
  diagnostics.push(...points.diagnostics)

  const rows: { label: string; value: number }[] = []
  for (const entry of points.entries) {
    const at = entry.text.lastIndexOf(':')
    const value = at === -1 ? NaN : Number(entry.text.slice(at + 1).trim())
    if (at === -1 || Number.isNaN(value)) {
      diagnostics.push(
        diagnostic('DIAG-306', 'error', '这一行不是一个数据点', {
          start: { line: entry.line, column: 1 },
          hint: '写成 名字 : 数值，例如 三月 : 120',
        }),
      )
      continue
    }
    rows.push({ label: entry.text.slice(0, at).trim(), value })
  }
  if (diagnostics.some((d) => d.severity === 'error')) return { diagnostics }

  const type = typeof input.attrs['type'] === 'string' ? input.attrs['type'] : 'bar'
  if (type !== 'bar' && type !== 'line') {
    return {
      diagnostics: [
        ...diagnostics,
        diagnostic('DIAG-307', 'error', `不认识的图表类型 ${type}`, {
          start: input.at,
          hint: '能用的是：bar / line',
        }),
      ],
    }
  }

  const plotHeight = 180
  const barWidth = 44
  const gap = 24
  const left = 48
  const top = 24 // 柱顶那行数值要有地方写，否则和纵轴最大值叠在一起
  const width = left + rows.length * (barWidth + gap) + 16
  const height = plotHeight + top + 44
  const max = Math.max(...rows.map((r) => r.value), 1)
  const baseline = plotHeight + top
  const parts: string[] = [
    `<line x1="${left}" y1="${top}" x2="${left}" y2="${baseline}" stroke="${LINE}"/>`,
    `<line x1="${left}" y1="${baseline}" x2="${width - 8}" y2="${baseline}" stroke="${LINE}"/>`,
    `<text x="8" y="${top + 4}" fill="${MUTED}" font-size="12">${max}</text>`,
  ]

  const centers = rows.map((row, index) => {
    const x = left + gap / 2 + index * (barWidth + gap)
    const h = Math.round((row.value / max) * plotHeight)
    const y = baseline - h
    if (type === 'bar') {
      parts.push(
        `<rect x="${x}" y="${y}" width="${barWidth}" height="${h}" rx="3" fill="${ACCENT}"/>`,
      )
    }
    parts.push(
      `<text x="${x + barWidth / 2}" y="${baseline + 18}" fill="${MUTED}" font-size="12" text-anchor="middle">${escape(row.label)}</text>`,
      `<text x="${x + barWidth / 2}" y="${y - 6}" fill="${TEXT}" font-size="12" text-anchor="middle">${row.value}</text>`,
    )
    return { x: x + barWidth / 2, y }
  })

  if (type === 'line') {
    const d = centers.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')
    parts.push(`<path d="${d}" fill="none" stroke="${ACCENT}" stroke-width="2"/>`)
    for (const point of centers) {
      parts.push(`<circle cx="${point.x}" cy="${point.y}" r="4" fill="${ACCENT}"/>`)
    }
  }

  return { svg: svg(width, height, parts.join(''), input.label), diagnostics }
}

/** 组织架构图：自上而下的树，按子树宽度分配横向空间 */
export function renderOrgchart(input: TranslateInput): TranslateResult {
  const diagnostics: Diagnostic[] = [...input.body.diagnostics]
  const members = requireBlock(input.body, 'members', input.at)
  diagnostics.push(...members.diagnostics)
  if (diagnostics.some((d) => d.severity === 'error')) return { diagnostics }

  // 成员行靠 `>` 的个数表示层级，和思维导图一致
  interface Node {
    text: string
    depth: number
    children: Node[]
    width: number
    x: number
  }
  const root: Node = { text: '', depth: -1, children: [], width: 0, x: 0 }
  const stack: Node[] = [root]
  for (const entry of members.entries) {
    const depth = /^>*/.exec(entry.text)?.[0].length ?? 0
    const text = entry.text.replace(/^>*/, '').trim()
    const node: Node = { text, depth, children: [], width: 0, x: 0 }
    while (stack.length > depth + 1) stack.pop()
    const parent = stack[stack.length - 1]
    if (!parent) continue
    parent.children.push(node)
    stack.push(node)
  }

  const boxHeight = FONT + PAD_Y * 2 + 4
  const levelGap = 48
  const siblingGap = 20

  const measure = (node: Node): number => {
    const own = textWidth(node.text) + PAD_X * 2
    if (node.children.length === 0) {
      node.width = own
      return own
    }
    const childrenWidth =
      node.children.reduce((sum, child) => sum + measure(child), 0) +
      siblingGap * (node.children.length - 1)
    node.width = Math.max(own, childrenWidth)
    return node.width
  }
  for (const child of root.children) measure(child)

  const totalWidth =
    root.children.reduce((sum, child) => sum + child.width, 0) +
    siblingGap * Math.max(root.children.length - 1, 0)

  const parts: string[] = []
  const place = (node: Node, left: number, depth: number): void => {
    const own = textWidth(node.text) + PAD_X * 2
    const centre = left + node.width / 2
    const x = centre - own / 2
    const y = 12 + depth * (boxHeight + levelGap)
    parts.push(box(x, y, own, boxHeight, node.text, { fill: depth === 0 ? FILL : BG }))
    node.x = centre

    let childLeft = left + (node.width - childrenSpan(node)) / 2
    for (const child of node.children) {
      const childCentre = childLeft + child.width / 2
      parts.push(
        `<path d="M${centre} ${y + boxHeight} V${y + boxHeight + levelGap / 2} H${childCentre} V${y + boxHeight + levelGap}" fill="none" stroke="${LINE}"/>`,
      )
      place(child, childLeft, depth + 1)
      childLeft += child.width + siblingGap
    }
  }
  const childrenSpan = (node: Node): number =>
    node.children.reduce((sum, child) => sum + child.width, 0) +
    siblingGap * Math.max(node.children.length - 1, 0)

  let left = 12
  let maxDepth = 0
  const depthOf = (node: Node, depth: number): void => {
    maxDepth = Math.max(maxDepth, depth)
    for (const child of node.children) depthOf(child, depth + 1)
  }
  for (const child of root.children) {
    depthOf(child, 0)
    place(child, left, 0)
    left += child.width + siblingGap
  }

  const height = 24 + (maxDepth + 1) * boxHeight + maxDepth * levelGap
  return { svg: svg(totalWidth + 24, height, parts.join(''), input.label), diagnostics }
}
