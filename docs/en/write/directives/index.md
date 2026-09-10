# How directives work

A **directive** is the only unit of Markdown extension, written `:::name[label]{attrs}`. There is exactly one rule:

- **`[label]` is always text for the reader**
- **`{attrs}` are always parameters for the compiler**

Remember that and you do not need to memorise the directives one by one.

```markdown
:::collapse[Advanced options]
Content that starts folded away.
:::
```

All nine directives are **container directives** — content must be wrapped in a matching pair of colon fences. The single-line form `::name[content]` reports `DIR-202`.

## Nesting needs more colons on the outside

:::warning This is the one people trip on
`:::tabs` around `:::tab` **does not work** — the colon counts match, so the first `:::` closes the outer one.

Write `::::tabs` around `:::tab`: four colons outside, three inside.
:::

```markdown
::::tabs

:::tab[One]
content
:::

::::
```

## The nine

| Directive | What it does |
|---|---|
| [`info` `tip` `warn` `danger`](/en/write/directives/callout) | Four kinds of callout |
| [`tabs` / `tab`](/en/write/directives/tabs) | Tabs |
| [`collapse`](/en/write/directives/collapse) | Collapsible block |
| [`steps`](/en/write/directives/steps) | Numbered steps |
| [`reveal`](/en/write/directives/reveal) | Scroll-in animation |

## Typos are handled

Diagnostics recognise other tools' spellings:

| You wrote | The hint |
|---|---|
| `note` | called `info` in Pamphlet |
| `warning` / `caution` | called `warn` in Pamphlet |
| `important` | called `danger` in Pamphlet |
| `details` / `accordion` | called `collapse` in Pamphlet |
| `tabset` | called `tabs` in Pamphlet |

Misspellings within edit distance 2 also get a "did you mean X?".

An unknown directive is only a `DIR-201` **warning**, not an error, because **the content is still emitted verbatim** — nothing is lost.

## Unknown attributes are ignored

An attribute a directive does not know reports `DIR-207` and the hint lists the ones it does know.

:::warning `class` and `id` currently do nothing
Directive syntax itself allows `{.myclass}` and `{#myid}`, and Pamphlet **does not warn** about them — but it **does not emit them either**. The values are silently discarded.

To restyle, use [theme tokens](/en/reference/theme-tokens).
:::
