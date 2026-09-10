/**
 * mdast → HTML 片段。
 *
 * 不用现成的 mdast-util-to-hast + hast-util-to-html，因为要做的事跟它们不一样：
 * 指令要变成带 data 属性的结构（ADR-0012 的运行时靠 data 属性驱动）、
 * Tab 标题要变成真标题（ADR-0015）、图表节点要内联已经渲染好的 SVG。
 * 逐节点自己写反而更短，也不必跟别人的插件体系较劲。
 */

import type { Code, ListItem, PhrasingContent, Root, RootContent } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import { isCallout } from '../ast.js'
import { labelOf } from '../directives.js'
import type { DiagramData } from '../diagrams/index.js'

export interface RenderContext {
  /** 标题 id 去重用 */
  usedIds: Map<string, number>
  /** 用到了哪些运行时特性 */
  features: Set<string>
  /** 收集出现过的标题，供目录用 */
  headings: { depth: number; text: string; id: string; fromTab: boolean }[]
  /** 图片路径 → data URI；组装器先把资源内嵌好，这里只查表 */
  assets: Map<string, string>
  /** 内嵌失败的图片 → 原因。这些不能把原路径写进产物（否则产物里留了外链） */
  assetFailures: Map<string, string>
}

export function createContext(): RenderContext {
  return {
    usedIds: new Map(),
    features: new Set(),
    headings: [],
    assets: new Map(),
    assetFailures: new Map(),
  }
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 只转义属性值里必须转的那些 */
export function escapeAttribute(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/** 标题文本 → 锚点 id：中文保留、空格转连字符、重名追加 -2 */
export function slug(text: string, used: Map<string, number>): string {
  const base =
    text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\p{Letter}\p{Number}\-_]/gu, '') || 'section'
  const seen = used.get(base)
  if (seen === undefined) {
    used.set(base, 1)
    return base
  }
  used.set(base, seen + 1)
  return `${base}-${seen + 1}`
}

export function plainText(nodes: readonly PhrasingContent[] | undefined): string {
  if (!nodes) return ''
  let out = ''
  for (const node of nodes) {
    if ('value' in node && typeof node.value === 'string') out += node.value
    else if ('children' in node) out += plainText(node.children as PhrasingContent[])
  }
  return out
}

export function renderNodes(
  nodes: readonly RootContent[],
  ctx: RenderContext,
  headingOffset = 0,
): string {
  return nodes.map((node) => renderNode(node, ctx, headingOffset)).join('')
}

export function renderRoot(ast: Root, ctx: RenderContext): string {
  return renderNodes(
    ast.children.filter((node) => node.type !== 'yaml'),
    ctx,
  )
}

function renderNode(node: RootContent, ctx: RenderContext, headingOffset: number): string {
  switch (node.type) {
    case 'heading': {
      const text = plainText(node.children)
      const id = slug(text, ctx.usedIds)
      const depth = Math.min(6, node.depth + headingOffset)
      ctx.headings.push({ depth, text, id, fromTab: false })
      return `<h${depth} id="${escapeAttribute(id)}">${renderNodes(node.children, ctx, headingOffset)}</h${depth}>`
    }
    case 'paragraph':
      return `<p>${renderNodes(node.children, ctx, headingOffset)}</p>`
    case 'text':
      return escapeHtml(node.value)
    case 'strong':
      return `<strong>${renderNodes(node.children, ctx, headingOffset)}</strong>`
    case 'emphasis':
      return `<em>${renderNodes(node.children, ctx, headingOffset)}</em>`
    case 'delete':
      return `<del>${renderNodes(node.children, ctx, headingOffset)}</del>`
    case 'inlineCode':
      return `<code>${escapeHtml(node.value)}</code>`
    case 'break':
      return '<br>'
    case 'thematicBreak':
      return '<hr>'
    case 'blockquote':
      return `<blockquote>${renderNodes(node.children, ctx, headingOffset)}</blockquote>`
    case 'link':
      return `<a href="${escapeAttribute(node.url)}"${node.title ? ` title="${escapeAttribute(node.title)}"` : ''}>${renderNodes(node.children, ctx, headingOffset)}</a>`
    case 'image': {
      const alt = escapeAttribute(node.alt ?? '')
      const failure = ctx.assetFailures.get(node.url)
      if (failure !== undefined) {
        // 不把原路径写进产物：留一个外链就等于打破「自包含」
        return `<span class="pf-asset-missing" role="img" aria-label="${alt}">${escapeHtml(node.alt ?? '图片')}（${escapeHtml(failure)}）</span>`
      }
      const src = ctx.assets.get(node.url) ?? node.url
      return `<img src="${escapeAttribute(src)}" alt="${alt}"${node.title ? ` title="${escapeAttribute(node.title)}"` : ''}>`
    }
    case 'list': {
      const tag = node.ordered === true ? 'ol' : 'ul'
      const start = node.ordered === true && node.start != null && node.start !== 1 ? ` start="${node.start}"` : ''
      // 「松散」是**列表**的属性而不是列表项的（CommonMark §5.3）：
      // 只要列表里任意两项之间隔了空行，整个列表的每一项都保留 <p>。
      // 光看 listItem.spread 会把松散列表的项也拆掉，那跟 CommonMark 的输出对不上。
      const loose = node.spread === true || node.children.some((item) => item.spread === true)
      return `<${tag}${start}>${node.children
        .map((item) => renderListItem(item, ctx, headingOffset, loose))
        .join('')}</${tag}>`
    }
    case 'listItem':
      // 列表项只从 list 分支进来（那里才知道整个列表松不松散）；
      // 单独走到这里说明是别处直接塞了一个 listItem，按紧凑处理
      return renderListItem(node, ctx, headingOffset, false)
    case 'code':
      return renderCode(node, ctx)
    case 'table': {
      const [head, ...body] = node.children
      const headHtml = head
        ? `<thead><tr>${head.children.map((cell) => `<th>${renderNodes(cell.children, ctx, headingOffset)}</th>`).join('')}</tr></thead>`
        : ''
      const bodyHtml = body
        .map(
          (row) =>
            `<tr>${row.children.map((cell) => `<td>${renderNodes(cell.children, ctx, headingOffset)}</td>`).join('')}</tr>`,
        )
        .join('')
      return `<table>${headHtml}<tbody>${bodyHtml}</tbody></table>`
    }
    case 'html':
      // 裸 HTML 原样通过（ADR-0021）
      return node.value
    case 'containerDirective':
      return renderDirective(node, ctx, headingOffset)
    case 'leafDirective':
    case 'textDirective':
      // 不合法的用法在解析阶段已经报过诊断，这里当普通文字输出
      return escapeHtml(`:${node.name}`)
    default: {
      const withChildren = node as { children?: RootContent[] }
      return withChildren.children ? renderNodes(withChildren.children, ctx, headingOffset) : ''
    }
  }
}

function renderCode(node: Code, ctx: RenderContext): string {
  const data = (node as Code & { data?: DiagramData }).data
  if (data?.svg) {
    // 图表管线已经渲染并换过色，这里只内联进去
    return `<figure class="pf-diagram">${data.svg}</figure>`
  }
  if (data?.failed) {
    return `<figure class="pf-diagram pf-diagram-failed"><p>这张图没画出来：${escapeHtml(data.failed.reason)}</p><pre><code>${escapeHtml(node.value)}</code></pre></figure>`
  }
  const lang = (node.lang ?? '').trim()
  const cls = lang === '' ? '' : ` class="language-${escapeAttribute(lang)}"`
  return `<pre><code${cls}>${escapeHtml(node.value)}</code></pre>`
}

function renderDirective(
  node: ContainerDirective,
  ctx: RenderContext,
  headingOffset: number,
): string {
  const name = node.name
  const label = labelOf(node)
  const labelText = label ? plainText((label as { children: PhrasingContent[] }).children) : ''
  const body = node.children.filter((child) => child !== label)

  if (name === 'tabs') return renderTabs(node, body, ctx, headingOffset)

  if (name === 'collapse') {
    ctx.features.add('collapse')
    const open = node.attributes && 'open' in node.attributes ? ' open' : ''
    return `<details class="pf-collapse"${open}><summary>${escapeHtml(labelText)}</summary>${renderNodes(body, ctx, headingOffset)}</details>`
  }

  if (name === 'steps') {
    ctx.features.add('steps')
    return `<div class="pf-steps">${renderNodes(body, ctx, headingOffset)}</div>`
  }

  if (name === 'reveal') {
    ctx.features.add('reveal')
    const effect =
      node.attributes && typeof node.attributes.effect === 'string'
        ? node.attributes.effect
        : 'fade-up'
    return `<div class="pf-reveal" data-pf-reveal="${escapeAttribute(effect)}">${renderNodes(body, ctx, headingOffset)}</div>`
  }

  if (isCallout(name)) {
    const title = labelText === '' ? '' : `<p class="pf-callout-title">${escapeHtml(labelText)}</p>`
    return `<aside class="pf-callout pf-callout-${name}">${title}${renderNodes(body, ctx, headingOffset)}</aside>`
  }

  return renderNodes(body, ctx, headingOffset)
}

/**
 * Tab 面板的标题渲染成真实标题元素（ADR-0015）：
 * 层级 = 最近祖先标题 + 1，带锚点 id。有 JavaScript 时运行时把它们变成按钮。
 */
function renderTabs(
  node: ContainerDirective,
  body: readonly RootContent[],
  ctx: RenderContext,
  headingOffset: number,
): string {
  ctx.features.add('tabs')
  const ancestorDepth = ctx.headings.length > 0 ? (ctx.headings[ctx.headings.length - 1]?.depth ?? 1) : 1
  const depth = Math.min(6, ancestorDepth + 1)

  const panels = body.filter(
    (child): child is ContainerDirective =>
      child.type === 'containerDirective' && child.name === 'tab',
  )

  let defaultIndex = panels.findIndex(
    (panel) => panel.attributes != null && 'default' in panel.attributes,
  )
  if (defaultIndex === -1) defaultIndex = 0

  const rendered = panels
    .map((panel, index) => {
      const label = labelOf(panel)
      const title = label ? plainText((label as { children: PhrasingContent[] }).children) : ''
      const id = slug(title, ctx.usedIds)
      ctx.headings.push({ depth, text: title, id, fromTab: true })
      const inner = renderNodes(
        panel.children.filter((child) => child !== label),
        ctx,
        headingOffset,
      )
      return `<section class="pf-tab" data-pf-tab="${escapeAttribute(id)}"${index === defaultIndex ? ' data-pf-default' : ''}><h${depth} class="pf-tab-title" id="${escapeAttribute(id)}">${escapeHtml(title)}</h${depth}><div class="pf-tab-body">${inner}</div></section>`
    })
    .join('')

  return `<div class="pf-tabs" data-pf-tabs>${rendered}</div>`
}

/** 列表项。紧凑列表去掉外层 `<p>`，松散列表保留（CommonMark §5.3） */
function renderListItem(
  node: ListItem,
  ctx: RenderContext,
  headingOffset: number,
  loose: boolean,
): string {
  const checkbox =
    node.checked === null || node.checked === undefined
      ? ''
      : `<input type="checkbox" disabled${node.checked ? ' checked' : ''}> `
  const inner = renderNodes(node.children, ctx, headingOffset)
  const unwrapped =
    !loose && inner.startsWith('<p>') && inner.endsWith('</p>') ? inner.slice(3, -4) : inner
  return `<li>${checkbox}${unwrapped}</li>`
}
