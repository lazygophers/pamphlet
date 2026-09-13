/** wavedrom 和 onml 都不带类型声明，这里只声明我们用到的那几个出口 */
declare module 'wavedrom' {
  const wavedrom: { renderAny: (index: number, source: unknown, skin: unknown) => unknown }
  export default wavedrom
}
declare module 'wavedrom/skins/default.js' {
  const skin: unknown
  export default skin
}
declare module 'onml' {
  const onml: { stringify: (tree: unknown) => string }
  export default onml
}
