# Steps

## What it is

A run of operations **done in order**, each with a numbered circle.

Versus a plain [ordered list](/en/write/blocks/lists): steps say "follow along", and they look heavier.

## How to write it

```markdown
:::steps
1. Install the dependency
2. Edit the config
3. Restart
:::
```

| Label | Attributes |
|---|---|
| — | none |

**The content must be one ordered list.** An unordered list or bare paragraphs reports `DIR-204`: `steps needs an ordered list`.

## A step can be long

List items can hold paragraphs, code blocks and images; just keep the indentation aligned:

````markdown
:::steps
1. **Install once**

   ```bash
   npm i -g @nekoleapuki/pamphlet-cli
   ```

2. **Compile**

   You get `plan.html`; double-click it.
:::
````

## What comes out

The numbers become circles. **The browser computes them** (CSS `counter`), so `1.` `1.` `1.` in the source still renders as 1, 2, 3.

The `incident` theme turns steps into a **timeline**: a rule with red nodes.

**JavaScript off changes nothing** — steps are pure CSS.

## Traps

- **One action per step.** A step containing two "and then" clauses wants splitting
- A single-step block is pointless; write a paragraph
