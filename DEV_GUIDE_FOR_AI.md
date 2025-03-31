# DocStudio AI开发指南

> 注意：此文档专为AI助手设计，提供快速代码定位和修改参考。

## 设计理念与原则

### 多模式架构设计

- **模式分离原则** - 不同模式有独立的界面(HTML)、样式(CSS)和协调脚本(JS)，便于适应不同使用场景
- **组件共享原则** - 所有模式共享核心组件(Draft、Preview等)，减少代码重复
- **样式分层策略** - 基础样式(`base.css`)在所有模式间共享，模式特有样式单独定义
- **状态持久化** - 模式切换时保存状态，确保用户工作连续性
- **适配多端** - 设计支持桌面端、APP端、小程序端等多种运行环境

DocStudio还采用以下核心设计理念，修改代码时应当遵循这些原则：

### 组件化设计原则

- **单一职责原则** - 每个组件只负责一个特定功能域（Draft负责左侧编辑，Preview负责右侧预览等）
- **松耦合高内聚** - 组件间通过事件系统通信，减少直接依赖
- **状态封装** - 组件内部状态通过`state`对象管理，不直接暴露，通过公共API访问
- **DOM引用隔离** - 组件只操作自己的DOM元素，通过`elements`对象引用

### 事件驱动架构

- **发布/订阅模式** - 组件间通过EventSystem实现松耦合通信
- **标准事件命名** - 主要使用`组件名:事件类型`格式，系统级事件可使用`功能域:事件类型`格式（如`mode:change-requested`、`application:ready`）
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

DocStudio使用组件化、事件驱动架构，并采用多模式设计，分为以下几个部分：

```
DocStudio/
├── index.html          # 模式选择入口页面
├── js/                 # JavaScript核心模块目录
│   ├── events.js       # 事件系统
│   ├── main.js         # 应用初始化和组件协调
│   ├── ModeManager.js  # 模式管理器
│   ├── components/     # 共享UI组件
│   │   ├── Draft.js    # 左侧工作区组件
│   │   ├── Preview.js  # 右侧预览区组件
│   │   └── Publish.js  # HTML渲染和展示组件
│   └── services/       # 通用服务
│       ├── Settings.js        # 设置管理服务
│       └── RightClickMenu.js  # 右键菜单服务
├── modes/              # 不同使用模式目录
│   ├── standard/       # 标准模式
│   │   ├── index.html  # 标准模式HTML结构
│   │   ├── script.js   # 标准模式协调脚本
│   │   └── styles.css  # 标准模式特有样式
│   └── focus/          # 专注模式
│       ├── index.html  # 专注模式HTML结构
│       ├── script.js   # 专注模式协调脚本
│       └── styles.css  # 专注模式特有样式
└── shared/             # 所有模式共享资源
    ├── base.css        # 基础共享样式
    └── about.html      # 使用帮助页面（所有模式共享）
```

### 加载顺序

加载顺序在各模式的index.html中定义，以标准模式为例：
1. 外部库: marked.min.js, turndown.js
2. 事件系统: events.js
3. 模式管理器: modeManager.js
4. 服务: Settings.js, RightClickMenu.js
5. 组件: Draft.js, Preview.js, Publish.js
6. 初始化: main.js
7. 模式特定脚本: script.js

## 核心组件与服务索引

### Draft组件 (js/components/Draft.js)

**功能**: 负责左侧工作区的所有功能，现支持自主DOM管理

**核心属性**:
- `elements` - DOM元素引用
- `state` - 组件状态管理

**关键方法**:
- `init()` - 组件初始化
- `initElements()` - 初始化DOM引用
- `createTextArea()` - 动态创建并添加textarea元素
- `bindRightClickHandler()` - 绑定右键菜单事件处理
- `getContent()` - 获取编辑内容
- `setContent(content)` - 设置编辑内容
- `organizeContent()` - 内容整理功能
- `getAISuggestion()` - 获取AI建议
- `handleInput()` - 处理输入事件，同步更新pre元素内容以实现自动高度调整
- `splitDocument()` - 将当前文档分割成多个便签
- `createNoteElement()` - 创建并插入新的便签元素

**事件发布**:
- `draft:initialized` - 组件初始化完成
- `draft:content-updated` - 内容更新时
- `draft:content-saved` - 内容保存时
- `draft:organize-started` - 整理开始时
- `draft:organize-completed` - 整理完成时
- `draft:ai-suggestion-completed` - AI建议完成时
- `draft:document-split` - 文档拆分为便签时

**事件订阅**:
- `settings:updated` - 响应设置更改
- `rightClickMenu:contentInserted` - 响应右键菜单内容插入

**修改重点**:
- 实现自主DOM管理: `createTextArea()` 和 `bindRightClickHandler()` 方法
- 更改AI建议逻辑: `getAISuggestion()` 方法
- 修改内容整理功能: `organizeContent()` 方法
- 更改自动保存行为: `handleInput()` 方法
- 高度自适应实现: 使用隐藏的pre元素同步textarea内容，通过CSS定位实现textarea高度100%并随pre元素高度自动调整
- 便签功能实现: `splitDocument()`和`createNoteElement()`方法，使用`.draft-note-container`和`.draft-pre-mirror`实现便签UI

### Preview组件 (js/components/Preview.js)

**功能**: 负责右侧预览区的Markdown编辑和预览，现支持自主DOM管理

**核心属性**:
- `elements` - DOM元素引用
- `state` - 组件状态

**关键方法**:
- `init()` - 组件初始化
- `initElements()` - 初始化DOM引用
- `createTextArea()` - 动态创建并添加textarea元素
- `bindRightClickHandlers()` - 为textarea和预览区绑定右键事件
- `getContent()` - 获取预览内容
- `setContent(content)` - 设置预览内容
- `renderMarkdown(markdown)` - 将Markdown渲染为HTML
- `toggleRenderMode(isEnabled)` - 切换编辑/预览模式
- `insertContentAt(content, position)` - 在指定位置插入内容
- `insertAtCursor(content)` - 在光标位置插入内容

**事件发布**:
- `preview:initialized` - 组件初始化完成
- `preview:content-updated` - 内容更新时
- `preview:content-saved` - 内容保存时
- `preview:preview-updated` - 预览内容编辑更新时
- `preview:markdown-rendered` - Markdown渲染完成时
- `preview:render-mode-changed` - 渲染模式更改时
- *注：render按钮功能已迁移至script.js*

**修改重点**:
- 实现自主DOM管理: `createTextArea()` 和 `bindRightClickHandlers()` 方法
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

### ModeManager (js/ModeManager.js)

**功能**: 负责模式管理，处理模式切换、状态保存和恢复（当前仅实现标准模式支持，但框架设计支持多模式扩展）

**核心属性**:
- `currentMode` - 当前激活的模式
- `availableModes` - 可用模式列表（目前仅包含'standard'）

**关键方法**:
- `init()` - 初始化模式管理器
- `getCurrentMode()` - 获取当前模式
- `switchToMode(modeName)` - 切换到指定模式
- `saveCurrentState()` - 保存当前工作状态
- `registerMode(modeName)` - 注册新模式

**事件发布**:
- `modeManager:initialized` - 模式管理器初始化完成

**事件订阅**:
- `mode:change-requested` - 响应模式切换请求

**修改重点**:
- 添加新模式: 使用`registerMode()`方法
- 修改模式切换逻辑: `switchToMode()`方法
- 修改状态保存行为: `saveCurrentState()`方法

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

**功能**: 提供被动式右键菜单服务和AI问答功能，由组件主动调用

**核心方法**:
- `init()` - 服务初始化，只处理菜单UI相关
- `showMenuAt(x, y, options)` - 公共API，供组件调用显示菜单
- `showMenu(x, y, selectedText)` - 内部方法，显示右键菜单
- `hideMenu()` - 隐藏右键菜单
- `generateResponse(inputText, referenceText, currentTextarea)` - 生成AI回答

**事件发布**:
- `rightClickMenu:responseGenerated` - 回答生成时
- `rightClickMenu:contentInserted` - 内容插入时
- `rightClickMenu:displayspaceUpdated` - 预览区内容更新时

**修改重点**:
- 改为被动服务模式: 不再主动绑定元素，提供`showMenuAt()`API
- 修改AI响应生成: `generateResponse()` 方法参数调整

### EventSystem (js/events.js)

**功能**: 提供事件发布/订阅系统，实现组件间通信

**核心方法**:
- `publish(eventName, data)` - 发布事件
- `subscribe(eventName, callback)` - 订阅事件
- `unsubscribe(eventName, callback)` - 取消订阅

**修改重点**:
- 添加新事件类型: 在相应组件中使用`EventSystem.publish()`

## 主要文件功能和定位

### index.html (根目录)
- **用途**: 模式选择入口页面，负责重定向到用户首选模式
- **修改场景**: 添加新模式按钮、修改模式选择逻辑

### modes/standard/index.html
- **用途**: 定义标准模式的页面结构、加载脚本
- **修改场景**: 修改标准模式界面布局、调整脚本加载顺序

### modes/focus/index.html
- **用途**: 定义专注模式的页面结构、加载脚本
- **修改场景**: 修改专注模式界面布局、调整脚本加载顺序

### shared/base.css
- **用途**: 定义所有模式共享的基础样式
- **修改场景**: 更新共享UI元素样式、添加新的共享组件样式

### modes/standard/styles.css
- **用途**: 定义标准模式特有的样式
- **修改场景**: 调整标准模式布局、修改模式特有元素样式

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
| 修改左侧编辑区UI | modes/[mode]/index.html, modes/[mode]/styles.css | 编辑区容器相关元素和CSS |
| 修改右侧预览区UI | modes/[mode]/index.html, modes/[mode]/styles.css | 预览区容器相关元素和CSS |
| 修改编辑区功能 | js/components/Draft.js | 相关方法(getContent, setContent等) |
| 修改预览区功能 | js/components/Preview.js | 相关方法(renderMarkdown等) |
| 修改自动保存行为 | js/components/Draft.js, js/components/Preview.js | handleInput方法中的保存逻辑 |
| 修改generate功能 | modes/[mode]/script.js | generateBtn点击事件处理函数 |
| 修改HTML渲染功能 | js/components/Publish.js | generateHTML, render方法 |
| 修改iframe展示 | js/components/Publish.js | showIframe, hideIframe方法 |
| 修改设置面板 | modes/[mode]/index.html, js/services/Settings.js | 设置模态框HTML和JS处理 |
| 修改右键菜单功能 | js/services/RightClickMenu.js | 菜单显示和AI响应生成逻辑 |
| 添加新模式 | index.html, js/ModeManager.js, 创建新模式目录 | ModeManager.registerMode方法和新模式文件 |
| 修改模式切换逻辑 | js/ModeManager.js | switchToMode方法 |

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

## CSS分层结构

DocStudio采用分层CSS架构，明确分离共享样式和模式特定样式：

1. **共享基础样式 (shared/base.css)**
   - 所有模式通用的基础样式
   - 包括重置样式、表单元素、模态框、全屏容器、右键菜单等
   - 包含`.markdown-preview`的基本样式规则，确保Markdown渲染一致性
   - 包含`.draft-note-container`和`.draft-pre-mirror`等便签功能的样式

2. **模式特定样式 (modes/[mode]/styles.css)**
   - 特定模式的布局和界面样式
   - 仅包含该模式特有的样式规则
   - 可以覆盖基础样式，以适应特定模式需求
   - 定义模式特有元素的显示状态（如`.markdown-preview`的`display: none`）

## 添加新功能指南

### 添加新模式

1. 在`modes/`目录下创建新模式目录，如`modes/focus/`
2. 创建模式所需的基本文件：
   ```
   modes/focus/
   ├── index.html  # 模式HTML结构
   ├── script.js   # 模式协调脚本
   └── styles.css  # 模式特定样式
   ```
3. 在`index.html`中添加链接到新模式的按钮
4. 在`js/ModeManager.js`中注册新模式：
   ```javascript
   ModeManager.registerMode('focus');
   ```

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
| preferredMode | 用户首选模式 | ModeManager |

## 常见错误和调试

1. 组件初始化失败 - 检查DOM元素是否存在，控制台查看错误信息
2. 事件未触发 - 确认EventSystem已正确加载，发布和订阅使用相同的事件名称
3. API请求失败 - 检查Settings服务中的API配置，查看网络请求和响应

## 简要代码修改流程

1. 确定需要修改的功能
2. 使用本文档定位到相关文件和方法
3. 进行修改，保持组件结构和事件通信一致性
4. 测试修改是否影响其他功能
