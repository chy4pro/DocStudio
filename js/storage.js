// Local storage management
const StorageManager = {
    init() {
        // Check if localStorage is available
        if (!this.isStorageAvailable()) {
            console.error('localStorage is not available in this browser');
            alert('Your browser does not support local storage. Some features may not work properly.');
        }
    },
    
    isStorageAvailable() {
        try {
            const x = '__storage_test__';
            localStorage.setItem(x, x);
            localStorage.removeItem(x);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    // Conversation storage methods
    saveConversation(conversationData) {
        try {
            localStorage.setItem('conversation', JSON.stringify(conversationData));
            console.log("Conversation saved successfully:", conversationData);
        } catch (error) {
            console.error("Error saving conversation:", error);
        }
    },
    
    getConversation() {
        try {
            const data = localStorage.getItem('conversation');
            if (!data) return [];
            
            const parsed = JSON.parse(data);
            console.log("Retrieved conversation data:", parsed);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error("Error retrieving conversation:", error);
            return [];
        }
    },
    
    // Workspace storage methods
    saveWorkspaces(workspacesList) {
        localStorage.setItem('workspaces', JSON.stringify(workspacesList));
    },
    
    getWorkspaces() {
        const workspaces = localStorage.getItem('workspaces');
        return workspaces ? JSON.parse(workspaces) : null;
    },
    
    saveWorkspaceContent(workspaceId, content) {
        localStorage.setItem(`workspace_${workspaceId}`, content);
    },
    
    getWorkspaceContent(workspaceId) {
        return localStorage.getItem(`workspace_${workspaceId}`);
    },
    
    // Document storage methods
    saveDocument(content) {
        localStorage.setItem('currentDocument', content);
    },
    
    getDocument() {
        return localStorage.getItem('currentDocument');
    },
    
    // API settings storage
    saveApiSettings(endpoint, apiKey, model, customRequestTemplate) {
        const settings = {
            endpoint,
            apiKey,
            model
        };
        
        Object.entries(settings).forEach(([key, value]) => {
            localStorage.setItem(`api_${key}`, value);
        });
        
        if (customRequestTemplate) {
            localStorage.setItem('api_custom_template', customRequestTemplate);
        }
    },
    
    getCustomRequestTemplate() {
        return localStorage.getItem('api_custom_template') || null;
    },
    
    getApiEndpoint() {
        return localStorage.getItem('api_endpoint') || 'https://api.openai.com/v1/chat/completions';
    },
    
    getApiKey() {
        return localStorage.getItem('api_key') || '';
    },
    
    getApiModel() {
        return localStorage.getItem('api_model') || 'gpt-3.5-turbo';
    },
    
    // Clear all storage
    clearStorage() {
        localStorage.clear();
    }
};
