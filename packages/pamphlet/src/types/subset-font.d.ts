/**
 * subset-font 没带类型声明（仓库里只有 index.js），这里按它 README 的签名补一份。
 * 只声明用到的那部分：Buffer 进、想留的字符、目标格式。
 * 出处：https://github.com/papandreou/subset-font#readme
 */
declare module 'subset-font' {
  export default function subsetFont(
    font: Buffer,
    text: string,
    options?: { targetFormat?: 'sfnt' | 'woff' | 'woff2'; variationAxes?: Record<string, unknown> },
  ): Promise<Buffer>
}
