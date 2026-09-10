# Diagnostic codes

Every diagnostic carries a location, a reason and a fix hint. The link underneath points at the matching anchor on this page.

```
error[DIR-204] tab 缺少标题
  --> plan.md:3:1
  |
3 | :::tab
  | ^
  |
  = 标题写在方括号里：:::tab[标题]。Tab 的标题就是那个可以点的按钮
  https://lazygophers.github.io/pamphlet/reference/diagnostics.html#dir-204
```

:::info Messages are Chinese today
The diagnostic strings are not yet internationalised. The **codes** are language-neutral, which is what this page documents.
:::

## How to read a code

Four segments. **The code itself does not encode severity**:

| Segment | Covers |
|---|---|
| `DOC-1xx` | Document and frontmatter |
| `DIR-2xx` | Container directives |
| `DIAG-3xx` | Diagram engines |
| `EMB-4xx` | Asset embedding |

Severity is a **separate field** (`error` / `warning`), because `--fail-on-warn` turns warnings into failures — if the code hard-coded an `E` / `W` prefix, that flag would contradict itself.

---

## DOC-1xx document and frontmatter

### DOC-101

**`spec` is higher than the compiler supports.** Severity `error`.

The document asks for a syntax version newer than your Pamphlet. Upgrade the compiler, or lower `spec`.

This compiler supports version `1`.

### DOC-102

**Unknown field in frontmatter; ignored.** Severity `warning`.

The known fields are only `spec` / `title` / `theme` / `lang` / `toc` / `engines`, and inside `toc` only `enable` / `deep` / `skipTabs` / `position`. See the [frontmatter reference](/en/reference/frontmatter).

Not ignoring it silently is deliberate — silence would let you believe the setting took effect.

### DOC-103

**Frontmatter is not valid YAML, or a field has the wrong type.** Severity `error`.

Common variants:

| Message | Meaning |
|---|---|
| `frontmatter 不是合法的 YAML：…` | The YAML itself does not parse |
| `frontmatter 必须是一组 键: 值` | Written as a list or a scalar |
| `spec 必须是整数` | Written as a string or a decimal |
| `toc.deep 必须是 1 到 6 之间的整数` | Out of range |
| `toc.position 只能是 top 或 side` | Misspelled |

The diagnostic points at **the line of the offending field**, not vaguely at the start of the frontmatter.

### DOC-104

**The value is valid but this version has not implemented it.** Severity depends on the field.

Two cases today:

- `engines` (custom engines) — `warning`, the declaration has no effect for now
- `toc.position: side` (sticky sidebar) — `error`

---

## DIR-2xx container directives

### DIR-201

**Unknown directive; contents emitted as ordinary paragraphs.** Severity `warning`.

Only a warning, because **an unrecognised directive still emits its contents** — no text is lost.

The diagnostic tries to point the way, recognising other tools' spellings:

| You wrote | Hint |
|---|---|
| `note` | Called `info` in Pamphlet |
| `warning` / `caution` | Called `warn` in Pamphlet |
| `important` | Called `danger` in Pamphlet |
| `details` / `accordion` | Called `collapse` in Pamphlet |
| `tabset` | Called `tabs` in Pamphlet |
| `callout` | The four callouts are `info` / `tip` / `warn` / `danger` |

Typos within edit distance 2 also get a "did you mean X?".

### DIR-202

**The directive is in the wrong place or the wrong shape.** Severity `error`.

Two cases:

- **Written as a non-container directive.** All nine directives are container directives and must wrap their content in paired colon fences
- **`tab` is not directly inside `tabs`.** The hint tells you: the outer fence needs one more colon than the inner one (`::::tabs` wrapping `:::tab[label]`)

### DIR-203

**Unclosed directive.** Severity `error`.

A closing fence **matches the same colon count first**; any inner fence skipped over is recorded as unclosed. That way the error points at the fence that genuinely was not closed, rather than at the outermost one.

### DIR-204

**The directive is missing a required part.** Severity `error`.

| Message | Fix |
|---|---|
| `tab 缺少标题` | The label is the clickable button; write `:::tab[label]` |
| `collapse 缺少标题` | Degrades to `<details>` without JavaScript; no label means nothing clickable |
| `tabs 里面没有任何 tab` | Add at least one `:::tab[label]`; mind the extra outer colon |
| `steps 里需要一个有序列表` | Write `1.` `2.` `3.` |

### DIR-205

**More than one `{default}` in the same `tabs` group.** Severity `error`.

Only one `tab` may carry `{default}`; with none, the first is selected.

An error rather than a silent pick-the-first — silent guessing produces an artifact that differs from your intent.

### DIR-206

**Attribute value outside the allowed set.** Severity `error`.

Today only `reveal{effect=…}`: valid values are `fade-up` (default) / `fade-in` / `slide-left` / `slide-right`. The diagnostic lists them all.

### DIR-207

**This directive does not know that attribute; ignored.** Severity `warning`.

The hint lists the attributes the directive does accept, and says so plainly when it accepts none.

`class` and `id` are native to directive syntax, work on any directive, and never trigger this.

---

## DIAG-3xx diagram engines

### DIAG-301

**The engine needed to render this diagram is not installed.** Severity `error`.

Two messages:

- `没有装能画 X 的引擎` — no engine claims that fence language at all. This version implements only Mermaid, so `d2` / `dot` / `math` and the rest land here
- `渲染 X 图表需要 Y 引擎` — the engine exists but its optional dependency is missing; the hint carries the full install command

Run `pamphlet doctor` first. See [diagram engines are all optional](/en/limits/engines).

### DIAG-302

**A single diagram's SVG is too large.** Severity `warning`. Threshold **200KB**.

An oversized diagram usually means too many nodes, which the reader cannot follow either. Consider splitting it.

### DIAG-303

**Rendering timed out or failed.** Severity `error`.

The timeout is **10 seconds**, and that number is measured: the first diagram costs 733ms including browser cold start, subsequent ones 364ms, a 40-node diagram 412ms — so 10s is about 13× the worst measured case.

When the diagram source has a syntax error, the hint suggests pasting it into <https://mermaid.live> to locate the problem.

**When a diagram fails, the artifact is still written** with a placeholder box in that slot, and the exit code is `1`. That way you can see the problem is confined to one diagram.

### DIAG-304

**The engine emitted hard-coded colours that could not be rewritten to theme variables.** Severity `warning`.

Those colours **will not follow the theme**; when switching to dark mode, check whether anything in that diagram becomes unreadable.

The diagnostic lists the colours it could not rewrite. This warning exists for exactly one reason: to catch "the colour-rewriting rules silently broke after an engine upgrade" — a failure you would otherwise never notice.

:::tip Cache hits report this too
A diagram fetched from cache runs the same diagnostics. Skipping that step would mean "diagram came from cache = nobody tells you about the missed colours", which is precisely the thing this mechanism exists to prevent.
:::

---

## EMB-4xx asset embedding

### EMB-401

**A single asset exceeds the byte limit.** Severity `error`. Limit **2MB**.

The hint gives concrete options: compress it first (for PNG, try `pngquant --quality=70`), or draw it with a diagram fence as SVG instead.

The limit exists because base64 inflates size by **33.3%** (RFC 2045 §6.8, RFC 4648 §4).

### EMB-402

**The asset could not be read.** Severity `error`.

Image paths resolve **relative to the source document's directory**, not to where you ran the command.

### EMB-403

**A remote asset was referenced, which self-containment forbids.** Severity `error`.

```markdown
![diagram](https://example.com/diagram.png)   ❌
![diagram](./diagram.png)                     ✅
```

Download it locally and reference that — **a pamphlet asks the network for nothing when opened**.

There is no escape hatch. Remote assets are a hard error rather than a silent download, so nobody accidentally produces an artifact that needs the internet.

### EMB-404

**This font format cannot be subsetted.** Severity `error`.

`.ttc` (a font collection — several fonts inside one file) cannot be subsetted directly. Pass a standalone `.ttf` / `.otf` to `--font` instead.

A subsetting failure (a corrupt font file and so on) reports the same code, with the underlying reason in the message.
