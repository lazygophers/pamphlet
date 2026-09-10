/**
 * 指令校验。语法规则只有一条（ADR-0038）：
 *   `[label]` 是给读者看的标题，`{attrs}` 是给编译器看的参数。
 */

import type { ContainerDirective, LeafDirective, TextDirective } from 'mdast-util-directive'
import {
  DEFAULT_REVEAL_EFFECT,
  DIRECTIVE_ATTRIBUTES,
  isCallout,
  isKnownDirective,
  KNOWN_DIRECTIVES,
  LABEL_REQUIRED,
  REVEAL_EFFECTS,
  type KnownDirective,
} from './ast.js'
import { diagnostic, type Diagnostic, type Point } from './diagnostics.js'

export type AnyDirective = ContainerDirective | LeafDirective | TextDirective

export function isDirective(node: { type: string }): node is AnyDirective {
  return (
    node.type === 'containerDirective' ||
    node.type === 'leafDirective' ||
    node.type === 'textDirective'
  )
}

function pointOf(node: AnyDirective): Point {
  return { line: node.position?.start.line ?? 1, column: node.position?.start.column ?? 1 }
}

export function validateDirective(node: AnyDirective, ancestors: AnyDirective[]): Diagnostic[] {
  const name = node.name
  const start = pointOf(node)

  if (!isKnownDirective(name)) {
    const suggestion = nearestDirectiveName(name)
    return [
      diagnostic('DIR-201', 'warning', `未知指令 ${name}，内容已按普通段落输出`, {
        start,
        ...(suggestion ? { hint: suggestion } : {}),
      }),
    ]
  }

  // 全部指令都是容器指令：三个冒号包起来
  if (node.type !== 'containerDirective') {
    return [
      diagnostic('DIR-202', 'error', `${name} 必须写成容器指令（冒号成对包住内容）`, {
        start,
        hint: `写法：${':'.repeat(3)}${name}${LABEL_REQUIRED.includes(name as 'tab' | 'collapse') ? '[标题]' : ''} … ${':'.repeat(3)}`,
      }),
    ]
  }

  const diagnostics: Diagnostic[] = [
    ...validateAttributes(node, name, start),
    ...validateLabel(node, name, start),
    ...validatePlacement(node, name, ancestors, start),
  ]

  if (name === 'tabs') diagnostics.push(...validateTabsChildren(node, start))
  if (name === 'steps') diagnostics.push(...validateStepsChildren(node, start))
  if (name === 'reveal') diagnostics.push(...validateRevealEffect(node, start))

  return diagnostics
}

function attributesOf(node: ContainerDirective): Record<string, string | null | undefined> {
  return (node.attributes ?? {}) as Record<string, string | null | undefined>
}

function validateAttributes(
  node: ContainerDirective,
  name: KnownDirective,
  start: Point,
): Diagnostic[] {
  const allowed = DIRECTIVE_ATTRIBUTES[name]
  const diagnostics: Diagnostic[] = []
  for (const key of Object.keys(attributesOf(node))) {
    // class 与 id 是 directive 语法原生的，任何指令都能带
    if (key === 'class' || key === 'id') continue
    if (!allowed.includes(key)) {
      diagnostics.push(
        diagnostic('DIR-207', 'warning', `${name} 不认识属性 ${key}，已忽略`, {
          start,
          hint: allowed.length > 0 ? `${name} 认识的属性：${allowed.join(' / ')}` : `${name} 不接受任何属性`,
        }),
      )
    }
  }
  return diagnostics
}

/** directive 扩展把 `[label]` 解析成带 `directiveLabel` 标记的第一个子节点 */
export function labelOf(node: ContainerDirective): ContainerDirective['children'][number] | undefined {
  const first = node.children[0]
  if (!first || first.type !== 'paragraph') return undefined
  const data = first.data as { directiveLabel?: boolean } | undefined
  if (data?.directiveLabel !== true) return undefined
  return first.children.length > 0 ? first : undefined
}

function validateLabel(
  node: ContainerDirective,
  name: KnownDirective,
  start: Point,
): Diagnostic[] {
  if (!LABEL_REQUIRED.includes(name as 'tab' | 'collapse')) return []
  if (labelOf(node)) return []
  const why =
    name === 'tab'
      ? 'Tab 的标题就是那个可以点的按钮'
      : '折叠块没有标题，无 JavaScript 时降级成 <details> 也没有可点的部分'
  return [
    diagnostic('DIR-204', 'error', `${name} 缺少标题`, {
      start,
      hint: `标题写在方括号里：:::${name}[标题]。${why}`,
    }),
  ]
}

function validatePlacement(
  node: ContainerDirective,
  name: KnownDirective,
  ancestors: AnyDirective[],
  start: Point,
): Diagnostic[] {
  if (name !== 'tab') return []
  const parent = ancestors[ancestors.length - 1]
  if (parent?.name === 'tabs') return []
  return [
    diagnostic('DIR-202', 'error', 'tab 只能直接放在 tabs 里面', {
      start,
      hint: '外层的冒号要比内层多一个：::::tabs 里面套 :::tab[标题]',
    }),
  ]
}

function validateTabsChildren(node: ContainerDirective, start: Point): Diagnostic[] {
  const tabs = node.children.filter(
    (child): child is ContainerDirective =>
      child.type === 'containerDirective' && child.name === 'tab',
  )
  if (tabs.length === 0) {
    return [
      diagnostic('DIR-204', 'error', 'tabs 里面没有任何 tab', {
        start,
        hint: '至少放一个 :::tab[标题] … :::；注意外层的冒号要比内层多一个',
      }),
    ]
  }

  // 同一组里只能有一个 {default}，多了就报错而不是静默取第一个
  const marked = tabs.filter((tab) => 'default' in attributesOf(tab))
  if (marked.length <= 1) return []
  return marked.slice(1).map((tab) =>
    diagnostic('DIR-205', 'error', '同一组 tabs 里有多个 {default}', {
      start: pointOf(tab),
      hint: '只能有一个 tab 标 {default}；都不标时选中第一个',
    }),
  )
}

function validateStepsChildren(node: ContainerDirective, start: Point): Diagnostic[] {
  const hasOrderedList = node.children.some(
    (child) => child.type === 'list' && child.ordered === true,
  )
  if (hasOrderedList) return []
  return [
    diagnostic('DIR-204', 'error', 'steps 里需要一个有序列表', {
      start,
      hint: '写成 1. 2. 3.——编号由浏览器算，Pamphlet 只负责把它做成圆圈样式',
    }),
  ]
}

function validateRevealEffect(node: ContainerDirective, start: Point): Diagnostic[] {
  const effect = attributesOf(node).effect
  if (effect === undefined || effect === null) return []
  if ((REVEAL_EFFECTS as readonly string[]).includes(effect)) return []
  return [
    diagnostic('DIR-206', 'error', `reveal 不认识效果 ${effect}`, {
      start,
      hint: `可用的效果：${REVEAL_EFFECTS.join(' / ')}；缺省是 ${DEFAULT_REVEAL_EFFECT}`,
    }),
  ]
}

const CALLOUT_HINT = '四种提示块是 info / tip / warn / danger'

/**
 * 别人很可能打出来、但不是 Pamphlet 指令名的词。
 * `note` / `warning` / `caution` / `important` 来自 Docusaurus 与 GitHub 的写法，
 * `callout` 来自本项目早期的设计稿。撞上这些词时给一条指路的提示，而不是干瘪的「未知指令」。
 */
const NEAR_MISSES: Record<string, string> = {
  callout: CALLOUT_HINT,
  note: `note 在 Pamphlet 里叫 info。${CALLOUT_HINT}`,
  warning: `warning 在 Pamphlet 里叫 warn。${CALLOUT_HINT}`,
  caution: `caution 在 Pamphlet 里叫 warn。${CALLOUT_HINT}`,
  important: `important 在 Pamphlet 里叫 danger。${CALLOUT_HINT}`,
  details: 'details 在 Pamphlet 里叫 collapse，写法：:::collapse[标题]',
  accordion: 'accordion 在 Pamphlet 里叫 collapse，写法：:::collapse[标题]',
  tabset: 'tabset 在 Pamphlet 里叫 tabs，写法：::::tabs 里面套 :::tab[标题]',
}

function nearestDirectiveName(name: string): string | undefined {
  const lower = name.toLowerCase()

  const direct = NEAR_MISSES[lower]
  if (direct) return direct

  const candidates = [...KNOWN_DIRECTIVES, ...Object.keys(NEAR_MISSES)]
  let best: string | undefined
  let bestDistance = Number.POSITIVE_INFINITY
  for (const candidate of candidates) {
    const distance = editDistance(lower, candidate)
    if (distance < bestDistance) {
      bestDistance = distance
      best = candidate
    }
  }
  if (best === undefined || bestDistance > 2) return undefined

  const alias = NEAR_MISSES[best]
  if (alias) return `是不是想写 ${best}？${alias}`
  const extra = isCallout(best) ? `（${CALLOUT_HINT}）` : ''
  return `是不是想写 ${best}？${extra}`
}

function editDistance(a: string, b: string): number {
  const cols = b.length + 1
  let previous = Array.from({ length: cols }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i, ...Array.from({ length: cols - 1 }, () => 0)]
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(
        (current[j - 1] ?? 0) + 1,
        (previous[j] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost,
      )
    }
    previous = current
  }
  return previous[cols - 1] ?? 0
}
