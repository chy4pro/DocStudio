// Publish组件 - 处理HTML渲染和iframe展示功能
const Publish = {
    // 配置选项
    options: {
        renderButton: '#displayspace-btn',
        container: '#fullscreenContainer',
        iframe: '#renderFrame',
        closeButton: '#closeIframeBtn',
        openTabButton: '#openNewTabBtn'
    },

    // DOM元素引用
    elements: {},

    // 内部状态
    state: {
        isVisible: false,
        isLoading: false,
        content: '',
        generatedHTML: '',
        errorMessage: null
    },

    // 初始化函数
    init: function(options) {
        // 合并选项
        this.options = Object.assign({}, this.options, options || {});
        
        // 初始化DOM引用
        this.initElements();
        
        // 绑定事件
        this.bindEvents();
        
        // 订阅事件系统
        this.subscribeToEvents();
        
        // 发布初始化完成事件
        if (window.EventSystem) {
            EventSystem.publish('publish:initialized', { 
                component: this
            });
        }
        
        console.log('Publish component initialized');
        return this;
    },

    // DOM元素初始化
    initElements: function() {
        const opt = this.options;
        this.elements = {
            renderButton: document.querySelector(opt.renderButton),
            container: document.querySelector(opt.container),
            iframe: document.querySelector(opt.iframe),
            closeButton: document.querySelector(opt.closeButton),
            openTabButton: document.querySelector(opt.openTabButton)
        };
        
        // 检查必要元素是否存在
        if (!this.elements.container) {
            console.error('Publish component: Required container element not found');
        }
        if (!this.elements.iframe) {
            console.error('Publish component: Required iframe element not found');
        }
    },

    // 事件绑定
    bindEvents: function() {
        // 注意：渲染按钮的点击事件处理已迁移到script.js
        
        // 关闭按钮点击事件
        if (this.elements.closeButton) {
            this.elements.closeButton.addEventListener('click', (e) => this.handleCloseClick(e));
        }
        
        // 新标签页按钮点击事件
        if (this.elements.openTabButton) {
            this.elements.openTabButton.addEventListener('click', (e) => this.handleOpenTabClick(e));
        }
    },
    
    // 事件订阅
    subscribeToEvents: function() {
        if (!window.EventSystem) return;
        
        // 注意：渲染事件的处理已迁移到script.js
        // Publish组件现在由script.js直接调用，不再通过事件订阅
    },
    
    // 关闭按钮点击处理
    handleCloseClick: function(event) {
        this.close();
    },
    
    // 新标签页按钮点击处理
    handleOpenTabClick: function(event) {
        this.openInNewTab();
    },

    // 显示加载状态
    showLoading: function() {
        this.state.isLoading = true;
        
        const loadingHTML = `
            <html>
            <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:Arial;background:#f5f5f5;">
                <div style="text-align:center">
                    <h2>正在生成HTML...</h2>
                    <p>AI正在将内容转换为HTML格式，请稍候</p>
                </div>
            </body>
            </html>
        `;
        
        this.writeToIframe(loadingHTML);
        this.showIframe();
        
        // 发布加载开始事件
        if (window.EventSystem) {
            EventSystem.publish('publish:loading-started', {});
        }
        
        return this;
    },
    
    // 显示错误
    showError: function(error) {
        this.state.errorMessage = error.message || '未知错误';
        
        const errorHTML = `
            <html>
            <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:Arial;background:#ffebee;color:#b71c1c;">
                <div style="text-align:center">
                    <h2>生成HTML时出错</h2>
                    <p>${this.state.errorMessage}</p>
                </div>
            </body>
            </html>
        `;
        
        this.writeToIframe(errorHTML);
        
        // 发布错误事件
        if (window.EventSystem) {
            EventSystem.publish('publish:render-error', {
                error: this.state.errorMessage
            });
        }
        
        return this;
    },
    
    // 写入内容到iframe
    writeToIframe: function(html) {
        if (!this.elements.iframe) return this;
        
        const iframeDocument = this.elements.iframe.contentDocument || 
                               this.elements.iframe.contentWindow.document;
        
        iframeDocument.open();
        iframeDocument.write(html);
        iframeDocument.close();
        
        return this;
    },

    // 显示iframe
    showIframe: function() {
        if (this.elements.container) {
            this.elements.container.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // 防止页面滚动
            this.state.isVisible = true;
            
            // 发布iframe显示事件
            if (window.EventSystem) {
                EventSystem.publish('publish:iframe-opened', {});
            }
        }
        return this;
    },

    // 隐藏iframe
    hideIframe: function() {
        if (this.elements.container) {
            this.elements.container.style.display = 'none';
            document.body.style.overflow = ''; // 恢复页面滚动
            this.state.isVisible = false;
            
            // 发布iframe关闭事件
            if (window.EventSystem) {
                EventSystem.publish('publish:iframe-closed', {});
            }
        }
        return this;
    },

    // 在新标签页中打开
    openInNewTab: function() {
        if (!this.elements.iframe) return this;
        
        const iframeDocument = this.elements.iframe.contentDocument || 
                               this.elements.iframe.contentWindow.document;
        const htmlContent = iframeDocument.documentElement.outerHTML;
        
        const newTab = window.open();
        if (newTab) {
            newTab.document.write(htmlContent);
            newTab.document.close();
            
            // 发布在新标签页打开事件
            if (window.EventSystem) {
                EventSystem.publish('publish:opened-in-new-tab', {});
            }
        }
        
        return this;
    },
    
    // 获取API设置
    getAPISettings: function() {
        const savedSettings = localStorage.getItem('APISettings');
        if (!savedSettings) {
            throw new Error('请先在设置中配置API信息');
        }
        
        const settings = JSON.parse(savedSettings);
        const endpoint = settings.apiEndpoint;
        const apiKey = settings.apiKey;
        const model = settings.model;
        
        if (!endpoint || !apiKey || !model) {
            throw new Error('API设置不完整，请检查设置');
        }
        
        return {
            endpoint,
            apiKey,
            model,
            maxTokens: parseInt(settings.maxTokens) || 2048,
            temperature: parseFloat(settings.temperature) || 0.7
        };
    },

    // 生成HTML (API调用)
    generateHTML: async function(content) {
        this.state.content = content;
        this.state.isLoading = true;
        
        try {
            // 获取API设置
            const settings = this.getAPISettings();
            
            // 发送API请求
            const response = await fetch(`${settings.endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.apiKey}`
                },
                body: JSON.stringify({
                    model: settings.model,
                    messages: [
                        { 
                            role: "system", 
                            content: "你是一个HTML生成专家。将用户提供的内容转换为格式精美的HTML网页。添加适当的CSS样式使页面美观。确保HTML结构完整，包含<html>、<head>和<body>标签，只生成html,不要说多余的话。" 
                        },
                        { 
                            role: "user", 
                            content: "请将以下内容转换为HTML网页格式,只生成html,不要说多余的话：\n\n" + content 
                        }
                    ],
                    max_tokens: settings.maxTokens,
                    temperature: settings.temperature
                })
            });
            
            if (!response.ok) {
                throw new Error('API请求失败');
            }
            
            const data = await response.json();
            
            // 获取生成的HTML
            const generatedHTML = data.choices[0].message.content;
            this.state.generatedHTML = generatedHTML;
            
            // 发布渲染完成事件
            if (window.EventSystem) {
                EventSystem.publish('publish:render-completed', {
                    content: content,
                    html: generatedHTML
                });
            }
            
            return generatedHTML;
        } catch (error) {
            console.error('HTML生成出错:', error);
            
            // 发布渲染错误事件
            if (window.EventSystem) {
                EventSystem.publish('publish:render-error', {
                    error: error.message || '未知错误'
                });
            }
            
            throw error;
        } finally {
            this.state.isLoading = false;
        }
    },

    // 公共API - 渲染内容
    render: async function(content) {
        if (!content) {
            alert('没有要渲染的内容');
            return this;
        }
        
        try {
            // 显示加载状态
            this.showLoading();
            
            // 发布渲染开始事件
            if (window.EventSystem) {
                EventSystem.publish('publish:render-started', {
                    content: content
                });
            }
            
            // 生成HTML并显示在iframe中
            const html = await this.generateHTML(content);
            this.writeToIframe(html);
            
        } catch (error) {
            console.error('HTML渲染出错:', error);
            this.showError(error);
        }
        
        return this;
    },

    // 公共API - 关闭
    close: function() {
        return this.hideIframe();
    },

    // 公共API - 检查是否活动状态
    isActive: function() {
        return this.state.isVisible;
    }
};

// 导出组件
window.Publish = Publish;
