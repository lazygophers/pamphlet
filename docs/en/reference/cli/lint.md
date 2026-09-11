# lint

Checks syntax and reports diagnostics. **Writes no files.**

```bash
pamphlet lint "docs/**/*.md"
pamphlet lint "docs/**/*.md" --format json
```

| Option | Meaning |
|---|---|
| `--format json` | Structured `{ reports, failed }` for CI and editor plugins |
| `--fail-on-warn` | Warnings count as failures |
| `--continue-on-error` | Keep going after a document fails |

## What the output looks like

Diagnostics are **grouped per file**, each group with a header; each entry carries a source excerpt, a fix hint and a documentation link; and a summary line is **always printed**, even when everything passed.

:::warning Diagnostic messages are Chinese-only today
The compiler has no message localisation. The codes (`DIR-204`), the positions and the documentation links are language-independent; the prose is not.

The output below is verbatim, not translated.
:::

Real output:

```
pflint/b.md
  error[DIR-204] tab 缺少指令标题
    --> pflint/b.md:3:1
    |
  3 | :::tab
    | ^
    |
    = 指令标题写在方括号里：:::tab[指令标题]。Tab 的指令标题就是那个可以点的按钮
    https://lazygophers.github.io/pamphlet/reference/diagnostics.html#dir-204

  warning[DIR-201] 未知指令 note，内容已按普通段落输出
    --> pflint/b.md:7:1
    |
  7 | :::note
    | ^
    |
    = note 在 Pamphlet 里叫 info。四种提示块是 info / tip / warn / danger
    https://lazygophers.github.io/pamphlet/reference/diagnostics.html#dir-201

──────────────────────────────────────────────
1 份通过，1 份失败，2 条错误，1 条警告
失败：pflint/b.md
```

Every code is explained in English in the [diagnostics reference](/en/reference/diagnostics).

Always printing the summary is deliberate — a silent success makes people wonder whether it ran at all.

## Putting it in CI

See [Checking documents in CI](/en/howto/ci).
