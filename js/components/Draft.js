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
        buttonState: 'ORGANIZE', // 按钮状态: ORGANIZE, STOP, REVERT
        activeTextarea: null, // 当前活动文本区域引用
        resizeObserver: null, // ResizeObserver实例
        consecutiveEnters: 0 // 连续回车计数器
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
        
        // 初始化ResizeObserver
        this.initResizeObserver();
        
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
    
    // 初始化ResizeObserver
    initResizeObserver: function() {
        // No longer needed as we'll use pre elements instead
        console.log('Using pre elements for height adjustment instead of ResizeObserver');
    },
    
    // 调整textarea高度的辅助方法
    adjustTextareaHeight: function(textarea) {
        // No longer needed as we'll use pre elements instead
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
            if (data && data.targetId) {
                // 查找对应的便签和索引
                const docIndex = this.state.documents.findIndex(doc => doc.id === data.targetId);
                if (docIndex !== -1) {
                    const textarea = document.getElementById(data.targetId);
                    if (!textarea) return;
                    
                    // 标记为需要保存
                    this.state.isDirty = true;
                    clearTimeout(this.state.saveTimeout);
                    this.state.saveTimeout = setTimeout(() => {
                        // 更新文档内容
                        this.state.documents[docIndex].content = textarea.value;
                        localStorage.setItem('docstudio_documents', JSON.stringify(this.state.documents));
                        console.log('来自右键菜单的内容已自动保存:', data.targetId);
                    }, 500);
                }
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
        
        // 清空现有内容
        this.elements.container.innerHTML = '';
        
        // 如果documents为空，添加默认文档
        if (this.state.documents.length === 0) {
            this.state.documents.push({
                id: 'note-' + Date.now(),
                content: '',
                title: '新建便签'
            });
        }
        
        // 创建textarea元素
        this.state.documents.forEach((draft, index) => {
            const div = document.createElement('div');
            div.className = 'draft-note-container';
            
            // 创建隐藏的pre元素用于撑开高度
            const pre = document.createElement('pre');
            pre.className = 'draft-pre-mirror';
            pre.textContent = draft.content + '\n'; // 添加额外换行确保足够空间
            
            const textarea = document.createElement('textarea');
            textarea.id = draft.id;
            textarea.value = draft.content;
            textarea.className = 'draft-textarea';
            textarea.placeholder = 'Please enter content';
            
            // 设置样式，确保textarea与pre完全重叠且高度为100%
            textarea.style.height = '100%';
            
            div.appendChild(pre);
            div.appendChild(textarea);
            this.elements.container.appendChild(div);
            
            // 设置第一个便签为活动便签
            if (index === 0) {
                this.state.activeTextarea = textarea;
                div.classList.add('active-note');
            }
            
            // 为每个textarea添加焦点事件，设置activeTextarea
            textarea.addEventListener('focus', () => {
                this.state.activeTextarea = textarea;
                
                // 更新视觉样式
                document.querySelectorAll('.draft-note-container').forEach(container => {
                    container.classList.remove('active-note');
                });
                div.classList.add('active-note');
                
                // 当一个便签获得焦点时，删除其他空便签
                this.deleteEmptyNotes();
            });
            
            // 为每个textarea添加输入事件，处理自动保存
            textarea.addEventListener('input', (e) => this.handleInput(e));
            
            // 添加键盘事件监听
            textarea.addEventListener('keydown', (e) => this.handleKeyDown(e));
        });
        
        // 绑定右键菜单处理
        this.bindRightClickHandler();
    },
    
    // 绑定右键菜单处理
    bindRightClickHandler: function() {
        // 获取所有的textarea元素
        const textareas = document.querySelectorAll('.draft-textarea');
        if (!textareas.length) return;
        
        // 为每个textarea添加右键菜单
        textareas.forEach(textarea => {
            textarea.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                
                // 将右键点击的textarea设为活动textarea
                this.state.activeTextarea = textarea;
                
                // 获取选中的文本
                const selectedText = textarea.value.substring(
                    textarea.selectionStart, 
                    textarea.selectionEnd
                );
                
                // 记录光标位置
                const cursorPosition = textarea.selectionStart;
                
                // 调用RightClickMenu服务显示菜单
                if (window.RightClickMenu) {
                    RightClickMenu.showMenuAt(event.clientX, event.clientY, {
                        activeTextarea: textarea,
                        cursorPosition: cursorPosition,
                        selectedText: selectedText
                    });
                }
            });
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
        
        // 使用当前活动的便签
        const textarea = this.state.activeTextarea;
        if (!textarea) {
            this.state.isWaitingForSuggestion = false;
            return this;
        }
        
        // 获取pre元素
        const preElement = textarea.parentElement.querySelector('.draft-pre-mirror');
        
        // 查找便签在文档集合中的位置
        const docId = textarea.id;
        const docIndex = this.state.documents.findIndex(doc => doc.id === docId);
        
        if (docIndex === -1) {
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
        
        // 同步更新pre元素
        if (preElement) {
            preElement.textContent = textarea.value + '\n';
        }
        
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
            this.state.documents[docIndex].content = textarea.value;
            localStorage.setItem('docstudio_documents', JSON.stringify(this.state.documents));
            
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
        // 使用当前活动的便签
        const textarea = this.state.activeTextarea;
        if (!textarea) return this;
        
        // 获取pre元素
        const preElement = textarea.parentElement.querySelector('.draft-pre-mirror');
        
        // 查找便签在文档集合中的位置
        const docId = textarea.id;
        const docIndex = this.state.documents.findIndex(doc => doc.id === docId);
        
        if (docIndex === -1) return this;
        
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
            
            // 同步更新pre元素
            if (preElement) {
                preElement.textContent = textarea.value + '\n';
            }
            
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
                                    
                                    // 同步更新pre元素
                                    if (preElement) {
                                        preElement.textContent = resultText + '\n';
                                    }
                                    
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
                this.state.documents[docIndex].content = resultText;
                localStorage.setItem('docstudio_documents', JSON.stringify(this.state.documents));
                
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
                
                // 同步更新pre元素
                if (preElement) {
                    preElement.textContent = textarea.value + '\n';
                }
                
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

    // 公共API方法 - 获取活动便签内容
    getContent: function() {
        if (this.state.activeTextarea) {
            return this.state.activeTextarea.value;
        }
        return '';
    },

    // 公共API方法 - 设置活动便签内容
    setContent: function(content) {
        const textarea = this.state.activeTextarea;
        if (!textarea) return this;
        
        // 查找便签在文档集合中的位置
        const docId = textarea.id;
        const docIndex = this.state.documents.findIndex(doc => doc.id === docId);
        if (docIndex === -1) return this;
        
        // 更新文本框内容
        textarea.value = content;
        
        // 同步更新pre元素
        const preElement = textarea.parentElement.querySelector('.draft-pre-mirror');
        if (preElement) {
            preElement.textContent = content + '\n';
        }
        
        // 更新文档集合和localStorage
        this.state.documents[docIndex].content = content;
        localStorage.setItem('docstudio_documents', JSON.stringify(this.state.documents));
        
        // 发布内容更新事件
        if (window.EventSystem) {
            EventSystem.publish('draft:content-updated', {
                content: content,
                noteId: docId
            });
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
        // 用事件目标作为当前活动的textarea
        const textarea = event.target;
        if (!textarea) return;
        
        // 确保这是我们的便签
        const docId = textarea.id;
        const docIndex = this.state.documents.findIndex(doc => doc.id === docId);
        if (docIndex === -1) return;
        
        // 设置为活动便签
        this.state.activeTextarea = textarea;
        
        // 更新对应的pre元素内容以调整高度
        const preElement = textarea.parentElement.querySelector('.draft-pre-mirror');
        if (preElement) {
            preElement.textContent = textarea.value + '\n'; // 额外添加换行确保足够空间
        }
        
        // 自动保存逻辑
        clearTimeout(this.state.saveTimeout);
        this.state.saveTimeout = setTimeout(() => {
            // 更新文档内容
            this.state.documents[docIndex].content = textarea.value;
            localStorage.setItem('docstudio_documents', JSON.stringify(this.state.documents));
            this.state.isDirty = false;
            console.log('便签内容已自动保存:', docId);
            
            // 发布内容更新事件
            if (window.EventSystem) {
                EventSystem.publish('draft:content-saved', {
                    content: textarea.value,
                    noteId: docId
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
                
                // 同步更新pre元素内容
                if (preElement) {
                    preElement.textContent = textarea.value + '\n';
                }
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
        const textarea = this.state.activeTextarea;
        if (textarea && this.state.originalContent) {
            // 查找便签在文档集合中的位置
            const docId = textarea.id;
            const docIndex = this.state.documents.findIndex(doc => doc.id === docId);
            
            if (docIndex === -1) return this;
            
            // 恢复原始内容
            textarea.value = this.state.originalContent;
            
            // 更新状态和localStorage
            this.state.documents[docIndex].content = this.state.originalContent;
            localStorage.setItem('docstudio_documents', JSON.stringify(this.state.documents));
            
            // 重置按钮状态
            this.state.buttonState = 'ORGANIZE';
            if (this.elements.organizeButton) {
                this.elements.organizeButton.textContent = '整理';
            }
            
            console.log('内容已恢复到整理前状态');
            
            // 发布内容回退事件
            if (window.EventSystem) {
                EventSystem.publish('draft:content-reverted', {
                    content: this.state.originalContent,
                    noteId: docId
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
        const textarea = this.state.activeTextarea;
        if (!textarea) return this;
        
        const currentContent = textarea.value;
        const pos = (position !== undefined) ? position : currentContent.length;
        
        const newContent = currentContent.substring(0, pos) + content + currentContent.substring(pos);
        return this.setContent(newContent);
    },
    
    // 插入内容到光标位置 - 公共API
    insertAtCursor: function(content) {
        const textarea = this.state.activeTextarea;
        if (!textarea) return this;
        
        const cursorPos = textarea.selectionStart;
        return this.insertContentAt(content, cursorPos);
    },
    
    // 聚焦活动文本框 - 公共API
    focus: function() {
        if (this.state.activeTextarea) {
            this.state.activeTextarea.focus();
        }
        return this;
    },
    
    // 删除空的便签（除了当前活动的便签）
    deleteEmptyNotes: function() {
        if (this.state.documents.length <= 1) return this; // 至少保留一个便签
        
        const activeId = this.state.activeTextarea ? this.state.activeTextarea.id : null;
        let hasDeleted = false;
        
        // 查找并删除空便签
        this.state.documents = this.state.documents.filter(doc => {
            // 如果是活动便签或有内容，则保留
            const keepNote = (doc.id === activeId || doc.content.trim() !== '');
            
            // 如果要删除便签，同时删除其DOM元素
            if (!keepNote) {
                const element = document.getElementById(doc.id);
                if (element && element.parentElement) {
                    element.parentElement.remove();
                    hasDeleted = true;
                }
            }
            
            return keepNote;
        });
        
        // 如果有便签被删除，保存更新后的列表
        if (hasDeleted) {
            localStorage.setItem('docstudio_documents', JSON.stringify(this.state.documents));
            console.log('已删除空便签');
        }
        
        return this;
    },

    // 处理键盘事件
    handleKeyDown: function(event) {
        const textarea = event.target;
        if (!textarea) return;
        
        // 查找对应便签
        const docId = textarea.id;
        const docIndex = this.state.documents.findIndex(doc => doc.id === docId);
        if (docIndex === -1) return;
        
        // 检测回车键
        if (event.key === 'Enter') {
            this.state.consecutiveEnters++;
            console.log("Enter:"+this.state.consecutiveEnters);
            
            // 连续3次回车触发拆分
            if (this.state.consecutiveEnters >= 3) {
                event.preventDefault(); // 阻止第三次回车的默认行为
                this.splitDocument(textarea, docIndex);
                this.state.consecutiveEnters = 0; // 重置计数器
            }
        } else {
            // 不是回车键，重置计数
            this.state.consecutiveEnters = 0;
        }
    },
    
    // 拆分文档方法
    splitDocument: function(textarea, docIndex) {
        // 获取光标位置
        const cursorPosition = textarea.selectionStart;
        const content = textarea.value;
        
        // 获取光标前后的内容
        let contentBefore = content.substring(0, cursorPosition);
        let contentAfter = content.substring(cursorPosition);
        
        // 删除多余的回车 - 最多保留一个回车作为段落分隔
        // contentBefore = contentBefore.replace(/\n{2,}$/, '\n');
        
        // 查找当前文档在DOM中的位置
        const currentNoteContainer = textarea.parentElement;
        const parentContainer = currentNoteContainer.parentElement;
        const noteIndex = Array.from(parentContainer.children).indexOf(currentNoteContainer);
        
        // 情况1: 光标前后都有内容 - 拆分为两个文档
        if (contentBefore.trim() && contentAfter.trim()) {
            // 处理前半部分末尾的连续回车，最多保留一个
            contentBefore = contentBefore.replace(/\n{2,}$/, '\n');
            
            // 处理后半部分开头的连续回车，全部删除
            contentAfter = contentAfter.replace(/^\n+/, '');
            
            // 更新当前文档内容为光标前的内容
            textarea.value = contentBefore;
            this.state.documents[docIndex].content = contentBefore;
            
            // 调整当前textarea高度
            this.adjustTextareaHeight(textarea);
            
            // 创建新文档包含光标后的内容
            const newDocId = 'note-' + Date.now();
            const newDoc = {
                id: newDocId,
                content: contentAfter,
                title: '新建便签'
            };
            
            // 在当前文档后插入新文档
            this.state.documents.splice(docIndex + 1, 0, newDoc);
            
            // 创建并插入新的DOM元素
            this.createNoteElement(newDoc, noteIndex + 1);
        } 
        // 情况2: 光标前没有内容 - 在当前文档前创建新文档
        else if (!contentBefore.trim() && contentAfter.trim()) {
            // 删除后半部分开头的连续回车
            contentAfter = contentAfter.replace(/^\n+/, '');
            
            // 更新当前文档内容为处理后的文本
            textarea.value = contentAfter;
            this.state.documents[docIndex].content = contentAfter;
            
            // 调整当前textarea高度
            this.adjustTextareaHeight(textarea);
            
            const newDocId = 'note-' + Date.now();
            const newDoc = {
                id: newDocId,
                content: '',
                title: '新建便签'
            };
            
            // 在当前文档前插入新文档
            this.state.documents.splice(docIndex, 0, newDoc);
            
            // 创建并插入新的DOM元素
            this.createNoteElement(newDoc, noteIndex);
        }
        // 情况3: 光标后没有内容 - 在当前文档后创建新文档
        else if (contentBefore.trim() && !contentAfter.trim()) {
            // 删除末尾多余的回车，全部删除
            const trimmedContent = contentBefore.replace(/\n+$/, '');
            textarea.value = trimmedContent;
            this.state.documents[docIndex].content = trimmedContent;
            
            // 调整当前textarea高度
            this.adjustTextareaHeight(textarea);
            
            const newDocId = 'note-' + Date.now();
            const newDoc = {
                id: newDocId,
                content: '',
                title: '新建便签'
            };
            
            // 在当前文档后插入新文档
            this.state.documents.splice(docIndex + 1, 0, newDoc);
            
            // 创建并插入新的DOM元素
            this.createNoteElement(newDoc, noteIndex + 1);
        }
        
        // 保存更新后的文档数组
        localStorage.setItem('docstudio_documents', JSON.stringify(this.state.documents));
        
        // 发布文档拆分事件
        if (window.EventSystem) {
            EventSystem.publish('draft:document-split', {
                sourceDocId: docIndex,
                documents: this.state.documents
            });
        }
    },
    
    // 在指定位置创建并插入便签
    createNoteElement: function(docData, insertIndex) {
        const container = this.elements.container;
        
        // 创建新便签容器和textarea
        const div = document.createElement('div');
        div.className = 'draft-note-container';
        
        // 创建隐藏的pre元素用于撑开高度
        const pre = document.createElement('pre');
        pre.className = 'draft-pre-mirror';
        pre.textContent = docData.content + '\n'; // 添加额外换行确保足够空间
        
        const textarea = document.createElement('textarea');
        textarea.id = docData.id;
        textarea.value = docData.content;
        textarea.className = 'draft-textarea';
        textarea.placeholder = 'Please enter content';
        
        // 设置样式，确保textarea高度为100%
        textarea.style.height = '100%';
        
        div.appendChild(pre);
        div.appendChild(textarea);
        
        // 获取所有现有便签
        const notes = container.querySelectorAll('.draft-note-container');
        
        // 在指定位置插入
        if (insertIndex < notes.length) {
            container.insertBefore(div, notes[insertIndex]);
        } else {
            container.appendChild(div);
        }
        
        // 设置为活动便签
        this.state.activeTextarea = textarea;
        
        // 更新视觉样式
        document.querySelectorAll('.draft-note-container').forEach(container => {
            container.classList.remove('active-note');
        });
        div.classList.add('active-note');
        
        // 添加事件监听
        textarea.addEventListener('focus', () => {
            this.state.activeTextarea = textarea;
            
            // 更新视觉样式
            document.querySelectorAll('.draft-note-container').forEach(container => {
                container.classList.remove('active-note');
            });
            div.classList.add('active-note');
            
            // 当一个便签获得焦点时，删除其他空便签
            this.deleteEmptyNotes();
        });
        
        textarea.addEventListener('input', (e) => this.handleInput(e));
        textarea.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // 聚焦新便签
        textarea.focus();
        
        return textarea;
    }
};

// 导出组件
window.Draft = Draft;
