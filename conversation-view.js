class ConversationView {
    constructor() {
        this.conversationMessages = document.getElementById('conversationMessages');
        this.conversationTitle = document.getElementById('conversationTitle');
        this.conversationSubtitle = document.getElementById('conversationSubtitle');
        this.messageCount = document.getElementById('messageCount');
        this.conversationDate = document.getElementById('conversationDate');
        
        this.sessionId = this.getSessionIdFromURL();
        
        if (this.sessionId) {
            this.loadConversation();
        } else {
            this.showError('No conversation ID provided');
        }
    }
    
    getSessionIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('sessionId');
    }
    
    async loadConversation() {
        try {
            this.showLoading();
            
            const response = await fetch(`/api/conversation/${this.sessionId}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to load conversation');
            }
            
            this.displayConversation(data);
            
        } catch (error) {
            console.error('Error loading conversation:', error);
            this.showError('Failed to load conversation. Please try again.');
        }
    }
    
    displayConversation(conversation) {
        // Update header information
        this.conversationTitle.textContent = `CONVERSATION ${conversation.sessionId.slice(-8)}`;
        this.conversationSubtitle.textContent = `System 7.0 - ${conversation.messages.length} messages`;
        
        // Update footer information
        this.messageCount.textContent = `${conversation.messages.length} message${conversation.messages.length !== 1 ? 's' : ''}`;
        this.conversationDate.textContent = this.formatDate(new Date(conversation.createdAt));
        
        // Display messages
        this.displayMessages(conversation.messages);
    }
    
    displayMessages(messages) {
        // Filter out system messages for display
        const displayMessages = messages.filter(msg => msg.role !== 'system');
        
        if (displayMessages.length === 0) {
            this.conversationMessages.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💬</div>
                    <h3>No messages in this conversation</h3>
                    <p>This conversation appears to be empty</p>
                </div>
            `;
            return;
        }
        
        const messagesHTML = displayMessages.map((message, index) => {
            const messageType = message.role === 'user' ? 'user' : 'bot';
            const timestamp = this.formatMessageTime(new Date());
            
            return `
                <div class="message ${messageType}">
                    <div class="message-avatar">
                        ${messageType === 'user' ? '◉' : '◉'}
                    </div>
                    <div class="message-content">
                        <div class="message-text">${this.escapeHtml(message.content)}</div>
                        <div class="message-timestamp">${timestamp}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        this.conversationMessages.innerHTML = messagesHTML;
        
        // Scroll to bottom
        this.scrollToBottom();
    }
    
    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    formatMessageTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    scrollToBottom() {
        this.conversationMessages.scrollTop = this.conversationMessages.scrollHeight;
    }
    
    showLoading() {
        this.conversationMessages.innerHTML = `
            <div class="loading-message">
                <div class="loading-spinner"></div>
                <p>Loading conversation...</p>
            </div>
        `;
    }
    
    showError(message) {
        this.conversationMessages.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Error</h3>
                <p>${message}</p>
                <button class="retry-button" onclick="window.location.reload()">Retry</button>
            </div>
        `;
    }
}

// Initialize conversation view when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const conversationView = new ConversationView();
    
    // Make conversation view globally accessible for debugging
    window.conversationView = conversationView;
});
