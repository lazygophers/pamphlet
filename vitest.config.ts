import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const resolvePath = (relative: string) => fileURLToPath(new URL(relative, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      // 测试跑源码，不依赖 dist —— 否则每次改 runtime 都要先 build 才能跑测试
      '@pamphlet/runtime': resolvePath('./packages/runtime/src/index.ts'),
      '@pamphlet/themes': resolvePath('./packages/themes/src/index.ts'),
      pamphlet: resolvePath('./packages/pamphlet/src/index.ts'),
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
