

const OpenRouter = {
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'google/gemini-2.0-flash-exp:free',
        models: {
        gemini: 'google/gemini-2.0-flash-exp:free',
        gemini_flash: 'google/gemini-flash-1.5',
        gpt4vision: 'openai/gpt-4-vision-preview', 
        claude: 'anthropic/claude-3-opus',
        llama: 'meta-llama/llama-3.1-70b-instruct',
        mistral: 'mistralai/mistral-7b-instruct:free'
    },

    async sendMessage(messages, apiKey, model = null) {
        const selectedModel = model || this.defaultModel;
        
        try {
            console.log('Making API request to OpenRouter...');
            console.log('Model:', selectedModel);
            console.log('Message count:', messages.length);
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin || 'https://drasa-ai.local',
                    'X-Title': 'Drasa AI'
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 3000,
                    top_p: 1,
                    frequency_penalty: 0,
                    presence_penalty: 0
                })
            });

            console.log('API Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error Data:', errorData);
                
                if (response.status === 429) {
                    throw new Error('Rate limit reached. Please wait a moment and try again. Consider using a different model or upgrading your API plan.');
                }
                
                throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response received successfully');
            
            return {
                success: true,
                message: data.choices[0].message.content,
                model: data.model,
                usage: data.usage
            };
        } catch (error) {
            console.error('OpenRouter API error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    async streamMessage(messages, apiKey, onChunk, model = null) {
        const selectedModel = model || this.defaultModel;
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Drasa AI'
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: messages,
                    stream: true,
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                throw new Error('Stream request failed');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices[0]?.delta?.content;
                            if (content) {
                                onChunk(content);
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }

            return { success: true };
        } catch (error) {
            console.error('OpenRouter stream error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    async validateApiKey(apiKey) {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            return response.ok;
        } catch (error) {
            console.error('API key validation error:', error);
            return false;
        }
    },

    async getModels(apiKey) {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch models');
            }

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error fetching models:', error);
            return [];
        }
    }
};
