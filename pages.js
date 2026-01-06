

const PageManager = {
    elements: {},
    isDarkTheme: false,
    currentAttachments: [], 
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.loadTheme();
        this.autoResizeTextarea();
    },

    cacheElements() {
        this.elements = {
            newChatBtn: document.getElementById('newChatBtn'),
            themeToggle: document.getElementById('themeToggle'),
            menuToggle: document.getElementById('menuToggle'),
            sidebar: document.getElementById('sidebar'),
            chatHistory: document.getElementById('chatHistory'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),
            
            welcomeScreen: document.getElementById('welcomeScreen'),
            chatContainer: document.getElementById('chatContainer'),
            messages: document.getElementById('messages'),
            
            chatInput: document.getElementById('chatInput'),
            sendBtn: document.getElementById('sendBtn'),
            attachBtn: document.getElementById('attachBtn'),
            charCount: document.getElementById('charCount'),
            
            suggestionCards: document.querySelectorAll('.suggestion-card'),
            mainContainer: document.querySelector('.main-container')
        };
    },

    setupEventListeners() {
        this.elements.newChatBtn.addEventListener('click', () => this.handleNewChat());
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.elements.menuToggle.addEventListener('click', () => this.toggleSidebar());
        
        this.elements.clearHistoryBtn.addEventListener('click', () => this.handleClearHistory());
        
        this.elements.sendBtn.addEventListener('click', () => this.handleSendMessage());
        this.elements.chatInput.addEventListener('keydown', (e) => this.handleInputKeydown(e));
        this.elements.chatInput.addEventListener('input', () => this.handleInputChange());
        this.elements.attachBtn.addEventListener('click', () => this.handleAttachment());
        
        this.elements.suggestionCards.forEach(card => {
            card.addEventListener('click', () => this.handleSuggestionClick(card));
        });
        
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
        
        window.addEventListener('resize', () => this.handleResize());
    },

    handleNewChat() {
        const chatId = ChatManager.createChat();
        this.updateUI();
        this.showWelcomeScreen(); 
        this.elements.chatInput.focus();
        Storage.save({
            chats: ChatManager.getAllChats(),
            currentChatId: ChatManager.currentChatId,
            isDarkTheme: this.isDarkTheme
        });
        
      
        if (window.innerWidth < 1024) {
            this.closeSidebar();
        }
    },

    async handleSendMessage() {
        const messageText = this.elements.chatInput.value.trim();
        const hasAttachments = this.currentAttachments.length > 0;
        
        if ((!messageText && !hasAttachments) || ChatManager.isTyping) return;
        
       
        if (!ChatManager.currentChatId) {
            this.handleNewChat();
        }
        
     
        const attachments = hasAttachments ? [...this.currentAttachments] : null;
        this.clearAttachments();
        
     
        const userMessage = ChatManager.addMessage('user', messageText, attachments);
        
        this.elements.chatInput.value = '';
        this.handleInputChange();
        
        this.showChatContainer();
        this.displayMessage(userMessage);
        this.scrollToBottom();
        
        Storage.save({
            chats: ChatManager.getAllChats(),
            currentChatId: ChatManager.currentChatId,
            isDarkTheme: this.isDarkTheme
        });
        
        await this.getAIResponse(hasAttachments);
    },

    async getAIResponse(hasAttachments = false) {
        ChatManager.setTyping(true);
        this.elements.sendBtn.disabled = true;
        
        const typingIndicator = this.createTypingIndicator();
        this.elements.messages.appendChild(typingIndicator);
        this.scrollToBottom();
        
        try {
            const messages = ChatManager.getMessages();
            const lastMessage = messages[messages.length - 1].text || '';
            
            const response = await APIHandler.getResponse(messages, lastMessage, hasAttachments);
            
            typingIndicator.remove();
            
            if (response.success) {
                const aiMessage = ChatManager.addMessage('ai', response.text);
                this.displayMessage(aiMessage);
                
                Storage.save({
                    chats: ChatManager.getAllChats(),
                    currentChatId: ChatManager.currentChatId,
                    isDarkTheme: this.isDarkTheme
                });
            } else {
                console.error('API Response Error:', response);
                this.showError(`Failed to get response: ${response.text || response.error || 'Unknown error'}. Please try again.`);
            }
        } catch (error) {
            console.error('Error getting AI response:', error);
            typingIndicator.remove();
            this.showError('An error occurred. Please try again.');
        } finally {
            ChatManager.setTyping(false);
            this.elements.sendBtn.disabled = false;
            this.scrollToBottom();
        }
    },

    displayMessage(message) {
        const messageElement = this.createMessageElement(message);
        this.elements.messages.appendChild(messageElement);
    },

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.type}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = message.type === 'user' ? 'U' : 'AI';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (message.attachments && message.attachments.length > 0) {
            const attachmentsDiv = document.createElement('div');
            attachmentsDiv.className = 'message-attachments';
            
            message.attachments.forEach(attachment => {
                const attachmentEl = document.createElement('div');
                attachmentEl.className = 'message-attachment';
                
                if (attachment.type.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.src = attachment.data;
                    img.alt = attachment.name;
                    img.onclick = () => this.showImageModal(attachment.data);
                    attachmentEl.appendChild(img);
                } else {
                    const fileInfo = document.createElement('div');
                    fileInfo.className = 'file-info';
                    fileInfo.innerHTML = `
                        <span class="file-icon">${this.getFileIcon(attachment.type)}</span>
                        <span class="file-name">${attachment.name}</span>
                        <span class="file-size">${this.formatFileSize(attachment.size)}</span>
                    `;
                    attachmentEl.appendChild(fileInfo);
                }
                
                attachmentsDiv.appendChild(attachmentEl);
            });
            
            contentDiv.appendChild(attachmentsDiv);
        }
        
        if (message.text) {
            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.innerHTML = this.formatMessageText(message.text);
            contentDiv.appendChild(bubble);
        }
        
        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = this.formatTime(message.timestamp);
        contentDiv.appendChild(time);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        return messageDiv;
    },

    formatMessageText(text) {
        if (!text) return '';
        
        let formatted = text;

        formatted = formatted
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Convert **bold** to <strong>
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // Convert *italic* to <em>
        formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Convert `code` to <code>
        formatted = formatted.replace(/`(.+?)`/g, '<code>$1</code>');
        
        // Convert bullet points (• or -) at start of line
        formatted = formatted.replace(/^[•\-]\s+(.+)$/gm, '<li>$1</li>');
        
        // Wrap consecutive list items in <ul>
        formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
        
        // Convert line breaks (\n) to <br>
        formatted = formatted.replace(/\n/g, '<br>');
        
        // Convert numbered lists (1. 2. 3.)
        formatted = formatted.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="numbered-item"><span class="number">$1.</span> $2</div>');
        
        return formatted;
    },

    showImageModal(imageSrc) {
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.onclick = () => modal.remove();
        
        const img = document.createElement('img');
        img.src = imageSrc;
        img.onclick = (e) => e.stopPropagation();
        
        modal.appendChild(img);
        document.body.appendChild(modal);
    },
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    createTypingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai';
        messageDiv.id = 'typing-indicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = 'AI';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-dot';
            typingDiv.appendChild(dot);
        }
        
        bubble.appendChild(typingDiv);
        contentDiv.appendChild(bubble);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        return messageDiv;
    },

    showChatContainer() {
        this.elements.welcomeScreen.classList.add('hidden');
        this.elements.chatContainer.classList.add('active');
    },

    showWelcomeScreen() {
        this.elements.welcomeScreen.classList.remove('hidden');
        this.elements.chatContainer.classList.remove('active');
        this.elements.messages.innerHTML = '';
    },

    updateUI() {
        this.updateChatHistory();
        this.updateMainView();
    },

    updateChatHistory() {
        this.elements.chatHistory.innerHTML = '';
        
        const history = ChatManager.getChatHistory();
        
        if (history.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.style.color = 'var(--text-tertiary)';
            emptyMessage.style.fontSize = '14px';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.padding = '20px';
            emptyMessage.textContent = 'No chat history yet';
            this.elements.chatHistory.appendChild(emptyMessage);
            return;
        }
        
        history.forEach(chat => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            if (chat.isActive) {
                historyItem.classList.add('active');
            }
            
            const title = document.createElement('div');
            title.className = 'history-item-title';
            title.textContent = chat.title;
            
            const time = document.createElement('div');
            time.className = 'history-item-time';
            time.textContent = this.formatDate(chat.timestamp);
            
            historyItem.appendChild(title);
            historyItem.appendChild(time);
            
            historyItem.addEventListener('click', () => this.loadChat(chat.id));
            
            this.elements.chatHistory.appendChild(historyItem);
        });
    },

    updateMainView() {
        if (!ChatManager.currentChatId) {
            this.showWelcomeScreen();
            return;
        }
        
        const currentChat = ChatManager.getCurrentChat();
        if (!currentChat || currentChat.messages.length === 0) {
            this.showWelcomeScreen();
            return;
        }
        
        this.showChatContainer();
        this.elements.messages.innerHTML = '';
        currentChat.messages.forEach(message => this.displayMessage(message));
        this.scrollToBottom();
    },

    loadChat(chatId) {
        ChatManager.setCurrentChat(chatId);
        this.updateUI();
        
        if (window.innerWidth < 1024) {
            this.closeSidebar();
        }
    },
    handleClearHistory() {
        if (ChatManager.getAllChats().length === 0) return;
        
        if (confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
            ChatManager.clearAll();
            Storage.save({
                chats: [],
                currentChatId: null,
                isDarkTheme: this.isDarkTheme
            });
            this.updateUI();
        }
    },

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        document.body.classList.toggle('dark-theme', this.isDarkTheme);
        Storage.save({
            chats: ChatManager.getAllChats(),
            currentChatId: ChatManager.currentChatId,
            isDarkTheme: this.isDarkTheme
        });
    },
    loadTheme() {
        if (this.isDarkTheme) {
            document.body.classList.add('dark-theme');
        }
    },

    toggleSidebar() {
        this.elements.sidebar.classList.toggle('active');
        
        if (window.innerWidth >= 1024) {
            this.elements.mainContainer.classList.toggle('sidebar-open');
        }
    },

    closeSidebar() {
        this.elements.sidebar.classList.remove('active');
        if (window.innerWidth >= 1024) {
            this.elements.mainContainer.classList.remove('sidebar-open');
        }
    },
    handleInputKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSendMessage();
        }
    },

    handleInputChange() {
        const text = this.elements.chatInput.value;
        const length = text.length;
        const hasAttachments = this.currentAttachments && this.currentAttachments.length > 0;
        
        this.elements.charCount.textContent = `${length} / 2000`;
        this.elements.sendBtn.disabled = (length === 0 && !hasAttachments) || ChatManager.isTyping;
        
        this.autoResizeTextarea();
    },

    autoResizeTextarea() {
        this.elements.chatInput.style.height = 'auto';
        this.elements.chatInput.style.height = this.elements.chatInput.scrollHeight + 'px';
    },
    handleAttachment() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*,.pdf,.txt,.doc,.docx,.csv,.json';
        
        input.onchange = async (e) => {
            const files = Array.from(e.target.files);
            for (const file of files) {
                await this.addAttachment(file);
            }
        };
        
        input.click();
    },
    async addAttachment(file) {
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
            return;
        }
        try {
            const attachment = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: null
            };

            if (file.type.startsWith('image/')) {
                attachment.data = await this.readFileAsDataURL(file);
            } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                attachment.data = await this.readFileAsText(file);
            } else {
                attachment.data = await this.readFileAsDataURL(file);
            }

            this.currentAttachments.push(attachment);
            this.displayAttachmentPreview(attachment);
        } catch (error) {
            console.error('Error reading file:', error);
            alert(`Error reading file "${file.name}"`);
        }
    },
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    },

    displayAttachmentPreview(attachment) {
        let previewContainer = document.querySelector('.attachment-preview-container');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.className = 'attachment-preview-container';
            this.elements.chatInput.parentElement.insertBefore(
                previewContainer, 
                this.elements.chatInput.parentElement.firstChild
            );
        }

        const preview = document.createElement('div');
        preview.className = 'attachment-preview';
        preview.dataset.fileName = attachment.name;

        if (attachment.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = attachment.data;
            img.alt = attachment.name;
            preview.appendChild(img);
        } else {
            const icon = document.createElement('div');
            icon.className = 'file-icon';
            icon.innerHTML = this.getFileIcon(attachment.type);
            preview.appendChild(icon);

            const name = document.createElement('div');
            name.className = 'file-name';
            name.textContent = attachment.name;
            preview.appendChild(name);
        }

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-attachment';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => this.removeAttachment(attachment.name);
        preview.appendChild(removeBtn);

        previewContainer.appendChild(preview);
    },
    removeAttachment(fileName) {
        this.currentAttachments = this.currentAttachments.filter(a => a.name !== fileName);
        
        const preview = document.querySelector(`[data-file-name="${fileName}"]`);
        if (preview) {
            preview.remove();
        }
        const container = document.querySelector('.attachment-preview-container');
        if (container && container.children.length === 0) {
            container.remove();
        }
    },
    clearAttachments() {
        this.currentAttachments = [];
        const container = document.querySelector('.attachment-preview-container');
        if (container) {
            container.remove();
        }
    },
    getFileIcon(type) {
        if (type.includes('pdf')) return '📄';
        if (type.includes('text')) return '📄';
        if (type.includes('word') || type.includes('document')) return '📃';
        if (type.includes('sheet') || type.includes('csv')) return '📊';
        if (type.includes('json')) return '📄';
        return '📎';
    },
    handleSuggestionClick(card) {
        const suggestion = card.getAttribute('data-suggestion');
        this.elements.chatInput.value = suggestion;
        this.handleInputChange();
        this.handleSendMessage();
    },
    handleOutsideClick(e) {
        if (window.innerWidth < 1024 && 
            this.elements.sidebar.classList.contains('active') && 
            !this.elements.sidebar.contains(e.target) && 
            !this.elements.menuToggle.contains(e.target)) {
            this.closeSidebar();
        }
    },
    handleResize() {
        if (window.innerWidth >= 1024) {
            this.elements.sidebar.classList.remove('active');
        }
    },

    scrollToBottom() {
        setTimeout(() => {
            this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;
        }, 100);
    },
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message ai';
        errorDiv.style.opacity = '0.7';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '⚠️';
        avatar.style.background = '#ef4444';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = message;
        bubble.style.backgroundColor = '#fee2e2';
        bubble.style.color = '#991b1b';
        
        contentDiv.appendChild(bubble);
        errorDiv.appendChild(avatar);
        errorDiv.appendChild(contentDiv);
        
        this.elements.messages.appendChild(errorDiv);
    },
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    },
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
        }
    }
};
