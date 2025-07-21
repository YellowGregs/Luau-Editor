export class AIAssistant {
    constructor() {
        // alt acc api key so idc what you do with it
        this.apiKey = ''; //put your Gemini API key 
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        this.isLoading = false;
        this.conversationHistory = [];
        this.setupUI();
    }

    setupUI() {
        const aiContent = document.getElementById('aiContent');
        aiContent.innerHTML = `
            <div class="ai-chat-container">
                <div class="ai-chat-messages" id="aiChatMessages">
                    <div class="ai-welcome-message">
                        <div class="ai-avatar">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                                <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </div>
                        <div class="ai-message-content">
                            <div class="ai-message-text">
                                <div class="ai-greeting">Hello! I'm your AI coding assistant.</div>
                                <div class="ai-capabilities">
                                    <div class="capability-item">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                        </svg>
                                        Code review & optimization
                                    </div>
                                    <div class="capability-item">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                        </svg>
                                        Debugging assistance
                                    </div>
                                    <div class="capability-item">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                        </svg>
                                        Code explanations
                                    </div>
                                    <div class="capability-item">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                        </svg>
                                        Best practices
                                    </div>
                                </div>
                                <div class="ai-prompt">How can I help you today?</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="ai-input-container">
                    <div class="ai-quick-actions">
                        <button class="ai-quick-btn" data-action="review">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M9 11H15M9 15H15M17 21L12 16L7 21V5A2 2 0 0 1 9 3H15A2 2 0 0 1 17 5V21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Review
                        </button>
                        <button class="ai-quick-btn" data-action="optimize">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Optimize
                        </button>
                        <button class="ai-quick-btn" data-action="explain">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                <path d="M9.09 9A3 3 0 0 1 15 9C15 12 12 13 12 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Explain
                        </button>
                        <button class="ai-quick-btn" data-action="debug">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M6.5 8A6.5 6.5 0 0 1 19 8C19 10.5 17.5 12.5 15.5 14L13 16.5L10.5 14C8.5 12.5 7 10.5 7 8" stroke="currentColor" stroke-width="2"/>
                                <path d="M12 2V8M8 14V17M16 14V17M12 8V16.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            Debug
                        </button>
                    </div>
                    <div class="ai-input-wrapper">
                        <textarea 
                            id="aiInput" 
                            placeholder="Ask me anything about your code..."
                            rows="1"
                        ></textarea>
                        <button id="aiSendBtn" class="ai-send-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const aiInput = document.getElementById('aiInput');
        const aiSendBtn = document.getElementById('aiSendBtn');
        const quickBtns = document.querySelectorAll('.ai-quick-btn');

        aiInput.addEventListener('input', () => {
            aiInput.style.height = 'auto';
            aiInput.style.height = Math.min(aiInput.scrollHeight, 120) + 'px';
        });

        aiInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        aiSendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        quickBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    async sendMessage(message = null) {
        const aiInput = document.getElementById('aiInput');
        const userMessage = message || aiInput.value.trim();
        
        if (!userMessage || this.isLoading) return;

        aiInput.value = '';
        aiInput.style.height = 'auto';

        this.addMessage(userMessage, 'user');

        this.setLoading(true);

        try {
            const response = await this.callGeminiAPI(userMessage);
            this.addMessage(response, 'ai');
        } catch (error) {
            console.error('AI Assistant error:', error);
            this.addMessage('Sorry, I encountered an error. Please try again.', 'ai', true);
        } finally {
            this.setLoading(false);
        }
    }

    async callGeminiAPI(message) {
        const currentCode = window.luaEditor?.editor?.getValue() || '';
        const contextMessage = currentCode ? 
            `Here's my current Lua code:\n\`\`\`lua\n${currentCode}\n\`\`\`\n\n${message}` : 
            message;

        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: `You are an Lua/Luau programming assistant. Please provide helpful, accurate, and concise responses about Lua programming. Focus on best practices, code quality, and clear explanations.\n\nUser question: ${contextMessage}`
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024
            }
        };

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': this.apiKey
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    addMessage(text, sender, isError = false) {
        const messagesContainer = document.getElementById('aiChatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${sender} ${isError ? 'error' : ''}`;

        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="ai-message-content">
                    <div class="ai-message-text">${this.escapeHtml(text)}</div>
                </div>
                <div class="ai-avatar user">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21V19A4 4 0 0 0 16 15H8A4 4 0 0 0 4 19V21M16 7A4 4 0 1 1 8 7A4 4 0 0 1 16 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="ai-avatar ${isError ? 'error' : ''}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                        <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </div>
                <div class="ai-message-content">
                    <div class="ai-message-text">${this.formatMessage(text)}</div>
                </div>
            `;
        }

        messagesContainer.appendChild(messageDiv);
        
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        
        requestAnimationFrame(() => {
            messageDiv.style.transition = 'all 0.3s ease-out';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        });

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    formatMessage(text) {
        // Basic markdown-like formatting
        return text
            .replace(/```lua\n([\s\S]*?)\n```/g, '<pre class="code-block"><code>$1</code></pre>')
            .replace(/```([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setLoading(loading) {
        this.isLoading = loading;
        const sendBtn = document.getElementById('aiSendBtn');
        const aiInput = document.getElementById('aiInput');
        
        if (loading) {
            sendBtn.innerHTML = `
                <div class="ai-loading-spinner">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="60" stroke-dashoffset="60">
                            <animate attributeName="stroke-dashoffset" dur="2s" values="60;0" repeatCount="indefinite"/>
                        </circle>
                    </svg>
                </div>
            `;
            sendBtn.disabled = true;
            aiInput.disabled = true;
            
            this.addTypingIndicator();
        } else {
            sendBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            sendBtn.disabled = false;
            aiInput.disabled = false;
            
            this.removeTypingIndicator();
        }
    }

    addTypingIndicator() {
        const messagesContainer = document.getElementById('aiChatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'ai-message ai typing-indicator';
        typingDiv.id = 'typingIndicator';
        
        typingDiv.innerHTML = `
            <div class="ai-avatar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" stroke-width="2"/>
                </svg>
            </div>
            <div class="ai-message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    handleQuickAction(action) {
        const currentCode = window.luaEditor?.editor?.getValue() || '';
        
        let message = '';
        switch (action) {
            case 'review':
                message = 'Please review my code and suggest improvements.';
                break;
            case 'optimize':
                message = 'How can I optimize this code for better performance?';
                break;
            case 'explain':
                message = 'Please explain what this code does and how it works.';
                break;
            case 'debug':
                message = 'Help me debug this code. Are there any issues or potential bugs?';
                break;
        }
        
        if (message) {
            this.sendMessage(message);
        }
    }
}