// Preview组件 - 处理右侧编辑区的Markdown编辑和预览功能
const Preview = {
    // 配置选项
    options: {
        container: '#preview-container',
        textarea: '#displayspace',
        previewArea: '#markdown-preview',
        toggleButton: '#displayspace-toggle',
        renderButton: '#displayspace-btn'
    },

    // DOM元素引用
    elements: {},

    // 内部状态
    state: {
        content: '',
        isAutoRenderEnabled: false,
        saveTimeout: null,
        renderTimeout: null,
        isUpdatingTextarea: false,
        isUpdatingPreview: false
    },

    // 初始化函数
    init: function(options) {
        // 合并选项
        this.options = Object.assign({}, this.options, options || {});
        
        // 初始化DOM引用
        this.initElements();
        
        // 加载内部状态
        this.loadState();
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化TurndownService
        this.initTurndown();

        // 初始化Marked设置
        this.initMarked();
        
        // 发布初始化完成事件
        if (window.EventSystem) {
            EventSystem.publish('preview:initialized', { 
                component: this,
                content: this.getContent()
            });
        }
        
        console.log('Preview component initialized');
        return this;
    },

    // DOM元素初始化
    initElements: function() {
        const opt = this.options;
        this.elements = {
            container: document.querySelector(opt.container),
            textarea: document.getElementById(opt.textarea.substring(1)), // 去掉#前缀
            previewArea: document.getElementById(opt.previewArea.substring(1)),
            toggleButton: document.getElementById(opt.toggleButton.substring(1)),
            renderButton: document.getElementById(opt.renderButton.substring(1))
        };
        
        // 检查必要元素是否存在
        if (!this.elements.textarea) {
            console.error('Preview component: Required textarea element not found');
        }
        if (!this.elements.previewArea) {
            console.error('Preview component: Required preview area element not found');
        }
    },

    // 初始化TurndownService
    initTurndown: function() {
        if (window.TurndownService) {
            this.turndownService = new TurndownService({
                headingStyle: 'atx',
                codeBlockStyle: 'fenced',
                emDelimiter: '*'
            });
        } else {
            console.error('Preview component: TurndownService not available');
        }
    },

    // 初始化Marked设置
    initMarked: function() {
        if (window.marked) {
            marked.setOptions({
                breaks: true,    // 换行符转换为<br>
                gfm: true,       // 使用GitHub风格Markdown
                sanitize: false  // 不转义HTML
            });
        } else {
            console.error('Preview component: marked library not available');
        }
    },

    // 加载保存的状态
    loadState: function() {
        // 加载保存的内容
        const savedContent = localStorage.getItem('displayspaceContent');
        if (savedContent !== null) {
            this.state.content = savedContent;
            if (this.elements.textarea) {
                this.elements.textarea.value = savedContent;
            }
        }
        
        // 加载自动渲染状态
        this.state.isAutoRenderEnabled = localStorage.getItem('autoRenderEnabled') === 'true';
        if (this.elements.toggleButton) {
            this.elements.toggleButton.checked = this.state.isAutoRenderEnabled;
        }
        
        // 根据渲染状态设置显示
        this.toggleRenderMode(this.state.isAutoRenderEnabled);
    },

    // 事件绑定
    bindEvents: function() {
        // 文本区域输入事件
        if (this.elements.textarea) {
            this.elements.textarea.addEventListener('input', (e) => this.handleInput(e));
        }
        
        // 预览区域输入事件
        if (this.elements.previewArea) {
            this.elements.previewArea.addEventListener('input', (e) => this.handlePreviewInput(e));
        }
        
        // 自动渲染开关事件
        if (this.elements.toggleButton) {
            this.elements.toggleButton.addEventListener('change', (e) => this.handleToggleChange(e));
        }
        
        // 注意：渲染按钮的点击事件处理已迁移到script.js
    },
    
    // 处理文本输入
    handleInput: function(event) {
        if (this.state.isUpdatingTextarea) return; // 避免循环触发
        
        const textarea = this.elements.textarea;
        if (!textarea) return;
        
        // 自动保存逻辑
        clearTimeout(this.state.saveTimeout);
        this.state.saveTimeout = setTimeout(() => {
            const content = textarea.value;
            this.saveContent(content);
            
            // 如果自动渲染开启，更新预览
            if (this.state.isAutoRenderEnabled && !this.state.isUpdatingPreview) {
                this.renderMarkdown(content);
            }
            
            // 发布内容保存事件
            if (window.EventSystem) {
                EventSystem.publish('preview:content-saved', {
                    content: content
                });
            }
        }, 500); // 500ms防抖
    },
    
    // 处理预览区输入
    handlePreviewInput: function(event) {
        if (this.state.isUpdatingPreview) return; // 避免循环触发
        
        const previewArea = this.elements.previewArea;
        if (!previewArea) return;
        
        clearTimeout(this.state.renderTimeout);
        this.state.renderTimeout = setTimeout(() => {
            // 将HTML转回Markdown
            this.state.isUpdatingTextarea = true;
            try {
                const html = previewArea.innerHTML;
                if (this.turndownService) {
                    const markdown = this.turndownService.turndown(html);
                    if (this.elements.textarea) {
                        this.elements.textarea.value = markdown;
                        this.saveContent(markdown);
                    }
                }
            } catch (e) {
                console.error('Preview component: HTML转Markdown出错:', e);
            }
            this.state.isUpdatingTextarea = false;
            
            // 发布预览更新事件
            if (window.EventSystem) {
                EventSystem.publish('preview:preview-updated', {
                    content: previewArea.innerHTML
                });
            }
        }, 500);
    },
    
    // 处理渲染开关切换
    handleToggleChange: function(event) {
        const isEnabled = event.target.checked;
        
        // 保存状态
        this.state.isAutoRenderEnabled = isEnabled;
        localStorage.setItem('autoRenderEnabled', isEnabled);
        
        // 切换显示模式
        this.toggleRenderMode(isEnabled);
        
        // 发布渲染模式变更事件
        if (window.EventSystem) {
            EventSystem.publish('preview:render-mode-changed', {
                enabled: isEnabled
            });
        }
    },
    
    // 渲染Markdown为HTML
    renderMarkdown: function(markdown) {
        if (!markdown) return;
        
        const previewArea = this.elements.previewArea;
        if (!previewArea || !window.marked) return;
        
        this.state.isUpdatingPreview = true;
        try {
            const html = marked.parse(markdown);
            previewArea.innerHTML = html;
            
            // 发布渲染完成事件
            if (window.EventSystem) {
                EventSystem.publish('preview:markdown-rendered', {
                    markdown: markdown,
                    html: html
                });
            }
        } catch (e) {
            console.error('Preview component: Markdown渲染出错:', e);
            previewArea.innerHTML = `<p style="color: red;">Markdown渲染出错: ${e.message}</p>`;
            
            // 发布渲染错误事件
            if (window.EventSystem) {
                EventSystem.publish('preview:markdown-render-error', {
                    error: e.message
                });
            }
        }
        this.state.isUpdatingPreview = false;
    },

    // 转换HTML回Markdown
    convertHtmlToMarkdown: function(html) {
        if (!html || !this.turndownService) return '';
        
        try {
            return this.turndownService.turndown(html);
        } catch (e) {
            console.error('Preview component: HTML转Markdown出错:', e);
            return '';
        }
    },

    // 保存内容到localStorage
    saveContent: function(content) {
        this.state.content = content;
        localStorage.setItem('displayspaceContent', content);
        console.log('Preview content saved');
    },

    // 切换渲染模式
    toggleRenderMode: function(isEnabled) {
        const textarea = this.elements.textarea;
        const previewArea = this.elements.previewArea;
        
        if (!textarea || !previewArea) return;
        
        if (isEnabled) {
            // 开启自动渲染，显示预览区域，隐藏文本区域
            textarea.style.display = 'none';
            previewArea.style.display = 'block';
            // 更新预览内容
            this.renderMarkdown(textarea.value);
            // 聚焦预览区域
            previewArea.focus();
        } else {
            // 关闭自动渲染，显示文本区域，隐藏预览区域
            textarea.style.display = 'block';
            previewArea.style.display = 'none';
            // 聚焦文本区域
            textarea.focus();
        }
    },

    // 公共API - 获取内容
    getContent: function() {
        if (this.elements.textarea) {
            return this.elements.textarea.value;
        }
        return this.state.content || '';
    },

    // 公共API - 设置内容
    setContent: function(content) {
        if (this.elements.textarea) {
            this.elements.textarea.value = content;
            this.saveContent(content);
            
            // 如果自动渲染开启，更新预览
            if (this.state.isAutoRenderEnabled) {
                this.renderMarkdown(content);
            }
            
            // 发布内容更新事件
            if (window.EventSystem) {
                EventSystem.publish('preview:content-updated', {
                    content: content
                });
            }
        }
        return this;
    },

    // 公共API - 聚焦
    focus: function() {
        if (this.state.isAutoRenderEnabled && this.elements.previewArea) {
            this.elements.previewArea.focus();
        } else if (this.elements.textarea) {
            this.elements.textarea.focus();
        }
        return this;
    },
    
    // 公共API - 刷新预览
    refreshPreview: function() {
        if (this.state.isAutoRenderEnabled && this.elements.textarea) {
            this.renderMarkdown(this.elements.textarea.value);
        }
        return this;
    }
};

// 导出组件
window.Preview = Preview;
