class Chatbot {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.sessionId = null;
        this.isProcessing = false;
        
        this.initializeEventListeners();
        this.addWelcomeMessage();
    }
    
    initializeEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Enter key press
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Input focus for better UX
        this.messageInput.addEventListener('focus', () => {
            this.messageInput.parentElement.style.boxShadow = '6px 6px 0 #000000';
            this.messageInput.parentElement.style.transform = 'translate(-2px, -2px)';
        });
        
        this.messageInput.addEventListener('blur', () => {
            this.messageInput.parentElement.style.boxShadow = '4px 4px 0 #000000';
            this.messageInput.parentElement.style.transform = 'translate(0, 0)';
        });
    }
    
    addWelcomeMessage() {
        const welcomeMessage = {
            type: 'bot',
            content: "Welcome to Macintosh System 7.0. I'm your digital assistant, ready to help you with any questions or tasks. How may I be of service today?"
        };
        this.addMessage(welcomeMessage);
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isProcessing) return;
        
        // Add user message
        this.addMessage({
            type: 'user',
            content: message
        });
        
        // Clear input
        this.messageInput.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        this.isProcessing = true;
        this.sendButton.disabled = true;
        
        try {
            // Send message to backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: this.sessionId
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to get response');
            }
            
            // Store session ID for future requests
            this.sessionId = data.sessionId;
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add bot response
            this.addMessage({
                type: 'bot',
                content: data.response
            });
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            
            // Show error message
            this.addMessage({
                type: 'bot',
                content: `System Error: ${error.message}. Please check your connection and try again.`
            });
        } finally {
            this.isProcessing = false;
            this.sendButton.disabled = false;
        }
    }
    
    
    addMessage(messageData) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${messageData.type}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = messageData.type === 'user' ? '◉' : '◉';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = messageData.content;
        
        messageElement.appendChild(avatar);
        messageElement.appendChild(content);
        
        this.chatMessages.appendChild(messageElement);
        
        // Scroll to bottom
        this.scrollToBottom();
        
        // Add some personality with slight delays for multiple messages
        if (messageData.type === 'bot') {
            messageElement.style.animationDelay = '0.1s';
        }
    }
    
    showTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.className = 'message bot';
        typingElement.id = 'typingIndicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '◉';
        
        const typingContent = document.createElement('div');
        typingContent.className = 'typing-indicator';
        typingContent.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        
        typingElement.appendChild(avatar);
        typingElement.appendChild(typingContent);
        
        this.chatMessages.appendChild(typingElement);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const chatbot = new Chatbot();
    
    // Make chatbot globally accessible for debugging
    window.chatbot = chatbot;
});
