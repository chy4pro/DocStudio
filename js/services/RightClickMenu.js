// RightClickMenu service - 右键菜单服务
const RightClickMenu = {
    // 存储右键菜单相关DOM元素引用
    elements: {},

    //光标位置和选中内容
    activeTextarea: null,
    cursorPosition: 0, // 记录光标位置
    isIMEComposing: false, // 添加输入法组合状态跟踪
    
    // 初始化右键菜单服务
    init: function() {
        // 获取并存储DOM元素引用
        this.elements = {
            menu: document.getElementById('rightClickMenu'),
            input: document.getElementById('rightClickInput'),
        };

        // 绑定两个文本框的右键菜单
        this.bindRightClickMenu(document.getElementById('workspace'));
        this.bindRightClickMenu(document.getElementById('displayspace'));
        this.bindEvents();
    },

    bindEvents: function () {
        this.elements.input.addEventListener('compositionstart', function () {
            isIMEComposing = true;
            console.log('IME composition started');
        });

        this.elements.input.addEventListener('compositionend', function () {
            isIMEComposing = false;
            console.log('IME composition ended');
        });
        // 点击页面其他地方时隐藏菜单
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
        // 按Esc键时隐藏菜单
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.elements.menu.style.display === 'block' && !this.isIMEComposing) {
                this.hideContextMenu();
            }
        });
    },

    // 绑定右键菜单
    bindRightClickMenu: function(element) {
        element.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            activeTextarea = element; // 记录当前活动的文本框
        
            // 检查是否有选中的文本
            const selectedText = element.value.substring(
                element.selectionStart, 
                element.selectionEnd
            );
            
            // 记录光标位置
            cursorPosition = element.selectionStart;
            // 如果没有选中，则光标设为文本末尾
            if (cursorPosition === undefined || cursorPosition === null) {
                cursorPosition = element.value.length;
            }
            
            // 获取点击位置相对于视口的坐标
            const x = event.clientX;
            const y = event.clientY;
            this.showMenu(x, y, selectedText);
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
    hideContextMenu: function () {
        this.elements.menu.style.display = 'none';
        this.elements.input.value = '';
        console.log('Context menu hidden');
    },

};

// 导出RightClickMenu服务
window.RightClickMenu = RightClickMenu;