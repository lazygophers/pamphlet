# Lists

## What it is

Three kinds: **unordered** (bullets), **ordered** (numbers), **task** (checkboxes).

## How to write it

### Unordered

`-`, `*` and `+` are equivalent — just **stay consistent within a document**:

```markdown
- First
- Second
- Third
```

### Ordered

```markdown
1. First
2. Second
3. Third
```

**The browser computes the numbers**, so writing `1.` `1.` `1.` still renders as 1, 2, 3. To start elsewhere, write that number on the first item (`3.` starts at three).

### Task lists

```markdown
- [x] Load test report
- [ ] Rollout plan
```

The checkboxes are **read-only** — the output is a document, not a to-do app. This is a GFM extension.

## Nesting

Indent children **to line up with the parent's text**: two spaces under an unordered item, three under an ordered one.

```markdown
- First
  - Child
    - Grandchild

1. First
   1. Child
   2. Child
```

## Several blocks inside one item

Same alignment rule:

````markdown
1. **Install once**

   ```bash
   npm i -g @nekoleapuki/pamphlet-cli
   ```

2. **Compile**

   You get `plan.html`; double-click it.
````

## Tight versus loose

Items separated by **blank lines** each get wrapped in a paragraph and the spacing opens up (a "loose list"); without blank lines it stays tight.

## Traps

- **For numbered operational steps** use the [steps](/en/write/components/steps) directive, not a plain ordered list
- One space too few reads as a sibling; one too many can become a code block. Align to the parent's text, not to its marker
