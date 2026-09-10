# serve

Local preview that recompiles and reloads whenever the source changes.

```bash
pamphlet serve plan.md
pamphlet serve plan.md --port 8080
```

| Option | Default |
|---|---|
| `--port <port>` | `4321` |

Reloading uses SSE (Server-Sent Events, the standard way for a server to push messages to a browser), so you never press refresh.

## One file at a time

A glob matching several files errors with exit `2`.

Previewing is the "watch one document while editing it" case; watching several at once means nothing — the browser shows one page anyway.

## Is the preview the same as a build

Yes. `serve` runs the same compile pipeline and sends the result to an in-memory HTTP server instead of writing a file.

So diagnostics, placeholder boxes and size in the preview match a `build` exactly.
