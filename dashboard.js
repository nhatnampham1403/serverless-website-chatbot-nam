class ConversationDashboard {
    constructor() {
        this.conversationsList = document.getElementById('conversationsList');
        this.conversationCount = document.getElementById('conversationCount');
        this.refreshButton = document.getElementById('refreshButton');
        
        this.initializeEventListeners();
        this.loadConversations();
    }
    
    initializeEventListeners() {
        // Refresh button
        this.refreshButton.addEventListener('click', () => this.loadConversations());
        
        // Auto-refresh every 30 seconds
        setInterval(() => this.loadConversations(), 30000);
    }
    
    async loadConversations() {
        try {
            this.showLoading();
            
            const response = await fetch('/api/sessions');
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to load conversations');
            }
            
            this.displayConversations(data.sessions);
            
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.showError('Failed to load conversations. Please try again.');
        }
    }
    
    displayConversations(conversations) {
        if (conversations.length === 0) {
            this.conversationsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <h3>No conversations yet</h3>
                    <p>Start chatting to see your conversations here</p>
                    <a href="/" class="start-chat-button">Start New Chat</a>
                </div>
            `;
            this.conversationCount.textContent = '0 conversations';
            return;
        }
        
        // Sort conversations by most recent first (client-side fallback)
        const sortedConversations = conversations.sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt);
            const dateB = new Date(b.updatedAt || b.createdAt);
            return dateB - dateA; // Most recent first
        });
        
        this.conversationCount.textContent = `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`;
        
        const conversationsHTML = sortedConversations.map(conversation => {
            const createdAt = new Date(conversation.createdAt);
            const timeAgo = this.getTimeAgo(createdAt);
            const preview = this.getConversationPreview(conversation);
            
            return `
                <div class="conversation-item" data-session-id="${conversation.sessionId}">
                    <div class="conversation-header">
                        <div class="conversation-info">
                            <h3>Session ${conversation.sessionId.slice(-8)}</h3>
                            <p class="conversation-time">${timeAgo}</p>
                        </div>
                        <div class="conversation-stats">
                            <span class="message-count">${conversation.messageCount} messages</span>
                        </div>
                    </div>
                    <div class="conversation-preview">
                        <p>${preview}</p>
                    </div>
                    <div class="conversation-actions">
                        <button class="view-button" onclick="window.location.href='/conversation-view.html?sessionId=${conversation.sessionId}'">
                            View Conversation
                        </button>
                        <button class="analyze-button" onclick="dashboard.analyzeLead('${conversation.sessionId}')" ${conversation.leadAnalysis ? 'disabled' : ''}>
                            ${conversation.leadAnalysis ? 'Analyzed' : 'Analyze Lead'}
                        </button>
                        <button class="delete-button" onclick="dashboard.deleteConversation('${conversation.sessionId}')">
                            Delete
                        </button>
                    </div>
                    ${conversation.leadAnalysis ? `
                        <div class="lead-analysis" id="lead-${conversation.sessionId}">
                            ${this.renderLeadAnalysis(conversation.leadAnalysis)}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        this.conversationsList.innerHTML = conversationsHTML;
    }
    
    getConversationPreview(conversation) {
        if (conversation.messageCount === 0) {
            return 'No messages yet';
        } else if (conversation.preview && conversation.preview !== 'No messages yet') {
            return conversation.preview;
        } else {
            return `${conversation.messageCount} message${conversation.messageCount !== 1 ? 's' : ''}`;
        }
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        }
    }
    
    showLoading() {
        this.conversationsList.innerHTML = `
            <div class="loading-message">
                <div class="loading-spinner"></div>
                <p>Loading conversations...</p>
            </div>
        `;
    }
    
    showError(message) {
        this.conversationsList.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Error</h3>
                <p>${message}</p>
                <button class="retry-button" onclick="window.location.reload()">Retry</button>
            </div>
        `;
    }
    
    async deleteConversation(sessionId) {
        // Show confirmation dialog
        const confirmed = confirm(`Are you sure you want to delete this conversation? This action cannot be undone.`);
        
        if (!confirmed) {
            return;
        }
        
        try {
            const response = await fetch(`/api/conversation/${sessionId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete conversation');
            }
            
            // Show success message briefly
            this.showSuccessMessage('Conversation deleted successfully');
            
            // Reload conversations
            await this.loadConversations();
            
        } catch (error) {
            console.error('Error deleting conversation:', error);
            this.showError('Failed to delete conversation. Please try again.');
        }
    }
    
    showSuccessMessage(message) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <div class="success-content">
                <span class="success-icon">✓</span>
                <span>${message}</span>
            </div>
        `;
        
        // Add to the top of the dashboard content
        const dashboardContent = document.querySelector('.dashboard-content');
        dashboardContent.insertBefore(successDiv, dashboardContent.firstChild);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }
    
    async analyzeLead(sessionId) {
        try {
            // Show loading state
            const analyzeButton = document.querySelector(`button[onclick="dashboard.analyzeLead('${sessionId}')"]`);
            if (analyzeButton) {
                analyzeButton.disabled = true;
                analyzeButton.textContent = 'Analyzing...';
            }
            
            const response = await fetch(`/api/conversation/${sessionId}/analyze-lead`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze lead');
            }
            
            // Show success message
            this.showSuccessMessage('Lead analysis completed successfully');
            
            // Display the lead analysis
            this.displayLeadAnalysis(sessionId, data.leadAnalysis);
            
            // Update button state
            if (analyzeButton) {
                analyzeButton.textContent = 'Analyzed';
                analyzeButton.classList.add('analyzed');
            }
            
        } catch (error) {
            console.error('Error analyzing lead:', error);
            this.showError('Failed to analyze lead. Please try again.');
            
            // Reset button state
            const analyzeButton = document.querySelector(`button[onclick="dashboard.analyzeLead('${sessionId}')"]`);
            if (analyzeButton) {
                analyzeButton.disabled = false;
                analyzeButton.textContent = 'Analyze Lead';
            }
        }
    }
    
    displayLeadAnalysis(sessionId, leadAnalysis) {
        // Find the conversation item
        const conversationItem = document.querySelector(`[data-session-id="${sessionId}"]`);
        if (!conversationItem) return;
        
        // Check if lead analysis already exists
        let leadDiv = conversationItem.querySelector('.lead-analysis');
        if (!leadDiv) {
            // Create new lead analysis div
            leadDiv = document.createElement('div');
            leadDiv.className = 'lead-analysis';
            leadDiv.id = `lead-${sessionId}`;
            conversationItem.appendChild(leadDiv);
        }
        
        // Render the lead analysis
        leadDiv.innerHTML = this.renderLeadAnalysis(leadAnalysis);
        
        // Wait a moment for the DOM to update, then scroll
        setTimeout(() => {
            // Calculate the position to scroll to
            const leadDivRect = leadDiv.getBoundingClientRect();
            const dashboardContent = document.querySelector('.dashboard-content');
            const dashboardRect = dashboardContent.getBoundingClientRect();
            
            // Calculate the scroll position to center the lead analysis
            const scrollTop = leadDivRect.top + window.pageYOffset - dashboardRect.top - 50;
            
            // Smooth scroll to the lead analysis
            window.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
            });
            
            // Add a subtle highlight effect
            leadDiv.style.boxShadow = '0 0 20px rgba(74, 144, 226, 0.3)';
            leadDiv.style.borderColor = '#4a90e2';
            setTimeout(() => {
                leadDiv.style.boxShadow = '';
                leadDiv.style.borderColor = '';
            }, 2000);
        }, 100);
    }
    
    renderLeadAnalysis(leadAnalysis) {
        const qualityClass = leadAnalysis.leadQuality === 'good' ? 'good' : 
                           leadAnalysis.leadQuality === 'ok' ? 'ok' : 'spam';
        
        return `
            <div class="lead-analysis-content">
                <div class="lead-header">
                    <h4>Lead Analysis</h4>
                    <span class="lead-quality ${qualityClass}">${leadAnalysis.leadQuality.toUpperCase()}</span>
                </div>
                <div class="lead-details">
                    <div class="lead-row">
                        <span class="lead-label">Name:</span>
                        <span class="lead-value">${leadAnalysis.customerName || 'Not provided'}</span>
                    </div>
                    <div class="lead-row">
                        <span class="lead-label">Email:</span>
                        <span class="lead-value">${leadAnalysis.customerEmail || 'Not provided'}</span>
                    </div>
                    <div class="lead-row">
                        <span class="lead-label">Phone:</span>
                        <span class="lead-value">${leadAnalysis.customerPhone || 'Not provided'}</span>
                    </div>
                    <div class="lead-row">
                        <span class="lead-label">Industry:</span>
                        <span class="lead-value">${leadAnalysis.customerIndustry || 'Not specified'}</span>
                    </div>
                    <div class="lead-row">
                        <span class="lead-label">Problems/Needs:</span>
                        <span class="lead-value">${leadAnalysis.customerProblem || 'Not specified'}</span>
                    </div>
                    <div class="lead-row">
                        <span class="lead-label">Availability:</span>
                        <span class="lead-value">${leadAnalysis.customerAvailability || 'Not specified'}</span>
                    </div>
                    <div class="lead-row">
                        <span class="lead-label">Consultation Booked:</span>
                        <span class="lead-value">${leadAnalysis.customerConsultation ? 'Yes' : 'No'}</span>
                    </div>
                    ${leadAnalysis.specialNotes ? `
                        <div class="lead-row">
                            <span class="lead-label">Special Notes:</span>
                            <span class="lead-value">${leadAnalysis.specialNotes}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new ConversationDashboard();
    
    // Make dashboard globally accessible for debugging
    window.dashboard = dashboard;
});
