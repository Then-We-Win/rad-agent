// src/commands/replicate/config.js
// Shared configuration for Replicate commands

// API configuration
export const API_CONFIG = {
  // Local proxy URL
  proxyUrl: 'http://localhost:3000/replicate',

  // Auth token (for reference, will be handled by proxy)
  authToken: '', // TODO: store this in a secure way

  // API endpoints and models
  models: {
    imageGeneration: "black-forest-labs/flux-schnell",
    textGeneration: "ibm-granite/granite-3.2-8b-instruct",
    toolUse: "anthropic/claude-3.7-sonnet",
  }
};

// Utility function to make API requests via the proxy
export async function callReplicateAPI(model, input) {
  try {
    const response = await fetch(API_CONFIG.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        input: input
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error response:", errorText);
      throw new Error(`API returned status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Replicate API request error:", error);
    throw error;
  }
}
