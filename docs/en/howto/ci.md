# Checking documents in CI

The goal: when someone breaks a source file, find out **before merging** rather than at compile time.

Use `pamphlet lint` — it checks syntax and reports diagnostics, and **writes no files**.

```bash
npx @pamphlet/cli lint "docs/**/*.md"
```

A non-zero exit code means something is wrong; CI can judge on that alone without parsing output.

## GitHub Actions

```yaml
name: Check docs

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npx @pamphlet/cli lint "docs/**/*.md"
```

**Quote the glob.** Unquoted, the shell expands first, and `bash` does not match `**` recursively by default — so you check one level and nothing tells you. See [Images and assets](/en/write/assets).

## Treat warnings as failures

```bash
npx @pamphlet/cli lint "docs/**/*.md" --fail-on-warn
```

By default only `error` sets the exit code to `1`; `warning` does not. This flag makes warnings count.

Worth adding **from day one on a new project** — warnings are all "works now, bites later", and cleaning up dozens of them later is painful.

## Producing output too

`lint` only checks. To actually compile, use `build`:

```yaml
      - run: npx @pamphlet/cli build "docs/**/*.md" --continue-on-error
```

`--continue-on-error` keeps going after a failure, with the exit code still reflecting whether anything failed. Without it, the first failure stops the run.

## If your documents have diagrams

Mermaid needs a real browser, so the CI image needs Chromium first:

```yaml
      - run: npm i -g mermaid-isomorphic playwright
      - run: npx playwright install --with-deps chromium
      - run: npx @pamphlet/cli build "docs/**/*.md"
```

`--with-deps` installs the system libraries too (required on Linux). That step takes about a minute.

**Text-only documents do not need these three lines** — the browser starts lazily and is never launched without a diagram.

## Structured output for editor plugins

```bash
npx @pamphlet/cli lint "docs/**/*.md" --format json
```

Emits `{ reports, failed }`.

:::warning `--format json` only affects `lint`
`build` ignores it and always prints human-readable diagnostics; `ast` already writes JSON to stdout, and the flag merely stops it printing human-readable diagnostics to stderr.
:::

## Run it after upgrading the compiler

During 0.x a **minor upgrade is allowed to break syntax** (`0.0 → 0.1`). That is the main reason to have `lint` in CI — it tells you immediately which document stopped compiling. See [the compatibility promise on the install page](/en/start/install).
