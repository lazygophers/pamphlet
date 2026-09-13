import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const resolvePath = (relative: string) => fileURLToPath(new URL(relative, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      // 测试跑源码，不依赖 dist —— 否则每次改 runtime 都要先 build 才能跑测试
      '@nekoleapuki/pamphlet-runtime': resolvePath('./packages/runtime/src/index.ts'),
      '@nekoleapuki/pamphlet-themes': resolvePath('./packages/themes/src/index.ts'),
      // 子路径要排在裸包名前面：alias 按顺序前缀匹配，反过来写 `/engine-kit` 永远命不中。
      // 少了这一条，从仓库根跑 vitest 时引擎包解析不到主包（实测 ERR_MODULE_NOT_FOUND，
      // 而从 packages/pamphlet 里跑却是好的——差别正是解析的起点在哪）
      '@nekoleapuki/pamphlet-cli/engine-kit': resolvePath('./packages/pamphlet/src/engine-kit.ts'),
      '@nekoleapuki/pamphlet-cli': resolvePath('./packages/pamphlet/src/index.ts'),
      ...Object.fromEntries(
        ['graphviz', 'mathjax', 'vega-lite', 'bytefield', 'wavedrom', 'd2', 'plantuml'].map(
          (engine) => [
            `@nekoleapuki/pamphlet-engine-${engine}`,
            resolvePath(`./packages/engine-${engine}/src/index.ts`),
          ],
        ),
      ),
    },
  },
  test: {
    include: ['packages/*/test/**/*.test.ts'],
    coverage: {
      include: ['packages/*/src/**/*.ts'],
      // bin.ts 只是入口、index.ts 只是重新导出，两者没有分支可测
      // bin.ts 只是入口、index.ts 只是重新导出、.d.ts 是补给第三方库的类型声明，
      // 三者都没有可执行的分支
      exclude: [
        'packages/*/src/bin.ts',
        'packages/pamphlet/src/index.ts',
        'packages/*/src/**/*.d.ts',
      ],
      thresholds: { statements: 95, branches: 90, functions: 95, lines: 95 },
    },
  },
})
