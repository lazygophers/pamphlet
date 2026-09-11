# 图片与资源

图片、字体全部**内嵌进产物** —— 图片编码成 base64，字体子集化后写成 data URI。所以产物拷到哪里都完整。

```markdown
![架构图](./图/架构.png)
```

## 路径相对于源文档

图片路径**相对于源文档所在目录**解析，**不是**相对于你跑命令的目录。

```
项目/
├─ docs/
│  ├─ 方案.md          ← 源文档在这
│  └─ 图/
│     └─ 架构.png      ← 写 ./图/架构.png
└─ (在这里跑 pamphlet build docs/方案.md)
```

读不到报 `EMB-402`。

## 远程图片直接报错

```markdown
![图](https://example.com/图.png)   ❌
![图](./图.png)                      ✅
```

得到 `EMB-403`。**没有绕过开关。**

远程资源直接报错而不是静默下载，这样就不会有人不小心产出一个需要联网的产物 —— 那会直接破坏「自包含」这条承诺。

把它下载到本地再引用即可。

## 单个资源上限 2MB

超了报 `EMB-401`，提示会给出具体办法：压一下再放进来（PNG 试 `pngquant --quality=70`），或者改用[图表围栏](/write/diagrams/flowchart)画成 SVG。

上限存在是因为 **base64 编码会让体积膨胀 33.3%**（RFC 2045 §6.8、RFC 4648 §4）—— 一张 2MB 的图进产物就是 2.7MB。

## 内嵌字体

```bash
pamphlet build 方案.md --font ./思源黑体.otf
```

**只留文档用到的字**（子集化）。中文字体动辄几 MB，子集化之后通常只剩几十 KB。

`.ttc`（字体集合，一个文件里装了好几套字体）不能子集化，报 `EMB-404` —— 换成单独的 `.ttf` / `.otf`。

## 编译哪些文件必须说清楚

`pamphlet build` **不带参数时不猜任何默认值**，也没有 `include` / `exclude` 配置字段。

```bash
pamphlet build docs/方案.md
pamphlet build docs/方案.md docs/预算.md
pamphlet build "docs/**/*.md"
```

### 通配符要加引号

**通配符由 Pamphlet 自己展开，不依赖 shell。**

```bash
pamphlet build "docs/**/*.md"     # ✅ 加引号
pamphlet build docs/**/*.md       # ❌ shell 会先抢着展开
```

不加引号时 shell 会先展开一遍，而不同 shell 对 `**` 的支持并不一致：`zsh` 原生支持递归匹配，`bash` 要先 `shopt -s globstar`，否则 `docs/**/*.md` **只匹配一层**。

后果是 CI 里出现「只编译了一部分文件却没有任何报错」—— 那比报错更难发现。

### 不做任何默认排除

:::danger 这一条会咬人
```bash
pamphlet build "**/*.md"     # ❌ 别这么写
```

在一个装了依赖的仓库里，这会命中 `node_modules` 下**成百上千份第三方 Markdown**。而产物写在源文档旁边，于是那些 HTML 会散落在你的依赖目录里。

正确写法是把范围限定住：

```bash
pamphlet build "docs/**/*.md"    # ✅
```
:::

### 为什么不读 `.gitignore`

`.gitignore` 说的是**「什么不要提交」**，与**「什么不要编译」**是两件事。

混用会产生静默的意外：有人因为产物在 `docs/` 里而把整个目录加进 `.gitignore`，结果源文档也一起不编译了。

### 为什么不做配置文件

考虑过两种，都落选：

- **配置里的 `include` / `exclude` 清单**：编译一批文档时最省事，而且可以隐式排除 `node_modules`。落选。
- **不带参数时默认编译当前目录下所有 `.md`**：开箱即用。落选 —— 会把 `README.md`、`CHANGELOG.md` 以及依赖目录里的第三方 Markdown 一起编译，产出一堆没人要的文件。

根本原因是：**任何 `.md` 都是 Pamphlet 的合法输入**（源文档不需要任何身份标记），既然如此，「编译哪些」就必须完全由你说清楚，不能由编译器推断。

> 出处：[ADR-0023](https://github.com/lazygophers/pamphlet/blob/master/docs/adr/0023-explicit-file-paths-only.md)
