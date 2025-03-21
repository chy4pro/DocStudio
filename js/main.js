// Main entry point for the DocStudio application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize application
    console.log('DocStudio initialized with new module system');

    // Initialize services
    if (window.EventSystem) {
        console.log('Event system ready');
    } else {
        console.error('Event system not loaded');
        return;
    }

    if (window.Settings) {
        Settings.init();
        console.log('Settings service initialized');

        // Subscribe to settings events
        EventSystem.subscribe('settings:initialized', () => {
            console.log('Settings service ready');
        });

        EventSystem.subscribe('settings:updated', (settings) => {
            console.log('Settings updated:', settings);
        });
    } else {
        console.error('Settings service not loaded');
    }

    if (window.RightClickMenu) {
        RightClickMenu.init();
        console.log('RightClickMenu service initialized');
    } else {
        console.error('RightClickMenu service not loaded');
    }
});
