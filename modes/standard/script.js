/**
 * DocStudio - 标准模式脚本
 * 
 * 处理标准模式的特定功能和组件协调
 * 基于原有的script.js改造，适配多模式框架
 */

// =============================================================================
// 标准模式初始化
// =============================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DocStudio 标准模式初始化');
    
    // 注册当前模式
    if (window.ModeManager) {
        // 确保模式管理器知道当前模式
        ModeManager.currentMode = 'standard';
    } else {
        console.error('模式管理器未加载，标准模式可能无法正常工作');
    }
    
    // 订阅应用就绪事件
    if (window.EventSystem) {
        EventSystem.subscribe('application:ready', (data) => {
            console.log('DocStudio 标准模式就绪', data.timestamp);
        });
    }
});

// =============================================================================
// Generate功能 - 将Draft内容转换为Markdown文档
// =============================================================================
const generateBtn = document.getElementById('markdown-button');
let isGenerating = false;

// Generate按钮点击事件处理
generateBtn.addEventListener('click', async function() {
    // 防止重复点击
    if (isGenerating) return;
    
    // 使用Draft组件获取内容
    const workspaceContent = Draft.getContent().trim();
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
        Preview.setContent("正在生成文档，请稍候...");
        
        // 发布生成开始事件
        if (window.EventSystem) {
            EventSystem.publish('generate:started', {
                sourceContent: workspaceContent
            });
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
        const generatedContent = data.choices[0].message.content;
        
        // 使用Preview组件显示生成的Markdown文档
        Preview.setContent(generatedContent);
        
        // 发布生成完成事件
        if (window.EventSystem) {
            EventSystem.publish('generate:completed', {
                sourceContent: workspaceContent,
                generatedContent: generatedContent
            });
        }
        
    } catch (error) {
        console.error('生成文档时出错:', error);
        Preview.setContent(`生成文档时出错: ${error.message || '未知错误'}`);
        
        // 发布错误事件
        if (window.EventSystem) {
            EventSystem.publish('generate:error', {
                error: error.message || '未知错误'
            });
        }
    } finally {
        // 恢复按钮状态
        isGenerating = false;
        generateBtn.disabled = false;
        generateBtn.textContent = 'generate';
    }
});

// =============================================================================
// Render功能 - 将Preview内容渲染为HTML
// =============================================================================
const renderBtn = document.getElementById('displayspace-btn');
let isRendering = false;

// Render按钮点击事件处理
renderBtn.addEventListener('click', async function() {
    // 防止重复点击
    if (isRendering) return;
    
    // 使用Preview组件获取内容
    const displayspaceContent = Preview.getContent().trim();
    if (!displayspaceContent) {
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
    if (!settings.apiEndpoint || !settings.apiKey || !settings.model) {
        alert('API设置不完整，请检查设置');
        return;
    }
    
    try {
        // 设置渲染状态
        isRendering = true;
        renderBtn.disabled = true;
        renderBtn.textContent = 'Rendering...';
        
        // 直接调用Publish组件的render方法
        if (window.Publish) {
            await Publish.render(displayspaceContent);
        } else {
            throw new Error('Publish组件未初始化');
        }
        
    } catch (error) {
        console.error('HTML渲染出错:', error);
        alert('HTML渲染出错: ' + (error.message || '未知错误'));
        
    } finally {
        // 恢复按钮状态
        isRendering = false;
        renderBtn.disabled = false;
        renderBtn.textContent = 'render';
    }
});
