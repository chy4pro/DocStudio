// RightClickMenu service - 右键菜单服务
const RightClickMenu = {
    // 存储右键菜单相关DOM元素引用
    elements: {},

    //光标位置和选中内容
    activeTextarea: null,
    cursorPosition: 0, // 记录光标位置
    isIMEComposing: false, // 添加输入法组合状态跟踪
    
    // 初始化右键菜单服务 - 只处理菜单UI
    init: function() {
        // 获取并存储DOM元素引用
        this.elements = {
            menu: document.getElementById('rightClickMenu'),
            input: document.getElementById('rightClickInput'),
        };

        // 只绑定菜单相关事件，不再直接绑定文本框
        this.bindEvents();
        
        console.log('RightClickMenu service initialized');
    },
    
    // 提供公共API，供组件调用来显示菜单
    showMenuAt: function(x, y, options) {
        // options包含：activeTextarea, cursorPosition, selectedText等
        this.activeTextarea = options.activeTextarea;
        this.cursorPosition = options.cursorPosition || 0;
        
        // 显示菜单
        this.showMenu(x, y, options.selectedText || '');
    },
    

    bindEvents: function () {
        this.elements.input.addEventListener('compositionstart', () => {
            this.isIMEComposing = true;
            console.log('IME composition started');
        });

        this.elements.input.addEventListener('compositionend', () => {
            this.isIMEComposing = false;
            console.log('IME composition ended');
            // 在组合输入结束后调整输入框大小
            this.adjustInputSize();
        });
        
        // 添加输入内容变化时自动调整输入框大小
        this.elements.input.addEventListener('input', () => {
            this.adjustInputSize();
        });
        // 点击页面其他地方时隐藏菜单
        document.addEventListener('click', () => {
            this.hideMenu();
        });
        // 按Esc键时隐藏菜单
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.elements.menu.style.display === 'block' && !this.isIMEComposing) {
                this.hideMenu();
            }
        });
        
        // 添加回车键处理
        this.elements.input.addEventListener('keydown', async (event) => {
            // 只有当不在输入法组合状态时才处理回车键事件
            if (event.key === 'Enter' && !this.isIMEComposing) {
                const inputText = this.elements.input.value.trim();
                // 保存当前活动的文本区域引用，因为hideContextMenu会清空这些状态
                const currentTextarea = this.activeTextarea;
                const referenceText = currentTextarea ? currentTextarea.value : '';
                
                // 立即隐藏菜单并清空内容
                this.hideMenu();
                
                // 如果有有效输入和文本区域，生成AI回答
                if (inputText && currentTextarea) {
                    // 处理输入并生成回答
                    console.log("处理输入:", inputText);
                    console.log("文本区域:", currentTextarea.id);
                    
                    // 使用内部方法生成回答
                    await this.generateResponse(inputText, referenceText, currentTextarea);
                }
            }
        });
    },

    showMenu: function (x, y, selectedText) {
        // 设置菜单位置
        this.elements.menu.style.left = `${x}px`;
        this.elements.menu.style.top = `${y}px`;

        // 显示菜单
        this.elements.menu.style.display = 'block';

        // 防止菜单超出视口
        const menuRect = this.elements.menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 如果菜单底部超出视口，向上移动
        if (menuRect.bottom > viewportHeight) {
            this.elements.menu.style.top = `${y - menuRect.height}px`;
        }

        // 如果菜单右侧超出视口，向左移动
        if (menuRect.right > viewportWidth) {
            this.elements.menu.style.left = `${x - menuRect.width}px`;
        }

        // 如果有选中文本，在输入框中添加提示
        if (selectedText && selectedText.trim().length > 0) {
            this.elements.input.placeholder = `针对选中的文本回答...`;
        } else {
            this.elements.input.placeholder = `在这里输入...`;
        }

        // 自动聚焦到输入框
        setTimeout(() => {
            this.elements.input.focus();
        }, 10);
    },

    // 隐藏右键菜单并清空内容
    hideMenu: function () {
        this.elements.menu.style.display = 'none';
        this.elements.input.value = '';
        console.log('Context menu hidden');
    },
    
    // 调整输入框大小以适应内容
    adjustInputSize: function() {
        // 设置最小宽度
        const minWidth = 150;
        // 计算内容宽度 (每个字符约 7px，但中文字符更宽)
        const contentLength = this.elements.input.value.length;
        // 中文和英文混合情况下的估计宽度
        const estimatedWidth = Math.max(minWidth, contentLength * 12);
        
        // 限制最大宽度，避免输入框过宽
        const maxWidth = Math.min(window.innerWidth * 0.8, 500); 
        const newWidth = Math.min(estimatedWidth, maxWidth);
        
        // 应用计算后的宽度
        this.elements.input.style.width = newWidth + 'px';
        
        // 更新菜单容器宽度，比输入框稍宽以便有内边距
        const menuContent = this.elements.menu.querySelector('.menu-content');
        if (menuContent) {
            menuContent.style.width = (newWidth + 20) + 'px';
        }
        
        // 调整菜单位置，避免超出视口边界
        this.adjustMenuPosition();
    },
    
    // 调整菜单位置以避免超出视口
    adjustMenuPosition: function() {
        if (this.elements.menu.style.display !== 'block') return;
        
        const rect = this.elements.menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        // 如果菜单右侧超出视口，向左移动
        if (rect.right > viewportWidth) {
            const overflowX = rect.right - viewportWidth;
            this.elements.menu.style.left = (parseInt(this.elements.menu.style.left) - overflowX - 10) + 'px';
        }
    },

    // 生成AI回答
    generateResponse: async function(inputText, referenceText, currentTextarea) {
        if (!inputText || !referenceText || !currentTextarea) return;
        
        // 检查是否有选中的文本
        const selectedText = currentTextarea.value.substring(
            currentTextarea.selectionStart, 
            currentTextarea.selectionEnd
        ).trim();
        
        // 决定使用哪段文本作为输入 - 如果有选中文本则优先使用
        let textForAI = referenceText;
        let contextPrompt = "";
        
        if (selectedText.length > 0) {
            textForAI = selectedText;
            contextPrompt = "用户选择了以下文本进行提问：\n\n" + selectedText + "\n\n";
        }
        
        // 获取API设置
        const settings = Settings.getSettings();
        const endpoint = settings.apiEndpoint;
        const apiKey = settings.apiKey;
        const model = settings.model;
        
        if (!endpoint || !apiKey || !model) {
            console.log('API设置不完整，无法获取AI回答');
            return;
        }
        
        // 左右文本框使用不同的插入逻辑
        const workspace = document.getElementById('workspace');
        if (currentTextarea === workspace) {
            // 左侧文本框 - 始终在末尾添加内容
            currentTextarea.focus();
            
            // 将光标移至文本末尾
            const endPosition = currentTextarea.value.length;
            currentTextarea.setSelectionRange(endPosition, endPosition);
            
            // 使用execCommand插入提示文字，这样可以支持撤销操作
            const promptText = "\n\n--- AI回答(问题: " + inputText + ") ---\n";
            document.execCommand('insertText', false, promptText);
            
            // 占位符
            const placeholder = "正在生成回答...";
            document.execCommand('insertText', false, placeholder);
            
            // 记住占位符的开始和结束位置，以便之后替换
            const placeholderStart = endPosition + promptText.length;
            const placeholderEnd = placeholderStart + placeholder.length;
            
            try {
                // API请求使用选中文本
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
                                content: "你是一个助手。用户会给你一个问题，然后提供一段参考文本。你需要主要基于问题给出回答，同时把参考文本作为背景信息考虑进去。回答要简洁、专业。" 
                            },
                            { 
                                role: "user", 
                                content: contextPrompt + "问题: " + inputText + "\n\n参考文本: " + textForAI 
                            }
                        ],
                        max_tokens: parseInt(settings.maxTokens) || 500,
                        temperature: parseFloat(settings.temperature) || 0.7
                    })
                });
                
                if (!response.ok) {
                    throw new Error('API请求失败');
                }
                
                const data = await response.json();
                const aiResponse = data.choices[0].message.content + "\n-------------";
                
                // 替换占位符为AI回答（使用execCommand以支持撤销）
                currentTextarea.focus();
                currentTextarea.setSelectionRange(placeholderStart, placeholderEnd);
                document.execCommand('insertText', false, aiResponse);
                
                // 设置光标位置在回答之后
                const newCursorPosition = placeholderStart + aiResponse.length;
                currentTextarea.setSelectionRange(newCursorPosition, newCursorPosition);
                
                // 自动保存内容
                localStorage.setItem('workspaceContent', workspace.value);
                
                // 发布事件
                EventSystem.publish('rightClickMenu:responseGenerated', { 
                    textarea: 'workspace', 
                    question: inputText, 
                    response: aiResponse 
                });
                
                // 通知Draft组件内容已更新
                EventSystem.publish('rightClickMenu:contentInserted', { 
                    targetId: 'workspace', 
                    content: workspace.value 
                });
                
            } catch (error) {
                console.error('获取AI回答时出错:', error);
                currentTextarea.focus();
                currentTextarea.setSelectionRange(placeholderStart, placeholderEnd);
                document.execCommand('insertText', false, "无法获取AI回答: " + error.message + "\n-------------");
            }
        } else {
            // 右侧文本框 - 在光标位置插入内容
            currentTextarea.focus();
            currentTextarea.setSelectionRange(this.cursorPosition, this.cursorPosition);
            
            // 使用execCommand插入提示文字
            const promptText = "\n\n--- AI回答(问题: " + inputText + ") ---\n";
            document.execCommand('insertText', false, promptText);
            
            // 为占位符记录新的插入点
            const placeholderPosition = this.cursorPosition + promptText.length;
            const placeholder = "正在生成回答...";
            document.execCommand('insertText', false, placeholder);
            
            // 记住占位符的开始和结束位置
            const placeholderStart = placeholderPosition;
            const placeholderEnd = placeholderStart + placeholder.length;
            
            try {
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
                                content: "你是一个助手。用户会给你一个问题，然后提供一段参考文本。你需要主要基于问题给出回答，同时把参考文本作为背景信息考虑进去。回答要简洁、专业。" 
                            },
                            { 
                                role: "user", 
                                content: contextPrompt + "问题: " + inputText + "\n\n参考文本: " + textForAI 
                            }
                        ],
                        max_tokens: parseInt(settings.maxTokens) || 500,
                        temperature: parseFloat(settings.temperature) || 0.7
                    })
                });
                
                if (!response.ok) {
                    throw new Error('API请求失败');
                }
                
                const data = await response.json();
                const aiResponse = data.choices[0].message.content + "\n-------------";
                
                // 替换占位符为AI回答
                currentTextarea.focus();
                currentTextarea.setSelectionRange(placeholderStart, placeholderEnd);
                document.execCommand('insertText', false, aiResponse);
                
                // 设置光标位置在回答之后
                const newCursorPosition = placeholderStart + aiResponse.length;
                currentTextarea.setSelectionRange(newCursorPosition, newCursorPosition);
                
                // 自动保存内容
                const displayspace = document.getElementById('displayspace');
                if (currentTextarea === displayspace) {
                    localStorage.setItem('displayspaceContent', displayspace.value);
                    
                    // 如果自动渲染开启，更新预览
                    const displayspaceToggle = document.getElementById('displayspace-toggle');
                    if (displayspaceToggle && displayspaceToggle.checked) {
                        // 触发自定义事件以更新预览区
                        EventSystem.publish('rightClickMenu:displayspaceUpdated', { content: displayspace.value });
                    }
                }
                
                // 发布事件
                EventSystem.publish('rightClickMenu:responseGenerated', { 
                    textarea: 'displayspace', 
                    question: inputText, 
                    response: aiResponse 
                });
                
            } catch (error) {
                console.error('获取AI回答时出错:', error);
                currentTextarea.focus();
                currentTextarea.setSelectionRange(placeholderStart, placeholderEnd);
                document.execCommand('insertText', false, "无法获取AI回答: " + error.message + "\n-------------");
            }
        }
    }
};

// 导出RightClickMenu服务
window.RightClickMenu = RightClickMenu;
