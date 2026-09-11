# State diagrams

## What it is

Which states a thing can be in, and **what makes it move between them**.

## When to use it

Order status, connection lifecycle, an approval flow.

## How to write it

````````````markdown
`````````mermaid
stateDiagram-v2
  [*] --> Parse
  Parse --> Render: has a diagram fence
  Parse --> Assemble: text only
  Render --> Assemble
  Assemble --> [*]
`````````
````````````

## What comes out

Drawn to SVG at compile time and inlined into the output, so **the reader downloads no drawing library and makes no network request**. Colours follow the theme; scroll to zoom, drag to pan, double-click to reset.

## Traps

- `[*]` is both start and end
- Put the **trigger** after the colon; an unlabelled arrow never explains why the change happens
- Use `stateDiagram-v2`, not the older `stateDiagram`
