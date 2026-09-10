# Steps

A run of numbered circles for a procedure.

```markdown
:::steps
1. Install dependencies
2. Edit the config
3. Restart
:::
```

| Label | Attributes |
|---|---|
| — | Accepts none |

## It must contain an ordered list

An unordered list (`-`) or bare paragraphs report `DIR-204`: `steps needs an ordered list`.

**The browser does the numbering**; Pamphlet only makes it look like circles (CSS `counter`). So writing `1.` `1.` `1.` still renders 1, 2, 3 — that is ordinary Markdown behaviour.

## A step can be long

List items can hold paragraphs, code blocks and images as long as the indentation lines up:

```markdown
:::steps
1. **Install**

   ```bash
   npm i -g @nekoleapuki/pamphlet-cli
   ```

2. **Compile**

   You get `plan.html`; double-click to open it.
:::
```

## With JavaScript off

**Entirely unaffected** — steps are pure CSS with no script involved. The circled numbers come from `counter-increment` and `::before`.
