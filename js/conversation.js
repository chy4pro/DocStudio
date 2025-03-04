// Conversation management
const ConversationManager = {
    chatPosition: 'hidden', // 'hidden', 'left', 'right'
    
    init() {
        console.log("ConversationManager init() called");
        
        try {
            // Initialize conversation UI elements
            this.aiChatBtn = document.getElementById('aiChatBtn');
            console.log("aiChatBtn found:", this.aiChatBtn);
            
            // 左侧聊天面板
            this.leftAIChat = document.getElementById('leftAIChat');
            this.leftAIChatContent = document.getElementById('leftAIChatContent');
            this.closeLeftChatBtn = document.getElementById('closeLeftChatBtn');
            this.switchChatToRightBtn = document.getElementById('switchChatToRightBtn');
            
            // 右侧聊天面板
            this.rightAIChat = document.getElementById('rightAIChat');
            this.rightAIChatContent = document.getElementById('rightAIChatContent');
            this.closeRightChatBtn = document.getElementById('closeRightChatBtn');
            this.switchChatToLeftBtn = document.getElementById('switchChatToLeftBtn');
            
            // 左右侧边栏区域
            this.leftSidebarArea = document.getElementById('leftSidebarArea');
            this.rightSidebarArea = document.getElementById('rightSidebarArea');
            
            // Load previous conversation from storage
            this.loadConversation();
            
            // Set up event listeners for chat visibility and positioning
            if (this.aiChatBtn) {
                console.log("Adding click event listener to aiChatBtn");
                this.aiChatBtn.addEventListener('click', () => {
                    console.log("AI Chat Button clicked");
                    this.toggleChatSidebar();
                });
            } else {
                console.error("aiChatBtn element not found");
            }
            
            // 设置关闭按钮
            this.closeLeftChatBtn?.addEventListener('click', () => this.closeChat('left'));
            this.closeRightChatBtn?.addEventListener('click', () => this.closeChat('right'));
            
            // 设置切换位置按钮
            this.switchChatToRightBtn?.addEventListener('click', () => this.setChatPosition('right'));
            this.switchChatToLeftBtn?.addEventListener('click', () => this.setChatPosition('left'));
            
            // Create the chat UI in sidebar containers
            this.renderChatUI();
            
            console.log("ConversationManager initialization completed");
        } catch (error) {
            console.error("Error in ConversationManager.init():", error);
        }
    },
    
    renderChatUI() {
        // Create chat UI in sidebar containers
        this.createChatUIInContainer(this.leftAIChatContent);
        this.createChatUIInContainer(this.rightAIChatContent);
        
        // Set up event listeners for the message form in all locations
        document.querySelectorAll('#chatInputForm').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const inputField = form.querySelector('#chatInput');
                const message = inputField.value.trim();
                if (message) {
                    this.sendMessage(message);
                    inputField.value = '';
                }
            });
        });
        
        // Set up enter key handling
        document.querySelectorAll('#chatInput').forEach(input => {
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const form = input.closest('form');
                    if (form) {
                        const event = new Event('submit', { cancelable: true });
                        form.dispatchEvent(event);
                    }
                }
            });
        });
        
        // Load conversation history if available
        const savedMessages = StorageManager.getConversation();
        if (savedMessages && savedMessages.length > 0) {
            this.renderMessages(savedMessages);
        }
    },
    
    createChatUIInContainer(container) {
        if (container) {
            container.innerHTML = `
                <div class="ai-chat">
                    <div class="chat-messages" id="chatMessages">
                        <!-- Messages will be inserted here -->
                    </div>
                    <form class="chat-input-form" id="chatInputForm">
                        <textarea class="chat-input" id="chatInput" placeholder="输入您的消息..." rows="2"></textarea>
                        <button type="submit" class="button-primary" id="chatSendBtn">
                            <svg class="icon" viewBox="0 0 24 24" width="18" height="18">
                                <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" stroke="currentColor" stroke-width="0.5"></path>
                            </svg>
                        </button>
                    </form>
                </div>
            `;
        }
    },
    
    loadConversation() {
        const savedMessages = StorageManager.getConversation();
        if (savedMessages && savedMessages.length > 0) {
            this.renderMessages(savedMessages);
        }
    },
    
    async sendMessage(message) {
        if (!message) return;
        
        // Add user message to chat
        this.addMessage('user', message);
        
        // Show typing indicator
        const typingIndicatorId = this.addTypingIndicator();
        
        try {
            // Call the LLM API and process response
            const response = await LLMApi.sendMessage(message);
            this.removeTypingIndicator(typingIndicatorId);
            this.addMessage('assistant', response);
        } catch (error) {
            this.removeTypingIndicator(typingIndicatorId);
            this.addMessage('assistant', `错误: ${error.message}。请检查您的API设置。`);
        }
    },
    
    addMessage(role, content) {
        // Create message object
        const messageObj = {
            id: Date.now().toString(),
            role,
            content,
            timestamp: new Date().toISOString()
        };
        
        // Get existing messages
        const messages = StorageManager.getConversation() || [];
        messages.push(messageObj);
        
        // Save to storage
        StorageManager.saveConversation(messages);
        
        // Render in all chat UIs - 显示所有消息
        this.renderMessages(messages);
        
        // Add save button for AI messages if they're not already shown
        if (role === 'assistant') {
            this.addSaveButtonToMessages();
        }
    },
    
    renderMessages(messages) {
        // 确保我们有消息要显示
        if (!messages || messages.length === 0) {
            return;
        }
        
        // 生成HTML - 显示所有消息
        const messagesHTML = messages.map(msg => {
            const isUser = msg.role === 'user';
            return `
                <div class="chat-message ${msg.role}" data-id="${msg.id}">
                    <p>${msg.content}</p>
                    ${!isUser ? 
                      `<div class="message-actions">
                          <button class="save-message" title="保存为笔记">
                              <svg class="icon" viewBox="0 0 24 24" width="12" height="12">
                                  <path fill="currentColor" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" stroke="currentColor" stroke-width="0.5"></path>
                              </svg>
                          </button>
                       </div>` 
                    : ''}
                </div>
            `;
        }).join('');
        
        // 更新所有聊天消息容器
        document.querySelectorAll('#chatMessages').forEach(container => {
            container.innerHTML = messagesHTML;
            this.scrollToBottom(container);
        });
        
        // 添加保存按钮的事件监听器
        this.addSaveButtonToMessages();
    },
    
    addSaveButtonToMessages() {
        document.querySelectorAll('.save-message').forEach(btn => {
            // Remove existing listeners first
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // Add new listener
            newBtn.addEventListener('click', (e) => {
                const messageEl = e.target.closest('.chat-message');
                if (messageEl) {
                    const messageContent = messageEl.querySelector('p').textContent;
                    NotesManager.addNote(messageContent, 'ai');
                    
                    // Show a quick feedback
                    const feedback = document.createElement('div');
                    feedback.textContent = '已保存到笔记!';
                    feedback.className = 'message-feedback';
                    feedback.style.position = 'absolute';
                    feedback.style.top = '0';
                    feedback.style.right = '40px';
                    feedback.style.fontSize = 'var(--font-size-xs)';
                    feedback.style.backgroundColor = 'var(--color-success)';
                    feedback.style.color = 'white';
                    feedback.style.padding = '3px 6px';
                    feedback.style.borderRadius = 'var(--radius-sm)';
                    feedback.style.opacity = '0';
                    feedback.style.transition = 'opacity 0.3s';
                    
                    messageEl.style.position = 'relative';
                    messageEl.appendChild(feedback);
                    
                    // Animate feedback
                    setTimeout(() => { feedback.style.opacity = '1'; }, 0);
                    setTimeout(() => { 
                        feedback.style.opacity = '0'; 
                        setTimeout(() => feedback.remove(), 300);
                    }, 1500);
                }
            });
        });
    },
    
    addTypingIndicator() {
        const id = 'typing-' + Date.now();
        const typingHTML = `
            <div class="chat-message assistant" id="${id}">
                <p>AI正在思考<span class="typing-dots">...</span></p>
            </div>
        `;
        
        document.querySelectorAll('#chatMessages').forEach(container => {
            container.insertAdjacentHTML('beforeend', typingHTML);
            this.scrollToBottom(container);
        });
        
        return id;
    },
    
    removeTypingIndicator(id) {
        document.querySelectorAll(`#${id}`).forEach(el => el.remove());
    },
    
    scrollToBottom(container) {
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    },
    
    // 切换聊天侧边栏的显示
    toggleChatSidebar() {
        console.log("toggleChatSidebar called, current chatPosition:", this.chatPosition);
        
        // 默认使用右侧边栏
        if (this.chatPosition === 'hidden') {
            this.setChatPosition('right');
        } else {
            this.closeChat(this.chatPosition);
        }
    },
    
    setChatPosition(position) {
        console.log("setChatPosition called with position:", position);
        
        try {
            // 如果切换位置，先隐藏当前位置
            if (this.chatPosition === 'left' && position === 'right') {
                this.leftAIChat.classList.add('hidden');
            } else if (this.chatPosition === 'right' && position === 'left') {
                this.rightAIChat.classList.add('hidden');
            }
            
            this.chatPosition = position;
            
            // 根据位置设置显示
            if (position === 'left') {
                this.leftAIChat.classList.remove('hidden');
                // 如果浏览器不支持 :has 选择器，添加标记类
                this.leftSidebarArea.classList.add('has-visible-sidebar');
            } else if (position === 'right') {
                this.rightAIChat.classList.remove('hidden');
                // 如果浏览器不支持 :has 选择器，添加标记类
                this.rightSidebarArea.classList.add('has-visible-sidebar');
            }
            
            // 加载所有消息
            this.renderMessages(StorageManager.getConversation() || []);
        } catch (error) {
            console.error("Error in setChatPosition:", error);
        }
    },
    
    closeChat(position) {
        // 隐藏指定位置的聊天面板
        if (position === 'left') {
            this.leftAIChat.classList.add('hidden');
            // 检查是否还有其他可见的侧边栏，如果没有则移除标记类
            if (!this.leftSidebarArea.querySelector('.sidebar:not(.hidden)')) {
                this.leftSidebarArea.classList.remove('has-visible-sidebar');
            }
        } else if (position === 'right') {
            this.rightAIChat.classList.add('hidden');
            // 检查是否还有其他可见的侧边栏，如果没有则移除标记类
            if (!this.rightSidebarArea.querySelector('.sidebar:not(.hidden)')) {
                this.rightSidebarArea.classList.remove('has-visible-sidebar');
            }
        }
        
        // 更新状态
        if (this.chatPosition === position) {
            this.chatPosition = 'hidden';
        }
    }
};