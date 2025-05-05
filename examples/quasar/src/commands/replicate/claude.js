// src/commands/replicate/ask.js
// Chat command for Replicate provider

import { API_CONFIG, callReplicateAPI } from './util/config';

export default {
  guide: 'Chat with an AI assistant: ask [message]',
  documentation: ``,
  command: function(args) {
    if (!args || args.length === 0) {
      return '<span style="color: #F88;">Please provide a message to send to the AI assistant</span>';
    }

    // Parse args properly to respect quotes
    const fullArgsString = args.join(' ');

    // Extract parts in quotes as a single argument
    const quotedParts = fullArgsString.match(/"([^"]*)"|'([^']*)'|([^ ].+)/g) || [];

    // Clean up the quoted parts (remove quotes)
    const cleanParts = quotedParts.map(part => {
      if (part.startsWith('"') && part.endsWith('"')) {
        return part.slice(1, -1);
      }
      if (part.startsWith("'") && part.endsWith("'")) {
        return part.slice(1, -1);
      }
      return part;
    });

    // Get the user's message
    const message = cleanParts[0];

    if (!message || message.trim() === '') {
      return '<span style="color: #F88;">Please provide a non-empty message</span>';
    }

    // Store a reference to the console's log method
    const consoleLog = this.log.bind(this);

    // Display the user's message
    consoleLog('message', `<div style="color: #7CF; margin-bottom: 5px;">User: ${message}</div>`);

    // Get chat history from localStorage or initialize it
    let chatHistory;
    try {
      chatHistory = JSON.parse(localStorage.getItem('console_chat_history')) || [];
    } catch (e) {
      chatHistory = [];
    }

    // Add user message to history
    chatHistory.push({ role: 'user', content: message });

    // Save updated history to localStorage
    localStorage.setItem('console_chat_history', JSON.stringify(chatHistory));

    // Handle async operation without returning a Promise
    (async () => {
      try {
        consoleLog('message', `<span style="color: #AAA;">Connecting to AI assistant via local proxy...</span>`);

        const input = {
          prompt: message,
          top_k: 50,
          top_p: 0.9,
          max_tokens: 512,
          min_tokens: 0,
          temperature: 0.6,
          system_prompt: "You are a helpful assistant. Provide concise and accurate responses to user questions.",
          presence_penalty: 0,
          frequency_penalty: 0
        };

        consoleLog('message', `<span style="color: #AAA;">Thinking...</span>`);
        consoleLog('message', `<div style="color: #AEF; margin-top: 5px;">AI Assistant:</div>`);

        // Call the API through our proxy
        const output = await callReplicateAPI(API_CONFIG.models.textGeneration, input);

        let responseText = "";
        if (Array.isArray(output)) {
          responseText = output.join('');
        } else if (typeof output === 'string') {
          responseText = output;
        } else {
          responseText = JSON.stringify(output);
        }

        // Display the response
        consoleLog('message', `<div style="color: #FFF; padding: 5px 0;">${responseText}</div>`);

        // Add assistant response to history
        chatHistory.push({ role: 'assistant', content: responseText });
        localStorage.setItem('console_chat_history', JSON.stringify(chatHistory));

      } catch (error) {
        console.error('Replicate API error:', error);

        // Fallback to a default response if API fails
        consoleLog('message', `<div style="color: #AEF; margin-top: 5px;">AI Assistant:</div>`);
        const fallbackResponse = "I'm sorry, I'm having trouble connecting to my knowledge service right now. Please try again in a moment.";
        consoleLog('message', `<div style="color: #FFF; padding: 5px 0;">${fallbackResponse}</div>`);

        // Add fallback response to history
        chatHistory.push({ role: 'assistant', content: fallbackResponse });
        localStorage.setItem('console_chat_history', JSON.stringify(chatHistory));
      }
    })();

    // Return immediately, the async function will handle the response
    return `<span style="color: #7CF;">Processing your message...</span>`;
  },
  schema: {
    type: "object",
    required: ["message"],
    properties: {
      message: {
        type: "string",
        description: "Message to send to the AI assistant"
      }
    }
  },
  src: "src/commands/replicate/ask.js"
};