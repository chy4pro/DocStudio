// Notes Management System - Adapted from endless-note
const NotesManager = {
    notes: [],
    selectedNotes: [],
    workspaceNotes: [],
    
    init() {
        // Initialize notes UI elements
        this.notesLibraryBtn = document.getElementById('notesLibraryBtn');
        this.leftSidebar = document.getElementById('leftSidebar');
        this.leftSidebarTitle = document.getElementById('leftSidebarTitle');
        this.leftSidebarContent = document.getElementById('leftSidebarContent');
        this.closeLeftSidebarBtn = document.getElementById('closeLeftSidebarBtn');
        this.notesArea = document.getElementById('notesArea');
        this.addAsNoteBtn = document.getElementById('addAsNoteBtn');
        
        // Load notes from storage
        this.loadNotes();
        this.loadWorkspaceNotes();
        
        // Set up event listeners
        this.notesLibraryBtn.addEventListener('click', this.toggleNotesLibrary.bind(this));
        this.closeLeftSidebarBtn.addEventListener('click', this.closeNotesLibrary.bind(this));
        
        // Extend context menu for notes functionality
        this.extendContextMenu();
        
        // Render workspace notes
        this.renderWorkspaceNotes();
    },
    
    loadNotes() {
        const savedNotes = StorageManager.getNotes();
        if (savedNotes) {
            this.notes = savedNotes;
        }
    },
    
    loadWorkspaceNotes() {
        const savedWorkspaceNotes = StorageManager.getWorkspaceNotes(WorkspaceManager.currentWorkspaceId);
        if (savedWorkspaceNotes) {
            this.workspaceNotes = savedWorkspaceNotes;
        } else {
            this.workspaceNotes = [];
        }
    },
    
    saveNotes() {
        StorageManager.saveNotes(this.notes);
    },
    
    saveWorkspaceNotes() {
        StorageManager.saveWorkspaceNotes(WorkspaceManager.currentWorkspaceId, this.workspaceNotes);
    },
    
    // Toggle notes library visibility
    toggleNotesLibrary() {
        if (this.leftSidebar.classList.contains('hidden')) {
            this.showNotesLibrary();
        } else if (this.leftSidebarTitle.textContent === 'Notes Library') {
            this.closeNotesLibrary();
        } else {
            this.showNotesLibrary();
        }
    },
    
    showNotesLibrary() {
        // If AI chat is in left sidebar, we need to remove it first
        if (this.leftSidebarTitle.textContent === 'AI Chat') {
            ConversationManager.chatPosition = 'floating';
        }
        
        this.leftSidebarTitle.textContent = 'Notes Library';
        this.leftSidebar.classList.remove('hidden');
        this.renderNotesLibrary();
    },
    
    closeNotesLibrary() {
        this.leftSidebar.classList.add('hidden');
    },
    
    renderNotesLibrary() {
        // Create notes library UI
        const notesLibraryHTML = `
            <div class="notes-library">
                <div class="notes-list" id="notesList">
                    ${this.notes.length > 0 ? this.notes.map(note => this.createNoteCardHTML(note)).join('') : '<p>No notes yet. Create a new note or save one from AI chat.</p>'}
                </div>
                
                <div class="notes-actions">
                    ${this.selectedNotes.length > 0 ? 
                        `<button id="addSelectedToWorkspaceBtn" class="button-primary">
                            Add to Workspace (${this.selectedNotes.length})
                        </button>` 
                        : ''}
                </div>
                
                <div class="new-note-form">
                    <textarea id="newNoteInput" class="new-note-input" placeholder="Write a new note..."></textarea>
                    <button id="addNewNoteBtn" class="button-primary">Add</button>
                </div>
            </div>
        `;
        
        this.leftSidebarContent.innerHTML = notesLibraryHTML;
        
        // Set up event listeners for the notes library
        document.getElementById('notesList').addEventListener('click', this.handleNoteClick.bind(this));
        
        if (this.selectedNotes.length > 0) {
            document.getElementById('addSelectedToWorkspaceBtn').addEventListener('click', this.addSelectedNotesToWorkspace.bind(this));
        }
        
        const addNewNoteBtn = document.getElementById('addNewNoteBtn');
        const newNoteInput = document.getElementById('newNoteInput');
        
        addNewNoteBtn.addEventListener('click', () => {
            const content = newNoteInput.value.trim();
            if (content) {
                this.addNote(content, 'user');
                newNoteInput.value = '';
                this.renderNotesLibrary();
            }
        });
    },
    
    createNoteCardHTML(note) {
        const isSelected = this.selectedNotes.includes(note.id);
        const date = new Date(note.createdAt).toLocaleString();
        
        return `
            <div class="note-card ${note.source}-note ${isSelected ? 'selected' : ''}" data-id="${note.id}">
                <div class="note-header">
                    ${note.source === 'user' ? 'Your note' : 'AI note'} • ${date}
                </div>
                <div class="note-content">${note.content}</div>
            </div>
        `;
    },
    
    handleNoteClick(e) {
        const noteCard = e.target.closest('.note-card');
        if (noteCard) {
            const noteId = noteCard.dataset.id;
            this.toggleNoteSelection(noteId);
            this.renderNotesLibrary();
        }
    },
    
    toggleNoteSelection(noteId) {
        const index = this.selectedNotes.indexOf(noteId);
        if (index === -1) {
            this.selectedNotes.push(noteId);
        } else {
            this.selectedNotes.splice(index, 1);
        }
    },
    
    addSelectedNotesToWorkspace() {
        // Get selected notes and add them to workspace
        const notesToAdd = this.notes.filter(note => this.selectedNotes.includes(note.id));
        
        notesToAdd.forEach(note => {
            const workspaceNote = {
                ...note,
                position: this.getNextNotePosition()
            };
            
            this.workspaceNotes.push(workspaceNote);
        });
        
        // Clear selection
        this.selectedNotes = [];
        
        // Save and render
        this.saveWorkspaceNotes();
        this.renderWorkspaceNotes();
        this.renderNotesLibrary();
    },
    
    getNextNotePosition() {
        // Calculate next position based on existing notes
        const columnCount = 3;
        const noteWidth = 240;
        const noteHeight = 160;
        const margin = 20;
        
        const index = this.workspaceNotes.length;
        const row = Math.floor(index / columnCount);
        const col = index % columnCount;
        
        return {
            x: col * (noteWidth + margin) + margin,
            y: row * (noteHeight + margin) + margin
        };
    },
    
    renderWorkspaceNotes() {
        // Clear existing notes
        this.notesArea.innerHTML = '';
        
        // Add each note to the workspace
        this.workspaceNotes.forEach(note => {
            const noteElement = this.createWorkspaceNoteElement(note);
            this.notesArea.appendChild(noteElement);
        });
    },
    
    createWorkspaceNoteElement(note) {
        // Create DOM element for a workspace note
        const noteDiv = document.createElement('div');
        noteDiv.className = `workspace-note ${note.source}-note`;
        noteDiv.dataset.id = note.id;
        noteDiv.style.left = `${note.position.x}px`;
        noteDiv.style.top = `${note.position.y}px`;
        
        const date = new Date(note.createdAt).toLocaleString();
        
        noteDiv.innerHTML = `
            <div class="note-header">
                ${note.source === 'user' ? 'Your note' : 'AI note'} • ${date}
            </div>
            <div class="note-content">${note.content}</div>
            <div class="note-controls">
                <button class="note-control-button remove-note" title="Remove from workspace">×</button>
            </div>
        `;
        
        // Make note draggable
        this.makeNoteDraggable(noteDiv);
        
        // Add event listener for remove button
        noteDiv.querySelector('.remove-note').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeNoteFromWorkspace(note.id);
        });
        
        return noteDiv;
    },
    
    makeNoteDraggable(noteElement) {
        let isDragging = false;
        let offsetX, offsetY;
        
        noteElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - noteElement.getBoundingClientRect().left;
            offsetY = e.clientY - noteElement.getBoundingClientRect().top;
            noteElement.style.zIndex = '10';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const workspaceRect = this.notesArea.getBoundingClientRect();
            let x = e.clientX - workspaceRect.left - offsetX;
            let y = e.clientY - workspaceRect.top - offsetY;
            
            // Keep within bounds
            x = Math.max(0, Math.min(x, workspaceRect.width - noteElement.offsetWidth));
            y = Math.max(0, Math.min(y, workspaceRect.height - noteElement.offsetHeight));
            
            noteElement.style.left = `${x}px`;
            noteElement.style.top = `${y}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            
            isDragging = false;
            noteElement.style.zIndex = '2';
            
            // Update note position in data
            const noteId = noteElement.dataset.id;
            const noteIndex = this.workspaceNotes.findIndex(note => note.id === noteId);
            
            if (noteIndex !== -1) {
                this.workspaceNotes[noteIndex].position = {
                    x: parseInt(noteElement.style.left),
                    y: parseInt(noteElement.style.top)
                };
                
                this.saveWorkspaceNotes();
            }
        });
    },
    
    removeNoteFromWorkspace(noteId) {
        this.workspaceNotes = this.workspaceNotes.filter(note => note.id !== noteId);
        this.saveWorkspaceNotes();
        this.renderWorkspaceNotes();
    },
    
    addNote(content, source) {
        const newNote = {
            id: Date.now().toString(),
            content: content,
            source: source,
            createdAt: new Date().toISOString()
        };
        
        this.notes.unshift(newNote); // Add to beginning of array
        this.saveNotes();
        
        return newNote;
    },
    
    extendContextMenu() {
        // Add functionality to save selected text as a note
        if (this.addAsNoteBtn) {
            this.addAsNoteBtn.addEventListener('click', () => {
                const selection = window.getSelection();
                if (selection.toString().length > 0) {
                    this.addNote(selection.toString(), 'user');
                    document.getElementById('contextMenu').style.display = 'none';
                    
                    // If notes library is open, refresh it
                    if (!this.leftSidebar.classList.contains('hidden') && 
                        this.leftSidebarTitle.textContent === 'Notes Library') {
                        this.renderNotesLibrary();
                    }
                }
            });
        }
    },
    
    // Handle workspace change
    handleWorkspaceChange(workspaceId) {
        // Save current workspace notes
        this.saveWorkspaceNotes();
        
        // Load notes for the new workspace
        this.loadWorkspaceNotes();
        
        // Render notes for the new workspace
        this.renderWorkspaceNotes();
    }
};

// Extend StorageManager with methods for notes
StorageManager.saveNotes = function(notes) {
    localStorage.setItem('notes', JSON.stringify(notes));
};

StorageManager.getNotes = function() {
    const notes = localStorage.getItem('notes');
    return notes ? JSON.parse(notes) : [];
};

StorageManager.saveWorkspaceNotes = function(workspaceId, notes) {
    localStorage.setItem(`workspace_notes_${workspaceId}`, JSON.stringify(notes));
};

StorageManager.getWorkspaceNotes = function(workspaceId) {
    const notes = localStorage.getItem(`workspace_notes_${workspaceId}`);
    return notes ? JSON.parse(notes) : [];
};
