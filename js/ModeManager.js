/**
 * DocStudio 模式管理器
 * 
 * 管理不同的界面模式（标准模式、专注模式、移动模式等）
 * 处理模式间的切换、初始化、状态保存和恢复
 */

const ModeManager = {
    currentMode: null,
    availableModes: ['standard'], // 先只支持标准模式，后续添加更多
    
    /**
     * 初始化模式管理器
     */
    init: function() {
        console.log('ModeManager 初始化');
        
        // 注册事件
        if (window.EventSystem) {
            EventSystem.subscribe('mode:change-requested', (data) => {
                this.switchToMode(data.mode);
            });
        } else {
            console.error('事件系统未加载，模式管理器无法正常工作');
        }
        
        // 发布初始化完成事件
        if (window.EventSystem) {
            EventSystem.publish('modeManager:initialized', {
                timestamp: new Date().toISOString()
            });
        }
        
        return this;
    },
    
    /**
     * 获取当前模式
     * @returns {string} 当前模式名称
     */
    getCurrentMode: function() {
        if (!this.currentMode) {
            // 如果尚未设置模式，则从localStorage获取，如果没有则使用默认值
            this.currentMode = localStorage.getItem('preferredMode') || 'standard';
        }
        return this.currentMode;
    },
    
    /**
     * 切换到指定模式
     * @param {string} modeName 模式名称
     */
    switchToMode: function(modeName) {
        console.log(`请求切换到模式: ${modeName}`);
        
        // 检查模式是否有效
        if (!this.availableModes.includes(modeName)) {
            console.error(`模式 "${modeName}" 不存在或尚未实现`);
            return false;
        }
        
        // 保存当前内容状态
        this.saveCurrentState();
        
        // 保存用户偏好
        localStorage.setItem('preferredMode', modeName);
        
        // 更新当前模式
        this.currentMode = modeName;
        
        // 重定向到新模式页面
        window.location.href = `./modes/${modeName}/index.html`;
        
        return true;
    },
    
    /**
     * 保存当前工作状态
     * 在模式切换前调用，确保用户不会丢失工作内容
     */
    saveCurrentState: function() {
        // 保存Draft组件内容（如果可用）
        if (window.Draft && typeof Draft.getContent === 'function') {
            localStorage.setItem('workspaceContent', Draft.getContent());
            console.log('已保存Draft内容');
        }
        
        // 保存Preview组件内容（如果可用）
        if (window.Preview && typeof Preview.getContent === 'function') {
            localStorage.setItem('displayspaceContent', Preview.getContent());
            console.log('已保存Preview内容');
        }
        
        // 保存其他重要状态...
    },
    
    /**
     * 添加新模式到可用模式列表
     * @param {string} modeName 模式名称
     */
    registerMode: function(modeName) {
        if (!this.availableModes.includes(modeName)) {
            this.availableModes.push(modeName);
            console.log(`已注册新模式: ${modeName}`);
            return true;
        }
        return false;
    }
};

// 导出模式管理器
window.ModeManager = ModeManager;
