# Comparisons

Only the two that are genuinely close: **Pandoc** and **the HTML export in Typora / Obsidian**.

Not VitePress, mdBook or Docusaurus — those produce **a website** (hundreds of files needing a server or GitHub Pages), Pamphlet produces **one file** (double-click). They are not the same kind of thing, so comparing them says nothing.

:::info This page will go out of date
When someone else ships a release, we may be wrong. Every claim below carries a check date and a source so you can verify it yourself.
:::

## Pandoc

**The closest competitor.** Pandoc can also turn Markdown into a self-contained HTML file:

```bash
pandoc plan.md --embed-resources --standalone -o plan.html
```

Source <https://pandoc.org/MANUAL.html#option--embed-resources> (checked 2026-09).

| | Pandoc | Pamphlet |
|---|---|---|
| Self-contained single file | ✅ `--embed-resources` | ✅ default, and **cannot be turned off** |
| Remote images | Downloaded and embedded | **Hard error** `EMB-403` |
| Tabs / collapsibles | ❌ no native syntax | ✅ nine container directives |
| Pre-rendered diagrams | ❌ needs your own filter | ✅ Mermaid drawn to SVG at compile time |
| No-JavaScript fallback | N/A (nothing interactive to begin with) | ✅ an explicit promise |
| Markdown dialect | **Pandoc Markdown** (its own dialect) | **strict CommonMark superset** |
| Output formats | Dozens (PDF, docx, LaTeX…) | HTML only |
| Install | One binary, about 150MB | An npm package, about 86 dependencies |

**Choose Pandoc** when you need PDF, Word or LaTeX; or when a static document with no interactivity is all you want. Nothing beats it at format conversion.

**Choose Pamphlet** when you want clickable tabs and collapsibles, diagrams drawn for you, and source files that still read properly on GitHub.

The deepest difference is the **dialect**: Pandoc Markdown has its own extensions, so a source file may not display correctly on GitHub. Pamphlet's whole promise rests on CommonMark.

## Typora / Obsidian HTML export

**What a non-programmer is most likely to compare against.** Both are WYSIWYG Markdown editors with an "export / save as HTML".

Sources <https://typora.io/>, <https://help.obsidian.md/export> (checked 2026-09).

| | Typora / Obsidian export | Pamphlet |
|---|---|---|
| How you use it | A few clicks in a GUI | Command line |
| Batches | ❌ one at a time | ✅ `pamphlet build "docs/**/*.md"` |
| Fits in CI | ❌ | ✅ judged on the exit code |
| Self-contained | Typora has a switch; Obsidian depends on a plugin | ✅ default and enforced |
| Tabs / collapsibles | ❌ (Obsidian callouts only work inside Obsidian) | ✅ |
| Diagrams | Mermaid usually inlined as SVG | ✅ and it follows the theme |
| Syntax checking | ❌ | ✅ `pamphlet lint` plus 20 diagnostic codes |
| Recovering the source | ❌ | ✅ `pamphlet extract` |

**Choose the editor export** when you already write in it and export one file occasionally, with nothing to repeat.

**Choose Pamphlet** when this happens many times, has to run in a pipeline, and has to come out the same every time.

## In one line

| Your situation | Use |
|---|---|
| You need PDF / Word | Pandoc |
| You export one file by hand occasionally | Whichever editor you already use |
| You want interactivity, batches, CI, and identical results every time | Pamphlet |
| You want a continuously updated multi-page site | VitePress / Rspress / mdBook |
