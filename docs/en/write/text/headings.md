# Headings

## What it is

The line that cuts a document into sections. Six levels: the more `#`, the lower the level.

The side menu is generated from headings, and every heading gets an anchor you can link to.

## How to write it

```markdown
# Level 1
## Level 2
### Level 3
#### Level 4
##### Level 5
###### Level 6
```

**The hash marks need a space after them.** `#Heading` is not a heading, it is ordinary text. Neither is seven hashes.

## What comes out

Size, weight, spacing and colour are **entirely up to the theme**, and they differ a lot:

| Theme | What a level-2 heading looks like |
|---|---|
| `editorial` | A 3.2rem serif display with `01` `02` section numbers |
| `paper` | Academic `1.` `2.` numbering; level 3 is italic |
| `blueprint` | Three-level `1` / `1.1` / `1.1.1` numbering, monospace |
| `architecture` | Carries a `§` number |
| `console` | Monospace throughout, square corners |

The same document under a different theme looks completely different; not a word of content changes.

## The first heading is the document title

The first `#` becomes the output's `<title>` (the text on the browser tab), unless you set `title` in frontmatter.

It also **does not appear in the table of contents** — the ToC navigates within the document, and the document's own title is not a section of it.

So: start sections at `##`, and write exactly one `#` per document.

## How anchors are computed

| Heading | Anchor |
|---|---|
| `## Callouts` | `#callouts` |
| `## Theme tokens` | `#theme-tokens` |
| `## Step 1: install once` | `#step-1-install-once` |

Lowercased, spaces to hyphens, punctuation dropped, non-Latin characters kept as they are. When two headings collide, the second gets `-2`.

For an in-document jump write `[go to callouts](#callouts)`.

## Traps

- **The ToC only collects to level 2 by default.** For level 3 and below set `toc: { deep: 3 }` in frontmatter — see the [frontmatter reference](/en/reference/frontmatter)
- **Don't use a heading to make text bold.** Use `**bold**`; a `####` pollutes the ToC and the document outline
- A tab's [directive label](/en/write/components/tabs) also becomes a real heading and enters the outline — which is why `toc.skipTabs` defaults to `true`
