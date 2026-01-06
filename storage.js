
const Storage = {
    keys: {
        chats: 'drasaAI_chats',
        currentChatId: 'drasaAI_currentChatId',
        isDarkTheme: 'drasaAI_isDarkTheme',
        apiKey: 'drasaAI_apiKey'
    },

    save(state) {
        try {
            localStorage.setItem(this.keys.chats, JSON.stringify(state.chats));
            localStorage.setItem(this.keys.currentChatId, state.currentChatId);
            localStorage.setItem(this.keys.isDarkTheme, state.isDarkTheme);
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },


    load() {
        try {
            const state = {
                chats: [],
                currentChatId: null,
                isDarkTheme: false
            };

            const chats = localStorage.getItem(this.keys.chats);
            if (chats) {
                state.chats = JSON.parse(chats);
            }

            const currentChatId = localStorage.getItem(this.keys.currentChatId);
            if (currentChatId) {
                state.currentChatId = parseInt(currentChatId);
            }

            const isDarkTheme = localStorage.getItem(this.keys.isDarkTheme);
            if (isDarkTheme === 'true') {
                state.isDarkTheme = true;
            }

            return state;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return {
                chats: [],
                currentChatId: null,
                isDarkTheme: false
            };
        }
    },

    saveApiKey(apiKey) {
        try {
            localStorage.setItem(this.keys.apiKey, apiKey);
            return true;
        } catch (error) {
            console.error('Error saving API key:', error);
            return false;
        }
    },

    getApiKey() {
        try {
            return localStorage.getItem(this.keys.apiKey);
        } catch (error) {
            console.error('Error getting API key:', error);
            return null;
        }
    },

    clear() {
        try {
            Object.values(this.keys).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    },

    exportChats(chats) {
        try {
            const dataStr = JSON.stringify(chats, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `drasa-ai-chats-${Date.now()}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Error exporting chats:', error);
            return false;
        }
    },
    async importChats(file) {
        try {
            const text = await file.text();
            const chats = JSON.parse(text);
            
            if (!Array.isArray(chats)) {
                throw new Error('Invalid chat format');
            }
            
            return chats;
        } catch (error) {
            console.error('Error importing chats:', error);
            return null;
        }
    }
};
