// Main application entry point
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    StorageManager.init();
    DebugTools.init();
    LLMApi.init();
    NotesManager.init();
    ConversationManager.init();
    WorkspaceManager.init();
    DocumentManager.init();
    
    // Set default positions: notes on left, AI chat on right
    NotesManager.setNotesPosition('left');
    ConversationManager.setChatPosition('right');
    
    // Initialize context menu and settings modal
    initContextMenu();
    initSettingsModal();
    initDisplayOverlay();
    
    // Hide document section initially
    document.getElementById('documentSection').style.display = 'none';
});

// Context menu for selected text
function initContextMenu() {
    const contextMenu = document.getElementById('contextMenu');
    const addToWorkspaceBtn = document.getElementById('addToWorkspaceBtn');
    const addAsNoteBtn = document.getElementById('addAsNoteBtn');
    
    // Show context menu on text selection
    document.addEventListener('mouseup', e => {
        const selection = window.getSelection();
        
        if (selection.toString().length > 0) {
            contextMenu.style.display = 'block';
            contextMenu.style.left = `${e.pageX}px`;
            contextMenu.style.top = `${e.pageY}px`;
        }
    });
    
    // Hide context menu when clicking elsewhere
    document.addEventListener('mousedown', e => {
        if (!e.target.closest('#contextMenu')) {
            contextMenu.style.display = 'none';
        }
    });
    
    // Add selected text to workspace
    addToWorkspaceBtn.addEventListener('click', () => {
        const selection = window.getSelection();
        if (selection.toString().length > 0) {
            WorkspaceManager.addToWorkspace(selection.toString());
            contextMenu.style.display = 'none';
        }
    });
    
    // Add selected text as note is handled in NotesManager.extendContextMenu()
}

// Display overlay functionality
function initDisplayOverlay() {
    const displayOverlay = document.getElementById('displayOverlay');
    const closeDisplayBtn = document.getElementById('closeDisplayBtn');
    const openDisplayInNewWindowBtn = document.getElementById('openDisplayInNewWindowBtn');
    
    if (!displayOverlay || !closeDisplayBtn || !openDisplayInNewWindowBtn) return;
    
    closeDisplayBtn.addEventListener('click', () => {
        displayOverlay.classList.add('hidden');
    });
    
    openDisplayInNewWindowBtn.addEventListener('click', () => {
        const content = document.getElementById('displayContent').innerHTML;
        openContentInNewWindow(content);
    });
}

// Open content in a new window
function openContentInNewWindow(content) {
    const newWindow = window.open('', '_blank');
    
    if (!newWindow) {
        alert('Your browser blocked opening a new window. Please allow popups for this site.');
        return;
    }
    
    newWindow.document.open();
    newWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>DocStudio - Generated Content</title>
            <style>
                body {
                    font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
                    line-height: 1.5;
                    color: #1a1a2e;
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 20px;
                }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>
    `);
    newWindow.document.close();
    newWindow.focus();
}

// Settings modal functionality
function initSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeBtn = document.querySelector('.close');
    const saveBtn = document.getElementById('saveSettingsBtn');
    const testBtn = document.getElementById('testConnectionBtn');
    
    // Advanced settings elements
    const showAdvancedSettings = document.getElementById('showAdvancedSettings');
    const advancedSettingsPanel = document.getElementById('advancedSettingsPanel');
    const debugMode = document.getElementById('debugMode');
    const requestFormat = document.getElementById('requestFormat');
    const customFormatFields = document.getElementById('customFormatFields');
    
    // Load existing settings into form
    document.getElementById('apiEndpoint').value = LLMApi.getEndpoint();
    document.getElementById('apiKey').value = LLMApi.getApiKey();
    document.getElementById('modelName').value = LLMApi.getModel();
    
    // Load debug mode state
    debugMode.checked = DebugTools.enabled;
    
    // Event handlers
    const toggleModal = (display) => modal.style.display = display;
    
    // Open modal
    settingsBtn.addEventListener('click', () => toggleModal('block'));
    
    // Close modal
    closeBtn.addEventListener('click', () => toggleModal('none'));
    
    // Close modal when clicking outside
    window.addEventListener('click', e => {
        if (e.target === modal) toggleModal('none');
    });
    
    // Show/hide advanced settings
    showAdvancedSettings.addEventListener('change', function() {
        advancedSettingsPanel.style.display = this.checked ? 'block' : 'none';
    });
    
    // Toggle debug mode
    debugMode.addEventListener('change', function() {
        DebugTools.setEnabled(this.checked);
    });
    
    // Toggle custom format fields
    requestFormat.addEventListener('change', function() {
        customFormatFields.style.display = this.value === 'custom' ? 'block' : 'none';
    });
    
    // Save settings
    saveBtn.addEventListener('click', () => {
        const endpoint = document.getElementById('apiEndpoint').value;
        const apiKey = document.getElementById('apiKey').value;
        const model = document.getElementById('modelName').value;
        
        LLMApi.setEndpoint(endpoint);
        LLMApi.setApiKey(apiKey);
        LLMApi.setModel(model);
        
        // Save custom request format if selected
        if (requestFormat.value === 'custom') {
            const customTemplate = document.getElementById('customRequestTemplate').value;
            LLMApi.setCustomRequestTemplate(customTemplate);
        }
        
        toggleModal('none');
        alert('Settings saved successfully!');
    });
    
    // Test connection
    testBtn.addEventListener('click', async function() {
        const endpoint = document.getElementById('apiEndpoint').value;
        const apiKey = document.getElementById('apiKey').value;
        const model = document.getElementById('modelName').value;
        
        this.disabled = true;
        this.textContent = 'Testing...';
        
        try {
            await LLMApi.testConnection(endpoint, apiKey, model);
            alert('Connection successful! The API is working properly.');
        } catch (error) {
            alert(`Connection failed: ${error.message}`);
        } finally {
            this.disabled = false;
            this.textContent = 'Test Connection';
        }
    });
}
