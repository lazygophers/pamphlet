/**
 * 引擎住在**独立的 npm 包**里，用到哪个装哪个。
 *
 * 主包只内置 Mermaid。别的引擎（Graphviz、MathJax、d2…）各自一个包，
 * 用不到就一个字节都不下载——七个全装约 340MB，d2 自己就 91.4MB，
 * 把这个代价摊给写纯文字的人是采用率杀手。
 *
 * 发现机制刻意做成一张**静态表加一次动态 import**，不是插件系统：
 * 围栏语言的集合是固定的（`ast.ts` 的 `FENCE_LANGUAGES`），
 * 所以「哪个语言归哪个包」是常量，不需要扫描、不需要注册、不需要配置文件。
 * 配置零代码执行这条边界（ADR-0007）因此原样保住。
 */

import type { FenceLanguage } from '../ast.js'
import type { Engine } from './engine.js'

/** 围栏语言 → 提供它的引擎包。`mermaid` 不在表里，它内置在主包。 */
export const ENGINE_PACKAGES: Partial<Record<FenceLanguage, string>> = {
  dot: '@nekoleapuki/pamphlet-engine-graphviz',
  math: '@nekoleapuki/pamphlet-engine-mathjax',
  'vega-lite': '@nekoleapuki/pamphlet-engine-vega-lite',
  bytefield: '@nekoleapuki/pamphlet-engine-bytefield',
  wavedrom: '@nekoleapuki/pamphlet-engine-wavedrom',
  d2: '@nekoleapuki/pamphlet-engine-d2',
  plantuml: '@nekoleapuki/pamphlet-engine-plantuml',
}

/** 引擎包的唯一约定：导出一个 `createEngine()`。 */
interface EnginePackage {
  createEngine: () => Engine
}

function isEnginePackage(module: unknown): module is EnginePackage {
  return typeof (module as EnginePackage | undefined)?.createEngine === 'function'
}

/** 某个围栏语言没有引擎可用时，作者该看到的东西 */
export interface MissingEngine {
  lang: FenceLanguage
  package: string
  /** 装它的命令，直接粘贴就能跑——缺引擎会让整次构建失败，这条提示是作者唯一的出路 */
  install: string
}

export function installCommand(packageName: string): string {
  return `npm i -D ${packageName}`
}

/**
 * 给这些围栏语言找引擎。
 *
 * 找不到的不抛错，放进 `missing` 一起返回：一份文档可能同时缺两个引擎，
 * 一次把话说完比让作者装一个再编一次、再看到下一条强。
 */
export async function loadEnginePackages(
  langs: Iterable<FenceLanguage>,
  table: Partial<Record<FenceLanguage, string>> = ENGINE_PACKAGES,
): Promise<{ engines: Engine[]; missing: MissingEngine[] }> {
  const engines: Engine[] = []
  const missing: MissingEngine[] = []

  for (const lang of new Set(langs)) {
    const packageName = table[lang]
    if (packageName === undefined) continue

    const loaded: unknown = await import(packageName).catch(() => undefined)
    if (!isEnginePackage(loaded)) {
      missing.push({ lang, package: packageName, install: installCommand(packageName) })
      continue
    }
    engines.push(loaded.createEngine())
  }

  return { engines, missing }
}
