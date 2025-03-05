# Endless Note

A feature-rich note-taking application with AI chat integration, workspace management, and document generation capabilities.

## Features

- **Notes Management**: Create, store, and organize notes in left or right sidebars
- **AI Chat**: Integrated chatbot for assistance and generating content
- **Workspaces**: Organize your work in different workspaces
- **Document Generation**: Generate documents based on your notes and workspace content
- **Sticky Notes**: Drag and position notes on your workspace
- **Local Storage**: All data is stored locally in your browser

## Getting Started

1. Open `index.html` in your web browser
2. Configure the API settings by clicking the Settings button
3. Start creating notes or chatting with the AI assistant
4. Add notes to workspaces and position them as needed
5. Generate documents from your workspace content

## API Configuration

To use the AI chat and document generation features, you need to set up API access:

1. Click the Settings button in the header
2. Enter your API endpoint (default: OpenAI's chat completions endpoint)
3. Enter your API key
4. Specify the model to use (e.g., gpt-3.5-turbo)
5. Click "Test Connection" to verify your settings
6. Save your settings

## Usage Tips

- Text selection will bring up a context menu to add content to workspace or save as note
- Notes can be moved between the left and right sidebars
- Multiple workspaces can be created to organize different projects
- Use the AI chat to get help, generate ideas, or create content
- Generated documents can be exported as PDF or DOC files

## Project Structure

- `index.html` - Main application structure
- `styles.css` - Application styling
- `js/app.js` - Main application initialization
- `js/notes.js` - Notes management functionality
- `js/conversation.js` - AI chat functionality
- `js/workspace.js` - Workspace management
- `js/document.js` - Document generation
- `js/storage.js` - Local storage handling
- `js/llm-api.js` - API integration for AI features
- `js/debug.js` - Debug utilities

## Keyboard Shortcuts

- `Enter` in chat input - Send message
- `Shift + Enter` in chat input - Add a new line
