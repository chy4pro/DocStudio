// Conversation management
const ConversationManager = {
    chatPosition: 'hidden', // 'hidden', 'left', 'right'
    
    init() {
        console.log("ConversationManager init() called");
        
        try {
            // Initialize conversation UI elements
            this.aiChatBtn = document.getElementById('aiChatBtn');
            console.log("aiChatBtn found:", this.aiChatBtn);
            
            this.chatLeftBtn = document.getElementById('chatLeftBtn');
            this.chatRightBtn = document.getElementById('chatRightBtn');
            
            this.leftSidebar = document.getElementById('leftSidebar');
            this.rightSidebar = document.getElementById('rightSidebar');
            this.leftSidebarTitle = document.getElementById('leftSidebarTitle');
            this.rightSidebarTitle = document.getElementById('rightSidebarTitle');
            this.leftSidebarContent = document.getElementById('leftSidebarContent');
            this.rightSidebarContent = document.getElementById('rightSidebarContent');
            this.closeLeftSidebarBtn = document.getElementById('closeLeftSidebarBtn');
            this.closeRightSidebarBtn = document.getElementById('closeRightSidebarBtn');
            
            // 移除浮动聊天元素引用，我们不再使用它们
            this.floatingChat = document.getElementById('floatingChat');
            if (this.floatingChat) {
                this.floatingChat.classList.add('hidden');
            }
            
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
            
            this.chatLeftBtn?.addEventListener('click', () => this.setChatPosition('left'));
            this.chatRightBtn?.addEventListener('click', () => this.setChatPosition('right'));
            this.closeLeftSidebarBtn?.addEventListener('click', this.handleCloseSidebar.bind(this));
            this.closeRightSidebarBtn?.addEventListener('click', this.handleCloseSidebar.bind(this));
            
            // Create the chat UI in sidebar containers
            this.renderChatUI();
            
            console.log("ConversationManager initialization completed");
        } catch (error) {
            console.error("Error in ConversationManager.init():", error);
        }
    },
    
    renderChatUI() {
        // Create the chat UI HTML
        const chatHTML = `
            <div class="ai-chat">
                <div class="chat-messages" id="chatMessages">
                    <div class="chat-message assistant">
                        <p>Hello! I'm your AI assistant. How can I help you today?</p>
                    </div>
                </div>
                <form class="chat-input-form" id="chatInputForm">
                    <textarea class="chat-input" id="chatInput" placeholder="Type your message..." rows="2"></textarea>
                    <button type="submit" class="button-primary" id="chatSendBtn">
                        <svg class="icon" viewBox="0 0 24 24" width="18" height="18">
                            <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" stroke="currentColor" stroke-width="0.5"></path>
                        </svg>
                    </button>
                </form>
            </div>
        `;
        
        // Load saved conversation from storage
        const savedMessages = StorageManager.getConversation();
        
        // Create chat UI in sidebar containers
        this.createChatUIInContainer(this.leftSidebarContent);
        this.createChatUIInContainer(this.rightSidebarContent);
        
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
                        <textarea class="chat-input" id="chatInput" placeholder="Type your message..." rows="2"></textarea>
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
            this.addMessage('assistant', `Error: ${error.message}. Please check your API settings.`);
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
        
        // Render in all chat UIs
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
        
        // 找到最后一轮对话（最多两条消息）
        let lastUserMessage = null;
        let correspondingAiMessage = null;
        
        // 从最近的消息开始检查
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            
            // 如果是AI消息且我们还没找到对应的AI回复
            if (msg.role === 'assistant' && !correspondingAiMessage) {
                correspondingAiMessage = msg;
                // 继续循环寻找这条AI消息之前的最近用户消息
                continue;
            }
            
            // 如果是用户消息且我们已经找到了AI回复，这应该是对应的用户消息
            if (msg.role === 'user' && correspondingAiMessage && !lastUserMessage) {
                lastUserMessage = msg;
                break; // 找到了完整的一轮对话，可以跳出循环
            }
            
            // 如果我们还没找到任何消息，且这是一条用户消息，保存它
            // 这处理的是用户发送消息但AI还没回复的情况
            if (msg.role === 'user' && !correspondingAiMessage && !lastUserMessage) {
                lastUserMessage = msg;
                break; // 只有用户消息，没有AI回复，也跳出循环
            }
        }
        
        // 按照时间顺序准备消息（先用户消息，再AI回复）
        const messagesToDisplay = [];
        if (lastUserMessage) {
            messagesToDisplay.push(lastUserMessage);
        }
        if (correspondingAiMessage) {
            messagesToDisplay.push(correspondingAiMessage);
        }
        
        // 生成HTML
        const messagesHTML = messagesToDisplay.map(msg => {
            const isUser = msg.role === 'user';
            return `
                <div class="chat-message ${msg.role}" data-id="${msg.id}">
                    <p>${msg.content}</p>
                    ${!isUser ? 
                      `<div class="message-actions">
                          <button class="save-message" title="Save as note">
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
                    feedback.textContent = 'Saved to notes!';
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
                <p>AI is thinking<span class="typing-dots">...</span></p>
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
            this.setChatPosition('hidden');
        }
    },
    
    setChatPosition(position) {
        console.log("setChatPosition called with position:", position);
        
        try {
            this.chatPosition = position;
            
            // 处理左侧边栏
            if (this.leftSidebarTitle && this.leftSidebarTitle.textContent === 'AI Chat') {
                this.leftSidebar?.classList.add('hidden');
            }
            
            // 处理右侧边栏
            if (this.rightSidebarTitle && this.rightSidebarTitle.textContent === 'AI Chat') {
                this.rightSidebar?.classList.add('hidden');
            }
            
            // 根据位置设置显示
            switch (position) {
                case 'left':
                    if (this.leftSidebarTitle) this.leftSidebarTitle.textContent = 'AI Chat';
                    this.leftSidebar?.classList.remove('hidden');
                    break;
                    
                case 'right':
                    if (this.rightSidebarTitle) this.rightSidebarTitle.textContent = 'AI Chat';
                    this.rightSidebar?.classList.remove('hidden');
                    break;
            }
            
            // 加载最新消息
            this.renderMessages(StorageManager.getConversation() || []);
        } catch (error) {
            console.error("Error in setChatPosition:", error);
        }
    },
    
    handleCloseSidebar() {
        if (this.leftSidebarTitle.textContent === 'AI Chat' || 
            this.rightSidebarTitle.textContent === 'AI Chat') {
            this.setChatPosition('hidden');
        } else {
            // It's not an AI chat sidebar, so let other managers handle it
            this.leftSidebar.classList.add('hidden');
            this.rightSidebar.classList.add('hidden');
        }
    }
};