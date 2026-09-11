# build

Compile to a single HTML file.

```bash
pamphlet build plan.md
pamphlet build "docs/**/*.md" --continue-on-error
```

Output goes **next to the source file** by default: `plan.md` → `plan.html`.

## Options

| Option | Meaning |
|---|---|
| `-o <path>`, `--out <path>` | Where the output goes. Single file only; several sources errors with `2` |
| `--theme <name>` | Switch theme, overriding frontmatter. See [Built-in themes](/en/reference/themes) |
| `--font <font file>` | Embed a font, keeping only the glyphs used |
| `--verbose` | Print a size breakdown |
| `--no-embed-source` | Do not embed the source |
| `--fail-on-warn` | Warnings count as failures |
| `--continue-on-error` | Keep going after a document fails |

:::warning Quote your globs
Globs are expanded by Pamphlet, not the shell. **And nothing is excluded by default** — `"**/*.md"` sweeps up hundreds of third-party documents under `node_modules`. See [Images and assets](/en/write/diagrams/images).
:::

## A failed diagram still produces output

Its place gets an explanatory placeholder box, everything else is correct, and **the exit code is `1`** — so you can see the problem is confined to that one diagram.

## Partial success across several files

| Case | Behaviour |
|---|---|
| Any failure | Exit `1`; **outputs already produced stay on disk** |
| With `--continue-on-error` | Keeps compiling the rest; exit code still reflects any failure |
| Diagnostics | Grouped per file, each group with a file header |
| Summary line | **Always printed**, even when everything passed; failures listed separately |
| With `--verbose` | A size report per file plus a total at the end |

Unreadable files only join the failure list; they do not count towards "passed".

## Size breakdown

```bash
pamphlet build plan.md --verbose
```

Real output, verbatim (compiling this repository's `examples/demo.md`; compiler messages are Chinese-only for now):

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

The segments do not overlap and add up to the whole file. Pamphlet **sets no size limit**; it just itemises the bill. Whether a diagram is worth 16KB is your judgement, not the compiler's.
