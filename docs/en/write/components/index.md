# How directives work

Five things that can be clicked or that step out of the prose, collectively **container directives**. They are what Pamphlet adds on top of standard Markdown.

| Directive | What it does |
|---|---|
| [`info` `tip` `warn` `danger`](/en/write/components/callout) | Four kinds of callout |
| [`tabs` / `tab`](/en/write/components/tabs) | Tabbed panels |
| [`collapse`](/en/write/components/collapse) | Collapsible block |
| [`steps`](/en/write/components/steps) | Numbered steps |
| [`reveal`](/en/write/components/reveal) | Reveal on scroll |

## One rule

```
:::name[directive label]{attributes}
```

- **`[directive label]` is always the words your reader sees**
- **`{attributes}` are always parameters for the compiler**

That is the whole rule; there is nothing to memorise per directive.

:::info "Directive label" and "heading" are different things
In this project a *heading* is Markdown's `#` (see [Headings](/en/write/text/headings)). The text in square brackets is always called the **directive label** — the diagnostics say so too.
:::

## All of them are container directives

Every directive name must wrap its content in **paired colons**. The single-line form `::name[content]` reports `DIR-202`.

### Nesting needs more colons on the outside

:::warning The most common mistake
`:::tabs` around `:::tab` **does not work** — with equal colons, the first `:::` closes the outer one.

Write `::::tabs` around `:::tab`: four colons outside, three inside.
:::

## Typos are survivable

The diagnostics recognise other tools' spellings:

| You wrote | The hint |
|---|---|
| `note` | It is `info` in Pamphlet |
| `warning` / `caution` | It is `warn` |
| `important` | It is `danger` |
| `details` / `accordion` | It is `collapse` |
| `tabset` | It is `tabs` |

Typos within an edit distance of 2 get a "did you mean X?".

An unknown directive is only a `DIR-201` **warning**, because **the content is still emitted as-is** — nothing is lost.

## Unknown attributes are ignored

An attribute the directive does not know reports `DIR-207` and lists the ones it does know.

:::warning `class` and `id` do nothing today
The directive syntax allows `{.myclass}` and `{#myid}`, and Pamphlet **does not warn** about them — but they **are not emitted** either; the values are dropped silently.

To change styling, use [theme tokens](/en/reference/theme-tokens).
:::
