# TouchFish 支持列表

一个纯静态的软件展示页面，用于列举 TouchFish 项目旗下的所有软件。基于 [Sober](https://soberjs.com/)（Material 3 Expressive Web Components）构建，自适应桌面、平板与移动端，支持明暗主题。



## 对配置的说明

`config.json` 是本项目的**唯一配置文件**，所有内容均从此处读取，无需改动 HTML/JS/CSS。

### `site` — 站点信息

| 字段          | 类型   | 说明                                                          |
| ------------- | ------ | ------------------------------------------------------------- |
| `title`       | string | 页面标题（顶栏 & 浏览器 Tab）                                 |
| `subtitle`    | string | 页面副标题                                                    |
| `author`      | string | 项目作者（显示在底部）                                        |
| `maintainer`  | string | 主维护者（显示在底部）                                        |
| `theme`       | string | 默认主题：`auto`（默认，跟随系统）/ `light` / `dark`           |
| `footerLinks` | array  | 页脚附加链接，元素为 `{ "label": "...", "url": "..." }`       |

```json
"site": {
  "title": "TouchFish 支持列表",
  "subtitle": "TouchFish 项目旗下的所有软件",
  "author": "TouchFish Team",
  "maintainer": "2044-space-elevator",
  "theme": "auto",
  "footerLinks": [
    { "label": "GitHub 组织", "url": "https://github.com/touchfish-devs" },
    { "label": "邮件联系", "url": "mailto:hi@touchfish.xin" }
  ]
}
```

`author` 和 `maintainer` 任一不为空时，页面底部将显示对应信息。若两者均为空字符串或缺失，则不显示底部信息条。
`theme` 只在访客没有手动切换过主题时生效（手动选择记录在 `localStorage`，优先级更高）。

---

### `categories` — 分类列表

控制顶部 Tab 栏的分类项，**`id: "all"` 的分类会默认选中并展示全部软件**。

| 字段   | 类型   | 说明                         |
| ------ | ------ | ---------------------------- |
| `id`   | string | 唯一标识，用于与 app 关联    |
| `name` | string | 显示名称                     |
| `icon` | string | Material Symbols 图标名      |

```json
"categories": [
  { "id": "all",   "name": "全部", "icon": "apps"  },
  { "id": "chat",  "name": "聊天", "icon": "chat"  },
  { "id": "tools", "name": "工具", "icon": "build" }
]
```

---

### `apps` — 软件列表

每个条目对应一张卡片。

| 字段              | 类型    | 必填 | 说明                                                          |
| ----------------- | ------- | ---- | ------------------------------------------------------------- |
| `id`              | string  | ✅   | 唯一标识                                                      |
| `name`            | string  | ✅   | 软件名称                                                      |
| `category`        | string  | ✅   | 对应 `categories` 中的 `id`                                   |
| `icon`            | object  | ✅   | 图标（见下方说明）                                            |
| `description`     | string  | ✅   | 卡片简介（建议不超过 50 字）                                  |
| `fullDescription` | string  | ✅   | 详情弹窗中的完整描述（缺省时回退为 `description`）            |
| `isOpenSource`    | boolean | ✅   | 是否开源                                                      |
| `license`         | string  |      | 许可证名称，开源时建议填写                                    |
| `author`          | string  |      | 该软件的作者                                                  |
| `maintainer`      | string  |      | 该软件的主维护者                                              |
| `website`         | string  |      | 官网链接（旧写法，等价于一条 `links` 记录）                   |
| `github`          | string  |      | GitHub 链接（旧写法，等价于一条 `links` 记录）                |
| `links`           | array   |      | **通用外链列表**，可放文档、下载、论坛、邮件等任意地址        |
| `badges`          | array   |      | 语义标记（Beta、已停用、推荐……），卡片显示前 2 个，详情全显示 |
| `tags`            | array   |      | 技术标签，如 `["Electron", "Rust"]`，仅在详情弹窗显示         |
| `platforms`       | array   |      | 支持平台，如 `["Windows", "macOS"]`，仅在详情弹窗显示         |

#### `icon` 对象

支持三种类型，也可以用字符串简写为 Material Symbols 图标名：

```json
// 简写：等价于 { "type": "material", "value": "chat" }
"icon": "chat"

// Material Symbols 图标
{ "type": "material", "value": "security" }

// 图片 URL
{ "type": "url", "value": "logo.png" }
{ "type": "image", "value": "https://example.com/icon.png" }

// Emoji
{ "type": "emoji", "value": "🐟" }
```

> `material` 类型使用的图标名需要在 `icons.js` 的 `ICON_PATHS` 中登记（未登记时回退为 `apps`）。
> 需要新图标时，可从 [ms-icon](https://www.npmjs.com/package/ms-icon) 补充。

#### `links` — 通用外链

每条记录生成一个按钮，按顺序排列；**第一个默认 `filled`，其余默认 `tonal`**。

| 字段      | 类型   | 说明                                                                     |
| --------- | ------ | ------------------------------------------------------------------------ |
| `url`     | string | 必填。支持 `https://`、相对路径、`mailto:`、`tel:` 等任意地址          |
| `label`   | string | 按钮文字，缺省时用域名（GitHub 自动显示为 `GitHub`）                      |
| `icon`    | string | Material Symbols 图标名，缺省时按地址推断 |
| `variant` | string | `filled` / `elevated` / `tonal` / `outlined` / `text`，缺省见上           |

```json
"links": [
  { "label": "官网", "url": "https://touchfish.xin/" },
  { "label": "部署文档", "url": "https://docs.touchfish.xin/deploy" },
  { "label": "下载", "url": "https://github.com/xxx/releases/latest" },
  { "label": "邮件联系", "url": "mailto:hi@touchfish.xin", "variant": "text" }
]
```

#### `badges` — 语义标记

元素可以是字符串，也可以是 `{ "label": "...", "tone": "..." }`：

| `tone`                       | 效果                     |
| ---------------------------- | ------------------------ |
| `default` / `muted`          | 中性灰（默认）           |
| `info`                       | 次要色容器               |
| `accent`                     | 主色容器（如「主项目」） |
| `success`                    | 绿色容器（如「推荐」）   |
| `warning`                    | 黄色容器（如「Beta」）   |
| `error`                      | 红色容器（如「已停用」） |

```json
"badges": [
  { "label": "推荐", "tone": "success" },
  { "label": "Beta", "tone": "warning" },
  "仅限邀请"
]
```

#### `tags` / `platforms`

```json
"tags": ["Golang", "WebSocket"],
"platforms": ["Linux", "Windows", "macOS"]
```


## 许可证

本项目仓库代码采用 [MIT License](LICENSE) 授权。各软件条目的许可证以其自身声明为准。
