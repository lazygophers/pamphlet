# d2

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

## Install it once

It does not come with Pamphlet — install it when you need it, and everyone else downloads nothing (解包约 91.4MB，七个里最大的一个):

```bash
npm i -D @nekoleapuki/pamphlet-engine-d2
```

Then confirm with `pamphlet doctor`:

```
✓ d2（d2）
```

**Using the fence without installing it**: you get `DIAG-301` and **the whole build fails** (no placeholder box), with that command in the hint.

Licence: MPL-2.0.

**A note on the package name**: upstream renamed `@terrastruct/d2` to `@d2lang/d2`, and the old name carries no deprecation marker — installing it warns about nothing, yet the old package never lets the process exit. The engine package pins the new name, so this is not your problem.

## Traps

- **Shapes inside a container are referenced with dots**: `outer.inner -> another.shape`
- A connection references a shape's **key**, not the label it displays
- The WASM bundle is about 60MB, the largest of the seven engines

> Sources: [ADR-0041](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0041-engines-are-separate-packages.md) (engines as separate packages), [ADR-0008](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0008-builtin-engines.md) (why these seven)
