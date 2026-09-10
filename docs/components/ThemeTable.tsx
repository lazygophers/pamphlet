/**
 * 主题一览表。数据直接来自主题注册表，所以文档站上的说明和
 * `DOC-106` 诊断里的说明**是同一份数据**——新增一套主题只写一次 `label`，
 * 两边同时更新，不会出现「代码里说是 A、文档里写着 B」（ADR-0047）。
 *
 * 中英文取的是同一条记录的两个字段：文档站双语，注册表就得双语。
 */

import { THEMES, BUILTIN_THEMES } from '@nekoleapuki/pamphlet-themes'

const HEADINGS = {
  zh: ['主题', '写什么用它'],
  en: ['Theme', 'What it is for'],
} as const

export function ThemeTable({ lang }: { lang: 'zh' | 'en' }) {
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
            <td>{lang === 'zh' ? THEMES[theme]!.label : THEMES[theme]!.labelEn}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
