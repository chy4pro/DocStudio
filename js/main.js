// Main entry point for the DocStudio application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize application
    console.log('DocStudio initialized with new module system');

    // Initialize services
    // 初始化模式管理器
    if (window.ModeManager) {
        ModeManager.init();
        console.log('ModeManager initialized');
        
        // 订阅模式管理器事件
        EventSystem.subscribe('modeManager:initialized', () => {
            console.log('ModeManager ready');
        });
        
        EventSystem.subscribe('mode:changed', (data) => {
            console.log('Mode changed to:', data.mode);
        });
    } else {
        console.log('ModeManager not loaded, running in legacy mode');
    }
    
    if (window.EventSystem) {
        console.log('Event system ready');
    } else {
        console.error('Event system not loaded');
        return;
    }

    if (window.Settings) {
        Settings.init();
        console.log('Settings service initialized');

        // Subscribe to settings events
        EventSystem.subscribe('settings:initialized', () => {
            console.log('Settings service ready');
        });

        EventSystem.subscribe('settings:updated', (settings) => {
            console.log('Settings updated:', settings);
        });
    } else {
        console.error('Settings service not loaded');
    }

    if (window.RightClickMenu) {
        RightClickMenu.init();
        console.log('RightClickMenu service initialized');
        
        // 订阅右键菜单事件
        EventSystem.subscribe('rightClickMenu:responseGenerated', (data) => {
            console.log('AI回答已生成:', data);
        });
        
        EventSystem.subscribe('rightClickMenu:displayspaceUpdated', (data) => {
            // 如果有预览区域，并且自动渲染开启，则更新预览
            const displayspace = document.getElementById('displayspace');
            const markdownPreview = document.getElementById('markdown-preview');
            const displayspaceToggle = document.getElementById('displayspace-toggle');
            
            if (displayspace && markdownPreview && displayspaceToggle && displayspaceToggle.checked) {
                // 在外部脚本中调用updateMarkdownPreview函数，或触发事件让script.js处理
                if (typeof updateMarkdownPreview === 'function') {
                    updateMarkdownPreview(data.content);
                }
            }
        });
    } else {
        console.error('RightClickMenu service not loaded');
    }
    
    // 初始化Draft组件
    if (window.Draft) {
        Draft.init();
        console.log('Draft component initialized from main');
        
        // 订阅Draft组件的事件
        if (window.EventSystem) {
            // 监听Draft内容更新
            EventSystem.subscribe('draft:content-updated', (data) => {
                console.log('Draft content updated:', data);
            });
            
            // 监听Draft整理功能
            EventSystem.subscribe('draft:organize-started', (data) => {
                console.log('Draft organize started');
            });
            
            EventSystem.subscribe('draft:organize-completed', (data) => {
                console.log('Draft organize completed');
            });
            
            // 监听AI建议功能
            EventSystem.subscribe('draft:ai-suggestion-completed', (data) => {
                console.log('AI suggestion added:', data.suggestion.substring(0, 50) + '...');
            });
            
            // 系统级事件通知
            EventSystem.subscribe('draft:initialized', (data) => {
                console.log('Draft component ready');
            });
        }
    } else {
        console.error('Draft component not loaded');
    }
    
    // 初始化Preview组件
    if (window.Preview) {
        Preview.init();
        console.log('Preview component initialized from main');
        
        // 订阅Preview组件的事件
        if (window.EventSystem) {
            // 监听Preview内容更新
            EventSystem.subscribe('preview:content-updated', (data) => {
                console.log('Preview content updated');
            });
            
            // 监听渲染模式变更
            EventSystem.subscribe('preview:render-mode-changed', (data) => {
                console.log('Preview render mode changed:', data.enabled ? 'enabled' : 'disabled');
            });
            
            // 监听渲染请求
            EventSystem.subscribe('preview:render-requested', (data) => {
                console.log('HTML render requested');
                // Publish组件会自动处理此事件
            });
            
            // 监听Markdown渲染
            EventSystem.subscribe('preview:markdown-rendered', (data) => {
                console.log('Markdown content rendered');
            });
            
            // 系统级事件通知
            EventSystem.subscribe('preview:initialized', (data) => {
                console.log('Preview component ready');
            });
        }
    } else {
        console.error('Preview component not loaded');
    }
    
    // 初始化Publish组件
    if (window.Publish) {
        Publish.init();
        console.log('Publish component initialized from main');
        
        // 订阅Publish组件的事件
        if (window.EventSystem) {
            // 监听HTML渲染状态
            EventSystem.subscribe('publish:render-started', (data) => {
                console.log('HTML render started');
            });
            
            EventSystem.subscribe('publish:render-completed', (data) => {
                console.log('HTML render completed');
            });
            
            EventSystem.subscribe('publish:render-error', (data) => {
                console.error('HTML render error:', data.error);
            });
            
            // 监听iframe状态
            EventSystem.subscribe('publish:iframe-opened', () => {
                console.log('Publish iframe opened');
            });
            
            EventSystem.subscribe('publish:iframe-closed', () => {
                console.log('Publish iframe closed');
            });
            
            // 系统级事件通知
            EventSystem.subscribe('publish:initialized', (data) => {
                console.log('Publish component ready');
                // 发布整体应用准备就绪事件
                EventSystem.publish('application:ready', {
                    timestamp: new Date().toISOString()
                });
            });
        }
    } else {
        console.error('Publish component not loaded');
    }
});
