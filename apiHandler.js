const APIHandler = {
    useRealAPI: true,
    //primary API key
    apiKey: hidden,
    currentModel: 'mistralai/mistral-7b-instruct:free',
    //fallback API key
    fallbackApiKey: hidden,
    fallbackModel: 'moonshotai/kimi-k2:free',
    //third backup API key and model
    backupApiKey: hidden,
    backupModel: 'mistralai/mistral-small-3.1-24b-instruct:free', 
    //rate limit tracking
    primaryApiRateLimited: false,
    rateLimitResetTime: null,
    fallbackApiRateLimited: false,
    fallbackRateLimitResetTime: null,
    backupApiRateLimited: false,
    backupRateLimitResetTime: null,
    //system prompt
    systemInstruction: 'You are Drasa AI, a helpful and polite AI assistant built by Ajay Keshri. Always be respectful, friendly, and provide accurate, helpful responses.',
    init() {
        const savedKey = Storage.getApiKey();
        if (savedKey) {
            this.apiKey = savedKey;
        }
        this.useRealAPI = !!this.apiKey;
        if (!savedKey && this.apiKey) {
            Storage.saveApiKey(this.apiKey);
        }
        if ('onLine' in navigator) {
            window.addEventListener('online', () => {
                console.log('Network connection restored');
            });
            window.addEventListener('offline', () => {
                console.log('Network connection lost');
            });
        }
        
        console.log('API Handler initialized:', {
            hasKey: !!this.apiKey,
            useRealAPI: this.useRealAPI,
            model: this.currentModel,
            online: navigator.onLine
        });
    },

    /**
     * @param {string} key - openrouter api key
     */
    setApiKey(key) {
        this.apiKey = key;
        this.useRealAPI = !!key;
        Storage.saveApiKey(key);
    },
    /**
     * to check if API key is configured
     * @returns {boolean} true if API key exists
     */
    hasApiKey() {
        return !!this.apiKey;
    },

    /**
     * @param {Array} messages - chat message history
     * @param {string} userMessage - tatest user message text
     * @param {boolean} hasAttachments - check extra files
     * @returns {Object} response object with success, text, and model
     */
    async getResponse(messages, userMessage, hasAttachments = false) {
        if (!navigator.onLine) {
            return {
                success: false,
                text: 'No internet connection. Please check your network and try again.',
                model: 'error'
            };
        }
        if (this.useRealAPI && this.apiKey) {
            // Reset expired rate limits
            if (this.primaryApiRateLimited && this.rateLimitResetTime && Date.now() >= this.rateLimitResetTime) {
                console.log(' Primary rate limit cooldown expired');
                this.primaryApiRateLimited = false;
                this.rateLimitResetTime = null;
            }
            if (this.fallbackApiRateLimited && this.fallbackRateLimitResetTime && Date.now() >= this.fallbackRateLimitResetTime) {
                console.log('Fallback rate limit cooldown expired');
                this.fallbackApiRateLimited = false;
                this.fallbackRateLimitResetTime = null;
            }
            if (this.backupApiRateLimited && this.backupRateLimitResetTime && Date.now() >= this.backupRateLimitResetTime) {
                console.log('Backup rate limit cooldown expired');
                this.backupApiRateLimited = false;
                this.backupRateLimitResetTime = null;
            }
            if (this.primaryApiRateLimited && this.fallbackApiRateLimited && this.backupApiRateLimited) {
                const times = [
                    this.rateLimitResetTime || 0,
                    this.fallbackRateLimitResetTime || 0,
                    this.backupRateLimitResetTime || 0
                ].filter(t => t > Date.now());
                
                if (times.length > 0) {
                    const waitTime = Math.ceil((Math.min(...times) - Date.now()) / 1000);
                    return {
                        success: false,
                        text: `All APIs are rate limited. Please wait ${waitTime} seconds and try again.`,
                        model: 'error'
                    };
                }
            }
            if (this.primaryApiRateLimited && Date.now() < this.rateLimitResetTime) {
                console.log('Primary API rate limited, trying alternatives');
                if (hasAttachments) {
                    return await this.useFallbackAPI(messages, hasAttachments);
                } else if (!this.backupApiRateLimited) {
                    return await this.useBackupAPI(messages);
                } else if (!this.fallbackApiRateLimited) {
                    return await this.useFallbackAPI(messages, hasAttachments);
                }
            }
            if (hasAttachments) {
                console.log('📸 Image detected - using vision-capable model (Qwen)');
                return await this.useFallbackAPI(messages, hasAttachments);
            } else {
                console.log('💬 Using OpenRouter API for text question');
                return await this.getRealAPIResponse(messages, hasAttachments);
            }
        } else {
            return {
                success: false,
                text: 'API key not configured. Please add an OpenRouter API key to use Drasa AI.',
                model: 'error'
            };
        }
    },

    /**
     * @param {Array} messages - chat message history
     * @param {boolean} hasAttachments - for checking message has file attachments
     * @returns {Object} API response object
     */
    async getRealAPIResponse(messages, hasAttachments = false, retryCount = 0) {
        try {
            const formattedMessages = messages.map(msg => ({
                role: msg.type === 'user' ? 'user' : 'assistant',
                content: msg.text
            }));
            console.log('Sending to Mistral API:', {
                messageCount: formattedMessages.length,
                model: this.currentModel
            });
            const result = await OpenRouter.sendMessage(
                formattedMessages,
                this.apiKey,
                this.currentModel
            );
            if (result.success) {
                console.log('API Response received:', result.model);
                return {
                    success: true,
                    text: result.message,
                    model: result.model
                };
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Primary API error:', error);
            if (error.message.includes('Rate limit')) {
                this.primaryApiRateLimited = true;
                this.rateLimitResetTime = Date.now() + (2 * 60 * 1000);
                console.log('Primary API rate limited. Using fallback for next 2 minutes.');
            }
            if (retryCount === 0) {
                console.log('Primary API failed. Trying backup APIs...');
                if (hasAttachments) {
                    return await this.useFallbackAPI(messages, hasAttachments);
                } else if (!this.backupApiRateLimited) {
                    return await this.useBackupAPI(messages);
                } else {
                    return await this.useFallbackAPI(messages, hasAttachments);
                }
            }
            return {
                success: false,
                text: `Sorry, I encountered an error: ${error.message}`,
                model: 'error'
            };
        }
    },

    /**
     * @param {Array} messages - Chat message history
     * @param {boolean} hasAttachments - for checking files
     * @returns {Object} API response object
     */
    async useFallbackAPI(messages, hasAttachments = false) {
        try {
            console.log('Using fallback API (Qwen 2.5 VL)');  
            const lastMessage = messages[messages.length - 1];
            if (!hasAttachments) {
                console.log('💬 Text-only request on fallback API');
                const formattedMessages = messages.map(msg => ({
                    role: msg.type === 'user' ? 'user' : 'assistant',
                    content: msg.text
                }));
                const result = await OpenRouter.sendMessage(
                    formattedMessages,
                    this.fallbackApiKey,
                    this.fallbackModel
                );
                if (result.success) {
                    console.log('Fallback API response received');
                    return {
                        success: true,
                        text: result.message,
                        model: result.model
                    };
                } else {
                    throw new Error(result.error);
                }
            }
            console.log('Processing image with fallback API');
            const content = [];
            
            const textContent = lastMessage.text || 'What is in this image?';
            content.push({
                type: 'text',
                text: textContent
            });
          
            if (lastMessage.attachments && lastMessage.attachments.length > 0) {
                lastMessage.attachments.forEach(attachment => {
                    if (attachment.type.startsWith('image/')) {
                        console.log('📸 Adding image to request');
                        content.push({
                            type: 'image_url',
                            image_url: {
                                url: attachment.data
                            }
                        });
                    }
                });
            }
            
            const formattedMessages = [
                {
                    role: 'user',
                    content: content
                }
            ];

            console.log('Sending to Qwen with', formattedMessages.length, 'message(s)');

            const result = await OpenRouter.sendMessage(
                formattedMessages,
                this.fallbackApiKey,
                this.fallbackModel
            );

            if (result.success) {
                console.log('Qwen response received');
                return {
                    success: true,
                    text: result.message,
                    model: result.model
                };
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Fallback API also failed:', error);
  
            if (error.message.includes('Rate limit')) {
                this.fallbackApiRateLimited = true;
                this.fallbackRateLimitResetTime = Date.now() + (2 * 60 * 1000);
                console.log('Fallback API rate limited.');
    
                if (!hasAttachments && !this.backupApiRateLimited) {
                    console.log('Trying backup API as last resort...');
                    return await this.useBackupAPI(messages);
                }
                
                return {
                    success: false,
                    text: 'All available APIs are currently rate limited. Please wait 2 minutes and try again.',
                    model: 'error'
                };
            }
            
            return {
                success: false,
                text: `API error: ${error.message}. Please try again.`,
                model: 'error'
            };
        }
    },

    /**
     * @param {Array} messages - Chat message history
     * @returns {Object} API response object
     */
    async useBackupAPI(messages) {
        try {
            console.log('Using backup API (DeepSeek)');
            
            const formattedMessages = messages.map(msg => ({
                role: msg.type === 'user' ? 'user' : 'assistant',
                content: msg.text
            }));
            
            const result = await OpenRouter.sendMessage(
                formattedMessages,
                this.backupApiKey,
                this.backupModel
            );
            
            if (result.success) {
                console.log('Backup API response received');
                return {
                    success: true,
                    text: result.message,
                    model: result.model
                };
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Backup API failed:', error);
            
            if (error.message.includes('Rate limit')) {
                this.backupApiRateLimited = true;
                this.backupRateLimitResetTime = Date.now() + (2 * 60 * 1000);
                console.log('Backup API rate limited.');
            }
            
            return {
                success: false,
                text: `Backup API error: ${error.message}. Please try again.`,
                model: 'error'
            };
        }
    },

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
