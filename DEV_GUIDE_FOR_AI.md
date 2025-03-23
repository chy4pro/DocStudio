# DocStudio AI开发指南

> 注意：此文档专为AI助手设计，提供快速代码定位和修改参考。

## 设计理念与原则

DocStudio采用以下核心设计理念，修改代码时应当遵循这些原则：

### 组件化设计原则

- **单一职责原则** - 每个组件只负责一个特定功能域（Draft负责左侧编辑，Preview负责右侧预览等）
- **松耦合高内聚** - 组件间通过事件系统通信，减少直接依赖
- **状态封装** - 组件内部状态通过`state`对象管理，不直接暴露，通过公共API访问
- **DOM引用隔离** - 组件只操作自己的DOM元素，通过`elements`对象引用

### 事件驱动架构

- **发布/订阅模式** - 组件间通过EventSystem实现松耦合通信
- **标准事件命名** - 使用`组件名:事件类型`格式确保清晰性
- **事件数据规范** - 事件数据以对象形式传递，包含必要的上下文信息
- **事件处理分离** - 事件发布与处理在不同组件，避免循环依赖

### API设计一致性

- **初始化模式** - 所有组件使用相同的`init(options)`初始化方法
- **链式调用** - 方法返回`this`以支持链式调用（如`Draft.setContent().focus()`）
- **命名一致性** - 使用`get/set/is/handle`前缀表达意图
- **公共API与私有方法** - 公共API直接挂在组件对象上，私有方法通常以下划线开头

### 状态管理与持久化

- **组件状态自治** - 每个组件管理自己的状态，不直接修改其他组件状态
- **localStorage分域** - 使用特定键名区分不同组件的持久化数据
- **状态初始化** - 组件加载时从localStorage恢复状态
- **即时保存** - 状态变化时及时保存到localStorage（使用防抖）

### 错误处理原则

- **优雅降级** - 出错时保持基本功能可用
- **错误反馈** - 向用户和控制台提供清晰的错误信息
- **错误隔离** - 一个组件的错误不应影响其他组件
- **恢复机制** - 提供从错误状态恢复的方法（如内容整理的回退功能）

## 系统架构概览

DocStudio使用组件化、事件驱动架构，分为以下几个部分：

```
DocStudio/
├── index.html          # 主HTML文件，包含UI结构
├── styles.css          # 全局样式
├── script.js           # 协调脚本（负责Generate和Render功能）
├── js/                 # JavaScript模块目录
│   ├── events.js       # 事件系统
│   ├── main.js         # 应用初始化和组件协调
│   ├── components/     # UI组件
│   │   ├── Draft.js    # 左侧工作区组件
│   │   ├── Preview.js  # 右侧预览区组件
│   │   └── Publish.js  # HTML渲染和展示组件
│   └── services/       # 通用服务
│       ├── Settings.js        # 设置管理服务
│       └── RightClickMenu.js  # 右键菜单服务
└── about.html          # 使用帮助页面
```

### 加载顺序

加载顺序在index.html中定义：
1. 外部库: marked.min.js, turndown.js
2. 事件系统: events.js
3. 服务: Settings.js, RightClickMenu.js
4. 组件: Draft.js, Preview.js, Publish.js
5. 初始化: main.js
6. 协调脚本: script.js

## 组件索引

### Draft组件 (js/components/Draft.js)

**功能**: 负责左侧工作区的所有功能

**核心属性**:
- `elements` - DOM元素引用
- `state` - 组件状态管理

**关键方法**:
- `init()` - 组件初始化
- `getContent()` - 获取编辑内容
- `setContent(content)` - 设置编辑内容
- `organizeContent()` - 内容整理功能
- `getAISuggestion()` - 获取AI建议

**事件发布**:
- `draft:initialized` - 组件初始化完成
- `draft:content-updated` - 内容更新时
- `draft:content-saved` - 内容保存时
- `draft:organize-started` - 整理开始时
- `draft:organize-completed` - 整理完成时
- `draft:ai-suggestion-completed` - AI建议完成时

**事件订阅**:
- `settings:updated` - 响应设置更改
- `rightClickMenu:contentInserted` - 响应右键菜单内容插入

**修改重点**:
- 更改AI建议逻辑: `getAISuggestion()` 方法
- 修改内容整理功能: `organizeContent()` 方法
- 更改自动保存行为: `handleInput()` 方法

### Preview组件 (js/components/Preview.js)

**功能**: 负责右侧预览区的Markdown编辑和预览

**核心属性**:
- `elements` - DOM元素引用
- `state` - 组件状态

**关键方法**:
- `init()` - 组件初始化
- `getContent()` - 获取预览内容
- `setContent(content)` - 设置预览内容
- `renderMarkdown(markdown)` - 将Markdown渲染为HTML
- `toggleRenderMode(isEnabled)` - 切换编辑/预览模式

**事件发布**:
- `preview:initialized` - 组件初始化完成
- `preview:content-updated` - 内容更新时
- `preview:markdown-rendered` - Markdown渲染完成时
- *注：render按钮功能已迁移至script.js*

**修改重点**:
- 更改Markdown渲染逻辑: `renderMarkdown()` 方法
- 修改预览模式切换: `toggleRenderMode()` 方法

### Publish组件 (js/components/Publish.js)

**功能**: 负责HTML渲染和iframe展示

**核心属性**:
- `elements` - DOM元素引用
- `state` - 组件状态

**关键方法**:
- `init()` - 组件初始化
- `render(content)` - 渲染内容为HTML
- `generateHTML(content)` - 生成HTML内容
- `showIframe()` / `hideIframe()` - 控制iframe显示/隐藏
- `writeToIframe(html)` - 向iframe写入内容

**事件发布**:
- `publish:initialized` - 组件初始化完成
- `publish:render-started` - 渲染开始时
- `publish:render-completed` - 渲染完成时
- `publish:iframe-opened` - iframe打开时
- `publish:iframe-closed` - iframe关闭时

**事件订阅**:
- *注：不再订阅预览组件的渲染请求，由script.js直接调用*

**修改重点**:
- 更改HTML生成逻辑: `generateHTML()` 方法
- 修改iframe显示行为: `showIframe()` / `hideIframe()` 方法

## 服务索引

### Settings服务 (js/services/Settings.js)

**功能**: 负责API设置的管理和持久化

**核心方法**:
- `init()` - 服务初始化
- `loadSettings()` - 加载保存的设置
- `saveSettings(settings)` - 保存设置到localStorage
- `testConnection(settings)` - 测试API连接

**事件发布**:
- `settings:initialized` - 初始化完成时
- `settings:updated` - 设置更新时
- `settings:test-success` / `settings:test-error` - 连接测试结果

**修改重点**:
- 更改设置保存逻辑: `saveSettings()` 方法
- 修改连接测试功能: `testConnection()` 方法

### RightClickMenu服务 (js/services/RightClickMenu.js)

**功能**: 处理右键菜单和AI问答功能

**核心方法**:
- `init()` - 服务初始化
- `showMenu(x, y, targetElement)` - 显示右键菜单
- `hideMenu()` - 隐藏右键菜单
- `generateResponse(prompt, targetElement)` - 生成AI回答

**事件发布**:
- `rightClickMenu:shown` - 菜单显示时
- `rightClickMenu:hidden` - 菜单隐藏时
- `rightClickMenu:responseGenerated` - 回答生成时
- `rightClickMenu:contentInserted` - 内容插入时

**修改重点**:
- 更改右键菜单行为: `showMenu()` / `hideMenu()` 方法
- 修改AI响应生成: `generateResponse()` 方法

### EventSystem (js/events.js)

**功能**: 提供事件发布/订阅系统，实现组件间通信

**核心方法**:
- `publish(eventName, data)` - 发布事件
- `subscribe(eventName, callback)` - 订阅事件
- `unsubscribe(eventName, callback)` - 取消订阅

**修改重点**:
- 添加新事件类型: 在相应组件中使用`EventSystem.publish()`

## 主要文件功能和定位

### index.html
- **用途**: 定义页面结构、加载脚本
- **修改场景**: 更改页面布局、添加新UI元素、调整脚本加载顺序

### main.js
- **用途**: 初始化所有组件和服务，建立事件监听
- **修改场景**: 更改组件初始化顺序、添加新组件初始化、修改组件间协作

### script.js
- **用途**: 处理Generate按钮功能和render按钮功能，组件间的协调和内容转换
- **修改场景**: 修改Generate功能、修改render功能、调整组件间协作逻辑

## 功能修改定位表

| 需要修改的功能 | 主要文件 | 具体位置/方法 |
|--------------|--------|-------------|
| 修改左侧编辑区UI | index.html, styles.css | 编辑区容器相关元素和CSS |
| 修改右侧预览区UI | index.html, styles.css | 预览区容器相关元素和CSS |
| 修改编辑区功能 | js/components/Draft.js | 相关方法(getContent, setContent等) |
| 修改预览区功能 | js/components/Preview.js | 相关方法(renderMarkdown等) |
| 修改自动保存行为 | js/components/Draft.js, js/components/Preview.js | handleInput方法中的保存逻辑 |
| 修改generate功能 | script.js | generateBtn点击事件处理函数 |
| 修改HTML渲染功能 | js/components/Publish.js | generateHTML, render方法 |
| 修改iframe展示 | js/components/Publish.js | showIframe, hideIframe方法 |
| 修改设置面板 | index.html, js/services/Settings.js | 设置模态框HTML和JS处理 |
| 修改右键菜单功能 | js/services/RightClickMenu.js | 菜单显示和AI响应生成逻辑 |

## 组件间通信图

```
┌─────────────┐     generate     ┌─────────────┐
│             │─────────────────>│             │
│    Draft    │                  │   Preview   │
│  (左侧编辑)  │<─────────────────│  (右侧预览)  │
└─────────────┘     更新内容      └─────────────┘
       │                               │
       │                               │
       │                               │
       ▼                               ▼
┌─────────────┐                 ┌─────────────┐
│  Settings   │                 │   Publish   │
│   (设置)    │                 │ (HTML渲染)  │
└─────────────┘                 └─────────────┘
```

## 添加新功能指南

### 添加新组件

1. 在`js/components/`目录创建新的组件JS文件
2. 组件应遵循现有组件结构:
   ```javascript
   const NewComponent = {
       options: {},
       elements: {},
       state: {},
       init: function(options) { /* 初始化逻辑 */ },
       // 其他方法...
   };
   window.NewComponent = NewComponent;
   ```
3. 在index.html中添加组件脚本引用
4. 在main.js中添加组件初始化代码

### 添加新事件类型

1. 确定事件命名，使用`组件名:事件类型`格式
2. 在触发位置使用`EventSystem.publish('event:name', data)`
3. 在需要响应的位置使用`EventSystem.subscribe('event:name', callback)`

### 修改现有功能

1. 确定功能所在的组件/文件
2. 找到对应的方法，进行修改
3. 确保保持事件发布/订阅的一致性
4. 如有必要，更新相关组件的状态管理

## 本地存储使用

DocStudio使用localStorage存储以下数据:

| 键名 | 用途 | 组件/服务 |
|-----|-----|----------|
| workspaceContent | 左侧编辑区内容 | Draft |
| displayspaceContent | 右侧预览区内容 | Preview |
| aiSuggestionsEnabled | AI建议功能开关状态 | Draft |
| autoRenderEnabled | 自动渲染开关状态 | Preview |
| APISettings | API配置信息 | Settings |

## 常见错误和调试

1. 组件初始化失败 - 检查DOM元素是否存在，控制台查看错误信息
2. 事件未触发 - 确认EventSystem已正确加载，发布和订阅使用相同的事件名称
3. API请求失败 - 检查Settings服务中的API配置，查看网络请求和响应

## 简要代码修改流程

1. 确定需要修改的功能
2. 使用本文档定位到相关文件和方法
3. 进行修改，保持组件结构和事件通信一致性
4. 测试修改是否影响其他功能
