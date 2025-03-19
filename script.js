// 获取元素
const settingsBtn = document.querySelector('.settings-btn');
const modal = document.getElementById('settingsModal');
const closeBtn = document.getElementById('closeModal');
const apiEndpointInput = document.getElementById('apiEndpoint');
const apiKeyInput = document.getElementById('apiKey');
const modelInput = document.getElementById('model');
const temperatureInput = document.getElementById('temperature');
const tempValueSpan = document.getElementById('tempValue');
const maxTokensInput = document.getElementById('maxTokens');
const testAPIBtn = document.getElementById('testAPI');
const saveSettingsBtn = document.getElementById('saveSettings');
const testResultDiv = document.getElementById('testResult');
const textarea = document.getElementById('workspace');

// 打开设置弹窗
settingsBtn.addEventListener('click', function() {
    modal.style.display = 'flex';
});

// 关闭设置弹窗
closeBtn.addEventListener('click', function() {
    modal.style.display = 'none';
});

// 点击弹窗外部关闭弹窗
window.addEventListener('click', function(event) {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// 显示温度值
temperatureInput.addEventListener('input', function() {
    tempValueSpan.textContent = this.value;
});

// 保存设置
saveSettingsBtn.addEventListener('click', function() {
    // 保存设置到localStorage
    const settings = {
        apiEndpoint: apiEndpointInput.value,
        apiKey: apiKeyInput.value,
        model: modelInput.value,
        temperature: temperatureInput.value,
        maxTokens: maxTokensInput.value
    };
    localStorage.setItem('APISettings', JSON.stringify(settings));
    alert('设置已保存');
    modal.style.display = 'none';
});

// 加载保存的设置
function loadSettings() {
    const savedSettings = localStorage.getItem('APISettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        apiEndpointInput.value = settings.apiEndpoint || '';
        apiKeyInput.value = settings.apiKey || '';
        modelInput.value = settings.model || '';
        temperatureInput.value = settings.temperature || 0.7;
        tempValueSpan.textContent = settings.temperature || 0.7;
        maxTokensInput.value = settings.maxTokens || 2048;
    }
}

// 测试API连接
testAPIBtn.addEventListener('click', async function() {
    testResultDiv.style.display = 'block';
    testResultDiv.textContent = '测试中...';
    testResultDiv.style.backgroundColor = '#f0f0f0';
    
    const endpoint = apiEndpointInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    const model = modelInput.value.trim();
    
    if (!endpoint || !apiKey || !model) {
        testResultDiv.textContent = '错误: 请填写所有必要的字段';
        testResultDiv.style.backgroundColor = '#ffebee';
        return;
    }
    
    try {
        // 构建API请求 - 使用简单的模型预检请求，避免生成过多内容
        const response = await fetch(`${endpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 1  // 只请求1个token的响应，节省API调用费用
            })
        });
        
        if (response.ok) {
            testResultDiv.textContent = '连接成功！API 设置有效。';
            testResultDiv.style.backgroundColor = '#e8f5e9';
        } else {
            const errorData = await response.json();
            testResultDiv.textContent = `错误: ${errorData.error?.message || response.statusText}`;
            testResultDiv.style.backgroundColor = '#ffebee';
        }
    } catch (error) {
        testResultDiv.textContent = `错误: ${error.message || '连接失败'}`;
        testResultDiv.style.backgroundColor = '#ffebee';
    }
});

// 获取开关元素
const workspaceToggle = document.getElementById('workspace-toggle');
const displayspaceToggle = document.getElementById('displayspace-toggle');

// 记录AI建议是否启用
let aiSuggestionsEnabled = localStorage.getItem('aiSuggestionsEnabled') !== 'false';

// 初始化工作区开关状态
workspaceToggle.checked = aiSuggestionsEnabled;

// 工作区开关功能 - 控制AI建议
workspaceToggle.addEventListener('change', function() {
    // 保存AI建议状态
    aiSuggestionsEnabled = this.checked;
    localStorage.setItem('aiSuggestionsEnabled', aiSuggestionsEnabled);
    
    if (this.checked) {
        console.log('AI建议已启用');
    } else {
        console.log('AI建议已禁用');
        // 如果关闭AI建议时正在等待建议，取消它
        if (suggestTimeout) {
            clearTimeout(suggestTimeout);
        }
    }
});

// 自动保存功能和AI建议功能
let saveTimeout;
let suggestTimeout;
let isWaitingForSuggestion = false;
let loadingIndicator = null;

// 当文本内容变化时保存并重置AI建议计时器
textarea.addEventListener('input', function() {
    // 自动保存逻辑
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(function() {
        localStorage.setItem('workspaceContent', textarea.value);
        console.log('内容已自动保存');
    }, 500); // 500ms防抖，避免频繁保存
    
    // AI建议逻辑 - 仅在启用时执行
    if (aiSuggestionsEnabled) {
        clearTimeout(suggestTimeout);
        
        // 如果有正在显示的加载指示器，移除它
        if (loadingIndicator) {
            textarea.value = textarea.value.replace(loadingIndicator, '');
            loadingIndicator = null;
        }
        
        // 重置AI建议等待状态
        isWaitingForSuggestion = false;
        
        // 如果文本不为空，设置新的计时器
        if (textarea.value.trim() !== '') {
            suggestTimeout = setTimeout(function() {
                getAISuggestion();
            }, 5000); // 5秒后获取AI建议
        }
    }
});

// 获取AI建议
async function getAISuggestion() {
    // 如果AI建议已禁用，则直接返回
    if (!aiSuggestionsEnabled) return;
    
    // 检查是否已经处于等待状态，避免重复请求
    if (isWaitingForSuggestion) return;
    isWaitingForSuggestion = true;
    
    // 获取设置
    const savedSettings = localStorage.getItem('APISettings');
    if (!savedSettings) {
        console.log('未找到API设置，无法获取建议');
        isWaitingForSuggestion = false;
        return;
    }
    
    const settings = JSON.parse(savedSettings);
    const endpoint = settings.apiEndpoint;
    const apiKey = settings.apiKey;
    const model = settings.model;
    
    if (!endpoint || !apiKey || !model) {
        console.log('API设置不完整，无法获取建议');
        isWaitingForSuggestion = false;
        return;
    }
    
    // 获取当前光标位置
    const cursorPosition = textarea.selectionStart;
    const text = textarea.value;
    
    // 添加加载指示器
    loadingIndicator = "\n\n正在生成AI建议...";
    textarea.value = textarea.value + loadingIndicator;
    
    try {
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
        textarea.value = textarea.value.replace(loadingIndicator, '');
        loadingIndicator = null;
        
        // 添加AI建议
        const suggestion = data.choices[0].message.content;
        const formattedSuggestion = "\n\n--- AI建议 ---\n" + suggestion + "\n-------------";
        
        textarea.value = textarea.value + formattedSuggestion;
        
        // 恢复光标位置
        textarea.selectionStart = cursorPosition;
        textarea.selectionEnd = cursorPosition;
        textarea.focus();
        
    } catch (error) {
        console.error('获取AI建议时出错:', error);
        
        // 移除加载指示器
        textarea.value = textarea.value.replace(loadingIndicator, '');
        loadingIndicator = null;
        
        // 错误提示
        const errorMessage = "\n\n--- 无法获取AI建议 ---";
        textarea.value = textarea.value + errorMessage;
        
        // 3秒后自动移除错误消息
        setTimeout(() => {
            textarea.value = textarea.value.replace(errorMessage, '');
        }, 3000);
        
    } finally {
        isWaitingForSuggestion = false;
    }
}

// 加载保存的文本内容
function loadWorkspaceContent() {
    const savedContent = localStorage.getItem('workspaceContent');
    if (savedContent !== null) {
        textarea.value = savedContent;
    }
}

// 为右侧输入框添加自动保存功能
const displayspace = document.getElementById('displayspace');
let saveTimeoutRight;

// 自动保存右侧文本内容
displayspace.addEventListener('input', function() {
    clearTimeout(saveTimeoutRight);
    saveTimeoutRight = setTimeout(function() {
        localStorage.setItem('displayspaceContent', displayspace.value);
        console.log('右侧显示区域内容已自动保存');
    }, 500); // 500ms防抖，避免频繁保存
});

// 加载右侧保存的文本内容
function loadDisplayspaceContent() {
    const savedContent = localStorage.getItem('displayspaceContent');
    if (savedContent !== null) {
        displayspace.value = savedContent;
    }
}

// 为中间的generate按钮添加功能
const generateBtn = document.getElementById('markdown-button');
let isGenerating = false;

// 点击生成按钮事件
generateBtn.addEventListener('click', async function() {
    // 防止重复点击
    if (isGenerating) return;
    
    const workspaceContent = textarea.value.trim();
    if (!workspaceContent) {
        alert('请在左侧输入框中输入一些内容');
        return;
    }
    
    // 获取API设置
    const savedSettings = localStorage.getItem('APISettings');
    if (!savedSettings) {
        alert('请先在设置中配置API信息');
        return;
    }
    
    const settings = JSON.parse(savedSettings);
    const endpoint = settings.apiEndpoint;
    const apiKey = settings.apiKey;
    const model = settings.model;
    
    if (!endpoint || !apiKey || !model) {
        alert('API设置不完整，请检查设置');
        return;
    }
    
    try {
        // 设置生成状态
        isGenerating = true;
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        
        // 显示加载状态
        displayspace.value = "正在生成文档，请稍候...";
        
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
                    { 
                        role: "system", 
                        content: "你是一个文档生成助手。请根据用户提供的内容，生成一份格式精美的Markdown文档。确保文档结构清晰，包含适当的标题、列表、强调和其他Markdown元素。保持专业、简洁的风格。" 
                    },
                    { 
                        role: "user", 
                        content: "请根据以下内容生成一份Markdown格式的文档：\n\n" + workspaceContent 
                    }
                ],
                max_tokens: parseInt(settings.maxTokens) || 2048,
                temperature: parseFloat(settings.temperature) || 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error('API请求失败');
        }
        
        const data = await response.json();
        
        // 显示生成的Markdown文档
        displayspace.value = data.choices[0].message.content;
        
        // 自动保存生成的内容
        localStorage.setItem('displayspaceContent', displayspace.value);
        
    } catch (error) {
        console.error('生成文档时出错:', error);
        displayspace.value = `生成文档时出错: ${error.message || '未知错误'}`;
    } finally {
        // 恢复按钮状态
        isGenerating = false;
        generateBtn.disabled = false;
        generateBtn.textContent = 'generate';
    }
});

// 为右侧输入框上方的render按钮添加功能
const displayspaceBtn = document.getElementById('displayspace-btn');
const fullscreenContainer = document.getElementById('fullscreenContainer');
const renderFrame = document.getElementById('renderFrame');
const closeIframeBtn = document.getElementById('closeIframeBtn');
const openNewTabBtn = document.getElementById('openNewTabBtn');

// 渲染HTML内容到iframe
displayspaceBtn.addEventListener('click', async function() {
    const content = displayspace.value.trim();
    if (!content) {
        alert('请先在右侧输入框中输入内容');
        return;
    }
    
    // 获取API设置
    const savedSettings = localStorage.getItem('APISettings');
    if (!savedSettings) {
        alert('请先在设置中配置API信息');
        return;
    }
    
    const settings = JSON.parse(savedSettings);
    const endpoint = settings.apiEndpoint;
    const apiKey = settings.apiKey;
    const model = settings.model;
    
    if (!endpoint || !apiKey || !model) {
        alert('API设置不完整，请检查设置');
        return;
    }
    
    try {
        // 显示加载中状态
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
        
        // 将loading内容写入iframe
        const iframe = document.getElementById('renderFrame');
        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
        iframeDocument.open();
        iframeDocument.write(loadingHTML);
        iframeDocument.close();
        
        // 显示全屏iframe (loading)
        fullscreenContainer.style.display = 'flex';
        
        // 防止页面滚动
        document.body.style.overflow = 'hidden';
        
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
                    { 
                        role: "system", 
                        content: "你是一个HTML生成专家。将用户提供的内容转换为格式精美的HTML网页。添加适当的CSS样式使页面美观。确保HTML结构完整，包含<html>、<head>和<body>标签，只生成html,不要说多余的话。" 
                    },
                    { 
                        role: "user", 
                        content: "请将以下内容转换为HTML网页格式,只生成html,不要说多余的话：\n\n" + content 
                    }
                ],
                max_tokens: parseInt(settings.maxTokens) || 2048,
                temperature: parseFloat(settings.temperature) || 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error('API请求失败');
        }
        
        const data = await response.json();
        
        // 获取生成的HTML
        const generatedHTML = data.choices[0].message.content;
        
        // 将HTML内容写入iframe
        iframeDocument.open();
        iframeDocument.write(generatedHTML);
        iframeDocument.close();
        
    } catch (error) {
        console.error('生成HTML时出错:', error);
        
        // 显示错误信息
        const errorHTML = `
            <html>
            <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:Arial;background:#ffebee;color:#b71c1c;">
                <div style="text-align:center">
                    <h2>生成HTML时出错</h2>
                    <p>${error.message || '未知错误'}</p>
                </div>
            </body>
            </html>
        `;
        
        const iframe = document.getElementById('renderFrame');
        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
        iframeDocument.open();
        iframeDocument.write(errorHTML);
        iframeDocument.close();
    }
});

// 关闭iframe
closeIframeBtn.addEventListener('click', function() {
    fullscreenContainer.style.display = 'none';
    document.body.style.overflow = '';
});

// 在新标签页打开
openNewTabBtn.addEventListener('click', function() {
    const iframe = document.getElementById('renderFrame');
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    const htmlContent = iframeDocument.documentElement.outerHTML;
    
    const newTab = window.open();
    newTab.document.write(htmlContent);
    newTab.document.close();
});

// 整理按钮功能 - 流式输出精简内容
const workspaceBtn = document.getElementById('workspace-btn');
let isStreamingContent = false;
let originalContent = ''; // 存储原始内容
let controller = null; // AbortController 用于取消流式请求
let editDetectionTimeout = null; // 用于检测用户编辑的超时
let buttonState = 'ORGANIZE'; // 按钮状态: ORGANIZE, STOP, REVERT

// 当用户开始编辑文本时，重置按钮状态
textarea.addEventListener('input', function() {
    // 如果按钮状态是回退，则重置为整理
    if (buttonState === 'REVERT') {
        buttonState = 'ORGANIZE';
        workspaceBtn.textContent = '整理';
    }
    
    // 重置其他编辑相关逻辑...
    // 原有的输入事件处理逻辑保持不变...
});

// 整理按钮的点击事件处理
workspaceBtn.addEventListener('click', async function() {
    // 根据按钮当前状态执行不同操作
    switch (buttonState) {
        case 'ORGANIZE': // 整理功能
            await organizeContent();
            break;
        case 'STOP': // 停止功能
            stopOrganizing();
            break;
        case 'REVERT': // 回退功能
            revertContent();
            break;
    }
});

// 整理内容的功能
async function organizeContent() {
    const content = textarea.value.trim();
    if (!content) {
        alert('请先在输入框中输入一些内容');
        return;
    }
    
    // 获取API设置
    const savedSettings = localStorage.getItem('APISettings');
    if (!savedSettings) {
        alert('请先在设置中配置API信息');
        return;
    }
    
    const settings = JSON.parse(savedSettings);
    const endpoint = settings.apiEndpoint;
    const apiKey = settings.apiKey;
    const model = settings.model;
    
    if (!endpoint || !apiKey || !model) {
        alert('API设置不完整，请检查设置');
        return;
    }
    
    try {
        // 保存原始内容用于可能的回退
        originalContent = textarea.value;
        
        // 设置处理状态
        isStreamingContent = true;
        buttonState = 'STOP';
        workspaceBtn.textContent = '停止';
        
        // 准备开始流式输出
        textarea.value = "正在整理内容...\n";
        
        // 创建 AbortController 用于可能的取消
        controller = new AbortController();
        const signal = controller.signal;
        
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
            localStorage.setItem('workspaceContent', resultText);
            
            // 整理完成后，设置按钮为回退状态
            buttonState = 'REVERT';
            workspaceBtn.textContent = '回退';
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('整理过程被用户中断');
                // 用户中断，设置按钮为回退状态
                buttonState = 'REVERT';
                workspaceBtn.textContent = '回退';
            } else {
                throw error; // 重新抛出其他错误
            }
        }
        
    } catch (error) {
        console.error('整理内容时出错:', error);
        if (error.name !== 'AbortError') { // 只有在非用户中断的错误情况下显示错误信息
            textarea.value = `整理内容时出错: ${error.message || '未知错误'}\n\n原始内容:\n${originalContent}`;
            // 出错时，设置按钮为回退状态
            buttonState = 'REVERT';
            workspaceBtn.textContent = '回退';
        }
    } finally {
        // 清理状态
        isStreamingContent = false;
        controller = null;
    }
}

// 停止整理过程
function stopOrganizing() {
    if (controller) {
        controller.abort(); // 取消正在进行的请求
    }
    // 停止后更新按钮状态 - 在abort处理程序中会更新为回退状态
}

// 回退到原始内容
function revertContent() {
    textarea.value = originalContent;
    localStorage.setItem('workspaceContent', originalContent); // 更新保存的内容
    
    // 重置为整理按钮
    buttonState = 'ORGANIZE';
    workspaceBtn.textContent = '整理';
}

// 右键菜单功能
const contextMenu = document.getElementById('contextMenu');
let activeTextarea = null;
let cursorPosition = 0; // 记录光标位置

// 为textarea添加右键菜单事件
function addContextMenuListeners(textareaElement) {
    // 右键点击显示菜单
    textareaElement.addEventListener('contextmenu', function(event) {
        event.preventDefault(); // 阻止默认右键菜单
        activeTextarea = textareaElement; // 记录当前活动的文本框
        
        // 检查是否有选中的文本
        const selectedText = textareaElement.value.substring(
            textareaElement.selectionStart, 
            textareaElement.selectionEnd
        );
        
        // 记录光标位置
        cursorPosition = textareaElement.selectionStart;
        // 如果没有选中，则光标设为文本末尾
        if (cursorPosition === undefined || cursorPosition === null) {
            cursorPosition = textareaElement.value.length;
        }
        
        // 获取点击位置相对于视口的坐标
        const x = event.clientX;
        const y = event.clientY;
        
        // 显示菜单并定位
        showContextMenu(x, y, selectedText);
    });
}

// 显示右键菜单
function showContextMenu(x, y, selectedText) {
    // 设置菜单位置
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    
    // 显示菜单
    contextMenu.style.display = 'block';
    
    // 防止菜单超出视口
    const menuRect = contextMenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 如果菜单底部超出视口，向上移动
    if (menuRect.bottom > viewportHeight) {
        contextMenu.style.top = `${y - menuRect.height}px`;
    }
    
    // 如果菜单右侧超出视口，向左移动
    if (menuRect.right > viewportWidth) {
        contextMenu.style.left = `${x - menuRect.width}px`;
    }
    
    // 如果有选中文本，在输入框中添加提示
    const input = document.getElementById('contextMenuInput');
    if (selectedText && selectedText.trim().length > 0) {
        input.placeholder = `针对选中的文本回答...`;
    } else {
        input.placeholder = `在这里输入...`;
    }
    
    // 自动聚焦到输入框
    setTimeout(() => {
        input.focus();
    }, 10);
}

// 隐藏右键菜单并清空内容
function hideContextMenu() {
    contextMenu.style.display = 'none';
    document.getElementById('contextMenuInput').value = '';
}

// 点击页面其他地方时隐藏菜单
document.addEventListener('click', function() {
    hideContextMenu();
});

// 按Esc键时隐藏菜单
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && contextMenu.style.display === 'block' && !isIMEComposing) {
        hideContextMenu();
    }
});

// 添加输入法组合状态跟踪
let isIMEComposing = false;

// 为右键菜单中的输入框添加输入法组合事件监听
const contextMenuInput = document.getElementById('contextMenuInput');
contextMenuInput.addEventListener('compositionstart', function() {
    isIMEComposing = true;
    console.log('IME composition started');
});

contextMenuInput.addEventListener('compositionend', function() {
    isIMEComposing = false;
    console.log('IME composition ended');
    // 在组合输入结束后也调整输入框大小
    adjustInputSize();
});

// 添加输入内容变化时自动调整输入框大小的功能
contextMenuInput.addEventListener('input', function() {
    adjustInputSize();
});

// 调整输入框大小以适应内容
function adjustInputSize() {
    // 设置最小宽度
    const minWidth = 150;
    // 计算内容宽度 (每个字符约 7px，但中文字符更宽)
    const contentLength = contextMenuInput.value.length;
    // 中文和英文混合情况下的估计宽度
    const estimatedWidth = Math.max(minWidth, contentLength * 12);
    
    // 限制最大宽度，避免输入框过宽
    const maxWidth = Math.min(window.innerWidth * 0.8, 500); 
    const newWidth = Math.min(estimatedWidth, maxWidth);
    
    // 应用计算后的宽度
    contextMenuInput.style.width = newWidth + 'px';
    
    // 更新菜单容器宽度，比输入框稍宽以便有内边距
    const menuContent = document.querySelector('.menu-content');
    if (menuContent) {
        menuContent.style.width = (newWidth + 20) + 'px';
    }
    
    // 调整菜单位置，避免超出视口边界
    adjustMenuPosition();
}

// 调整菜单位置以避免超出视口
function adjustMenuPosition() {
    const menu = document.getElementById('contextMenu');
    if (menu.style.display !== 'block') return;
    
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // 如果菜单右侧超出视口，向左移动
    if (rect.right > viewportWidth) {
        const overflowX = rect.right - viewportWidth;
        menu.style.left = (parseInt(menu.style.left) - overflowX - 10) + 'px';
    }
}

// 为右键菜单中的输入框添加回车键事件
contextMenuInput.addEventListener('keydown', async function(event) {
    // 只有当不在输入法组合状态时才处理回车键事件
    if (event.key === 'Enter' && !isIMEComposing) {
        const inputText = this.value.trim();
        // 保存当前活动的文本区域引用，因为hideContextMenu会清空这些状态
        const currentTextarea = activeTextarea;
        const referenceText = currentTextarea ? currentTextarea.value : '';
        
        // 立即隐藏菜单并清空内容
        hideContextMenu();
        
        // 如果有有效输入和文本区域，在后台生成AI回答
        if (inputText && currentTextarea) {
            // 生成AI回答
            await generateContextMenuResponse(inputText, referenceText);
        }
    }
});

// 根据右键菜单输入框内容生成AI回答
async function generateContextMenuResponse(inputText, referenceText) {
    if (!inputText || !referenceText) return;
    
    // 检查是否有选中的文本
    const selectedText = activeTextarea.value.substring(
        activeTextarea.selectionStart, 
        activeTextarea.selectionEnd
    ).trim();
    
    // 决定使用哪段文本作为输入 - 如果有选中文本则优先使用
    let textForAI = referenceText;
    let contextPrompt = "";
    
    if (selectedText.length > 0) {
        textForAI = selectedText;
        contextPrompt = "用户选择了以下文本进行提问：\n\n" + selectedText + "\n\n";
    }
    
    // 获取API设置
    const savedSettings = localStorage.getItem('APISettings');
    if (!savedSettings) {
        console.log('未找到API设置，无法获取AI回答');
        return;
    }
    
    const settings = JSON.parse(savedSettings);
    const endpoint = settings.apiEndpoint;
    const apiKey = settings.apiKey;
    const model = settings.model;
    
    if (!endpoint || !apiKey || !model) {
        console.log('API设置不完整，无法获取AI回答');
        return;
    }
    
    // 左右文本框使用不同的插入逻辑
    if (activeTextarea === textarea) {
        // 左侧文本框 - 始终在末尾添加内容
        activeTextarea.focus();
        
        // 将光标移至文本末尾
        const endPosition = activeTextarea.value.length;
        activeTextarea.setSelectionRange(endPosition, endPosition);
        
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
            activeTextarea.focus();
            activeTextarea.setSelectionRange(placeholderStart, placeholderEnd);
            document.execCommand('insertText', false, aiResponse);
            
            // 设置光标位置在回答之后
            const newCursorPosition = placeholderStart + aiResponse.length;
            activeTextarea.setSelectionRange(newCursorPosition, newCursorPosition);
            
            // 自动保存内容
            localStorage.setItem('workspaceContent', textarea.value);
            
        } catch (error) {
            console.error('获取AI回答时出错:', error);
            activeTextarea.focus();
            activeTextarea.setSelectionRange(placeholderStart, placeholderEnd);
            document.execCommand('insertText', false, "无法获取AI回答: " + error.message + "\n-------------");
        }
    } else {
        // 右侧文本框 - 在光标位置插入内容
        activeTextarea.focus();
        activeTextarea.setSelectionRange(cursorPosition, cursorPosition);
        
        // 使用execCommand插入提示文字
        const promptText = "\n\n--- AI回答(问题: " + inputText + ") ---\n";
        document.execCommand('insertText', false, promptText);
        
        // 为占位符记录新的插入点
        const placeholderPosition = cursorPosition + promptText.length;
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
            activeTextarea.focus();
            activeTextarea.setSelectionRange(placeholderStart, placeholderEnd);
            document.execCommand('insertText', false, aiResponse);
            
            // 设置光标位置在回答之后
            const newCursorPosition = placeholderStart + aiResponse.length;
            activeTextarea.setSelectionRange(newCursorPosition, newCursorPosition);
            
            // 自动保存内容
            localStorage.setItem('displayspaceContent', displayspace.value);
            
        } catch (error) {
            console.error('获取AI回答时出错:', error);
            activeTextarea.focus();
            activeTextarea.setSelectionRange(placeholderStart, placeholderEnd);
            document.execCommand('insertText', false, "无法获取AI回答: " + error.message + "\n-------------");
        }
    }
}

// 页面加载时加载设置和内容
document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    loadWorkspaceContent();
    loadDisplayspaceContent();
    
    // 为两个文本输入框添加右键菜单
    addContextMenuListeners(document.getElementById('workspace'));
    addContextMenuListeners(document.getElementById('displayspace'));
});
