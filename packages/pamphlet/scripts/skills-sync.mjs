#!/usr/bin/env node
/**
 * `skills/` 下那几份**会跟着代码变**的附件，由这个脚本从源码现生成：
 * 主题清单、token 清单、诊断码表。
 *
 * 为什么不手写：手写的那一份和代码对不上时**没有任何东西会报错**——
 * 新增一套主题、加一个诊断码，说明书照旧是旧的，而读它的模型会照着旧的干活。
 * 文档站上那张主题表走的也是这条路（`docs/components/Themes.tsx`，ADR-0047）。
 *
 * 和截图那条流水线不同，**生成结果必须提交进版本库**：
 * `npx skills add` 是直接从 git 仓库拉文件的，它不跑任何构建。不提交就等于没有。
 * 所以 `skills-sync.test.ts` 盯着这件事——改了源码没重跑，测试就红。
 *
 * 跑它：`pnpm skills:sync`
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { BUILTIN_THEMES, SEMANTIC_TOKENS, THEMES } from '@nekoleapuki/pamphlet-themes'

const repoFile = (relative) => fileURLToPath(new URL(`../../../${relative}`, import.meta.url))

const HEADER = '<!-- 这份文件由 `pnpm skills:sync` 从源码生成，别手改 -->\n'

/** 元素层那 16 个 token 写在一段模板字符串里，按 `--pf-x:var(--pf-y);` 逐条取 */
function elementTokens() {
  const source = readFileSync(repoFile('packages/pamphlet/src/assemble/theme.ts'), 'utf8')
  const layer = source.match(/const ELEMENT_LAYER = `([\s\S]*?)`/)
  if (!layer) throw new Error('theme.ts 里找不到 ELEMENT_LAYER，取 token 的正则要跟着改')
  return [...layer[1].matchAll(/--pf-([\w-]+):var\(--pf-([\w-]+)\);/g)].map((m) => ({
    name: m[1],
    from: m[2],
  }))
}

/** 诊断码写成一个联合类型，每个成员后面跟着一句注释，那句就是它的意思 */
function diagnosticCodes() {
  const source = readFileSync(repoFile('packages/pamphlet/src/diagnostics.ts'), 'utf8')
  const codes = [...source.matchAll(/\|\s*'([A-Z]+-\d+)'\s*\/\/\s*(.+)/g)].map((m) => ({
    code: m[1],
    meaning: m[2].trim(),
  }))
  if (codes.length === 0) throw new Error('diagnostics.ts 里一个码都没取到，正则要跟着改')
  return codes
}

function themesDoc() {
  const rows = BUILTIN_THEMES.map((name) => `| \`${name}\` | ${THEMES[name].purpose.zh} |`)
  return `${HEADER}
# 内置主题清单（${BUILTIN_THEMES.length} 套）

| 名字 | 写什么用它 |
|---|---|
${rows.join('\n')}

挑主题看的是**这份文档是什么**，不是好不好看。名字写错报 \`DOC-106\`，退回 \`default\` 照常产出产物。
`
}

function tokensDoc() {
  const element = elementTokens()
  const semantic = SEMANTIC_TOKENS.map((name) => `| \`--pf-${name}\` |`).join('\n')
  const derived = element.map((t) => `| \`--pf-${t.name}\` | \`--pf-${t.from}\` |`).join('\n')
  return `${HEADER}
# 主题 token 清单

两层：语义层是根，元素层默认从语义层派生。覆盖时优先改语义层——改一个，派生的一片跟着变。

## 语义层（${SEMANTIC_TOKENS.length} 个）

| 变量 |
|---|
${semantic}

## 元素层（${element.length} 个）

只引用语义层，不引用别的元素层。只想动某一处时才改这里。

| 变量 | 默认取自 |
|---|---|
${derived}
`
}

function diagnosticsDoc() {
  const rows = diagnosticCodes().map((d) => `| \`${d.code}\` | ${d.meaning} |`)
  return `${HEADER}
# 诊断码表（${rows.length} 条）

码段：\`DOC-1xx\` 文档与 frontmatter · \`DIR-2xx\` 容器指令 · \`DIAG-3xx\` 图表引擎 · \`EMB-4xx\` 资源内嵌。

**码本身不编码严重程度**——严重程度是独立字段，\`--fail-on-warn\` 能把警告变成失败。

| 码 | 意思 |
|---|---|
${rows.join('\n')}

每条的完整说明和修复办法：<https://lazygophers.github.io/pamphlet/reference/diagnostics.html>，
码就是那一页上的锚点（\`#doc-106\`）。
`
}

/** 路径 → 内容。测试拿它和磁盘上的比对，不重复一遍生成逻辑 */
export function generated() {
  return {
    'skills/pamphlet-theme/themes.md': themesDoc(),
    'skills/pamphlet-theme/tokens.md': tokensDoc(),
    'skills/pamphlet-syntax/diagnostics.md': diagnosticsDoc(),
  }
}

export const generatedPath = repoFile

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [path, content] of Object.entries(generated())) {
    writeFileSync(repoFile(path), content, 'utf8')
    console.log(path)
  }
}
