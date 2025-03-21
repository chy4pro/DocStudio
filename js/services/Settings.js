// Settings service - 管理应用设置
const Settings = {
    // 存储设置相关DOM元素引用
    elements: {},
    
    // 初始化设置服务
    init: function() {
        // 获取并存储DOM元素引用
        this.elements = {
            settingsBtn: document.querySelector('.settings-btn'),
            modal: document.getElementById('settingsModal'),
            closeBtn: document.getElementById('closeModal'),
            apiEndpointInput: document.getElementById('apiEndpoint'),
            apiKeyInput: document.getElementById('apiKey'),
            modelInput: document.getElementById('model'),
            temperatureInput: document.getElementById('temperature'),
            tempValueSpan: document.getElementById('tempValue'),
            maxTokensInput: document.getElementById('maxTokens'),
            testAPIBtn: document.getElementById('testAPI'),
            saveSettingsBtn: document.getElementById('saveSettings'),
            testResultDiv: document.getElementById('testResult')
        };
        
        // 绑定事件处理程序
        this.bindEvents();
        
        // 加载保存的设置
        this.loadSettings();
        
        // 发布初始化完成事件
        EventSystem.publish('settings:initialized', {});
    },
    
    // 绑定事件处理程序
    bindEvents: function() {
        // 打开设置弹窗
        this.elements.settingsBtn.addEventListener('click', () => {
            this.showModal();
        });
        
        // 关闭设置弹窗
        this.elements.closeBtn.addEventListener('click', () => {
            this.hideModal();
        });
        
        // 点击弹窗外部关闭弹窗
        window.addEventListener('click', (event) => {
            if (event.target === this.elements.modal) {
                this.hideModal();
            }
        });
        
        // 显示温度值
        this.elements.temperatureInput.addEventListener('input', () => {
            this.elements.tempValueSpan.textContent = this.elements.temperatureInput.value;
        });
        
        // 保存设置
        this.elements.saveSettingsBtn.addEventListener('click', () => {
            this.saveSettings();
        });
        
        // 测试API连接
        this.elements.testAPIBtn.addEventListener('click', () => {
            this.testAPI();
        });
    },
    
    // 显示设置弹窗
    showModal: function() {
        this.elements.modal.style.display = 'flex';
        EventSystem.publish('settings:modalOpened', {});
    },
    
    // 隐藏设置弹窗
    hideModal: function() {
        this.elements.modal.style.display = 'none';
        EventSystem.publish('settings:modalClosed', {});
    },
    
    // 保存设置到localStorage
    saveSettings: function() {
        const settings = {
            apiEndpoint: this.elements.apiEndpointInput.value,
            apiKey: this.elements.apiKeyInput.value,
            model: this.elements.modelInput.value,
            temperature: this.elements.temperatureInput.value,
            maxTokens: this.elements.maxTokensInput.value
        };
        localStorage.setItem('APISettings', JSON.stringify(settings));
        alert('设置已保存');
        this.hideModal();
        
        // 发布设置已更新事件
        EventSystem.publish('settings:updated', settings);
    },
    
    // 从localStorage加载设置
    loadSettings: function() {
        const savedSettings = localStorage.getItem('APISettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            this.elements.apiEndpointInput.value = settings.apiEndpoint || '';
            this.elements.apiKeyInput.value = settings.apiKey || '';
            this.elements.modelInput.value = settings.model || '';
            this.elements.temperatureInput.value = settings.temperature || 0.7;
            this.elements.tempValueSpan.textContent = settings.temperature || 0.7;
            this.elements.maxTokensInput.value = settings.maxTokens || 2048;
        }
    },
    
    // 获取当前设置
    getSettings: function() {
        const savedSettings = localStorage.getItem('APISettings');
        if (savedSettings) {
            return JSON.parse(savedSettings);
        }
        return {
            apiEndpoint: '',
            apiKey: '',
            model: '',
            temperature: 0.7,
            maxTokens: 2048
        };
    },
    
    // 测试API连接
    testAPI: async function() {
        this.elements.testResultDiv.style.display = 'block';
        this.elements.testResultDiv.textContent = '测试中...';
        this.elements.testResultDiv.style.backgroundColor = '#f0f0f0';
        
        const endpoint = this.elements.apiEndpointInput.value.trim();
        const apiKey = this.elements.apiKeyInput.value.trim();
        const model = this.elements.modelInput.value.trim();
        
        if (!endpoint || !apiKey || !model) {
            this.elements.testResultDiv.textContent = '错误: 请填写所有必要的字段';
            this.elements.testResultDiv.style.backgroundColor = '#ffebee';
            return;
        }
        
        try {
            // 构建API请求 - 使用简单的模型预检请求
            const response = await fetch(`${endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: 'Hello' }],
                    max_tokens: 1
                })
            });
            
            if (response.ok) {
                this.elements.testResultDiv.textContent = '连接成功！API 设置有效。';
                this.elements.testResultDiv.style.backgroundColor = '#e8f5e9';
            } else {
                const errorData = await response.json();
                this.elements.testResultDiv.textContent = `错误: ${errorData.error?.message || response.statusText}`;
                this.elements.testResultDiv.style.backgroundColor = '#ffebee';
            }
        } catch (error) {
            this.elements.testResultDiv.textContent = `错误: ${error.message || '连接失败'}`;
            this.elements.testResultDiv.style.backgroundColor = '#ffebee';
        }
    }
};

// 导出Settings服务
window.Settings = Settings;
