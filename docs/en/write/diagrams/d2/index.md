# d2 (not implemented yet)

## What it is

d2 is Terrastruct's diagram scripting language. Like Mermaid it turns text into a picture, but its **automatic layout is stronger**: once a diagram has many nodes, Mermaid's edges start crowding each other while d2 still spreads them out.

It ships four layout engines; `dagre` and `elk` come with the npm package and need no browser.

## What it draws

| What it draws | How |
|---|---|
| Flowcharts, architecture diagrams | shapes plus connections, containers for grouping |
| Sequence diagrams | `shape: sequence_diagram` on a container |
| Database table relationships | `shape: sql_table` |
| Class diagrams | `shape: class` |

**Architecture diagrams are the point of it**: [ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md) records that having d2 built in is exactly why Pamphlet does not need to invent its own architecture-diagram syntax.

## How to write it

A shape is a line of text, a connection is `->`, and the label goes after the colon:

````markdown
```d2
request -> cache: look first
cache -> database: on a miss
database: {
  shape: cylinder
}
```
````

There are eighteen shape names: `rectangle` (default) / `square` / `page` / `parallelogram` / `document` / `cylinder` / `queue` / `package` / `step` / `callout` / `stored_data` / `person` / `diamond` / `oval` / `circle` / `hexagon` / `cloud` / `c4-person`. There are four connection forms: `->` / `<-` / `<->` / `--`.

A sequence diagram is one field on a container:

````markdown
```d2
checkout: {
  shape: sequence_diagram
  user
  orders
  user -> orders: submit
  orders -> user: order id
}
```
````

> Sources: <https://d2lang.com/tour/shapes>, <https://d2lang.com/tour/connections>, <https://d2lang.com/tour/sequence-diagrams>

## Where it stands

**The fence language `d2` is recognised, but the engine is not written yet.** Using it reports `DIAG-301` ("no engine installed that can draw d2") and **fails the build** — not a placeholder box, the whole compile stops.

The planned dependency shape is npm, WASM, no browser, optional like the other six: installing `@nekoleapuki/pamphlet-cli` gets you the compiler and no engines at all. [The other seven engines](/en/write/diagrams/others) explains why.

Until then, reach for the closest [Mermaid fence](/en/write/diagrams/mermaid/).

## Traps

- **Shapes inside a container are referenced with dots**: `outer.inner -> another.shape`
- A connection references a shape's **key**, not the label it displays
- The WASM bundle is about 60MB, the largest of the seven engines

> Source: [ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md)
