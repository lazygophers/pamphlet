/**
 * 目录（ADR-0022）。纯静态：一段嵌套列表加锚点链接，零 JavaScript。
 *
 * `skipTabs` 缺省 true——Tab 面板在语义上是同一话题的几种视角，
 * 出现在目录里会让读者以为它们是不同章节。而 ADR-0015 为了无障碍与深链
 * 把 Tab 标题做成了真标题，注定会进文档大纲，所以目录这一侧必须有这个开关。
 */

import type { TocConfig } from '../ast.js'
import { escapeAttribute, escapeHtml, type RenderContext } from './html.js'

export interface TocPlan {
  enabled: boolean
  html: string
}

export function renderToc(ctx: RenderContext, config: TocConfig | undefined): TocPlan {
  if (config?.enable !== true) return { enabled: false, html: '' }

  const maxDepth = config.deep ?? 2
  const skipTabs = config.skipTabs ?? true

  const entries = ctx.headings.filter(
    (heading) => heading.depth <= maxDepth && heading.depth > 1 && !(skipTabs && heading.fromTab),
  )
  if (entries.length === 0) return { enabled: false, html: '' }

  const minDepth = Math.min(...entries.map((entry) => entry.depth))
  let html = ''
  let current = minDepth
  html += '<ol>'
  for (const entry of entries) {
    while (current < entry.depth) {
      html += '<ol>'
      current += 1
    }
    while (current > entry.depth) {
      html += '</ol>'
      current -= 1
    }
    html += `<li><a href="#${escapeAttribute(entry.id)}">${escapeHtml(entry.text)}</a></li>`
  }
  while (current > minDepth) {
    html += '</ol>'
    current -= 1
  }
  html += '</ol>'

  return { enabled: true, html: `<nav class="pf-toc" aria-label="目录">${html}</nav>` }
}
