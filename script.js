/**
 * DocStudio应用 - 协调脚本
 * 
 * 应用架构说明:
 * - 组件系统: 所有主要功能已被封装为独立组件，保持单一职责原则
 *   - Draft组件: 负责左侧工作区功能(文本编辑、AI建议、内容整理)
 *   - Preview组件: 负责右侧编辑和预览功能(Markdown编辑和实时HTML预览)
 *   - Publish组件: 负责HTML渲染和展示功能(HTML生成和iframe管理)
 * 
 * - 服务系统: 提供全局功能支持
 *   - Settings服务: 管理全局API设置
 *   - RightClickMenu服务: 处理右键菜单和上下文操作
 *   - EventSystem: 提供事件发布/订阅机制，实现组件间松耦合通信
 * 
 * - 本脚本职责:
 *   - 作为组件间的协调层，处理跨组件事务
 *   - 管理Generate按钮功能(从Draft到Preview的内容转换)
 *   - 管理Render按钮功能(从Preview到Publish的内容渲染)
 */

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

document.addEventListener('DOMContentLoaded', function() {
    // 组件会在main.js中自动初始化，这里只需要处理组件间的协作关系
    
    // 订阅应用就绪事件
    if (window.EventSystem) {
        EventSystem.subscribe('application:ready', (data) => {
            console.log('DocStudio 组件化应用初始化完成', data.timestamp);
        });
    }
});
