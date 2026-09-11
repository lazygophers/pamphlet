# Let an AI write your Pamphlet documents

The repository ships three **skills** — instruction files written for an AI assistant. Once installed, your assistant loads them by itself when it writes a Pamphlet document, so you don't have to paste the syntax in every time.

```bash
npx skills add lazygophers/pamphlet
```

That lists the three and installs the ones you pick into this project's `.claude/skills/`. Add `-g` to install them for every project on the machine.

## What each one covers

| Name | When it is used |
|---|---|
| `pamphlet-syntax` | Writing frontmatter, the nine directives, diagram fences, images; any diagnostic starting with `DOC` / `DIR` / `DIAG` / `EMB` |
| `pamphlet-theme` | Picking a theme, or overriding a colour or two |
| `pamphlet-best-practices` | The judgement calls: when tabs are the right shape, how far to take a diagram, what to check before shipping |

Install just one:

```bash
npx skills add lazygophers/pamphlet --skill pamphlet-syntax
```

`--skill` is singular and repeatable.

Note the skill bodies are written in Chinese. The audience is a model, which reads them without loss; keeping one copy avoids a second translation that would drift out of sync with the first.

## How this relates to the documentation site

They give you different things:

| | For | Read when |
|---|---|---|
| This site + [`llms.txt`](https://lazygophers.github.io/pamphlet/llms.txt) | People / AI | Something needs looking up |
| A skill | AI | **Loaded automatically as soon as the work is relevant** |

Documentation is reference material; a skill is a procedure. "This document is an incident report, so it wants the `incident` theme, where steps render as a timeline" is a judgement — the reference pages don't phrase it that way.

Every page on this site is also published as Markdown: swap `.html` for `.md` in the URL. The index is at `/llms.txt` and the whole bundle at `/llms-full.txt`.

## What gets installed, and how to update it

`npx skills add` pulls files straight from this git repository — what it fetches is exactly the three folders under `skills/`. To update:

```bash
npx skills update
```

The theme list, the token list and the diagnostic-code table are **generated from the source** (`pnpm skills:sync`), and a test in the repository keeps them from going stale — so "the code gained a theme but the skill still lists the old set" cannot happen quietly.

The `skills` CLI is not a Pamphlet tool; it is <https://github.com/vercel-labs/skills>, and it supports Claude Code, Cursor, Codex and dozens of other assistants.
