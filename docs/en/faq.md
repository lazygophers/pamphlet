# FAQ

## Do I have to install it first

No.

```bash
npx @nekoleapuki/pamphlet-cli build plan.md
```

`npx` downloads it, runs it once, and leaves nothing behind. If you use it often, [install it](/en/start/install).

## Why is the command `pamphlet` but the package `@nekoleapuki/pamphlet-cli`

The unscoped name `pamphlet` **was taken in 2018** (<https://www.npmjs.com/package/pamphlet>, latest 4.0.0). It is not an abandoned package and cannot be reclaimed.

Once installed, the command is `pamphlet`.

## Why did my diagram not render

Check the code first:

| Code | Meaning | What to do |
|---|---|---|
| `DIAG-301` | Engine not installed | Run `pamphlet doctor` and follow the hint |
| `DIAG-303` | Bad diagram source, or a timeout | Paste it into <https://mermaid.live> to locate the error |

Only Mermaid works; a ` ```d2 ` fence always reports `DIAG-301`. See [The other seven diagram types](/en/write/diagrams/others).

## Why does it need a 150MB browser

Mermaid needs a real browser's layout engine to measure text; jsdom does not implement `SVGTextElement.getBBox()`. A Mermaid organisation member ruled out the jsdom approach explicitly (<https://github.com/mermaid-js/mermaid/issues/3886#issuecomment-1341694822>).

**A text-only document never launches the browser**, so installing it costs you nothing at runtime.

## Why is my `:::tabs` not working

Almost certainly the colon count. **The outside needs more than the inside**:

```markdown
::::tabs        ← four
:::tab[One]     ← three
content
:::
::::
```

With equal counts, the first `:::` closes the outer one.

## Can I change the fonts and colours

Yes. The twelve [built-in themes](/en/reference/themes) are sorted by document type, each with its own palette and layout:

```bash
pamphlet build plan.md --theme fiction
```

You can also put it in frontmatter so it travels with the document (`--theme` overrides it). To change just a colour or two, see [Changing the theme colours](/en/howto/theme).

## Why did the HTML I pasted break the page

Because **raw HTML passes through unfiltered**. A `<style>` block can override the entire theme system.

That is the design, not a bug — see [CommonMark basics](/en/write/markdown/commonmark).

## Why is the output so large

Run:

```bash
pamphlet build plan.md --verbose
```

It itemises the bill. The usual culprits are diagram SVG (48% in the example document) and embedded images (base64 inflates them by 33.3%).

Pamphlet **sets no size limit**; what to cut is your call.

## They cannot open it on their phone

Since iOS 18.5 Safari does not open local HTML files directly, and WeChat's browser blocks them too. Three workarounds in [What the output is](/en/design/output).

## My footnote disappeared

Writing `[^1]` now **fails with `DOC-105`** rather than vanishing silently. Alternatives in [GFM extensions](/en/write/markdown/gfm).

## Can I write inline maths

No. Only the block ` ```math ` fence — and that engine is not implemented yet.

`$` is everywhere in technical writing (`$ npm install`, `$HOME`, `$99`), and a false positive would turn ordinary prose into a formula.

## Will upgrading break my documents

**During 0.x only patch compatibility is promised**: `0.0.1 → 0.0.2` breaks nothing, `0.0 → 0.1` may break syntax.

Put `pamphlet lint` in CI and you find out immediately. See [Checking documents in CI](/en/howto/ci).

## I lost the source file

As long as the output was built with default options, the source is inside it:

```bash
pamphlet extract plan.html > recovered.md
```

Outputs built with `--no-embed-source` do not carry it.

## Can it build a multi-page site

No. One source file = one HTML file, with no cross-page navigation or site-wide search.

For a multi-page site use VitePress / Rspress / mdBook — the site you are reading is built with Rspress.
