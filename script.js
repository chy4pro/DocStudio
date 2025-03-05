document.addEventListener("DOMContentLoaded", () => {
  // State
  const state = {
    notes: [],
    workspaceContent: {
      text: "",
      notes: [],
    },
    displayContent: "",
    selectedNotes: [],
    notesLibraryPosition: "left",
    aiChatPosition: "right",
    showNotesLibrary: false,
    showAIChat: false,
    settings: {
      apiEndpoint: "",
      apiKey: "",
      modelName: "gpt-3.5-turbo",
      temperature: 0.7,
    },
    chatHistory: [], // Store full chat history for context
  }

  // Load settings from localStorage
  loadSettings()

  // DOM Elements
  const elements = {
    toggleNotesLibraryBtn: document.getElementById("toggle-notes-library"),
    toggleAIChatBtn: document.getElementById("toggle-ai-chat"),
    toggleSettingsBtn: document.getElementById("toggle-settings"),
    leftSidebar: document.getElementById("left-sidebar"),
    rightSidebar: document.getElementById("right-sidebar"),
    workspaceText: document.getElementById("workspace-text"),
    workspaceNotes: document.getElementById("workspace-notes"),
    promptInput: document.getElementById("prompt-input"),
    generateBtn: document.getElementById("generate-btn"),
    displaySpace: document.getElementById("display-space"),
    displayContent: document.getElementById("display-content"),
    openNewWindowBtn: document.getElementById("open-new-window"),
    settingsModal: document.getElementById("settings-modal"),
    settingsForm: document.getElementById("settings-form"),
    apiEndpointInput: document.getElementById("api-endpoint"),
    apiKeyInput: document.getElementById("api-key"),
    modelNameInput: document.getElementById("model-name"),
    temperatureInput: document.getElementById("temperature"),
    temperatureValue: document.getElementById("temperature-value"),
    closeSettingsBtn: document.getElementById("close-settings"),
    testConnectionBtn: document.getElementById("test-connection"),
    connectionStatus: document.getElementById("connection-status"),
    closeDisplaySpaceBtn: document.getElementById("close-display-space"),
  }

  // Templates
  const templates = {
    sidebarComponent: document.getElementById("sidebar-component-template"),
    notesLibrary: document.getElementById("notes-library-template"),
    aiChat: document.getElementById("ai-chat-template"),
    note: document.getElementById("note-template"),
    workspaceNote: document.getElementById("workspace-note-template"),
    message: document.getElementById("message-template"),
  }

  // Initialize
  init()

  function init() {
    // Set up event listeners
    elements.toggleNotesLibraryBtn.addEventListener("click", toggleNotesLibrary)
    elements.toggleAIChatBtn.addEventListener("click", toggleAIChat)
    elements.toggleSettingsBtn.addEventListener("click", toggleSettings)
    elements.workspaceText.addEventListener("input", updateWorkspaceText)
    elements.promptInput.addEventListener("input", updatePromptInput)
    elements.generateBtn.addEventListener("click", generateDisplay)
    elements.openNewWindowBtn.addEventListener("click", openInNewWindow)
    elements.closeSettingsBtn.addEventListener("click", toggleSettings)
    elements.settingsForm.addEventListener("submit", saveSettings)
    elements.testConnectionBtn.addEventListener("click", testConnection)
    elements.temperatureInput.addEventListener("input", updateTemperatureValue)
    elements.closeDisplaySpaceBtn.addEventListener("click", toggleDisplaySpace);
    // Initialize workspace
    updateGenerateButtonState()
  }

  // Load settings from localStorage
  function loadSettings() {
    const savedSettings = localStorage.getItem("docStudioSettings")
    if (savedSettings) {
      state.settings = JSON.parse(savedSettings)
    }
  }

  // Save settings to localStorage
  function saveSettings(e) {
    e.preventDefault()

    state.settings.apiEndpoint = elements.apiEndpointInput.value
    state.settings.apiKey = elements.apiKeyInput.value
    state.settings.modelName = elements.modelNameInput.value
    state.settings.temperature = Number.parseFloat(elements.temperatureInput.value)

    localStorage.setItem("docStudioSettings", JSON.stringify(state.settings))

    showConnectionStatus("Settings saved successfully!", "success")
    setTimeout(() => {
      elements.settingsModal.classList.add("hidden")
      elements.connectionStatus.classList.add("hidden")
    }, 1500)
  }

  // Test API connection
  async function testConnection() {
    const endpoint = elements.apiEndpointInput.value
    const apiKey = elements.apiKeyInput.value
    const model = elements.modelNameInput.value

    if (!endpoint || !apiKey) {
      showConnectionStatus("Please enter API endpoint and API key", "error")
      return
    }

    elements.testConnectionBtn.disabled = true
    elements.testConnectionBtn.innerHTML = '<span class="loading"></span>Testing...'

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: "Hello, are you working?" }],
          temperature: 0.7,
          max_tokens: 50,
        }),
      })

      if (response.ok) {
        showConnectionStatus("Connection successful! API is working.", "success")
      } else {
        const error = await response.json()
        showConnectionStatus(`Connection failed: ${error.error?.message || "Unknown error"}`, "error")
      }
    } catch (error) {
      showConnectionStatus(`Connection failed: ${error.message}`, "error")
    } finally {
      elements.testConnectionBtn.disabled = false
      elements.testConnectionBtn.innerHTML = "Test Connection"
    }
  }

  // Show connection status
  function showConnectionStatus(message, type) {
    elements.connectionStatus.textContent = message
    elements.connectionStatus.className = type
    elements.connectionStatus.classList.remove("hidden")
  }

  // Update temperature value display
  function updateTemperatureValue() {
    elements.temperatureValue.textContent = elements.temperatureInput.value
  }

  // Toggle Settings Modal
  function toggleSettings() {
    elements.settingsModal.classList.toggle("hidden")

    if (!elements.settingsModal.classList.contains("hidden")) {
      // Populate form with current settings
      elements.apiEndpointInput.value = state.settings.apiEndpoint
      elements.apiKeyInput.value = state.settings.apiKey
      elements.modelNameInput.value = state.settings.modelName
      elements.temperatureInput.value = state.settings.temperature
      elements.temperatureValue.textContent = state.settings.temperature
      elements.connectionStatus.classList.add("hidden")
    }
  }

  // Toggle Notes Library
  function toggleNotesLibrary() {
    state.showNotesLibrary = !state.showNotesLibrary
    elements.toggleNotesLibraryBtn.classList.toggle("active", state.showNotesLibrary)
    renderSidebars()
  }

  // Toggle AI Chat
  function toggleAIChat() {
    state.showAIChat = !state.showAIChat
    elements.toggleAIChatBtn.classList.toggle("active", state.showAIChat)
    renderSidebars()
  }

  // Render Sidebars
  function renderSidebars() {
    // Clear sidebars
    elements.leftSidebar.innerHTML = ""
    elements.rightSidebar.innerHTML = ""

    // Get components for each sidebar
    const leftComponents = getLeftSidebarComponents()
    const rightComponents = getRightSidebarComponents()

    // Update sidebar classes
    elements.leftSidebar.classList.toggle("active", leftComponents.length > 0)
    elements.leftSidebar.classList.toggle("double", leftComponents.length > 1)
    elements.rightSidebar.classList.toggle("active", rightComponents.length > 0)
    elements.rightSidebar.classList.toggle("double", rightComponents.length > 1)

    // Render left sidebar components
    leftComponents.forEach((component) => {
      const sidebarComponent = createSidebarComponent(component)
      elements.leftSidebar.appendChild(sidebarComponent)
    })

    // Render right sidebar components
    rightComponents.forEach((component) => {
      const sidebarComponent = createSidebarComponent(component)
      elements.rightSidebar.appendChild(sidebarComponent)
    })
  }

  // Get Left Sidebar Components
  function getLeftSidebarComponents() {
    const components = []

    if (state.showNotesLibrary && state.notesLibraryPosition === "left") {
      components.push({
        type: "notes",
        title: "Notes Library",
        content: createNotesLibrary(),
      })
    }

    if (state.showAIChat && state.aiChatPosition === "left") {
      components.push({
        type: "chat",
        title: "AI Chat",
        content: createAIChat(),
      })
    }

    return components
  }

  // Get Right Sidebar Components
  function getRightSidebarComponents() {
    const components = []

    if (state.showNotesLibrary && state.notesLibraryPosition === "right") {
      components.push({
        type: "notes",
        title: "Notes Library",
        content: createNotesLibrary(),
      })
    }

    if (state.showAIChat && state.aiChatPosition === "right") {
      components.push({
        type: "chat",
        title: "AI Chat",
        content: createAIChat(),
      })
    }

    return components
  }

  // Create Sidebar Component
  function createSidebarComponent(component) {
    const template = templates.sidebarComponent.content.cloneNode(true)
    const sidebarComponent = template.querySelector(".sidebar-component")
    const title = sidebarComponent.querySelector("h2")
    const content = sidebarComponent.querySelector(".sidebar-content")
    const togglePositionBtn = sidebarComponent.querySelector(".toggle-position")
    const closeBtn = sidebarComponent.querySelector(".close-btn")
    const panelIcon = sidebarComponent.querySelector(".panel-icon")

    title.textContent = component.title
    content.appendChild(component.content)

    // Set panel icon based on current position
    if (component.type === "notes") {
      if (state.notesLibraryPosition === "left") {
        panelIcon.innerHTML = '<polyline points="9 18 15 12 9 6"></polyline>'
        togglePositionBtn.title = "Move to right sidebar"
      } else {
        panelIcon.innerHTML = '<polyline points="15 18 9 12 15 6"></polyline>'
        togglePositionBtn.title = "Move to left sidebar"
      }
    } else {
      if (state.aiChatPosition === "left") {
        panelIcon.innerHTML = '<polyline points="9 18 15 12 9 6"></polyline>'
        togglePositionBtn.title = "Move to right sidebar"
      } else {
        panelIcon.innerHTML = '<polyline points="15 18 9 12 15 6"></polyline>'
        togglePositionBtn.title = "Move to left sidebar"
      }
    }

    // Add event listeners
    togglePositionBtn.addEventListener("click", () => {
      togglePosition(component.type)
    })

    closeBtn.addEventListener("click", () => {
      if (component.type === "notes") {
        toggleNotesLibrary()
      } else {
        toggleAIChat()
      }
    })

    return sidebarComponent
  }

  // Toggle Component Position
  function togglePosition(componentType) {
    if (componentType === "notes") {
      state.notesLibraryPosition = state.notesLibraryPosition === "left" ? "right" : "left"
    } else {
      state.aiChatPosition = state.aiChatPosition === "left" ? "right" : "left"
    }
    renderSidebars()
  }

  // Create Notes Library
  function createNotesLibrary() {
    const template = templates.notesLibrary.content.cloneNode(true)
    const notesLibrary = template.querySelector(".notes-library")
    const notesList = notesLibrary.querySelector(".notes-list")
    const addToWorkspaceBtn = notesLibrary.querySelector("#add-to-workspace")
    const newNoteTextarea = notesLibrary.querySelector(".new-note textarea")
    const addNoteBtn = notesLibrary.querySelector(".add-note-btn")

    // Render notes
    state.notes.forEach((note) => {
      const noteElement = createNoteElement(note)
      notesList.appendChild(noteElement)
    })

    // Add event listeners
    addToWorkspaceBtn.addEventListener("click", addSelectedNotesToWorkspace)
    addNoteBtn.addEventListener("click", () => {
      const content = newNoteTextarea.value.trim()
      if (content) {
        addNote(content, "user")
        newNoteTextarea.value = ""
        renderSidebars()
      }
    })

    newNoteTextarea.addEventListener("input", () => {
      addNoteBtn.disabled = !newNoteTextarea.value.trim()
    })

    // Show/hide add to workspace button based on selected notes
    updateAddToWorkspaceButton(addToWorkspaceBtn)

    return notesLibrary
  }

  // Create Note Element
  function createNoteElement(note) {
    const template = templates.note.content.cloneNode(true)
    const noteElement = template.querySelector(".note")
    const noteMeta = noteElement.querySelector(".note-meta")
    const noteContent = noteElement.querySelector(".note-content")

    noteElement.classList.add(note.source)
    noteElement.dataset.id = note.id

    if (state.selectedNotes.includes(note.id)) {
      noteElement.classList.add("selected")
    }

    noteMeta.textContent = `${note.source === "user" ? "Your note" : "AI note"} • ${new Date(note.createdAt).toLocaleString()}`
    noteContent.textContent = note.content

    noteElement.addEventListener("click", () => {
      toggleNoteSelection(note.id)
    })

    return noteElement
  }

  // Toggle Note Selection
  function toggleNoteSelection(noteId) {
    if (state.selectedNotes.includes(noteId)) {
      state.selectedNotes = state.selectedNotes.filter((id) => id !== noteId)
    } else {
      state.selectedNotes.push(noteId)
    }

    // Update notes library
    renderSidebars()
  }

  // Update Add to Workspace Button
  function updateAddToWorkspaceButton(button) {
    if (state.selectedNotes.length > 0) {
      button.classList.remove("hidden")
    } else {
      button.classList.add("hidden")
    }
  }

  // Add Selected Notes to Workspace
  function addSelectedNotesToWorkspace() {
    const selectedNotesToAdd = state.notes
      .filter((note) => state.selectedNotes.includes(note.id))
      .map((note) => ({
        ...note,
        position: {
          x: (state.workspaceContent.notes.length % 3) * 260 + 20,
          y: Math.floor(state.workspaceContent.notes.length / 3) * 140 + 20,
        },
      }))

    state.workspaceContent.notes = [...state.workspaceContent.notes, ...selectedNotesToAdd]

    state.selectedNotes = []
    renderSidebars()
    renderWorkspaceNotes()
    updateGenerateButtonState()
  }

  // Create AI Chat
  function createAIChat() {
    const template = templates.aiChat.content.cloneNode(true)
    const aiChat = template.querySelector(".ai-chat")
    const messages = aiChat.querySelector(".messages")
    const textarea = aiChat.querySelector("textarea")
    const sendBtn = aiChat.querySelector(".send-btn")

    // Add initial AI message if no messages exist
    if (messages.children.length === 0 && state.chatHistory.length === 0) {
      const initialMessage = {
        id: "1",
        content: "Hello! I'm your AI assistant. How can I help you today?",
        role: "assistant",
      }

      state.chatHistory.push({
        role: "assistant",
        content: initialMessage.content,
      })

      const messageElement = createMessageElement(initialMessage)
      messages.appendChild(messageElement)
    } else if (state.chatHistory.length > 0) {
      // Render existing chat history
      state.chatHistory.forEach((msg, index) => {
        const message = {
          id: index.toString(),
          content: msg.content,
          role: msg.role,
        }
        const messageElement = createMessageElement(message)
        messages.appendChild(messageElement)
      })

      // Scroll to bottom
      setTimeout(() => {
        messages.scrollTop = messages.scrollHeight
      }, 100)
    }

    // Add event listeners
    textarea.addEventListener("input", () => {
      sendBtn.disabled = !textarea.value.trim()
    })

    sendBtn.addEventListener("click", async () => {
      const content = textarea.value.trim()
      if (content) {
        // Add user message
        const userMessage = {
          id: Date.now().toString(),
          content,
          role: "user",
        }

        // Add to chat history
        state.chatHistory.push({
          role: "user",
          content,
        })

        const userMessageElement = createMessageElement(userMessage)
        messages.appendChild(userMessageElement)

        // Clear input
        textarea.value = ""
        sendBtn.disabled = true

        // Scroll to bottom
        messages.scrollTop = messages.scrollHeight

        // Show loading indicator
        const loadingMessage = document.createElement("div")
        loadingMessage.className = "message ai"
        loadingMessage.innerHTML = `
        <div class="message-content">AI is thinking...</div>
        `
        messages.appendChild(loadingMessage)
        messages.scrollTop = messages.scrollHeight

        try {
          // Check if API settings are configured
          if (!state.settings.apiEndpoint || !state.settings.apiKey) {
            throw new Error("API settings not configured. Please set up your API endpoint and key in Settings.")
          }

          // Call the API
          const response = await fetch(state.settings.apiEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${state.settings.apiKey}`,
            },
            body: JSON.stringify({
              model: state.settings.modelName,
              messages: state.chatHistory.map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
              temperature: state.settings.temperature,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error?.message || "Failed to get response from API")
          }

          const data = await response.json()
          const aiContent = data.choices[0].message.content

          // Add to chat history
          state.chatHistory.push({
            role: "assistant",
            content: aiContent,
          })

          // Remove loading message
          messages.removeChild(loadingMessage)

          // Create AI response message
          const aiResponse = {
            id: (Date.now() + 1).toString(),
            content: aiContent,
            role: "assistant",
          }

          const aiMessageElement = createMessageElement(aiResponse)
          messages.appendChild(aiMessageElement)
        } catch (error) {
          // Remove loading message
          messages.removeChild(loadingMessage)

          // Show error message
          const errorResponse = {
            id: (Date.now() + 1).toString(),
            content: `Error: ${error.message}`,
            role: "assistant",
          }

          const errorMessageElement = createMessageElement(errorResponse)
          messages.appendChild(errorMessageElement)

          // Don't add error messages to chat history
        } finally {
          // Scroll to bottom
          messages.scrollTop = messages.scrollHeight
        }
      }
    })

    return aiChat
  }

  // Create Message Element
  function createMessageElement(message) {
    const template = templates.message.content.cloneNode(true)
    const messageElement = template.querySelector(".message")
    const messageContent = messageElement.querySelector(".message-content")
    const saveNoteBtn = messageElement.querySelector(".save-note-btn")

    messageElement.classList.add(message.role === "user" ? "user" : "ai")
    messageContent.textContent = message.content

    if (message.role === "assistant") {
      saveNoteBtn.addEventListener("click", () => {
        addNote(message.content, "ai")
        renderSidebars()
      })
    } else {
      saveNoteBtn.remove()
    }

    return messageElement
  }

  // Add Note
  function addNote(content, source) {
    const newNote = {
      id: Date.now().toString(),
      content,
      source,
      createdAt: new Date(),
    }

    state.notes.push(newNote)
  }

  // Update Workspace Text
  function updateWorkspaceText() {
    state.workspaceContent.text = elements.workspaceText.value
    updateGenerateButtonState()
  }

  // Update Prompt Input
  function updatePromptInput() {
    updateGenerateButtonState()
  }

  // Update Generate Button State
  function updateGenerateButtonState() {
    const hasPrompt = elements.promptInput.value.trim() !== ""
    const hasWorkspaceContent = state.workspaceContent.text.trim() !== "" || state.workspaceContent.notes.length > 0

    elements.generateBtn.disabled = !hasPrompt || !hasWorkspaceContent
  }

  // Render Workspace Notes
  function renderWorkspaceNotes() {
    elements.workspaceNotes.innerHTML = ""

    state.workspaceContent.notes.forEach((note) => {
      const template = templates.workspaceNote.content.cloneNode(true)
      const noteElement = template.querySelector(".workspace-note")
      const noteMeta = noteElement.querySelector(".note-meta")
      const noteContent = noteElement.querySelector(".note-content")
      const removeBtn = noteElement.querySelector(".remove-note")

      noteElement.classList.add(note.source)
      noteElement.dataset.id = note.id
      noteElement.style.left = `${note.position.x}px`
      noteElement.style.top = `${note.position.y}px`

      noteMeta.textContent = `${note.source === "user" ? "Your note" : "AI note"} • ${new Date(note.createdAt).toLocaleString()}`
      noteContent.textContent = note.content

      // Add drag functionality
      const isDragging = false
      let startX, startY, startLeft, startTop

      noteElement.addEventListener("dragstart", (e) => {
        const noteId = e.target.dataset.id
        const note = state.workspaceContent.notes.find((n) => n.id === noteId)

        if (note) {
          e.dataTransfer.setData("text/plain", noteId)

          // Create ghost image
          const ghostElement = document.createElement("div")
          ghostElement.classList.add("workspace-note", "ghost")
          ghostElement.style.width = "12rem"
          ghostElement.style.height = "6rem"
          ghostElement.style.opacity = "0.5"
          ghostElement.style.background = note.source === "user" ? "var(--yellow-100)" : "var(--blue-100)"
          ghostElement.style.borderRadius = "var(--radius)"
          document.body.appendChild(ghostElement)

          e.dataTransfer.setDragImage(ghostElement, 24, 12)
          setTimeout(() => document.body.removeChild(ghostElement), 0)
        }
      })

      elements.workspaceNotes.addEventListener("dragover", (e) => {
        e.preventDefault()
      })

      noteElement.addEventListener("dragend", (e) => {
        const noteId = e.target.dataset.id
        const note = state.workspaceContent.notes.find((n) => n.id === noteId)

        if (note) {
          const workspace = elements.workspaceNotes.getBoundingClientRect()
          const x = e.clientX - workspace.left
          const y = e.clientY - workspace.top

          // Update note position
          note.position.x = Math.max(0, Math.min(x, workspace.width - 192)) // 12rem = 192px
          note.position.y = Math.max(0, Math.min(y, workspace.height - 100)) // approximate height

          renderWorkspaceNotes()
        }
      })

      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        const noteId = noteElement.dataset.id
        removeWorkspaceNote(noteId)
      })

      elements.workspaceNotes.appendChild(noteElement)
    })
  }

  // Remove Workspace Note
  function removeWorkspaceNote(noteId) {
    state.workspaceContent.notes = state.workspaceContent.notes.filter((note) => note.id !== noteId)
    renderWorkspaceNotes()
    updateGenerateButtonState()
  }

  // Generate Display
  async function generateDisplay() {
    const prompt = elements.promptInput.value.trim()
    // Get the iframe and its content document
    const iframe = document.getElementById("display-content");
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;

    if (!prompt || (!state.workspaceContent.text.trim() && state.workspaceContent.notes.length === 0)) {
      return
    }

    // Show loading state
    elements.generateBtn.disabled = true
    elements.generateBtn.innerHTML = '<span class="loading"></span>Generating...'
    elements.displaySpace.classList.remove("hidden")
    iframeDocument.body.innerHTML =
      '<html><div class="flex items-center justify-center h-full"><p class="animate-pulse">Generating content...</p></div></html>'
    elements.displaySpace.classList.toggle("show")

    try {
      // Check if API settings are configured
      if (!state.settings.apiEndpoint || !state.settings.apiKey) {
        throw new Error("API settings not configured. Please set up your API endpoint and key in Settings.")
      }

      // Prepare content from workspace
      let workspaceContentText = state.workspaceContent.text

      // Add notes content
      if (state.workspaceContent.notes.length > 0) {
        workspaceContentText +=
          "\n\nNotes:\n" +
          state.workspaceContent.notes
            .map((note) => `- ${note.source === "user" ? "Your note" : "AI note"}: ${note.content}`)
            .join("\n")
      }

      // Call the API
      const response = await fetch(state.settings.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.settings.apiKey}`,
        },
        body: JSON.stringify({
          model: state.settings.modelName,
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that generates well-formatted HTML content based on the user's workspace and prompt. Your response should be valid HTML that can be directly inserted into a document.",
            },
            {
              role: "user",
              content: `Generate a well-formatted HTML document based on this content and prompt.
              
              WORKSPACE CONTENT:
              ${workspaceContentText}
              
              PROMPT:
              ${prompt}
              
              Please format your response as clean HTML with appropriate styling. Include headings, paragraphs, and other HTML elements as needed. Make it visually appealing.`,
            },
          ],
          temperature: state.settings.temperature,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || "Failed to generate content")
      }

      const data = await response.json()
      const generatedHtml = data.choices[0].message.content

      // Clean up HTML if needed (remove markdown backticks if present)
      let cleanHtml = generatedHtml.replace(/```html|```/g, "").trim()

      // Ensure we have a complete HTML structure
      if (!cleanHtml.includes("<html>") && !cleanHtml.includes("<!DOCTYPE")) {
        cleanHtml = `
          <div style="font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            ${cleanHtml}
          </div>
        `
      }

      // Write the generated HTML to the iframe's document
      iframeDocument.body.innerHTML = cleanHtml;
    } catch (error) {
      // Show error in display space
      elements.displayContent.innerHTML = `
        <div style="color: var(--error); padding: 20px; text-align: center;">
          <h3>Error Generating Content</h3>
          <p>${error.message}</p>
        </div>
      `
    } finally {
      // Reset button state
      elements.generateBtn.disabled = false
      elements.generateBtn.innerHTML = `Generate <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path><path d="M9 18h6"></path><path d="M10 22h4"></path></svg>`
    }
  }

  // Open in New Window
  function openInNewWindow() {
    const newWindow = window.open("", "_blank")
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>DocStudio Display</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0;">
            ${state.displayContent}
          </body>
        </html>
      `)
      newWindow.document.close()
    }
  }
  function toggleDisplaySpace() {
    elements.displaySpace.classList.toggle("show");
  }
})

