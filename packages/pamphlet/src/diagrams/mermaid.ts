/**
 * Mermaid 引擎。走 mermaid-isomorphic（官方方案，内部是 Playwright + Chromium）。
 *
 * 浏览器是**惰性启动的进程内单例**：第一次真的需要渲染时才拉起来，
 * 之后整个进程共用；进程退出时随之关闭，不暴露显式的关闭接口。
 * 这样 `build`（跑完就退）与 `serve`（进程常驻）共用同一套代码——
 * 差别只在进程活多久，而那不是渲染层该关心的事。
 *
 * 纯文本文档永远不会拉起浏览器（实测冷启动 733ms，白付很浪费）。
 */

import { createHash } from 'node:crypto'
import { diagnostic, type Diagnostic } from '../diagnostics.js'
import {
  DEFAULT_TIMEOUT_MS,
  SVG_SIZE_WARN_BYTES,
  withTimeout,
  type Engine,
  type RenderRequest,
  type RenderedDiagram,
} from './engine.js'
import { recolor } from './recolor.js'
import { pinIntrinsicSize } from './pin-size.js'
import { SENTINELS } from './tokens.js'

/**
 * 把哨兵色当主题色喂给 Mermaid。两个作用：
 *  1. 输出里的颜色变成可识别的哨兵，替换时不必靠猜；
 *  2. 实测证明喂十六进制能把 Mermaid 输出里的 CSS 具名色（`fill:black`）挤掉——
 *     而只替十六进制是已定的策略，具名色漏掉的后果是暗色下看不见的文字。
 */
const THEME_VARIABLES = {
  primaryColor: SENTINELS.fill,
  primaryTextColor: SENTINELS.text,
  primaryBorderColor: SENTINELS.line,
  secondaryColor: SENTINELS.fill,
  tertiaryColor: SENTINELS.bg,
  background: SENTINELS.bg,
  mainBkg: SENTINELS.fill,
  lineColor: SENTINELS.line,
  textColor: SENTINELS.text,
  nodeTextColor: SENTINELS.text,
  actorBkg: SENTINELS.fill,
  actorBorder: SENTINELS.line,
  actorTextColor: SENTINELS.text,
  actorLineColor: SENTINELS.line,
  signalColor: SENTINELS.line,
  signalTextColor: SENTINELS.text,
  labelBoxBkgColor: SENTINELS.fill,
  labelBoxBorderColor: SENTINELS.line,
  labelTextColor: SENTINELS.text,
  loopTextColor: SENTINELS.text,
  noteBkgColor: SENTINELS.fill,
  noteTextColor: SENTINELS.text,
  noteBorderColor: SENTINELS.line,
  activationBkgColor: SENTINELS.accent,
  activationBorderColor: SENTINELS.line,
  sequenceNumberColor: SENTINELS.bg,
  altBackground: SENTINELS.bg,
  clusterBkg: SENTINELS.bg,
  clusterBorder: SENTINELS.line,
  edgeLabelBackground: SENTINELS.bg,
  titleColor: SENTINELS.text,
  // 箭头头部与出错提示。这三个不钉住，Mermaid 会从别的色**算**出来
  // （它源码里写作 `'calculated'`），算出来的值不在哨兵表里，
  // 于是 DIAG-304 会报「有硬编码色值换不掉」——实测漏的就是 `#00fffe`。
  arrowheadColor: SENTINELS.line,
  errorBkgColor: SENTINELS.fill,
  errorTextColor: SENTINELS.text,

  // ── 按图种补的那些 ──────────────────────────────────────────────────
  // 上面那批只覆盖流程图和时序图。甘特图、饼图、类图、ER 图、状态图各有
  // 自己的一组主题变量，不钉住的话 Mermaid 会用它自己的默认色（实测漏出
  // `#003163` `#eeeeee` `#ff8888`），那些颜色不跟主题走。
  // 变量名逐个对着 mermaid@11.17.2 的 theme-default 核过，不是凭印象写的。

  // 甘特图
  sectionBkgColor: SENTINELS.bg,
  sectionBkgColor2: SENTINELS.bg,
  altSectionBkgColor: SENTINELS.fill,
  excludeBkgColor: SENTINELS.fill,
  gridColor: SENTINELS.line,
  taskBkgColor: SENTINELS.fill,
  taskBorderColor: SENTINELS.line,
  taskTextColor: SENTINELS.text,
  taskTextOutsideColor: SENTINELS.text,
  taskTextDarkColor: SENTINELS.text,
  taskTextLightColor: SENTINELS.bg,
  taskTextClickableColor: SENTINELS.accent,
  activeTaskBkgColor: SENTINELS.accent,
  activeTaskBorderColor: SENTINELS.line,
  doneTaskBkgColor: SENTINELS.muted,
  doneTaskBorderColor: SENTINELS.line,
  critBkgColor: SENTINELS.fill,
  critBorderColor: SENTINELS.accent,
  todayLineColor: SENTINELS.accent,

  // 饼图。扇区颜色必须**逐个钉死**：留给 Mermaid 自己算，它会把主色按比例调亮调暗，
  // 算出来的既不是哨兵、又是 `rgb()` 写法，两头都躲过替换——页面上就是几块刺眼的洋红。
  // 只有六个图表 token，所以十二个扇区按四色循环，靠描边分开相邻的两块。
  pie1: SENTINELS.accent,
  pie2: SENTINELS.muted,
  pie3: SENTINELS.line,
  pie4: SENTINELS.fill,
  pie5: SENTINELS.accent,
  pie6: SENTINELS.muted,
  pie7: SENTINELS.line,
  pie8: SENTINELS.fill,
  pie9: SENTINELS.accent,
  pie10: SENTINELS.muted,
  pie11: SENTINELS.line,
  pie12: SENTINELS.fill,
  pieStrokeColor: SENTINELS.bg,
  pieOuterStrokeColor: SENTINELS.line,
  pieTitleTextColor: SENTINELS.text,
  pieSectionTextColor: SENTINELS.text,
  pieLegendTextColor: SENTINELS.text,

  // 架构图（architecture-beta）
  archEdgeColor: SENTINELS.line,
  archEdgeArrowColor: SENTINELS.line,
  archGroupBorderColor: SENTINELS.line,

  // 块图、思维导图、数据包图共用的这三个填充
  blockFillColor: SENTINELS.fill,
  leafFillColor: SENTINELS.fill,
  sectionFillColor: SENTINELS.fill,

  // 时间线、旅程图的十二档配色。留给 Mermaid 自己算，它会把主色一档档调亮，
  // 算出来的是 `#ff0508` 这种擦着哨兵边的值——既换不掉，又刺眼
  cScale0: SENTINELS.accent,
  cScale1: SENTINELS.muted,
  cScale2: SENTINELS.line,
  cScale3: SENTINELS.fill,
  cScale4: SENTINELS.accent,
  cScale5: SENTINELS.muted,
  cScale6: SENTINELS.line,
  cScale7: SENTINELS.fill,
  cScale8: SENTINELS.accent,
  cScale9: SENTINELS.muted,
  cScale10: SENTINELS.line,
  cScale11: SENTINELS.fill,
  cScaleLabel0: SENTINELS.bg,
  cScaleLabel1: SENTINELS.text,
  cScaleLabel2: SENTINELS.text,
  cScaleLabel3: SENTINELS.text,
  cScaleLabel4: SENTINELS.bg,
  cScaleLabel5: SENTINELS.text,
  cScaleLabel6: SENTINELS.text,
  cScaleLabel7: SENTINELS.text,
  cScaleLabel8: SENTINELS.bg,
  cScaleLabel9: SENTINELS.text,
  cScaleLabel10: SENTINELS.text,
  cScaleLabel11: SENTINELS.text,

  // 象限图
  quadrant1Fill: SENTINELS.fill,
  quadrant2Fill: SENTINELS.bg,
  quadrant3Fill: SENTINELS.fill,
  quadrant4Fill: SENTINELS.bg,
  quadrantPointFill: SENTINELS.accent,
  quadrantPointTextFill: SENTINELS.text,
  quadrantTitleFill: SENTINELS.text,
  quadrantXAxisTextFill: SENTINELS.text,
  quadrantYAxisTextFill: SENTINELS.text,
  quadrantInternalBorderStrokeFill: SENTINELS.line,
  quadrantExternalBorderStrokeFill: SENTINELS.line,

  // git 分支图
  git0: SENTINELS.accent,
  git1: SENTINELS.muted,
  git2: SENTINELS.line,
  git3: SENTINELS.fill,
  git4: SENTINELS.accent,
  git5: SENTINELS.muted,
  git6: SENTINELS.line,
  git7: SENTINELS.fill,
  gitBranchLabel0: SENTINELS.bg,
  gitBranchLabel1: SENTINELS.text,
  gitBranchLabel2: SENTINELS.text,
  gitBranchLabel3: SENTINELS.text,
  gitBranchLabel4: SENTINELS.bg,
  gitBranchLabel5: SENTINELS.text,
  gitBranchLabel6: SENTINELS.text,
  gitBranchLabel7: SENTINELS.text,
  commitLabelColor: SENTINELS.text,
  commitLabelBackground: SENTINELS.bg,
  tagLabelColor: SENTINELS.text,
  tagLabelBackground: SENTINELS.fill,
  tagLabelBorder: SENTINELS.line,

  // 类图、ER 图、状态图
  classText: SENTINELS.text,
  attributeBackgroundColorOdd: SENTINELS.fill,
  attributeBackgroundColorEven: SENTINELS.bg,
  erEdgeLabelBackground: SENTINELS.bg,
  relationLabelBackground: SENTINELS.bg,
  relationLabelColor: SENTINELS.text,
  stateBkg: SENTINELS.fill,
  stateBorder: SENTINELS.line,
  stateLabelColor: SENTINELS.text,
  stateEdgeLabelBackground: SENTINELS.bg,
  specialStateColor: SENTINELS.text,
  transitionLabelColor: SENTINELS.text,
  labelBackgroundColor: SENTINELS.bg,
} as const

/**
 * C4 图（`C4Context` 等）的颜色**不走 themeVariables**，走 `c4` 这个配置段，
 * 键名是 `person_bg_color` 这一路的下划线写法（mermaid@11.17.2 的默认配置里共 42 个）。
 * 不钉住的话它用自己那套 C4 官方蓝，在深色页面上是一块看不清的深蓝。
 *
 * 「本体填充 + 边框」这个结构重复十几遍，所以按前缀生成，不手抄四十行。
 */
const C4_SHAPES = [
  'person',
  'external_person',
  'system',
  'system_db',
  'system_queue',
  'external_system',
  'external_system_db',
  'external_system_queue',
  'container',
  'container_db',
  'container_queue',
  'external_container',
  'external_container_db',
  'external_container_queue',
  'component',
  'component_db',
  'component_queue',
  'external_component',
  'external_component_db',
  'external_component_queue',
] as const

const C4_CONFIG: Record<string, string> = {
  ...Object.fromEntries(
    C4_SHAPES.flatMap((shape) => [
      // 外部系统用次要色，自家的用强调色——这是 C4 图本身的读法，不是随便分的
      [`${shape}_bg_color`, shape.startsWith('external_') ? SENTINELS.muted : SENTINELS.accent],
      [`${shape}_border_color`, SENTINELS.line],
    ]),
  ),
  rect_border_color: SENTINELS.line,
  text_color: SENTINELS.bg,
}

type MermaidRenderer = (
  diagrams: readonly string[],
  options?: { mermaidConfig?: Record<string, unknown> },
) => Promise<
  ({ status: 'fulfilled'; value: { svg: string } } | { status: 'rejected'; reason: unknown })[]
>

/** 进程内单例，惰性初始化 */
let renderer: MermaidRenderer | undefined

async function getRenderer(): Promise<MermaidRenderer> {
  if (renderer) return renderer
  const mod: unknown = await import('mermaid-isomorphic')
  const create = (mod as { createMermaidRenderer?: () => MermaidRenderer }).createMermaidRenderer
  if (typeof create !== 'function') {
    throw new Error('mermaid-isomorphic 没有导出 createMermaidRenderer')
  }
  renderer = create()
  return renderer
}

export interface MermaidOptions {
  timeoutMs?: number
  /** 只给测试用：替掉真实的渲染器，免得为了测超时与失败分支真去卡一个浏览器 */
  renderer?: MermaidRenderer
}

export function createMermaidEngine(options: MermaidOptions = {}): Engine {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const resolveRenderer = options.renderer
    ? async (): Promise<MermaidRenderer> => options.renderer as MermaidRenderer
    : getRenderer

  return {
    name: 'mermaid',
    langs: ['mermaid'],
    fingerprint: createHash('sha256')
      .update(JSON.stringify({ THEME_VARIABLES, C4_CONFIG }))
      .digest('hex')
      .slice(0, 8),

    async probe() {
      try {
        await import('mermaid-isomorphic')
      } catch {
        return {
          available: false,
          hint: '装一次就好：npm i -g mermaid-isomorphic playwright && npx playwright install chromium（首次约 150MB）',
        }
      }
      return { available: true }
    },

    // Mermaid 是唯一实现批量的引擎——省的是浏览器往返，见 engine.ts 的注释
    async renderOne(request: RenderRequest) {
      const [only] = await this.renderBatch!([request])
      return only ?? { svg: '', unmapped: [] }
    },

    async renderBatch(requests: RenderRequest[]) {
      if (requests.length === 0) return []

      let results: Awaited<ReturnType<MermaidRenderer>>
      try {
        const render = await resolveRenderer()
        results = await withTimeout(
          render(
            requests.map((r) => r.code),
            { mermaidConfig: { theme: 'base', themeVariables: THEME_VARIABLES, c4: C4_CONFIG } },
          ),
          timeoutMs,
          () => new Error(`渲染超过 ${timeoutMs / 1000} 秒`),
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        // 整批失败（浏览器起不来、超时）：每张图各给一条诊断，别只报一条让人猜是哪张
        return requests.map((r) =>
          diagnostic('DIAG-303', 'error', `mermaid 渲染失败：${message}`, {
            start: { line: r.line, column: 1 },
            hint: '这张图会以占位框的形式出现在产物里，构建仍然会失败（退出码 1）',
          }),
        )
      }

      return results.map((result, index) => {
        const request = requests[index]
        const at = { line: request?.line ?? 1, column: 1 }

        if (result.status === 'rejected') {
          const message = String(
            (result.reason as { message?: unknown })?.message ?? result.reason,
          ).split('\n')[0]
          return diagnostic('DIAG-303', 'error', `mermaid 画不出这张图：${message}`, {
            start: at,
            hint: '检查图源的语法；在 https://mermaid.live 上贴进去能更快定位',
          })
        }

        const { svg, unmapped } = recolor(pinIntrinsicSize(result.value.svg))
        return { svg, unmapped } satisfies RenderedDiagram
      })
    },
  }
}

export function sizeDiagnostic(bytes: number, line: number): Diagnostic | undefined {
  if (bytes <= SVG_SIZE_WARN_BYTES) return undefined
  return diagnostic(
    'DIAG-302',
    'warning',
    `这张图的 SVG 有 ${Math.round(bytes / 1024)}KB`,
    {
      start: { line, column: 1 },
      hint: '图太大通常意味着节点太多，读者也看不清；考虑拆成几张',
    },
  )
}
