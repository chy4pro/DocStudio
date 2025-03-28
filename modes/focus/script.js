/**
 * DocStudio - 专注模式脚本
 * 
 * 专注模式的特定功能和初始化逻辑
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('专注模式初始化中...');
    
    // 确保ModeManager已初始化并注册模式
    if (window.ModeManager) {
        ModeManager.registerMode('focus');
    }
    
    // 初始化处理，只有在EventSystem可用时进行
    if (window.EventSystem) {
        // 当应用程序准备就绪时
        EventSystem.subscribe('application:ready', function(data) {
            console.log('专注模式应用程序准备就绪');
        });
        
        // 当Draft组件初始化完成时
        EventSystem.subscribe('draft:initialized', function(data) {
            console.log('Draft组件已初始化，专注模式准备就绪');
        });
    }
    
    // 当窗口调整大小时更新编辑区域高度
    window.addEventListener('resize', adjustEditorHeight);
    
    // 初始调整编辑区域高度
    setTimeout(adjustEditorHeight, 100);
});

/**
 * 调整编辑区域高度以适应窗口
 */
function adjustEditorHeight() {
    const editor = document.querySelector('.editor-container');
    if (editor) {
        // 确保编辑区填满可用空间
        const headerHeight = document.querySelector('.header').offsetHeight;
        const availableHeight = window.innerHeight - headerHeight - 30; // 30px为上下padding
        editor.style.height = availableHeight + 'px';
    }
}
