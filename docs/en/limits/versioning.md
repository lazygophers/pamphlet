# Versioning promise: 0.x is patch-compatible only

| Upgrade | Promise |
|---|---|
| `0.0.1 → 0.0.2` | **Breaks nothing** |
| `0.0 → 0.1` | **May break** syntax, CLI flags, the AST and the plugin API |

The first published version is **0.0.1**.

This matches [what semantic versioning says about a zero major version](https://semver.org/#spec-item-4); it is not a rule Pamphlet invented.

## What this means for you

**Check that your documents still compile on every minor upgrade.**

```bash
pamphlet lint "docs/**/*.md"
```

Put that in CI and it tells you immediately which document stopped compiling after an upgrade.

The cost is real: it is unfriendly to early adopters. That cost was accepted in exchange for **being able to correct the syntax freely during 0.x** — including deleting and renaming syntax that has already shipped.

## Three things explicitly unstable

:::danger Do not treat these as stable interfaces
- **The AST shape** (what `pamphlet ast` prints) — no compatibility promise during 0.x
- **CLI flags** — may be renamed or removed in a minor release
- **The plugin API** — likewise
:::

These three are exactly the parts that need the most adjustment early on. Freezing them at 0.1 (considered, rejected) would weld shut the parts most in need of change.

## `spec:` now does one thing

```yaml
---
spec: 1
---
```

Its role is reduced to a **single responsibility: marking "this is a pamphlet source document"**.

It **no longer** triggers multi-parser behaviour — the original design's "old specs supported forever, parsers coexisting across versions" has been deleted. One parser is maintained, and a permanent doubling of maintenance cost went away with it. That is the largest practical gain from this decision.

A `spec` higher than the compiler supports reports `DOC-101`. Omitting it means no check.

## 1.0 will revisit this

At that point the promise should be considerably stronger than patch compatibility. This rule applies to 0.x only.

> Source: [ADR-0006](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0006-versioning-promise.md)
