# Explicit file paths only

`pamphlet build` needs to be told exactly which files to compile. **With no arguments it guesses nothing**, and there are no `include` / `exclude` config fields.

```bash
pamphlet build docs/plan.md
pamphlet build docs/plan.md docs/budget.md
pamphlet build "docs/**/*.md"
```

## Quote your globs

**Globs are expanded by Pamphlet itself, not by the shell.**

```bash
pamphlet build "docs/**/*.md"     # ✅ quoted
pamphlet build docs/**/*.md       # ❌ the shell expands first
```

Without quotes the shell expands first, and shells disagree about `**`: `zsh` supports recursive matching natively, `bash` needs `shopt -s globstar` first, or `docs/**/*.md` **matches only one level deep**.

The failure mode is "CI compiled only some of the files and reported nothing" — which is harder to notice than an error.

## No default exclusions

:::danger This one bites
```bash
pamphlet build "**/*.md"     # ❌ do not write this
```

In a repository with dependencies installed, this matches the **hundreds of third-party Markdown files under `node_modules`**. Artifacts are written next to the source, so those HTML files end up scattered through your dependency tree.

Scope it instead:

```bash
pamphlet build "docs/**/*.md"    # ✅
```
:::

The compiler hides no decision. A glob compiles whatever it matches — a known cost, traded for completely predictable behaviour.

## Why `.gitignore` is not read

`.gitignore` says **"what not to commit"**, which is a different question from **"what not to compile"**.

Conflating them produces silent surprises: someone adds `docs/` to `.gitignore` because artifacts land there, and now the sources are not compiled either.

## Partial success across several files

Passing several paths introduces a "some succeeded, some failed" state:

| Situation | Behaviour |
|---|---|
| Any failure | Exit code `1`; **artifacts already produced stay on disk** |
| With `--continue-on-error` | Keeps compiling the rest; the exit code still reflects whether anything failed |
| Diagnostic output | Grouped by file, each group with a file header |
| Summary line | **Always printed**, even when everything passed; failed filenames listed separately |
| With `--verbose` | A size report per document, plus a total at the end |

Files that could not be read go on the failure list only; they do not count toward "passed".

## Why no config file

Two alternatives were considered and rejected:

- **An `include` / `exclude` list in config**: most convenient for compiling a batch, and it could exclude `node_modules` implicitly. Rejected.
- **Default to every `.md` in the current directory**: works out of the box. Rejected — it would sweep up `README.md`, `CHANGELOG.md` and third-party Markdown in dependency directories, producing a pile of unwanted files.

The underlying reason: any `.md` is valid input to Pamphlet (sources need no identifying marker). Given that, "which ones to compile" must be stated by you and cannot be inferred by the compiler.

> Source: [ADR-0023](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0023-explicit-file-paths-only.md)
