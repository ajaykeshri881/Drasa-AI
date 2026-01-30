const APIHandler = {
    apiKey: 'hidden',
    backupApiKey: 'hidden',
    thirdApiKey: 'hidden',
    API_URL_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=',
    systemInstruction: 'You are Drasa AI, a helpful and polite AI assistant built by Ajay Keshri. Always be respectful, friendly, and provide accurate, helpful responses.',
    init() {
        console.log('API Handler initialized for Gemini API.');
    },

    /**
     * @param {string} key 
     */
    setApiKey(key) {
        
    },
    /**
     * @returns {boolean} true if API key exists
     */
    hasApiKey() {
        return true;
    },

    /**
     * @param {Array} messages - chat message history
     * @param {string} userMessage - tatest user message text
     * @param {boolean} hasAttachments - check extra files
     * @returns {Object} response object with success, text, and model
     */
    async getResponse(messages, userMessage, hasAttachments = false) {
        // Try primary, then backup, then third key if rate limit/quota error
        const tryApiKey = async (apiKey) => {
            const formattedMessages = messages.map(msg => ({
                role: msg.type === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));
            const body = {
                contents: formattedMessages
            };
            const url = this.API_URL_BASE + apiKey;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error?.message || `API request failed: ${response.status}`);
            }
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return {
                success: true,
                text: text,
                model: 'gemini-2.5-flash'
            };
        };
        try {
            return await tryApiKey(this.apiKey);
        } catch (error1) {
            const errMsg1 = error1.message || '';
            if (errMsg1.includes('quota') || errMsg1.includes('rate limit') || errMsg1.includes('exceeded')) {
                try {
                    return await tryApiKey(this.backupApiKey);
                } catch (error2) {
                    const errMsg2 = error2.message || '';
                    if (errMsg2.includes('quota') || errMsg2.includes('rate limit') || errMsg2.includes('exceeded')) {
                        try {
                            return await tryApiKey(this.thirdApiKey);
                        } catch (error3) {
                            return {
                                success: false,
                                text: `API error: ${error3.message}`,
                                model: 'error'
                            };
                        }
                    }
                    return {
                        success: false,
                        text: `API error: ${error2.message}`,
                        model: 'error'
                    };
                }
            }
            return {
                success: false,
                text: `API error: ${error1.message}`,
                model: 'error'
            };
        }
    },

    /**
     * @param {Array} messages - chat message history
     * @param {boolean} hasAttachments - for checking message has file attachments
     * @returns {Object} API response object
     */
    // All fallback/backup logic removed for Gemini-only API

    /**
     * @param {Array} messages - Chat message history
     * @param {boolean} hasAttachments - for checking files
     * @returns {Object} API response object
     */
    // Fallback API removed

    /**
     * @param {Array} messages - Chat message history
     * @returns {Object} API response object
     */
    // Backup API removed

    /**
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Change AI model
     * @param {string} modelId - Model identifier
    setModel(modelId) {
        this.currentModel = modelId;
    },

    /**
     * Get current AI model
     * @returns {string} Current model identifier
     */
    getModel() {
        return this.currentModel;
    }
};
