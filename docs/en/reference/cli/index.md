# Command line

```
pamphlet build   <path...> [options]   compile to a single HTML file
pamphlet serve   <path>    [options]   local preview, reloads on source change
pamphlet lint    <path...> [options]   check syntax and report diagnostics
pamphlet ast     <path>    [options]   print the AST as JSON
pamphlet extract <output.html>         recover the source from an output file
pamphlet doctor                        which diagram engines are installed
```

Without installing, prefix with `npx @nekoleapuki/pamphlet-cli`, e.g. `npx @nekoleapuki/pamphlet-cli build plan.md`.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | success |
| `1` | compile error |
| `2` | argument or usage error |
| `3` | environment missing (`doctor` found an engine absent) |

CI can judge on the exit code alone without parsing output.

Running `pamphlet` with no arguments prints usage and exits `2` — "you didn't say what to do" is a usage error, not a success.

## Options

| Option | Applies to | Meaning |
|---|---|---|
| `-o <path>`, `--out <path>` | `build` | Where the output goes. Single file only; several sources errors with `2` |
| `--theme <name>` | `build` `serve` | Switch theme, **overriding frontmatter `theme`**. The six are in [Built-in themes](/en/reference/themes) |
| `--font <font file>` | `build` | Embed this font, **keeping only the glyphs used** |
| `--verbose` | `build` | Print a size breakdown after compiling |
| `--no-embed-source` | `build` | Do not embed the source (`extract` stops working) |
| `--port <port>` | `serve` | Default `4321` |
| `--format json` | **`lint` only** | Structured output for CI and editors |
| `--fail-on-warn` | `build` `lint` | Treat warnings as failures |
| `--continue-on-error` | `build` `lint` | Keep going after a document fails |
| `--no-color` | all | No colour |
| `-h`, `--help` | all | Usage |

:::warning `--format json` is not a global option
Only `lint` actually switches output format on it.

`build` **ignores** it and always prints human-readable diagnostics; `ast` already writes JSON to stdout, and the flag merely stops it printing human-readable diagnostics to stderr.

Likewise `--fail-on-warn` and `--continue-on-error` have no effect on `ast`.
:::

:::info Compiler messages are Chinese-only
There is no message localisation yet. Codes, positions and documentation links are language-independent; the prose is not. Output shown on this page is verbatim, not translated.
:::

## Environment variables

| Variable | Effect |
|---|---|
| `NO_COLOR` | If set, disables colour, same as `--no-color`. A cross-tool convention (<https://no-color.org/>) |
