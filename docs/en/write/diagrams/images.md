# Images and assets

Images and fonts are **embedded into the output** — images as base64, fonts subset into a data URI. So the output stays complete wherever you copy it.

```markdown
![Architecture](./img/architecture.png)
```

## Paths are relative to the source file

Image paths resolve **relative to the directory the source file lives in**, **not** the directory you ran the command from.

```
project/
├─ docs/
│  ├─ plan.md            ← the source file
│  └─ img/
│     └─ architecture.png   ← write ./img/architecture.png
└─ (run pamphlet build docs/plan.md from here)
```

Unreadable reports `EMB-402`.

## Remote images are an error

```markdown
![img](https://example.com/img.png)   ❌
![img](./img.png)                      ✅
```

You get `EMB-403`. **There is no escape hatch.**

Erroring rather than downloading silently means nobody accidentally ships output that needs a network — which would break the self-contained promise outright.

Download it locally and reference that.

## 2MB per asset

Over that reports `EMB-401`, and the hint is concrete: compress it first (for PNG try `pngquant --quality=70`), or draw it as SVG with a [diagram fence](/en/write/diagrams/flowchart).

The limit exists because **base64 inflates size by 33.3%** (RFC 2045 §6.8, RFC 4648 §4) — a 2MB image is 2.7MB in the output.

## Embedding a font

```bash
pamphlet build plan.md --font ./NotoSans.otf
```

**Only the glyphs the document uses are kept** (subsetting). CJK fonts run to several MB and usually come out at tens of KB after subsetting.

`.ttc` (a font collection — several fonts in one file) cannot be subset and reports `EMB-404`; use a standalone `.ttf` / `.otf`.

## Which files to compile must be stated

`pamphlet build` **guesses no default when given no arguments**, and there is no `include` / `exclude` config field.

```bash
pamphlet build docs/plan.md
pamphlet build docs/plan.md docs/budget.md
pamphlet build "docs/**/*.md"
```

### Quote your globs

**Globs are expanded by Pamphlet itself, not the shell.**

```bash
pamphlet build "docs/**/*.md"     # ✅ quoted
pamphlet build docs/**/*.md       # ❌ the shell expands it first
```

Unquoted, the shell expands first — and shells disagree about `**`: `zsh` matches recursively natively, `bash` needs `shopt -s globstar` first or `docs/**/*.md` **matches one level only**.

The result is "CI compiled only some of the files and said nothing" — harder to spot than an error.

### Nothing is excluded by default

:::danger This one bites
```bash
pamphlet build "**/*.md"     # ❌ don't
```

In a repository with dependencies installed this hits **hundreds of third-party Markdown files** under `node_modules`. And since output is written next to the source, those HTML files end up scattered through your dependency tree.

Scope it:

```bash
pamphlet build "docs/**/*.md"    # ✅
```
:::

### Why not read `.gitignore`

`.gitignore` says **"what not to commit"**, which is a different question from **"what not to compile"**.

Conflating them produces silent surprises: someone adds `docs/` to `.gitignore` because output lands there, and the sources stop being compiled too.

### Why no config file

Two options were considered and both rejected:

- **An `include` / `exclude` list in config**: least effort for a batch of documents, and it could exclude `node_modules` implicitly. Rejected.
- **Compile every `.md` in the current directory by default**: works out of the box. Rejected — it would sweep up `README.md`, `CHANGELOG.md` and third-party Markdown, producing a pile of files nobody wants.

The root reason: **any `.md` is valid input to Pamphlet** (source files carry no identifying marker). Given that, "which ones" has to be stated by you and cannot be inferred by the compiler.

> Source: [ADR-0023](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0023-explicit-file-paths-only.md)
