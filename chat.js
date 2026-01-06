const ChatManager = {
    currentChatId: null,
    chats: [],
    isTyping: false,
    init(chats, currentChatId) {
        this.chats = chats || [];
        this.currentChatId = currentChatId;
    },
    createChat() {
        const chatId = Date.now();
        const newChat = {
            id: chatId,
            title: 'New Chat',
            messages: [],
            timestamp: new Date().toISOString()
        };
        
        this.chats.unshift(newChat);
        this.currentChatId = chatId;
        
        return chatId;
    },
    getCurrentChat() {
        return this.chats.find(chat => chat.id === this.currentChatId);
    },
    getChat(chatId) {
        return this.chats.find(chat => chat.id === chatId);
    },
    addMessage(type, text, attachments = null) {
        const currentChat = this.getCurrentChat();
        if (!currentChat) return null;

        const message = {
            id: Date.now(),
            type: type, 
            text: text,
            timestamp: new Date().toISOString(),
            attachments: attachments || null
        };

        currentChat.messages.push(message);
        if (currentChat.messages.length === 1 && type === 'user') {
            const titleText = text || 'Shared a file';
            currentChat.title = titleText.substring(0, 50) + (titleText.length > 50 ? '...' : '');
        }

        return message;
    },
    getMessages() {
        const currentChat = this.getCurrentChat();
        return currentChat ? currentChat.messages : [];
    },
    deleteChat(chatId) {
        const index = this.chats.findIndex(chat => chat.id === chatId);
        if (index !== -1) {
            this.chats.splice(index, 1);
            if (this.currentChatId === chatId) {
                this.currentChatId = null;
            }
            
            return true;
        }
        return false;
    },
    clearAll() {
        this.chats = [];
        this.currentChatId = null;
    },

    setCurrentChat(chatId) {
        const chat = this.getChat(chatId);
        if (chat) {
            this.currentChatId = chatId;
            return true;
        }
        return false;
    },

    getChatHistory() {
        return this.chats.map(chat => ({
            id: chat.id,
            title: chat.title,
            timestamp: chat.timestamp,
            messageCount: chat.messages.length,
            isActive: chat.id === this.currentChatId
        }));
    },
    setTyping(isTyping) {
        this.isTyping = isTyping;
    },
    getTyping() {
        return this.isTyping;
    },
    getAllChats() {
        return this.chats;
    },
    updateChatTitle(chatId, title) {
        const chat = this.getChat(chatId);
        if (chat) {
            chat.title = title;
            return true;
        }
        return false;
    },
    searchMessages(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        this.chats.forEach(chat => {
            chat.messages.forEach(message => {
                if (message.text.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        chatId: chat.id,
                        chatTitle: chat.title,
                        message: message
                    });
                }
            });
        });

        return results;
    },

    getStatistics() {
        const totalChats = this.chats.length;
        const totalMessages = this.chats.reduce((sum, chat) => sum + chat.messages.length, 0);
        const userMessages = this.chats.reduce((sum, chat) => 
            sum + chat.messages.filter(m => m.type === 'user').length, 0);
        const aiMessages = this.chats.reduce((sum, chat) => 
            sum + chat.messages.filter(m => m.type === 'ai').length, 0);

        return {
            totalChats,
            totalMessages,
            userMessages,
            aiMessages
        };
    }
};
