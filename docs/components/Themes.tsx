/**
 * 文档站上的主题一览表和主题画廊。两者都遍历主题注册表，所以**主题清单只有一份**：
 * 注册表里删掉一套，站上那一行、那张图一起消失；加一套，两页同时多出来一节，
 * 不需要有人记得去改页面（issue 01/02、ADR-0047）。
 *
 * 手写十二个 `![](/themes/x.png)` 的做法反过来：删一套主题，图不再生成而页面照旧引它，
 * 构建照样通过，站上留下一个裂图——正是这两张 ticket 要消灭的失效。
 */

import { normalizeImagePath } from '@rspress/core/runtime'
import { THEMES, BUILTIN_THEMES, type Lang, type ThemeName } from '@nekoleapuki/pamphlet-themes'

const HEADINGS: Record<Lang, [string, string]> = {
  zh: ['主题', '写什么用它'],
  en: ['Theme', 'What it is for'],
}

/**
 * 每套主题在画廊里的那段长说明。它只服务文档站——注册表里那一句是**给挑主题的人和诊断看的**，
 * 塞进注册表会让一个零依赖的数据包背上文档站的文案。
 *
 * 没写到的主题**不会让页面缺一节**：回落到注册表里那一句。所以新增一套主题时，
 * 这里写不写都行，写了更细，不写也照样有名字、有说明、有截图。
 */
const DETAILS: Partial<Record<ThemeName, Record<Lang, string>>> = {
  default: {
    zh: '通用中性。缺省值，所以最不容易出错、最不抢内容。',
    en: 'Neutral. It is the fallback, so it is the hardest to get wrong and the least likely to compete with your content.',
  },
  minimal: {
    zh: '只有黑白灰和一条细线。窄栏、大留白、衬线标题、直角。提示块退成一条左线加一行小标题。',
    en: 'Black, white, grey and one hairline. A narrow column, generous whitespace, serif headings, square corners. Callouts shrink to a rule plus a small label.',
  },
  'tech-dark': {
    zh: '等宽标题、方角、青色强调，`##` 标记显示在标题前。提示块整块底色加顶部色条。',
    en: 'Monospace headings, sharp corners, a cyan accent, the `##` marker shown before the heading. Callouts are filled blocks with a coloured top rule.',
  },
  editorial: {
    zh: '杂志内页。3.2rem 衬线大标题、`01` `02` 章节编号、报头式 Tab、引言居中横线包夹、表格只留上下粗线。',
    en: 'A magazine spread. A 3.2rem serif display, `01` `02` section numbers, masthead-style tabs, pull quotes framed by rules, tables with rules only top and bottom.',
  },
  console: {
    zh: '盯着看的面板。全等宽、带竖线的菜单栏、方括号标签的提示块、分段控件式 Tab、高密度表格。',
    en: 'A panel you keep an eye on. Monospace throughout, a ruled sidebar, bracketed callout labels, segmented-control tabs, dense tables.',
  },
  paper: {
    zh: '论文。衬线正文、`1.` `2.` 编号标题、斜体三级标题、提示块变边注、三线表。',
    en: 'A paper. Serif body, `1.` `2.` numbered sections, italic third-level headings, callouts as margin notes, booktabs-style rules.',
  },
  fiction: {
    zh: '为连续阅读排的版：窄栏、首行缩进两字、段间不留空、首字下沉、场景分隔是居中三点。提示块变成作者旁白。',
    en: 'Set for continuous reading: a narrow column, first-line indents and no gap between paragraphs, a drop cap, and scene breaks as centred dots. Callouts become authorial asides.',
  },
  manual: {
    zh: '代码块是主角：左侧色条、更大的内边距。长表格的表头吸顶、斑马纹，文件夹标签式 Tab。',
    en: 'Code blocks lead: a coloured rule down the left and more padding. Sticky table headers and zebra striping for long tables, folder-tab switching.',
  },
  prd: {
    zh: '每个二级标题是一条带 `R01` 徽章的需求。验收清单是真的复选框，提示块变成约束卡片，Tab 是胶囊分段控件。',
    en: 'Every second-level heading is a numbered requirement with an `R01` badge. Acceptance lists are real checkboxes, callouts become constraint cards, tabs are pill segments.',
  },
  architecture: {
    zh: '图占最宽的画布（94rem）并带边框。引用块渲染成「决策」记录，表格是三线表，标题带 `§` 编号。',
    en: 'Diagrams get the widest canvas (94rem) and a frame. Block quotes render as decision records, tables are booktabs, headings carry a `§` number.',
  },
  blueprint: {
    zh: '密度优先。三级编号 `1` / `1.1` / `1.1.1`、等宽标题、紧凑字段表 —— 给「一条条对着实现」的人看的。',
    en: 'Density first. Three-level numbering `1` / `1.1` / `1.1.1`, monospace headings, tight field tables — for the person implementing it line by line.',
  },
  incident: {
    zh: '步骤变时间轴（竖线 + 红点）。标题带「事故报告」眉批，`danger` 压过页面上其它一切，影响面表格一眼看完。',
    en: 'Steps become a timeline (a rule with red nodes). The title carries an "incident report" eyebrow, `danger` outranks everything else on the page, and the impact table reads at a glance.',
  },
}

export function ThemeTable({ lang }: { lang: Lang }) {
  const [name, purpose] = HEADINGS[lang]
  return (
    <table>
      <thead>
        <tr>
          <th>{name}</th>
          <th>{purpose}</th>
        </tr>
      </thead>
      <tbody>
        {BUILTIN_THEMES.map((theme) => (
          <tr key={theme}>
            <td>
              <a href={`#${theme}`}>
                <code>{theme}</code>
              </a>
            </td>
            <td>{THEMES[theme].purpose[lang]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function ThemeGallery({ lang }: { lang: Lang }) {
  return (
    <>
      {BUILTIN_THEMES.map((theme) => (
        <section key={theme}>
          {/* id 手写在这里：一览表那一列链到 `#主题名`，锚点得对得上 */}
          <h2 id={theme}>{theme}</h2>
          <p>{DETAILS[theme]?.[lang] ?? THEMES[theme].purpose[lang]}</p>
          {/* 图由 `pnpm themes:shots` 从真实编译现截，文件名就是主题名（issue 01）。
              走 normalizeImagePath 补站点 base——Markdown 里的图是 Rspress 自己补的，
              组件里这一步得自己做，否则线上路径少一层 `/pamphlet/` */}
          <img src={normalizeImagePath(`/themes/${theme}.png`)} alt={`${theme} theme`} />
        </section>
      ))}
    </>
  )
}
