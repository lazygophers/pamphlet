# doctor

Print, engine by engine, whether it is installed and how to install it.

```bash
pamphlet doctor
```

Installed (output verbatim; compiler messages are Chinese-only for now):

```
✓ mermaid（mermaid）
```

Not installed:

```
✗ mermaid（mermaid）：装一次就好：npm i -g mermaid-isomorphic playwright && npx playwright install chromium（首次约 150MB）
```

**A missing engine exits `3`** (environment missing), not `1`. They are separate so CI can distinguish "the document is wrong" from "the machine is missing software".

## One line in this version

Only Mermaid is implemented, so there is only one line. The rest are in [The other seven diagram types](/en/write/diagrams/others).

When PlantUML lands, `doctor` will check `java -version` and give a clear diagnostic when it is missing, rather than letting a raw `spawn` failure surface.
