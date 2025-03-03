// Debug utilities
const DebugTools = {
    enabled: false,
    
    init() {
        // Check if debug mode was previously enabled
        this.enabled = localStorage.getItem('debug_mode') === 'true';
        
        // Create debug overlay if enabled
        if (this.enabled) {
            this.createDebugOverlay();
        }
    },
    
    setEnabled(enabled) {
        this.enabled = enabled;
        localStorage.setItem('debug_mode', enabled);
        
        if (enabled) {
            this.createDebugOverlay();
        } else {
            this.removeDebugOverlay();
        }
    },
    
    createDebugOverlay() {
        // Remove existing overlay if any
        this.removeDebugOverlay();
        
        // Create debug overlay
        const overlay = document.createElement('div');
        overlay.id = 'debugOverlay';
        overlay.style.cssText = `
            position: fixed;
            bottom: 0;
            right: 0;
            width: 400px;
            height: 200px;
            background: rgba(0, 0, 0, 0.8);
            color: #0f0;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            overflow: auto;
        `;
        
        const header = document.createElement('div');
        header.textContent = 'Debug Console';
        header.style.cssText = `
            font-weight: bold;
            margin-bottom: 5px;
            padding-bottom: 5px;
            border-bottom: 1px solid #0f0;
        `;
        
        const logContainer = document.createElement('div');
        logContainer.id = 'debugLog';
        
        overlay.appendChild(header);
        overlay.appendChild(logContainer);
        document.body.appendChild(overlay);
        
        // Override console methods to also display in our debug overlay
        this.overrideConsole();
    },
    
    removeDebugOverlay() {
        const overlay = document.getElementById('debugOverlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
    },
    
    overrideConsole() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        
        console.log = (...args) => {
            originalLog.apply(console, args);
            this.logToOverlay('LOG', args);
        };
        
        console.error = (...args) => {
            originalError.apply(console, args);
            this.logToOverlay('ERROR', args);
        };
        
        console.warn = (...args) => {
            originalWarn.apply(console, args);
            this.logToOverlay('WARN', args);
        };
    },
    
    logToOverlay(type, args) {
        if (!this.enabled) return;
        
        const logElement = document.getElementById('debugLog');
        if (!logElement) return;
        
        const logEntry = document.createElement('div');
        logEntry.style.cssText = 'margin: 2px 0; word-break: break-all;';
        
        const textColors = {
            LOG: '#0f0',
            ERROR: '#f00',
            WARN: '#ff0'
        };
        
        logEntry.style.color = textColors[type] || '#0f0';
        
        const timestamp = new Date().toLocaleTimeString();
        let message = `[${timestamp}] [${type}] `;
        
        args.forEach(arg => {
            if (typeof arg === 'object') {
                try {
                    message += JSON.stringify(arg) + ' ';
                } catch (e) {
                    message += arg + ' ';
                }
            } else {
                message += arg + ' ';
            }
        });
        
        logEntry.textContent = message;
        logElement.appendChild(logEntry);
        
        // Scroll to bottom
        logElement.scrollTop = logElement.scrollHeight;
        
        // Limit log entries
        while (logElement.children.length > 100) {
            logElement.removeChild(logElement.firstChild);
        }
    }
};
