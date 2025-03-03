// Workspace management
const WorkspaceManager = {
    currentWorkspaceId: 'workspace1',
    workspaces: ['workspace1'],
    
    init() {
        // Initialize workspace UI elements
        this.workspaceTabs = document.getElementById('workspaceTabs');
        this.newWorkspaceBtn = document.getElementById('newWorkspaceBtn');
        this.generateDocBtn = document.getElementById('generateDocBtn');
        this.workspaceArea = document.getElementById('workspaceArea');
        this.notesArea = document.getElementById('notesArea');
        this.generatePrompt = document.getElementById('generatePrompt');
        
        // Display overlay elements
        this.displayOverlay = document.getElementById('displayOverlay');
        this.displayContent = document.getElementById('displayContent');
        
        // Set up basic text editor
        this.initEditor();
        
        // Load workspaces from storage
        this.loadWorkspaces();
        
        // Set up event listeners
        this.newWorkspaceBtn.addEventListener('click', this.createNewWorkspace.bind(this));
        this.generateDocBtn.addEventListener('click', this.generateContent.bind(this));
        this.workspaceTabs.addEventListener('click', this.handleTabClick.bind(this));
    },
    
    initEditor() {
        // Initialize basic text editor without formatting tools
        this.editor = document.getElementById('editor');
        // Convert the editor div to a textarea if it isn't already
        if (this.editor.tagName !== 'TEXTAREA') {
            const textarea = document.createElement('textarea');
            textarea.id = 'editor';
            textarea.className = 'workspace-editor';
            this.editor.parentNode.replaceChild(textarea, this.editor);
            this.editor = textarea;
        }
        this.editor.addEventListener('input', () => this.saveCurrentWorkspace());
    },
    
    loadWorkspaces() {
        const savedWorkspaces = StorageManager.getWorkspaces();
        if (savedWorkspaces?.length > 0) {
            this.workspaces = savedWorkspaces;
            this.renderWorkspaceTabs();
            
            // Set the current workspace ID first
            this.currentWorkspaceId = this.workspaces[0];
            
            // Then load the content for this workspace
            this.loadWorkspaceContent(this.workspaces[0]);
            
            // Also notify NotesManager about the workspace change
            if (NotesManager) {
                NotesManager.handleWorkspaceChange(this.currentWorkspaceId);
            }
            
            console.log(`Initialized with workspace: ${this.currentWorkspaceId}`);
        } else {
            // Create a default workspace if none exists
            this.currentWorkspaceId = 'workspace1';
            this.workspaces = [this.currentWorkspaceId];
            console.log(`Created default workspace: ${this.currentWorkspaceId}`);
            this.saveCurrentWorkspace();
        }
    },
    
    renderWorkspaceTabs() {
        // Clear existing tabs (except the "New" button)
        this.workspaceTabs.querySelectorAll('.tab:not(.new-tab)').forEach(tab => tab.remove());
        
        // Create a tab for each workspace
        this.workspaces.forEach(workspaceId => {
            const tab = document.createElement('button');
            tab.classList.add('tab');
            tab.dataset.id = workspaceId;
            tab.textContent = workspaceId;
            
            if (workspaceId === this.currentWorkspaceId) {
                tab.classList.add('active');
            }
            
            // Insert before the "New" button
            this.workspaceTabs.insertBefore(tab, this.newWorkspaceBtn);
        });
    },
    
    handleTabClick(e) {
        const { target } = e;
        if (target.classList.contains('tab') && !target.classList.contains('new-tab')) {
            // Save current workspace before switching
            this.saveCurrentWorkspaceIfNeeded();
            
            // Get new workspace ID
            const workspaceId = target.dataset.id;
            
            // Update the current workspace ID first
            this.currentWorkspaceId = workspaceId;
            
            // Update the UI
            this.updateActiveTab(target);
            
            // Then load the content for this workspace
            this.loadWorkspaceContent(workspaceId);
            
            // Also notify NotesManager about the workspace change
            if (NotesManager) {
                NotesManager.handleWorkspaceChange(workspaceId);
            }
            
            console.log(`Switched to workspace: ${workspaceId}`);
        }
    },

    saveCurrentWorkspaceIfNeeded() {
        if (this.currentWorkspaceId) {
            this.saveCurrentWorkspace();
        }
    },

    updateActiveTab(activeTab) {
        this.workspaceTabs.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        activeTab.classList.add('active');
    },
    
    loadWorkspaceContent(workspaceId) {
        console.log(`Loading content for workspace: ${workspaceId}`);
        const content = StorageManager.getWorkspaceContent(workspaceId);
        console.log(`Content found: ${content ? 'yes' : 'no'}, length: ${content ? content.length : 0}`);
        
        // Set plain text content
        this.editor.value = content || '';
        
        // Load notes for this workspace (handled by NotesManager)
    },
    
    createNewWorkspace() {
        // Save current workspace before creating a new one
        this.saveCurrentWorkspaceIfNeeded();
        
        // Create new workspace ID
        const newId = `workspace${this.workspaces.length + 1}`;
        this.workspaces.push(newId);
        
        // Update current workspace ID first
        this.currentWorkspaceId = newId;
        
        // Save workspaces list
        StorageManager.saveWorkspaces(this.workspaces);
        
        // Render tabs
        this.renderWorkspaceTabs();
        
        // Clear editor for new workspace
        this.editor.value = '';
        
        // Explicitly save the empty state
        this.saveCurrentWorkspace();
        
        // Update active tab
        this.workspaceTabs.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.id === newId) {
                tab.classList.add('active');
            }
        });
        
        // Notify NotesManager about the workspace change
        if (NotesManager) {
            NotesManager.handleWorkspaceChange(newId);
        }
        
        console.log(`Created new workspace: ${newId}`);
    },
    
    saveCurrentWorkspace() {
        const content = this.editor.value;
        console.log(`Saving workspace ${this.currentWorkspaceId}. Content length: ${content.length}`);
        StorageManager.saveWorkspaceContent(this.currentWorkspaceId, content);
        StorageManager.saveWorkspaces(this.workspaces);
    },
    
    addToWorkspace(text) {
        // Insert text at cursor position or at the end
        if (typeof this.editor.selectionStart === 'number') {
            const startPos = this.editor.selectionStart;
            const endPos = this.editor.selectionEnd;
            const beforeText = this.editor.value.substring(0, startPos);
            const afterText = this.editor.value.substring(endPos);
            this.editor.value = beforeText + text + afterText;
            this.editor.selectionStart = this.editor.selectionEnd = startPos + text.length;
        } else {
            // Fallback if selection isn't supported
            this.editor.value += text;
        }
        this.saveCurrentWorkspace();
    },
    
    // Generate content for display overlay (preview before document generation)
    generateContent() {
        // Get prompt if provided, or use a default
        const prompt = this.generatePrompt.value.trim() || 'Generate document';
        
        // Get text content and notes
        const textContent = this.editor.value;
        const workspaceNotes = NotesManager ? NotesManager.workspaceNotes : [];
        
        // Save current workspace
        this.saveCurrentWorkspaceIfNeeded();
        
        // Generate HTML content for display
        this.generateDisplayContent(textContent, workspaceNotes, prompt);
    },
    
    generateDisplayContent(text, notes, prompt) {
        // Create HTML for display preview
        const notesHTML = notes.length > 0 
            ? `
                <h3 style="margin-top: 20px;">Notes</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 16px;">
                    ${notes.map(note => `
                        <div style="background: ${note.source === 'user' ? '#fef9c3' : '#dbeafe'}; padding: 16px; border-radius: 8px;">
                            <div style="font-size: 0.75rem; color: #666; margin-bottom: 4px;">
                                ${note.source === 'user' ? 'Your note' : 'AI note'} • ${new Date(note.createdAt).toLocaleString()}
                            </div>
                            <div style="font-size: 0.875rem;">${note.content}</div>
                        </div>
                    `).join('')}
                </div>
            `
            : '';
            
        const displayHTML = `
            <div style="font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto;">
                <h1 style="color: #333;">Preview Content</h1>
                <p>Generated based on your workspace and prompt:</p>
                <blockquote style="background: #f9f9f9; border-left: 4px solid #ccc; margin: 1.5em 0; padding: 1em;">
                    ${prompt}
                </blockquote>
                
                <div style="margin-top: 20px;">
                    <h2>Workspace Content</h2>
                    <div style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 10px;">
                        ${text || '<em>No text content</em>'}
                    </div>
                    ${notesHTML}
                </div>
                
                <div style="margin-top: 30px; display: flex; justify-content: space-between;">
                    <button id="proceedToDocumentBtn" style="background-color: #4361ee; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                        Proceed to Document Generation
                    </button>
                    <button id="returnToEditBtn" style="background-color: transparent; border: 1px solid #4361ee; color: #4361ee; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                        Return to Edit
                    </button>
                </div>
            </div>
        `;
        
        // Show the content in the display overlay
        this.displayContent.innerHTML = displayHTML;
        this.displayOverlay.classList.remove('hidden');
        
        // Add event listeners to buttons
        setTimeout(() => {
            const proceedBtn = document.getElementById('proceedToDocumentBtn');
            const returnBtn = document.getElementById('returnToEditBtn');
            
            if (proceedBtn) {
                proceedBtn.addEventListener('click', () => {
                    this.displayOverlay.classList.add('hidden');
                    this.generateDocument(text, notes);
                });
            }
            
            if (returnBtn) {
                returnBtn.addEventListener('click', () => {
                    this.displayOverlay.classList.add('hidden');
                });
            }
        }, 0);
    },
    
    generateDocument(text, notes) {
        // Combine text and notes into a complete document for generation
        let fullContent = text || '';
        
        // Add notes content if available
        if (notes && notes.length > 0) {
            fullContent += '\n\n--- Notes ---\n';
            notes.forEach(note => {
                fullContent += `\n[${note.source === 'user' ? 'Your note' : 'AI note'}]: ${note.content}\n`;
            });
        }
        
        // Send to document manager for generation
        DocumentManager.generateDocument(fullContent);
    }
};
