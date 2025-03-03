// Document generation and preview
const DocumentManager = {
    init() {
        // Initialize document UI elements
        this.documentSection = document.getElementById('documentSection');
        this.previewContent = document.getElementById('previewContent');
        this.editDocumentBtn = document.getElementById('editDocumentBtn');
        this.openInNewWindowBtn = document.getElementById('openInNewWindowBtn');
        this.exportPdfBtn = document.getElementById('exportPdfBtn');
        this.exportDocBtn = document.getElementById('exportDocBtn');
        
        // Set up event listeners
        this.editDocumentBtn.addEventListener('click', this.backToWorkspace.bind(this));
        this.openInNewWindowBtn.addEventListener('click', this.handleOpenInNewWindow.bind(this));
        this.exportPdfBtn.addEventListener('click', this.exportPDF.bind(this));
        this.exportDocBtn.addEventListener('click', this.exportDOC.bind(this));
    },
    
    handleOpenInNewWindow() {
        const content = this.previewContent.innerHTML;
        this.openDocumentInNewWindow(content);
    },
    
    async generateDocument(content) {
        try {
            this.showLoading();
            
            // Send content to LLM for document generation
            const formattedDocument = await this.generateFormattedDocumentFromLLM(content);
            
            // Display LLM-generated content in preview section
            this.previewContent.innerHTML = formattedDocument;
            
            // Show document section, hide workspace
            document.querySelector('.split-view').style.display = 'none';
            this.documentSection.style.display = 'block';
            
            this.hideLoading();
            
            // Save document content
            StorageManager.saveDocument(formattedDocument);
        } catch (error) {
            this.hideLoading();
            alert(`Error generating document: ${error.message}`);
            console.error('Document generation error:', error);
        }
    },
    
    openDocumentInNewWindow(htmlContent) {
        const newWindow = window.open('', '_blank');
        
        if (!newWindow) {
            alert('Your browser blocked opening a new window. Please allow popups for this site.');
            return;
        }
        
        // Write the HTML content directly to the new window
        newWindow.document.open();
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        newWindow.focus();
    },
    
    showLoading() {
        // Create loading overlay if it doesn't exist
        if (!document.getElementById('documentLoadingOverlay')) {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
            
            const overlay = document.createElement('div');
            overlay.id = 'documentLoadingOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            `;
            
            const container = document.createElement('div');
            container.style.cssText = 'display: flex; align-items: center;';
            
            const spinner = document.createElement('div');
            spinner.style.cssText = `
                border: 5px solid #f3f3f3;
                border-top: 5px solid #3498db;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 2s linear infinite;
            `;
            
            const message = document.createElement('div');
            message.textContent = 'AI is generating your document...';
            message.style.cssText = 'color: white; font-size: 18px; margin-left: 20px;';
            
            container.append(spinner, message);
            overlay.appendChild(container);
            document.body.appendChild(overlay);
        } else {
            document.getElementById('documentLoadingOverlay').style.display = 'flex';
        }
    },
    
    hideLoading() {
        const overlay = document.getElementById('documentLoadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },
    
    async generateFormattedDocumentFromLLM(content) {
        // Prepare the prompt for the LLM
        const prompt = `
            I need you to generate a professional-looking, well-formatted HTML document with embedded CSS based on the following content:
            
            ${content}
            
            Please follow these guidelines:
            1. Create a complete, standalone HTML document with embedded CSS
            2. Use a clean, professional design suitable for printing
            3. Properly format headings, paragraphs, lists, and other elements
            4. Add appropriate spacing, margins, and typography
            5. Structure the document in a logical way
            6. You may add minimal styling improvements, but preserve all the original content
            7. Return ONLY the HTML/CSS code without any explanations or markdown formatting
            8. The HTML should be printable and look good as a PDF
            
            Return the complete HTML document including <!DOCTYPE>, <html>, <head>, and <body> tags.
        `;
        
        try {
            // Send to LLM API
            const formattedDocument = await LLMApi.sendMessage(prompt);
            return this.cleanLLMResponse(formattedDocument);
        } catch (error) {
            console.error('LLM Document Generation Error:', error);
            throw new Error(`Failed to generate document: ${error.message}`);
        }
    },
    
    cleanLLMResponse(response) {
        let cleanedResponse = response;
        
        // Extract HTML from markdown code blocks if present
        const htmlBlockRegex = /```html\s*([\s\S]*?)\s*```/;
        const genericBlockRegex = /```\s*([\s\S]*?)\s*```/;
        
        const htmlMatch = htmlBlockRegex.exec(cleanedResponse);
        if (htmlMatch?.[1]) {
            cleanedResponse = htmlMatch[1];
        } else {
            const genericMatch = genericBlockRegex.exec(cleanedResponse);
            if (genericMatch?.[1]) {
                cleanedResponse = genericMatch[1];
            }
        }
        
        // Ensure the response includes HTML structure
        if (!cleanedResponse.includes('<!DOCTYPE') && !cleanedResponse.includes('<html')) {
            // If it's just a fragment, wrap it in a basic HTML document
            cleanedResponse = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Document</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }
        p {
            margin-bottom: 1em;
        }
    </style>
</head>
<body>
    ${cleanedResponse}
</body>
</html>`;
        }
        
        return cleanedResponse;
    },
    
    backToWorkspace() {
        document.querySelector('.split-view').style.display = 'flex';
        this.documentSection.style.display = 'none';
    },
    
    exportPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Use HTML rendering
        doc.html(this.previewContent, {
            callback: doc => doc.save('document.pdf'),
            x: 10,
            y: 10,
            width: 180,
            windowWidth: 800
        });
    },
    
    exportDOC() {
        const content = this.previewContent.innerHTML;
        const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Document</title></head><body>${content}</body></html>`;
        
        const blob = new Blob([html], {
            type: 'application/msword'
        });
        
        // Create a link and trigger download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'document.doc';
        link.click();
        
        // Clean up
        URL.revokeObjectURL(link.href);
    }
};
