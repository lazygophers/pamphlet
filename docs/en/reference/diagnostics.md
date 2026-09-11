# Diagnostics reference

Every diagnostic carries a position, a reason and a fix hint, and the link underneath points at the matching anchor on this page.

:::info The compiler's own messages are Chinese-only
There is no message localisation yet. The code (`DIR-204`), the position and the documentation link are language-independent; the prose is not. This page explains every code in English.
:::

```
error[DIR-204] tab 缺少指令标题
  --> plan.md:3:1
  |
3 | :::tab
  | ^
  |
  = 指令标题写在方括号里：:::tab[指令标题]。Tab 的指令标题就是那个可以点的按钮
  https://lazygophers.github.io/pamphlet/reference/diagnostics.html#dir-204
```

## Reading a code

Four segments, and **the code does not encode severity**:

| Segment | Covers |
|---|---|
| `DOC-1xx` | The document and its frontmatter |
| `DIR-2xx` | Container directives |
| `DIAG-3xx` | Diagram engines |
| `EMB-4xx` | Asset embedding |

Severity is a **separate field** (`error` / `warning`), because `--fail-on-warn` can turn warnings into failures — a hard-coded `E` / `W` prefix in the code would contradict that switch.

---

## DOC-1xx document and frontmatter

### DOC-101

**`spec` is higher than the compiler supports.** Severity `error`.

This document asks for a newer syntax version than the Pamphlet you have. Upgrade the compiler, or lower `spec`.

This compiler supports version `1`.

### DOC-102

**Unknown field in frontmatter; ignored.** Severity `warning`.

The known fields are only `spec` / `title` / `theme` / `lang` / `toc` / `engines`, and inside `toc` only `enable` / `deep` / `skipTabs` / `position`. See the [frontmatter reference](/en/reference/frontmatter).

Not ignoring it silently is deliberate — silence would let you believe the setting took effect.

### DOC-103

**Frontmatter is not valid YAML, or a field has the wrong type.** Severity `error`.

Common cases:

| Message | Meaning |
|---|---|
| `frontmatter 不是合法的 YAML：…` | The YAML itself does not parse |
| `frontmatter 必须是一组 键: 值` | Written as a list or a scalar |
| `spec 必须是整数` | Written as a string or a decimal |
| `toc.deep 必须是 1 到 6 之间的整数` | Out of range |
| `toc.position 只能是 top 或 side` | Misspelled |

The diagnostic points at **the line of the offending field**, not vaguely at the start of the frontmatter.

### DOC-104

**The value is valid but this version does not implement it.** Severity `warning`.

One case today: `engines` (custom engines) — the declaration has no effect for now; the built-in engines keep working.

(`toc.position: side` used to report this too. Once the side menu was implemented it became the default, and it no longer reports anything.)

### DOC-105

**Footnotes are used, and this version does not support them.** Severity `error`.

GFM footnotes (`[^1]` plus `[^1]: note`) do parse, but the assembler has no handling for them — the reference would render as an empty string and the definition body would be spliced into the flow.

**An error rather than silent dropping**: dropping silently means the note you wrote vanishes from the output and you never find out.

Alternatives are in [Callouts](/en/write/components/callout).

The reference and the definition **each report once**, and an orphan definition (with no reference) reports too.

### DOC-106

**The named theme does not exist.** Severity `error`.

`--theme` or the frontmatter `theme:` names something unknown. The hint lists every built-in theme, one per line, **each name followed by the kind of document it suits**, so you can pick without opening the docs. That description is **in Chinese**: every compiler diagnostic is Chinese-only, and printing this one line in English would give you a half-English hint ([ADR-0047](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0047-theme-purpose-is-bilingual-data.md)). The English wording of each is in [Built-in themes](/en/reference/themes).

**It errors without stopping the compile**: it falls back to `default` and still writes the output — a wrong theme only affects how it looks; the content is fine.

An error rather than a warning, because silently substituting a theme would let you believe the one you wrote took effect.

See [Built-in themes](/en/reference/themes).

---

## DIR-2xx container directives

### DIR-201

**Unknown directive; content emitted as ordinary paragraphs.** Severity `warning`.

A warning rather than an error because **an unknown directive still emits its content verbatim** — nothing is lost.

The diagnostic tries to point the way, recognising other tools' spellings:

| You wrote | The hint |
|---|---|
| `note` | called `info` in Pamphlet |
| `warning` / `caution` | called `warn` in Pamphlet |
| `important` | called `danger` in Pamphlet |
| `details` / `accordion` | called `collapse` in Pamphlet |
| `tabset` | called `tabs` in Pamphlet |
| `callout` | the four callouts are `info` / `tip` / `warn` / `danger` |

Misspellings within edit distance 2 also get a "did you mean X?".

### DIR-202

**A directive is in the wrong place or the wrong form.** Severity `error`.

Two cases:

- **Written as a non-container directive.** All nine are container directives and must wrap their content in a matching pair of colon fences
- **A `tab` not directly inside a `tabs`.** The hint tells you the outer fence needs one more colon than the inner one (`::::tabs` around `:::tab[指令标题]`)

### DIR-203

**Unclosed directive.** Severity `error`.

A closing fence **prefers a matching colon count**; any inner fence it skipped over is recorded as unclosed. That way the error points at the one actually left open rather than at the outermost.

### DIR-204

**A directive is missing something required.** Severity `error`.

| Message | Fix |
|---|---|
| `tab 缺少指令标题` | The label is the clickable button; write `:::tab[label]` |
| `collapse 缺少指令标题` | Without JavaScript it degrades to `<details>`; with no label there is nothing to click |
| `tabs 里面没有任何 tab` | Put at least one `:::tab[指令标题]` in it, with more colons on the outside |
| `steps 里需要一个有序列表` | Write `1.` `2.` `3.` |

### DIR-205

**More than one `{default}` in one `tabs` group.** Severity `error`.

Only one `tab` may carry `{default}`; with none, the first is selected.

An error rather than silently taking the first — guessing silently produces output that differs from your intent.

### DIR-206

**An attribute value is outside the allowed set.** Severity `error`.

Only `reveal{effect=…}` today: valid values are `fade-up` (default) / `fade-in` / `slide-left` / `slide-right`. The diagnostic lists them all.

### DIR-207

**This directive does not know this attribute; ignored.** Severity `warning`.

The hint lists the attributes it does know; when it accepts none, it says so.

:::warning `class` and `id` do not report this, and also do not work
Both are native to directive syntax, so **any directive may carry them and none warns** — but they are **not emitted into the output** either. The values are silently discarded.

To restyle, use [theme tokens](/en/reference/theme-tokens).
:::

---

## DIAG-3xx diagram engines

### DIAG-301

**The engine needed for this diagram is not installed.** Severity `error`.

Two messages:

- `没有装能画 X 的引擎` — no engine claims that fence language at all. This version implements only Mermaid, so `d2` / `dot` / `math` and the rest land here
- `渲染 X 图表需要 Y 引擎` — the engine exists but its optional dependency is missing; the hint carries the full install command

Run `pamphlet doctor` first to see what is installed. See [The other seven diagram types](/en/write/diagrams/others).

### DIAG-302

**A single diagram's SVG is too large.** Severity `warning`. Threshold **200KB**.

An oversized diagram usually means too many nodes, which the reader cannot follow either; consider splitting it.

### DIAG-303

**Rendering timed out or failed.** Severity `error`.

The timeout is **10 seconds**, and that number is measured: the 1st diagram takes 733ms including browser cold start, subsequent ones 364ms, a 40-node diagram 412ms — 10 seconds is about 13× the worst case.

When the diagram source has a syntax error, the hint suggests pasting it into <https://mermaid.live>.

**The output is still written when a diagram fails**: its place gets a placeholder box and the exit code is `1`. That way you can see the problem is confined to that one diagram.

### DIAG-304

**Hard-coded colours in the engine output could not be substituted with theme variables.** Severity `warning`.

Those colours **will not follow the theme**; check that diagram for anything unreadable in dark mode.

The diagnostic lists the colours it could not substitute. This warning exists for exactly one reason: to catch "the colour substitution rules silently stopped working after an engine upgrade" — a failure that is undetectable unless reported.

:::tip Cache hits report it too
A diagram served from cache still runs the diagnostic. Without that step, "diagram came from cache" would mean "nobody tells you about the colours that were missed" — precisely what this mechanism exists to prevent.
:::

---

### DIAG-305

**A block in a structured diagram is malformed.** Severity `error`.

The structured syntax (`:::flow` and friends) writes a block name on its own line with the entries indented under it. This code covers four ways to get that wrong:

| What you wrote | What the hint says |
|---|---|
| No blocks at all | There must be at least one block name (e.g. `nodes:`) |
| An entry before any block name | Write the block name first, then the entries |
| The same block name more than once | Write each block once, with all its entries under it |
| A block this diagram kind requires is missing | Add a `<block>:` line with the entries indented under it |

The diagram's place gets a placeholder box; the document still compiles.

### DIAG-306

**A relation in a structured diagram is malformed.** Severity `error`.

A line in the relation block does not read as a relation, or it references a name the declaration block never declared:

- `a -> ghost` where `ghost` was never declared in `nodes:`
- A pie slice whose value is not a number
- A Gantt task filed under a section that was never declared
- A git graph operation that is not recognised

The hint lists the names that *were* declared, so typos are easy to spot.

### DIAG-307

**A structured diagram uses an unknown shape.** Severity `error`.

The `triangle` in `a = triangle "A"` is not in this diagram kind's shape table. The hint lists the ones that are (for flowcharts: `box` / `round` / `stadium` / `diamond` / `circle` / `hexagon` / `cylinder` / `parallelogram`).

`{type=donut}` on a chart reports the same code.

---

## EMB-4xx asset embedding

### EMB-401

**A single asset exceeds the byte limit.** Severity `error`. Limit **2MB**.

The hint is concrete: compress it first (for PNG try `pngquant --quality=70`), or draw it as SVG with a [diagram fence](/en/write/diagrams/flowchart).

The limit exists because base64 inflates size by **33.3%** (RFC 2045 §6.8, RFC 4648 §4).

### EMB-402

**This asset could not be read.** Severity `error`.

Image paths resolve **relative to the source file's directory**, not the directory you ran the command from. See [Images and assets](/en/write/diagrams/images).

### EMB-403

**A remote asset was referenced; self-containment forbids it.** Severity `error`.

```markdown
![img](https://example.com/img.png)   ❌
![img](./img.png)                      ✅
```

Download it locally and reference that — **a pamphlet asks the network for nothing when opened**.

There is no escape hatch. Erroring rather than downloading silently means nobody accidentally ships output that needs a network.

### EMB-404

**This font format cannot be subset.** Severity `error`.

`.ttc` (a font collection — several fonts in one file) cannot be subset directly. Use a standalone `.ttf` / `.otf` with `--font`.

A subsetting failure for other reasons (a corrupt font file, say) also reports this, with the underlying cause in the message.
