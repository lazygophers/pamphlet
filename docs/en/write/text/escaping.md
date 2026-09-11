# Escaping

## What it is

Making `*` `_` `#` and friends **show up as themselves** instead of being read as syntax.

## How to write it

Put a backslash in front:

```markdown
\*not italic\*
5 \* 3 = 15
\# not a heading
```

## Which characters need it

`\` `` ` `` `*` `_` `{}` `[]` `()` `#` `+` `-` `.` `!` `|`

**No need to memorise them**: escape only where the character would really be read as syntax in that position. A lone `*` in `5 * 3` is not italic, and the dot in `3.14` does not start a list.

## The easier way

For a short run, wrap it in [inline code](/en/write/text/inline-code) — **nothing inside needs escaping**:

```markdown
`**shown literally**`
```

## Traps

- **Inside a table a literal pipe must be `\|`**, otherwise it splits the column — see [Tables](/en/write/blocks/table)
- A backslash at the end of a line is a [hard line break](/en/write/text/paragraphs), not an escape
