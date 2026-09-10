# ast

Print the syntax tree parsed out of a document.

```bash
pamphlet ast plan.md
```

Writes `{ path, frontmatter, ast, diagnostics }` as JSON to stdout.

One file at a time; a glob matching several errors with exit `2`.

:::danger The AST is unstable during 0.x
Its shape carries **no compatibility promise** and can change in a minor release. Do not build tools against it as a stable interface. See [the compatibility promise on the install page](/en/start/install).
:::

## Flags that do nothing here

| Flag | Actual behaviour |
|---|---|
| `--format json` | It already emits JSON. The flag only stops it printing human-readable diagnostics to stderr |
| `--fail-on-warn` | **Ignored** |
| `--continue-on-error` | **Ignored** (it only ever takes one file) |

## When it is useful

Debugging. When a directive is not doing what you expect, `ast` shows exactly what the parser made of it.

Day-to-day writing never needs it.
