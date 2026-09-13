/**
 * 写一个引擎包要用到的东西，就这些。
 *
 * 引擎住在独立的 npm 包里（见 `diagrams/packages.ts`），但换色、尺寸钉定、
 * 超时这些**必须所有引擎一模一样**——否则「切主题图跟着变」这条承诺会在
 * 某一个引擎上悄悄失效。所以它们留在主包里，由引擎包 import 过去。
 *
 * 这不是给第三方的公共扩展点（ADR-0007 的边界没有变）：官方引擎包和主包
 * 一起发版、一起改，形状可以随时调整。
 */

export {
  DEFAULT_TIMEOUT_MS,
  SVG_SIZE_WARN_BYTES,
  withTimeout,
  type Engine,
  type RenderRequest,
  type RenderedDiagram,
} from './diagrams/engine.js'
export { recolor } from './diagrams/recolor.js'
export { pinIntrinsicSize } from './diagrams/pin-size.js'
export { SENTINELS, DIAGRAM_TOKENS, type DiagramToken } from './diagrams/tokens.js'
export { diagnostic, type Diagnostic } from './diagnostics.js'
