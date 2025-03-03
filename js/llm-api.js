// LLM API integration
const LLMApi = {
  endpoint: null,
  apiKey: null,
  model: null,
  customRequestTemplate: null,
  
  init() {
    // Load API settings from storage
    this.endpoint = StorageManager.getApiEndpoint();
    this.apiKey = StorageManager.getApiKey();
    this.model = StorageManager.getApiModel();
    this.customRequestTemplate = StorageManager.getCustomRequestTemplate();
  },
  
  // Get current settings
  getEndpoint() {
    return this.endpoint;
  },
  
  getApiKey() {
    return this.apiKey;
  },
  
  getModel() {
    return this.model;
  },
  
  getCustomRequestTemplate() {
    return this.customRequestTemplate;
  },
  
  // Update settings
  setEndpoint(endpoint) {
    this.endpoint = endpoint;
    this.saveSettings();
  },
  
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    this.saveSettings();
  },
  
  setModel(model) {
    this.model = model;
    this.saveSettings();
  },
  
  setCustomRequestTemplate(template) {
    this.customRequestTemplate = template;
    this.saveSettings();
  },
  
  saveSettings() {
    StorageManager.saveApiSettings(
      this.endpoint, 
      this.apiKey, 
      this.model, 
      this.customRequestTemplate
    );
  },
  
  // Get the properly formatted endpoint URL
  getFormattedEndpoint() {
    let endpoint = this.endpoint.trim();
    
    // Check if the endpoint already ends with chat/completions
    if (endpoint.endsWith('/chat/completions')) {
      return endpoint;
    }
    
    // If it ends with /v1, append /chat/completions
    if (endpoint.endsWith('/v1')) {
      return `${endpoint}/chat/completions`;
    }
    
    // If it doesn't end with a slash, add one
    if (!endpoint.endsWith('/')) {
      endpoint += '/';
    }
    
    // If it doesn't contain v1/chat/completions, add it
    if (!endpoint.includes('v1/chat/completions')) {
      if (endpoint.includes('v1')) {
        // Extract everything up to and including v1
        const v1Index = endpoint.indexOf('v1');
        endpoint = endpoint.substring(0, v1Index + 2); // +2 for 'v1'
        return `${endpoint}/chat/completions`;
      } else {
        return `${endpoint}v1/chat/completions`;
      }
    }
    
    return endpoint;
  },
  
  // Send message to LLM API
  async sendMessage(message) {
    // Check if API is configured
    if (!this.endpoint || !this.apiKey) {
      throw new Error('API not configured. Please set up the API endpoint and key in settings.');
    }
    
    try {
      const formattedEndpoint = this.getFormattedEndpoint();
      console.log('Sending request to:', formattedEndpoint);
      
      let requestBody;
      if (this.customRequestTemplate) {
        // Use custom template with placeholders replaced
        const template = this.customRequestTemplate
          .replace('${model}', this.model)
          .replace('${message}', message);
        requestBody = JSON.parse(template);
      } else {
        // Use standard OpenAI format
        requestBody = {
          model: this.model,
          messages: [
            {
              role: 'user',
              content: message
            }
          ]
        };
      }
      
      const response = await fetch(formattedEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      // Check content type of response
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        console.error('API returned non-JSON response:', contentType);
        const textResponse = await response.text();
        console.error('Response text (first 100 chars):', textResponse.substring(0, 100));
        throw new Error('API returned non-JSON response. The endpoint might be incorrect or the server might be returning an error page.');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API request failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle different API response formats
      return data.choices?.[0]?.message?.content || // OpenAI format
             data.response || // Alternative format
             data.output || data.result || data.text || data.content || // Other common formats
             JSON.stringify(data); // Fallback
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  // Test API connection
  async testConnection(endpoint, apiKey, model) {
    try {
      // Format the endpoint by temporarily setting it
      const originalEndpoint = this.endpoint;
      this.endpoint = endpoint;
      const formattedEndpoint = this.getFormattedEndpoint();
      this.endpoint = originalEndpoint; // Restore original
      
      console.log('Testing connection to:', formattedEndpoint);
      
      const response = await fetch(formattedEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: 'Hello, this is a test message. Please respond with a brief confirmation.'
            }
          ],
          max_tokens: 20
        })
      });
      
      // Check content type of response
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        console.error('API returned non-JSON response:', contentType);
        const textResponse = await response.text();
        console.error('Response text (first 100 chars):', textResponse.substring(0, 100));
        throw new Error('API returned non-JSON response. The endpoint might be incorrect or the server might be returning an error page.');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API request failed with status: ${response.status}`);
      }
      
      // Just check that we can parse the response as JSON
      await response.json();
      return true;
    } catch (error) {
      console.error('API Test Error:', error);
      throw error;
    }
  }
};
