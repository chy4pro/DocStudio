# DocStudio

[English](#english) | [中文](#中文)

## English

### Overview

DocStudio is an AI-powered document editing and formatting tool that helps users create, organize, and transform content efficiently. It leverages language model APIs to provide intelligent document assistance directly in your browser.

This is a completely serverless application—all API keys and content are stored locally in your browser, ensuring your data remains private and secure. No server infrastructure is required to run DocStudio.

### Features

- **Dual Editor Interface**: Work with two synchronized text areas for different stages of document creation
- **AI-Powered Document Generation**: Transform your notes and ideas into well-structured documents
- **Content Organization**: Automatically refine and organize your content while preserving key information
- **Markdown to HTML Conversion**: Instantly convert your content to formatted HTML
- **Contextual AI Assistance**: Get suggestions and answers through a convenient right-click menu
- **Auto-Save**: Never lose your work with automatic content saving
- **Customizable API Settings**: Configure your preferred language model API settings

### Setup

1. Clone or download this repository
2. Open `index.html` in your browser
3. Click the settings icon (⚙️) to configure your API connection:
   - API Endpoint (e.g., `https://api.openai.com/v1`)
   - API Key
   - Model name (e.g., `gpt-3.5-turbo`)
   - Temperature and token settings

### How to Use

1. **Getting Started**: Click the "📖 使用帮助" (Help) link next to the title for detailed usage instructions
2. **Content Creation**: Type or paste your content in the left editor panel
3. **Generate Document**: Click the "generate" button to transform your content into a well-structured document in the right panel
4. **Organize Content**: Use the "整理" (Organize) button to refine and streamline your content
5. **Preview HTML**: Click the "render" button to see your content as a formatted web page
6. **Context Menu**: Right-click anywhere in either editor to ask AI questions about your content

### Requirements

- Modern web browser with JavaScript enabled
- Access to an API that is compatible with OpenAI's chat completions API format

### Roadmap

#### Implemented Features
- ✅ AI-powered document generation
- ✅ AI auto-suggestions after 5s of inactivity
- ✅ Right-click to ask AI
- ✅ Text selection questions
- ✅ Content organization
- ✅ Markdown to HTML conversion
- ✅ Auto-save functionality
- ✅ Customizable API settings
- ✅ HTML preview
- ✅ Markdown preview with real-time editing
- ✅ Component-based architecture
- ✅ Focus mode
- ✅ Note-based editing (sticky notes for easier draft processing)

#### Future Features
- 🔄 Multi-language support
- 🔄 In-line AI text insertions
- 🔄 Text selection editing
- 🔄 Generated content review and correction
- 🔄 Writer mode (Conversational writing mode)
- 🔄 Additional AI actions via right-click
- 🔄 Multiple workspace saving and management
- 🔄 Export workspace files
- 🔄 Version control
- 🔄 Document-wide search with display and batch editing to prevent missing changes
- 🔄 File upload and knowledge base
- 🔄 Image recognition
- 🔄 Image insertion in documents
- 🔄 Self-check functionality (with checking logic)
- 🔄 Post-render editing on final rendered page
- 🔄 Style and format templates based on provided examples
- 🔄 Additional export formats (PDF, DOCX, PPT, EXCEL) and website publishing
- 🔄 Template library
- 🔄 Server mode option

---

## 中文

### 概述

DocStudio 是一款基于人工智能的文档编辑和格式化工具，帮助用户高效地创建、组织和转换内容。它利用语言模型 API 在浏览器中直接提供智能文档辅助功能。

这是一个完全无服务器（Serverless）的应用程序——所有 API 密钥和内容都存储在您的本地浏览器中，确保您的数据保持私密和安全。运行 DocStudio 不需要任何服务器基础设施。

### 功能特点

- **双编辑器界面**：使用两个同步的文本区域进行不同阶段的文档创建
- **AI 驱动的文档生成**：将您的笔记和想法转化为结构良好的文档
- **内容整理**：自动优化和组织您的内容，同时保留关键信息
- **Markdown 转 HTML**：即时将您的内容转换为格式化的 HTML
- **上下文 AI 辅助**：通过便捷的右键菜单获取建议和答案
- **自动保存**：自动保存内容，确保工作不会丢失
- **可定制的 API 设置**：配置您首选的语言模型 API 设置

### 设置步骤

1. 克隆或下载此代码库
2. 在浏览器中打开 `index.html`
3. 点击设置图标 (⚙️) 配置您的 API 连接：
   - API 接口地址（如 `https://api.openai.com/v1`）
   - API 密钥
   - 模型名称（如 `gpt-3.5-turbo`）
   - 温度和令牌数设置

### 使用方法

1. **快速入门**：点击标题旁的"📖 使用帮助"链接获取详细使用说明
2. **内容创建**：在左侧编辑器面板中输入或粘贴您的内容
3. **生成文档**：点击"generate"按钮将您的内容转换为右侧面板中的结构化文档
4. **整理内容**：使用"整理"按钮精简和优化您的内容
5. **预览 HTML**：点击"render"按钮查看格式化的网页版内容
6. **上下文菜单**：在任一编辑器中右键单击以向 AI 询问有关您内容的问题

### 系统要求

- 支持 JavaScript 的现代网络浏览器
- 访问与 OpenAI 聊天补全 API 格式兼容的 API

### 开发路线图

#### 已实现功能
- ✅ AI 驱动的文档生成
- ✅ 5秒不动AI自动提问
- ✅ 右键向AI提问
- ✅ 选中提问
- ✅ 内容整理
- ✅ Markdown 转 HTML
- ✅ 自动保存功能
- ✅ 自定义 API 设置
- ✅ HTML 预览
- ✅ Markdown实时预览与编辑
- ✅ 组件化架构
- ✅ 专注模式
- ✅ 便签式编辑(让草稿处理更方便)

#### 未来功能
- 🔄 多语言支持
- 🔄 AI文中插入式输出
- 🔄 选中修改
- 🔄 生成内容批改
- 🔄 写手模式(对话写作模式)
- 🔄 对每个按钮后面的prompt进行自定义
- 🔄 右键让AI执行功能
- 🔄 保存工作区，并能创建多个工作区
- 🔄 导出工作区文件
- 🔄 版本控制
- 🔄 对相关内容全文查找，并展示，并且如果要修改，允许同时修改，防止漏改
- 🔄 上传文件，知识库
- 🔄 图像识别
- 🔄 文档支持图像插入
- 🔄 自我检查（提供检查逻辑）
- 🔄 渲染后批改，提供在最终渲染页面上修改文字的能力
- 🔄 根据提供的模板复制文风、格式、写作逻辑等
- 🔄 导出更多格式（PDF、DOCX、PPT、EXCEL）及直接发布网站
- 🔄 提供模版库
- 🔄 服务器模式（Server mode）选项
