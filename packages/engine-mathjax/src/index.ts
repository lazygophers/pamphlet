/**
 * MathJax 引擎：画 ` ```math ` 围栏里的 TeX 公式。
 *
 * 它补的是**Mermaid 完全没有的能力**——一个公式都画不了。
 *
 * 换色这件事它天生就不用做：实测（v3/v4 各 7 个式子）输出 SVG 里的颜色只有
 * 根 `<g>` 上两个 `currentColor`，分数线、根号线、`\cancel` 的斜杠全都没有
 * 自己的 fill/stroke，纯继承。所以公式的颜色跟着正文走，切深色自动跟。
 *
 * 版本**写死 3.2.2**，不是 `^3`：3.2.2 被单独标了 deprecated，`^3` 会解析到
 * 3.2.1。v4（`@mathjax/src`）颜色行为逐字节相同，但 112M vs 50M，而且没有
 * `AllPackages`（扩展要手写清单，漏了只有一行 stderr warning），不换。
 */

import {
  DEFAULT_TIMEOUT_MS,
  diagnostic,
  pinIntrinsicSize,
  recolor,
  type Diagnostic,
  type Engine,
  type RenderRequest,
  type RenderedDiagram,
} from '@nekoleapuki/pamphlet-cli/engine-kit'

interface LiteAdaptor {
  innerHTML: (node: unknown) => string
  textContent: (node: unknown) => string
}

interface MathDocument {
  convert: (tex: string, options: { display: boolean }) => unknown
}

interface Converter {
  adaptor: LiteAdaptor
  document: MathDocument
  styleSheet: () => string
}

let converter: Promise<Converter> | undefined

/**
 * 整个进程共用一套 MathJax。实测初始化 153ms、之后每张 3ms——
 * 每张图重新初始化一次等于把 3ms 的活干成 156ms。
 */
async function getConverter(): Promise<Converter> {
  converter ??= (async () => {
    const [{ mathjax }, { TeX }, { SVG }, { liteAdaptor }, { RegisterHTMLHandler }, { AllPackages }] =
      await Promise.all([
        import('mathjax-full/js/mathjax.js'),
        import('mathjax-full/js/input/tex.js'),
        import('mathjax-full/js/output/svg.js'),
        import('mathjax-full/js/adaptors/liteAdaptor.js'),
        import('mathjax-full/js/handlers/html.js'),
        import('mathjax-full/js/input/tex/AllPackages.js'),
      ])

    const adaptor = liteAdaptor()
    RegisterHTMLHandler(adaptor)
    // fontCache: 'local' 让每张图自带它用到的字形，产物因此是自包含的
    const output = new SVG({ fontCache: 'local' })
    const document = mathjax.document('', {
      InputJax: new TeX({ packages: AllPackages }),
      OutputJax: output,
    })
    return {
      adaptor: adaptor as unknown as LiteAdaptor,
      document: document as unknown as MathDocument,
      styleSheet: () => adaptor.textContent(output.styleSheet(document) as never),
    }
  })()
  return converter
}

/**
 * 把 MathJax 的样式表塞进这张图自己的 `<svg>` 里。
 *
 * **这一步不能省**：实测故意漏掉那约 2KB 的样式表之后，`\begin{array}{|c|c|}`
 * 直接变成一块实心方块把里面的字母整个盖住。而产物是单文件、要能双击打开，
 * 所以样式只能跟着图走，不能指望外部 CSS。
 */
function withStyleSheet(svg: string, css: string): string {
  const at = svg.indexOf('>')
  if (at === -1 || css.trim() === '') return svg
  return `${svg.slice(0, at + 1)}<style>${css}</style>${svg.slice(at + 1)}`
}

export function createEngine(options: { timeoutMs?: number } = {}): Engine {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  return {
    name: 'mathjax',
    langs: ['math'],
    // 公式的颜色全靠 currentColor，没有哨兵注入，所以指纹只认版本
    fingerprint: 'mathjax-3.2.2-local-fontcache',

    async probe() {
      try {
        await import('mathjax-full/js/mathjax.js')
      } catch {
        return {
          available: false,
          hint: '装一次就好：npm i -D @nekoleapuki/pamphlet-engine-mathjax（约 50MB，纯 JS，不需要浏览器）',
        }
      }
      return { available: true }
    },

    async renderOne(request: RenderRequest): Promise<RenderedDiagram | Diagnostic> {
      void timeoutMs
      try {
        const { adaptor, document, styleSheet } = await getConverter()
        // 转换是同步的，不会挂住——所以这里不套超时，套了也拦不住什么
        const node = document.convert(request.code, { display: true })
        // 外面那层是 <mjx-container>，浏览器不认识它，剥掉只留 <svg>
        const svg = adaptor.innerHTML(node)

        // TeX 写错时 MathJax **不抛错**，而是画一个红底的错误框塞进产物里。
        // 那等于把编译期的问题推给读者看，所以这里把它翻成一条诊断
        if (svg.includes('data-mml-node="merror"')) {
          const reason = /aria-label="([^"]*)"/.exec(svg)?.[1] ?? '公式语法有误'
          return diagnostic('DIAG-303', 'error', `MathJax 画不出这个公式：${reason}`, {
            start: { line: request.line, column: 1 },
            hint: '围栏里写的是标准 TeX，和论文里一样；可以先贴到 https://mathjax.github.io/MathJax-demos-web 上试',
          })
        }
        const recolored = recolor(withStyleSheet(pinIntrinsicSize(svg), styleSheet()))
        return { svg: recolored.svg, unmapped: recolored.unmapped }
      } catch (error) {
        return diagnostic(
          'DIAG-303',
          'error',
          `MathJax 画不出这个公式：${error instanceof Error ? error.message : String(error)}`,
          {
            start: { line: request.line, column: 1 },
            hint: '围栏里写的是标准 TeX，和论文里一样；行内公式不支持，只有块级围栏',
          },
        )
      }
    },
  }
}
