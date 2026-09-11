# 类图

## 这是什么

类、字段、方法，以及类之间的关系。

## 什么时候用

画数据结构、画接口继承、画模块之间谁依赖谁。

## 怎么写

````````````markdown
`````````mermaid
classDiagram
  class Theme {
    +string name
    +ThemeTokens light
    +ThemeTokens dark
  }
  class ThemeTokens {
    +string bg
    +string fg
  }
  Theme --> ThemeTokens
`````````
````````````

## 出来是什么样

编译时就画成 SVG 内联进产物，**读者那边不下载任何绘图库、也不联网**。颜色跟着主题走，可以滚轮缩放、按住拖动、双击复位。

## 坑

- `+` 是公开，`-` 是私有
- `-->` 是关联，`<|--` 是继承，`*--` 是组合
- 一张图里超过七八个类就读不动了
