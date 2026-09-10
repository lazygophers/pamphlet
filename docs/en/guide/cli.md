# CLI

```
pamphlet build   <paths...> [options]   compile to a single-file HTML
pamphlet serve   <path>     [options]   local preview, reloads on source change
pamphlet lint    <paths...> [options]   check syntax and report diagnostics
pamphlet ast     <path>     [options]   print the AST as JSON
pamphlet extract <artifact.html>        recover the source from an artifact
pamphlet doctor                         which diagram engines are installed
```

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | Compile error |
| `2` | Usage or argument error |
| `3` | Environment missing (`doctor` found an engine absent) |

In CI, branch on the exit code; you do not need to parse the output.

## Options

| Option | Meaning |
|---|---|
| `-o <path>` | Where to write the artifact. Single document only; passing several is an error with exit `2` |
| `--font <font file>` | Embed this font, **keeping only the characters the document uses** |
| `--verbose` | Print the size breakdown after compiling |
| `--no-embed-source` | Do not embed the source in the artifact (which disables `extract`) |
| `--port <port>` | Port for `serve`, default `4321` |
| `--format json` | Structured output for CI and editors |
| `--fail-on-warn` | Treat warnings as failures too |
| `--continue-on-error` | Keep going after a document fails |
| `--no-color` | No colour |
| `-h`, `--help` | This help |

Running bare `pamphlet` prints the help and exits `2` — "you did not say what to do" is a usage error, not a success.

## build

```bash
pamphlet build plan.md
pamphlet build "docs/**/*.md" --continue-on-error
```

Artifacts are written **next to the source**: `plan.md` → `plan.html`.

:::warning Quote your globs
Globs are expanded by Pamphlet itself, not by the shell. Without quotes the shell expands first, and shells disagree about `**`. **Pamphlet also applies no default exclusions** — `"**/*.md"` will compile the hundreds of third-party documents inside `node_modules`. See [explicit file paths only](/en/limits/file-paths).
:::

**When a diagram fails to render the artifact is still written, and the exit code is 1.** That diagram's slot holds an explanatory placeholder box while the rest is correct — so you can see immediately that the problem is confined to one diagram.

### Size breakdown

```bash
pamphlet build plan.md --verbose
```

Real output (compiling this repository's `examples/demo.md`; the labels are Chinese in the current build):

```
demo.html  33.7KB
  体积 33.7KB（gzip 10.6KB）
    图表 SVG          16.0KB  gzip     2.8KB  48%
    样式               5.7KB  gzip     1.4KB  17%
    正文 HTML          4.0KB  gzip     2.1KB  12%
    源文档注释            3.8KB  gzip     2.4KB  11%
    运行时              3.1KB  gzip     1.3KB  9%
    骨架                933B  gzip      574B  3%
```

The parts do not overlap and add up to exactly the whole artifact. Pamphlet **sets no size gate**; it lays the bill out. Whether 16KB is worth dropping a diagram for is your call, not the compiler's.

## serve

```bash
pamphlet serve plan.md --port 8080
```

Starts a local server that recompiles and reloads the page whenever the source changes (over SSE). One file at a time; a glob matching several is an error with exit `2`.

## lint

```bash
pamphlet lint "docs/**/*.md" --format json
```

Checks syntax and reports diagnostics without producing any file.

Diagnostics are **grouped by file** with a file header; each carries a source snippet, a fix hint and a documentation link. A summary line is **always printed**, even when everything passes — a silent success makes people wonder whether it ran at all. Real output:

```
pflint/b.md
  error[DIR-204] tab 缺少标题
    --> pflint/b.md:3:1
    |
  3 | :::tab
    | ^
    |
    = 标题写在方括号里：:::tab[标题]。Tab 的标题就是那个可以点的按钮
    https://lazygophers.github.io/pamphlet/reference/diagnostics.html#dir-204

──────────────────────────────────────────────
1 份通过，1 份失败，2 条错误，1 条警告
失败：pflint/b.md
```

:::info Diagnostic messages are Chinese today
The compiler's diagnostic strings are not yet internationalised. The codes (`DIR-204` and friends) are language-neutral and documented in [the diagnostics reference](/en/reference/diagnostics).
:::

`--format json` emits `{ reports, failed }` for CI and editor plugins.

## ast

```bash
pamphlet ast plan.md
```

Prints `{ path, frontmatter, ast, diagnostics }` as JSON.

:::danger The AST is unstable during 0.x
The AST shape carries **no compatibility promise** in 0.x and may change on a minor release. Do not build tooling against it as a stable interface. See [the versioning promise](/en/limits/versioning).
:::

One file at a time; matching several is an error with exit `2`.

## extract

```bash
pamphlet extract plan.html > recovered.md
```

Recovers the source document verbatim — it is embedded in an HTML comment inside the artifact by default, so **the artifact is its own backup**.

Artifacts built with `--no-embed-source` do not carry it, and `extract` fails with exit `1`.

## doctor

```bash
pamphlet doctor
```

Prints each engine's status and how to install it. Any missing engine exits `3`.

This version implements only Mermaid, so there is only one line. See [diagram engines are all optional](/en/limits/engines).
