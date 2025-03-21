// Simple event system for component communication
const EventSystem = {
    events: {},
    
    // Subscribe to an event
    subscribe: function(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        
        // Return an unsubscribe function
        return () => {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        };
    },
    
    // Publish an event
    publish: function(event, data) {
        if (!this.events[event]) return;
        
        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event ${event} callback:`, error);
            }
        });
    }
};

// Export event system
window.EventSystem = EventSystem;
