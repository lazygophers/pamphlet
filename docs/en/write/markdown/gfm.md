# GFM extensions

Beyond CommonMark, Pamphlet also enables **GFM** (GitHub Flavored Markdown, GitHub's set of Markdown extensions; spec at <https://github.github.com/gfm/>).

So the tables, strikethrough and task lists you are used to writing on GitHub work in source files too.

## Tables

```markdown
| Environment | Instances | Monthly cost |
|---|---|---|
| production | 6 | $450 |
| staging | 2 | $110 |
```

Table styling follows the theme: borders use `--pf-table-border`, header background uses `--pf-table-header-bg` (see [Theme tokens](/en/reference/theme-tokens)).

Tables **scroll horizontally on narrow screens rather than being squeezed into wrapping** — that is deliberate, see [What the output is](/en/design/output).

## Strikethrough

```markdown
The original plan was ~~a self-hosted Redis cluster~~; it is a managed service now.
```

## Task lists

```markdown
- [x] Load test report
- [x] Cost estimate
- [ ] Rollout plan
```

The checkboxes are **read-only** — the output is a document, not a to-do app.

## Autolinks

Bare URLs become links:

```markdown
See https://spec.commonmark.org/
```

## Footnotes are not supported

GFM has footnotes (`[^1]`). **Pamphlet does not support them.** Writing one is an error:

```
error[DOC-105] footnotes are not supported in this version
  --> plan.md:3:4
  = rewrite it as a parenthetical, or put the note in an :::info container
```

:::info Why an error rather than ignoring it
Dropping footnotes silently means the note you wrote **vanishes** from the output and you never find out. An error makes it visible immediately.
:::

Two alternatives:

```markdown
P99 is 800ms today (figure from the March load test).
```

```markdown
:::info[Where this number comes from]
March load test, sample of 100,000 requests.
:::
```

Incidentally, Pandoc's inline footnote form `^[note]` is not part of GFM; Pamphlet treats it as **ordinary text** and passes it through without an error.
