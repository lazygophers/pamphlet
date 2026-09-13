/** bytefield-svg 不带类型声明；它只有一个默认导出：源码进、SVG 字符串出 */
declare module 'bytefield-svg' {
  const generate: (source: string) => string
  export default generate
}
