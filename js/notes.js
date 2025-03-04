// Notes Management System - Adapted from endless-note
const NotesManager = {
    notes: [],
    selectedNotes: [],
    workspaceNotes: [],
    notesPosition: 'hidden', // 'hidden', 'left', 'right'
    
    init() {
        // Initialize notes UI elements
        this.notesLibraryBtn = document.getElementById('notesLibraryBtn');
        
        // 左侧笔记面板
        this.leftNotesLibrary = document.getElementById('leftNotesLibrary');
        this.leftNotesLibraryContent = document.getElementById('leftNotesLibraryContent');
        this.closeNotesLibraryBtn = document.getElementById('closeNotesLibraryBtn');
        this.switchNotesToRightBtn = document.getElementById('switchNotesToRightBtn');
        
        // 右侧笔记面板
        this.rightNotesLibrary = document.getElementById('rightNotesLibrary');
        this.rightNotesLibraryContent = document.getElementById('rightNotesLibraryContent');
        this.closeRightNotesLibraryBtn = document.getElementById('closeRightNotesLibraryBtn');
        this.switchNotesToLeftBtn = document.getElementById('switchNotesToLeftBtn');
        
        // 左右侧边栏区域
        this.leftSidebarArea = document.getElementById('leftSidebarArea');
        this.rightSidebarArea = document.getElementById('rightSidebarArea');
        
        this.notesArea = document.getElementById('notesArea');
        this.addAsNoteBtn = document.getElementById('addAsNoteBtn');
        
        // Load notes from storage
        this.loadNotes();
        this.loadWorkspaceNotes();
        
        // Set up event listeners
        this.notesLibraryBtn.addEventListener('click', this.toggleNotesLibrary.bind(this));
        this.closeNotesLibraryBtn.addEventListener('click', () => this.closeNotes('left'));
        this.closeRightNotesLibraryBtn.addEventListener('click', () => this.closeNotes('right'));
        
        // 添加位置切换按钮的事件监听器
        this.switchNotesToRightBtn?.addEventListener('click', () => this.setNotesPosition('right'));
        this.switchNotesToLeftBtn?.addEventListener('click', () => this.setNotesPosition('left'));
        
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
        if (this.notesPosition === 'hidden') {
            this.setNotesPosition('right');
        } else {
            this.closeNotes(this.notesPosition);
        }
    },
    
    setNotesPosition(position) {
        console.log("setNotesPosition called with position:", position);
        
        try {
            // 保存当前内容以确保在位置切换时不丢失
            const currentContent = this.notes;
            
            // 检查AI聊天是否在同一侧，用于处理多面板情况
            const isAIChatOnSameSide = (position === 'left' && ConversationManager.chatPosition === 'left') || 
                                       (position === 'right' && ConversationManager.chatPosition === 'right');
            
            // 如果切换位置，先隐藏当前位置
            if (this.notesPosition === 'left' && position === 'right') {
                this.leftNotesLibrary.classList.add('hidden');
                // 如果左侧没有其他可见组件，移除标记类
                if (!this.leftSidebarArea.querySelector('.sidebar:not(.hidden)')) {
                    this.leftSidebarArea.classList.remove('has-visible-sidebar');
                    this.leftSidebarArea.classList.remove('has-multiple-sidebars');
                }
            } else if (this.notesPosition === 'right' && position === 'left') {
                this.rightNotesLibrary.classList.add('hidden');
                // 如果右侧没有其他可见组件，移除标记类
                if (!this.rightSidebarArea.querySelector('.sidebar:not(.hidden)')) {
                    this.rightSidebarArea.classList.remove('has-visible-sidebar');
                    this.rightSidebarArea.classList.remove('has-multiple-sidebars');
                }
            }
            
            this.notesPosition = position;
            
            // 根据位置设置显示
            if (position === 'left') {
                this.leftNotesLibrary.classList.remove('hidden');
                this.leftSidebarArea.classList.add('has-visible-sidebar');
                
                // 如果AI聊天也在左侧，添加多面板标记
                if (isAIChatOnSameSide) {
                    this.leftSidebarArea.classList.add('has-multiple-sidebars');
                }
                
                // 确保内容正确渲染
                this.renderNotesLibraryInContainer(this.leftNotesLibraryContent);
            } else if (position === 'right') {
                this.rightNotesLibrary.classList.remove('hidden');
                this.rightSidebarArea.classList.add('has-visible-sidebar');
                
                // 如果AI聊天也在右侧，添加多面板标记
                if (isAIChatOnSameSide) {
                    this.rightSidebarArea.classList.add('has-multiple-sidebars');
                }
                
                // 确保内容正确渲染
                this.renderNotesLibraryInContainer(this.rightNotesLibraryContent);
            }
            
            // 如果之前显示内容是空的，确保使用保存的内容重新渲染
            if (this.notes.length === 0 && currentContent.length > 0) {
                this.notes = currentContent;
                
                if (position === 'left') {
                    this.renderNotesLibraryInContainer(this.leftNotesLibraryContent);
                } else if (position === 'right') {
                    this.renderNotesLibraryInContainer(this.rightNotesLibraryContent);
                }
            }
        } catch (error) {
            console.error("Error in setNotesPosition:", error);
        }
    },
    
    closeNotes(position) {
        // 隐藏指定位置的笔记面板
        if (position === 'left') {
            this.leftNotesLibrary.classList.add('hidden');
            
            // 检查是否还有其他可见的侧边栏，如果没有则移除标记类
            if (!this.leftSidebarArea.querySelector('.sidebar:not(.hidden)')) {
                this.leftSidebarArea.classList.remove('has-visible-sidebar');
                this.leftSidebarArea.classList.remove('has-multiple-sidebars');
            } else {
                // 如果只剩一个可见的侧边栏，移除多面板标记
                this.leftSidebarArea.classList.remove('has-multiple-sidebars');
            }
        } else if (position === 'right') {
            this.rightNotesLibrary.classList.add('hidden');
            
            // 检查是否还有其他可见的侧边栏，如果没有则移除标记类
            if (!this.rightSidebarArea.querySelector('.sidebar:not(.hidden)')) {
                this.rightSidebarArea.classList.remove('has-visible-sidebar');
                this.rightSidebarArea.classList.remove('has-multiple-sidebars');
            } else {
                // 如果只剩一个可见的侧边栏，移除多面板标记
                this.rightSidebarArea.classList.remove('has-multiple-sidebars');
            }
        }
        
        // 更新状态
        if (this.notesPosition === position) {
            this.notesPosition = 'hidden';
        }
    },
    
    renderNotesLibraryInContainer(container) {
        if (!container) return;
        
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
        
        container.innerHTML = notesLibraryHTML;
        
        // Set up event listeners for the notes library
        container.querySelector('#notesList')?.addEventListener('click', this.handleNoteClick.bind(this));
        
        if (this.selectedNotes.length > 0) {
            container.querySelector('#addSelectedToWorkspaceBtn')?.addEventListener('click', this.addSelectedNotesToWorkspace.bind(this));
        }
        
        const addNewNoteBtn = container.querySelector('#addNewNoteBtn');
        const newNoteInput = container.querySelector('#newNoteInput');
        
        if (addNewNoteBtn && newNoteInput) {
            addNewNoteBtn.addEventListener('click', () => {
                const content = newNoteInput.value.trim();
                if (content) {
                    this.addNote(content, 'user');
                    newNoteInput.value = '';
                    this.renderNotesLibraryInContainer(container);
                }
            });
        }
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
            
            // 刷新两个侧边栏里的笔记库
            if (this.leftNotesLibrary && !this.leftNotesLibrary.classList.contains('hidden')) {
                this.renderNotesLibraryInContainer(this.leftNotesLibraryContent);
            }
            if (this.rightNotesLibrary && !this.rightNotesLibrary.classList.contains('hidden')) {
                this.renderNotesLibraryInContainer(this.rightNotesLibraryContent);
            }
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
        
        // 刷新两个侧边栏里的笔记库
        if (this.leftNotesLibrary && !this.leftNotesLibrary.classList.contains('hidden')) {
            this.renderNotesLibraryInContainer(this.leftNotesLibraryContent);
        }
        if (this.rightNotesLibrary && !this.rightNotesLibrary.classList.contains('hidden')) {
            this.renderNotesLibraryInContainer(this.rightNotesLibraryContent);
        }
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
        
        // 刷新两个侧边栏里的笔记库
        if (this.leftNotesLibrary && !this.leftNotesLibrary.classList.contains('hidden')) {
            this.renderNotesLibraryInContainer(this.leftNotesLibraryContent);
        }
        if (this.rightNotesLibrary && !this.rightNotesLibrary.classList.contains('hidden')) {
            this.renderNotesLibraryInContainer(this.rightNotesLibraryContent);
        }
        
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
