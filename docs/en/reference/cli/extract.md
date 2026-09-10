# extract

Recover the source file from an output file, verbatim.

```bash
pamphlet extract plan.html > recovered.md
```

The source is embedded in an HTML comment by default, so **the output is its own backup** — with nothing but the HTML file you can still get the `.md` back.

## Not for files built with `--no-embed-source`

Those outputs do not carry the comment, and `extract` fails with exit `1`.

When to turn embedding off: the output goes to someone external and the source contains notes or drafts they should not see. The cost is losing this recovery.

The size cost is measurable — run `pamphlet build --verbose` and read the "embedded source" line (measured on this repository's example: 3.8KB, 11% of the file).
