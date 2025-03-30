// Draft组件 - 工作区功能的组件化实现
const Draft = {
    // 配置选项
    options: {
        container: '[data-role="textarea-container-draft"]',
        textareaId: 'workspace',  // 直接使用ID名，不含#前缀
        toggleButton: '#workspace-toggle',
        organizeButton: '#workspace-btn'
    },

    // 组件DOM元素引用
    elements: {},

    // 组件内部状态
    state: {
        aiSuggestionsEnabled: false,
        isDirty: false,
        content: '',
        documents: [],
        saveTimeout: null,
        suggestTimeout: null,
        isWaitingForSuggestion: false,
        loadingIndicator: null,
        isStreamingContent: false,
        originalContent: '', // 用于内容整理的原始内容备份
        controller: null, // AbortController 用于取消流式请求
        buttonState: 'ORGANIZE' // 按钮状态: ORGANIZE, STOP, REVERT
    },

    // 组件初始化函数
    init: function(options) {
        // 合并选项
        this.options = Object.assign({}, this.options, options || {});
        
        // 初始化DOM引用
        this.initElements();
        
        // 加载内部状态
        this.loadState();

        // 创建文本区域
        this.createTextArea();
        
        // 绑定内部事件
        this.bindEvents();
        
        // 订阅外部事件
        this.subscribeToEvents();
        
        // 发布初始化完成事件
        if (window.EventSystem) {
            EventSystem.publish('draft:initialized', { 
                component: this,
                content: this.getContent()
            });
        }
        
        console.log('Draft component initialized');
        return this;
    },
    
    // 订阅外部事件
    subscribeToEvents: function() {
        if (!window.EventSystem) return;
        
        // 响应设置更新事件
        EventSystem.subscribe('settings:updated', (data) => {
            console.log('Draft组件接收到设置更新:', data);
            // 可以根据设置调整组件行为
        });
        
        // 响应来自右键菜单的内容修改
        EventSystem.subscribe('rightClickMenu:contentInserted', (data) => {
            if (data && data.targetId === this.elements.textarea.id) {
                // 右键菜单在workspace中插入了内容，触发保存
                this.state.isDirty = true;
                clearTimeout(this.state.saveTimeout);
                this.state.saveTimeout = setTimeout(() => {
                    localStorage.setItem('workspaceContent', this.elements.textarea.value);
                    this.state.content = this.elements.textarea.value;
                    console.log('来自右键菜单的内容已自动保存');
                }, 500);
            }
        });
    },

    // 初始化DOM元素引用
    initElements: function() {
        const opt = this.options;
        this.elements = {
            container: document.querySelector(opt.container),
            toggleButton: document.getElementById(opt.toggleButton.substring(1)), // 去掉#前缀
            organizeButton: document.getElementById(opt.organizeButton.substring(1)) // 去掉#前缀
        };
        
        // 检查必要元素是否存在
        if (!this.elements.container) {
            console.error('Draft component: Container element not found');
            return;
        }
    },
    
    // 创建textarea元素
    createTextArea: function() {
        if (!this.elements.container) return;
        
        // 创建textarea元素
        console.log(this.state.documents[1])
        this.state.documents.forEach((draft) => {
            const div = document.createElement('div');
            const textarea = document.createElement('textarea');
            textarea.id = draft.id;
            textarea.value = draft.content;
            textarea.className = 'draft-textarea';
            textarea.placeholder = 'Please enter content';
            div.appendChild(textarea);
            this.elements.container.appendChild(div)
            textarea.style.height = textarea.scrollHeight + 'px';
        });
        // const textarea = document.createElement('textarea');
        // textarea.id = this.options.textareaId;  // 使用配置中的ID
        // textarea.className = 'draft-textarea'; // 添加类名
        // textarea.placeholder = '请输入文本';
        
        // // 添加到锚点容器
        // this.elements.container.innerHTML = '';  // 清空锚点内容
        // this.elements.container.appendChild(textarea);
        
        // // 保存引用
        // this.elements.textarea = textarea;
        
        // 绑定右键菜单处理
        this.bindRightClickHandler();
    },
    
    // 绑定右键菜单处理
    bindRightClickHandler: function() {
        if (!this.elements.textarea) return;
        
        this.elements.textarea.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            
            // 获取选中的文本
            const selectedText = this.elements.textarea.value.substring(
                this.elements.textarea.selectionStart, 
                this.elements.textarea.selectionEnd
            );
            
            // 记录光标位置
            const cursorPosition = this.elements.textarea.selectionStart;
            
            // 调用RightClickMenu服务显示菜单
            if (window.RightClickMenu) {
                RightClickMenu.showMenuAt(event.clientX, event.clientY, {
                    activeTextarea: this.elements.textarea,
                    cursorPosition: cursorPosition,
                    selectedText: selectedText
                });
            }
        });
    },

    // 加载状态
    loadState: function() {
        // 加载AI建议状态
        this.state.aiSuggestionsEnabled = localStorage.getItem('aiSuggestionsEnabled') !== 'false';
        
        // 加载保存的内容
        const savedContent = localStorage.getItem('workspaceContent');
        if (savedContent !== null) {
            this.state.content = savedContent;
            // if (this.elements.textarea) {
            //     this.elements.textarea.value = savedContent;
            // }
        }

        const savedDrafts = JSON.parse(localStorage.getItem('docstudio_documents'));
        if (savedDrafts !== null) {
            this.state.documents = savedDrafts;
        }
        
        // 设置开关状态
        if (this.elements.toggleButton) {
            this.elements.toggleButton.checked = this.state.aiSuggestionsEnabled;
        }
    },

    // 绑定事件处理
    bindEvents: function() {
        // 工作区开关功能 - 控制AI建议
        if (this.elements.toggleButton) {
            this.elements.toggleButton.addEventListener('change', (e) => this.handleToggleChange(e));
        }
        
        // 文本内容变化事件
        if (this.elements.textarea) {
            this.elements.textarea.addEventListener('input', (e) => this.handleInput(e));
        }
        
        // 整理按钮点击事件
        if (this.elements.organizeButton) {
            this.elements.organizeButton.addEventListener('click', (e) => this.handleOrganizeClick(e));
        }
    },

    // AI建议相关方法
    getAISuggestion: async function() {
        // 如果AI建议已禁用，则直接返回
        if (!this.state.aiSuggestionsEnabled) return this;
        
        // 检查是否已经处于等待状态，避免重复请求
        if (this.state.isWaitingForSuggestion) return this;
        this.state.isWaitingForSuggestion = true;
        
        const textarea = this.elements.textarea;
        if (!textarea) {
            this.state.isWaitingForSuggestion = false;
            return this;
        }
        
        // 获取设置
        const savedSettings = localStorage.getItem('APISettings');
        if (!savedSettings) {
            console.log('未找到API设置，无法获取建议');
            this.state.isWaitingForSuggestion = false;
            return this;
        }
        
        const settings = JSON.parse(savedSettings);
        const endpoint = settings.apiEndpoint;
        const apiKey = settings.apiKey;
        const model = settings.model;
        
        if (!endpoint || !apiKey || !model) {
            console.log('API设置不完整，无法获取建议');
            this.state.isWaitingForSuggestion = false;
            return this;
        }
        
        // 获取当前光标位置
        const cursorPosition = textarea.selectionStart;
        const text = textarea.value;
        
        // 添加加载指示器
        this.state.loadingIndicator = "\n\n正在生成AI建议...";
        textarea.value = textarea.value + this.state.loadingIndicator;
        
        try {
            // 发布AI建议请求开始事件
            if (window.EventSystem) {
                EventSystem.publish('draft:ai-suggestion-started', {});
            }
            
            // 发送API请求
            const response = await fetch(`${endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: "你是一个助手，根据用户输入的文本，只提出1个相关的后续问题或建议帮助用户完善文档，简短直接，不要解释。" },
                        { role: "user", content: text }
                    ],
                    max_tokens: parseInt(settings.maxTokens) || 100,
                    temperature: parseFloat(settings.temperature) || 0.7
                })
            });
            
            if (!response.ok) {
                throw new Error('API请求失败');
            }
            
            const data = await response.json();
            
            // 移除加载指示器
            textarea.value = textarea.value.replace(this.state.loadingIndicator, '');
            this.state.loadingIndicator = null;
            
            // 添加AI建议
            const suggestion = data.choices[0].message.content;
            const formattedSuggestion = "\n\n--- AI建议 ---\n" + suggestion + "\n-------------";
            
            textarea.value = textarea.value + formattedSuggestion;
            
            // 更新内部状态
            this.state.content = textarea.value;
            localStorage.setItem('workspaceContent', textarea.value);
            
            // 恢复光标位置
            textarea.selectionStart = cursorPosition;
            textarea.selectionEnd = cursorPosition;
            textarea.focus();
            
            // 发布AI建议完成事件
            if (window.EventSystem) {
                EventSystem.publish('draft:ai-suggestion-completed', {
                    suggestion: suggestion
                });
            }
            
        } catch (error) {
            console.error('获取AI建议时出错:', error);
            
            // 移除加载指示器
            if (this.state.loadingIndicator) {
                textarea.value = textarea.value.replace(this.state.loadingIndicator, '');
                this.state.loadingIndicator = null;
            }
            
            // 错误提示
            const errorMessage = "\n\n--- 无法获取AI建议 ---";
            textarea.value = textarea.value + errorMessage;
            
            // 3秒后自动移除错误消息
            setTimeout(() => {
                textarea.value = textarea.value.replace(errorMessage, '');
            }, 3000);
            
            // 发布错误事件
            if (window.EventSystem) {
                EventSystem.publish('draft:ai-suggestion-error', {
                    error: error.message
                });
            }
        } finally {
            this.state.isWaitingForSuggestion = false;
        }
        
        return this;
    },

    // 内容整理相关方法
    organizeContent: async function() {
        const textarea = this.elements.textarea;
        if (!textarea) return this;
        
        const content = textarea.value.trim();
        if (!content) {
            alert('请先在输入框中输入一些内容');
            return this;
        }
        
        // 获取API设置
        const savedSettings = localStorage.getItem('APISettings');
        if (!savedSettings) {
            alert('请先在设置中配置API信息');
            return this;
        }
        
        const settings = JSON.parse(savedSettings);
        const endpoint = settings.apiEndpoint;
        const apiKey = settings.apiKey;
        const model = settings.model;
        
        if (!endpoint || !apiKey || !model) {
            alert('API设置不完整，请检查设置');
            return this;
        }
        
        try {
            // 保存原始内容用于可能的回退
            this.state.originalContent = textarea.value;
            
            // 设置处理状态
            this.state.isStreamingContent = true;
            this.state.buttonState = 'STOP';
            
            if (this.elements.organizeButton) {
                this.elements.organizeButton.textContent = '停止';
            }
            
            // 准备开始流式输出
            textarea.value = "正在整理内容...\n";
            
            // 创建 AbortController 用于可能的取消
            this.state.controller = new AbortController();
            const signal = this.state.controller.signal;
            
            // 发布整理开始事件
            if (window.EventSystem) {
                EventSystem.publish('draft:organize-started', {
                    originalContent: this.state.originalContent
                });
            }
            
            // 开始流式请求
            const response = await fetch(`${endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { 
                            role: "system", 
                            content: "你是一个文本整理专家。请对用户提供的内容进行精简和优化，识别并保留用户意图,文档类型和核心信息，以关键词,key:value的形式输出。不要添加额外解释，直接给出优化后的文本。" 
                        },
                        { 
                            role: "user", 
                            content: "请精简整理以下内容，保持核心信息不变：\n\n" + content 
                        }
                    ],
                    max_tokens: parseInt(settings.maxTokens) || 2048,
                    temperature: parseFloat(settings.temperature) || 0.7,
                    stream: true // 启用流式输出
                }),
                signal // 添加信号用于可能的取消
            });
            
            if (!response.ok) {
                throw new Error('API请求失败');
            }
            
            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let resultText = '';
            
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                            try {
                                const data = JSON.parse(line.substring(6));
                                if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                                    resultText += data.choices[0].delta.content;
                                    textarea.value = resultText;
                                    textarea.scrollTop = textarea.scrollHeight; // 自动滚动到底部
                                    
                                    // 发布整理进度事件
                                    if (window.EventSystem) {
                                        EventSystem.publish('draft:organize-progress', {
                                            progress: resultText
                                        });
                                    }
                                }
                            } catch (e) {
                                console.error('解析流式数据时出错:', e);
                            }
                        } else if (line === 'data: [DONE]') {
                            break;
                        }
                    }
                }
                
                // 自动保存整理后的内容
                this.state.content = resultText;
                localStorage.setItem('workspaceContent', resultText);
                
                // 整理完成后，设置按钮为回退状态
                this.state.buttonState = 'REVERT';
                if (this.elements.organizeButton) {
                    this.elements.organizeButton.textContent = '回退';
                }
                
                // 发布整理完成事件
                if (window.EventSystem) {
                    EventSystem.publish('draft:organize-completed', {
                        originalContent: this.state.originalContent,
                        organizedContent: resultText
                    });
                }
                
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('整理过程被用户中断');
                    // 用户中断，设置按钮为回退状态
                    this.state.buttonState = 'REVERT';
                    if (this.elements.organizeButton) {
                        this.elements.organizeButton.textContent = '回退';
                    }
                    
                    // 发布整理中断事件
                    if (window.EventSystem) {
                        EventSystem.publish('draft:organize-aborted', {});
                    }
                } else {
                    throw error; // 重新抛出其他错误
                }
            }
            
        } catch (error) {
            console.error('整理内容时出错:', error);
            if (error.name !== 'AbortError') { // 只有在非用户中断的错误情况下显示错误信息
                textarea.value = `整理内容时出错: ${error.message || '未知错误'}\n\n原始内容:\n${this.state.originalContent}`;
                
                // 出错时，设置按钮为回退状态
                this.state.buttonState = 'REVERT';
                if (this.elements.organizeButton) {
                    this.elements.organizeButton.textContent = '回退';
                }
                
                // 发布错误事件
                if (window.EventSystem) {
                    EventSystem.publish('draft:organize-error', {
                        error: error.message
                    });
                }
            }
        } finally {
            // 清理状态
            this.state.isStreamingContent = false;
            this.state.controller = null;
        }
        
        return this;
    },

    // 公共API方法 - 获取内容
    getContent: function() {
        if (this.elements.textarea) {
            return this.elements.textarea.value;
        }
        return this.state.content || '';
    },

    // 公共API方法 - 设置内容
    setContent: function(content) {
        if (this.elements.textarea) {
            this.elements.textarea.value = content;
            this.state.content = content;
            localStorage.setItem('workspaceContent', content);
            
            // 发布内容更新事件
            if (window.EventSystem) {
                EventSystem.publish('draft:content-updated', {
                    content: content
                });
            }
        }
        return this;
    },
    
    // 处理开关切换事件
    handleToggleChange: function(event) {
        // 保存AI建议状态
        this.state.aiSuggestionsEnabled = event.target.checked;
        localStorage.setItem('aiSuggestionsEnabled', this.state.aiSuggestionsEnabled);
        
        if (event.target.checked) {
            console.log('AI建议已启用');
        } else {
            console.log('AI建议已禁用');
            // 如果关闭AI建议时正在等待建议，取消它
            if (this.state.suggestTimeout) {
                clearTimeout(this.state.suggestTimeout);
            }
        }
        
        // 发布事件
        if (window.EventSystem) {
            EventSystem.publish('draft:ai-suggestions-toggled', {
                enabled: this.state.aiSuggestionsEnabled
            });
        }
    },
    
    // 处理文本输入事件
    handleInput: function(event) {
        const textarea = this.elements.textarea;
        if (!textarea) return;
        
        // 自动保存逻辑
        clearTimeout(this.state.saveTimeout);
        this.state.saveTimeout = setTimeout(() => {
            localStorage.setItem('workspaceContent', textarea.value);
            this.state.content = textarea.value;
            this.state.isDirty = false;
            console.log('内容已自动保存');
            
            // 发布内容更新事件
            if (window.EventSystem) {
                EventSystem.publish('draft:content-saved', {
                    content: textarea.value
                });
            }
        }, 500); // 500ms防抖，避免频繁保存
        
        // 更新dirty状态
        this.state.isDirty = true;
        
        // AI建议逻辑 - 仅在启用时执行
        if (this.state.aiSuggestionsEnabled) {
            clearTimeout(this.state.suggestTimeout);
            
            // 如果有正在显示的加载指示器，移除它
            if (this.state.loadingIndicator) {
                textarea.value = textarea.value.replace(this.state.loadingIndicator, '');
                this.state.loadingIndicator = null;
            }
            
            // 重置AI建议等待状态
            this.state.isWaitingForSuggestion = false;
            
            // 如果文本不为空，设置新的计时器
            if (textarea.value.trim() !== '') {
                this.state.suggestTimeout = setTimeout(() => {
                    this.getAISuggestion();
                }, 5000); // 5秒后获取AI建议
            }
        }
        
        // 处理组织按钮状态更改
        if (this.state.buttonState === 'REVERT') {
            this.state.buttonState = 'ORGANIZE';
            if (this.elements.organizeButton) {
                this.elements.organizeButton.textContent = '整理';
            }
        }
    },
    
    // 处理整理按钮点击
    handleOrganizeClick: function(event) {
        // 根据按钮当前状态执行不同操作
        switch (this.state.buttonState) {
            case 'ORGANIZE': // 整理功能
                this.organizeContent();
                break;
            case 'STOP': // 停止功能
                this.stopOrganizing();
                break;
            case 'REVERT': // 回退功能
                this.revertContent();
                break;
        }
    },
    
    // 停止整理过程
    stopOrganizing: function() {
        if (this.state.controller) {
            this.state.controller.abort(); // 取消正在进行的请求
            console.log('内容整理过程已停止');
        }
        return this;
    },
    
    // 回退到原始内容
    revertContent: function() {
        if (this.elements.textarea && this.state.originalContent) {
            // 恢复原始内容
            this.elements.textarea.value = this.state.originalContent;
            
            // 更新状态和localStorage
            this.state.content = this.state.originalContent;
            localStorage.setItem('workspaceContent', this.state.originalContent);
            
            // 重置按钮状态
            this.state.buttonState = 'ORGANIZE';
            if (this.elements.organizeButton) {
                this.elements.organizeButton.textContent = '整理';
            }
            
            console.log('内容已恢复到整理前状态');
            
            // 发布内容回退事件
            if (window.EventSystem) {
                EventSystem.publish('draft:content-reverted', {
                    content: this.state.originalContent
                });
            }
        }
        return this;
    },
    
    // 加载工作区内容 - 公共API
    loadWorkspaceContent: function() {
        this.loadState();
        return this;
    },
    
    // 检查内容是否为空 - 公共API
    isEmpty: function() {
        const content = this.getContent();
        return !content || content.trim() === '';
    },
    
    // 清空内容 - 公共API
    clearContent: function() {
        return this.setContent('');
    },
    
    // 插入内容到指定位置 - 公共API
    insertContentAt: function(content, position) {
        if (!this.elements.textarea) return this;
        
        const currentContent = this.elements.textarea.value;
        const pos = (position !== undefined) ? position : currentContent.length;
        
        const newContent = currentContent.substring(0, pos) + content + currentContent.substring(pos);
        return this.setContent(newContent);
    },
    
    // 插入内容到光标位置 - 公共API
    insertAtCursor: function(content) {
        if (!this.elements.textarea) return this;
        
        const cursorPos = this.elements.textarea.selectionStart;
        return this.insertContentAt(content, cursorPos);
    },
    
    // 聚焦文本框 - 公共API
    focus: function() {
        if (this.elements.textarea) {
            this.elements.textarea.focus();
        }
        return this;
    }
};

// 导出组件
window.Draft = Draft;
