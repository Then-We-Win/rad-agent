// src/commands/app/ask.js
// Chat command for app provider with tool execution capability

import { API_CONFIG, callReplicateAPI } from '../replicate/util/config';

export default {
  guide: 'Chat with an AI assistant: ask [message]',
  documentation: `
# Ask Command

This command allows you to chat with an AI assistant and execute suggested tools.

## Syntax
\`\`\`
ask [message]
\`\`\`

## Parameters
- \`message\`: The message to send to the AI assistant

## Examples
\`\`\`
ask What is the capital of France?
ask Write a short poem about coding
ask Can you analyze the bundle sizes in our app?
\`\`\`
  `,
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

    // Store a reference to the console's dispatch method
    const consoleDispatch = this.$console.dispatch.bind(this.$console);

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

    // Create example objects for the system prompt
    const exampleApp = {
      time: new Date().toLocaleString('en-US', { timeZoneName: 'short' }),
      locale: "United States",
      language: "English",
      name: "Demo App",
      detailsForAI: "This is a demo app that provides access to various tools and utilities for developers. It's designed to help developers debug, analyze, and interact with their applications.",
      user: {
        name: "Nick Steele",
        organization: "Example Co",
        role: "Software Engineer",
        device: "Desktop - Chrome Browser"
      },
      tools: []
    };

    // Get the real tools from the application providers and commands
    const toolsList = [];

    // Access the console's providers through the global app configuration
    const providers = this.$console.providers;

    // Loop through each provider and their commands
    Object.keys(providers).forEach(providerName => {
      const provider = providers[providerName];

      Object.keys(provider).forEach(commandName => {
        const command = provider[commandName];

        // Skip the ask command itself to avoid recursion
        if (providerName === 'app' && commandName === 'ask') {
          return;
        }

        // Create a tool entry for this command
        const tool = {
          name: `${commandName}${providerName !== this.$console.defaultConfig.defaultProvider ? ':' + providerName : ''}`,
          description: command.guide || 'No description available',
          parameters: {}
        };

        // Add parameter information if schema is available
        if (command.schema && command.schema.properties) {
          Object.keys(command.schema.properties).forEach(propName => {
            const prop = command.schema.properties[propName];
            const required = command.schema.required && command.schema.required.includes(propName);

            tool.parameters[propName] = `${prop.type || 'any'} (${required ? 'required' : 'optional'}) - ${prop.description || 'No description'}`;
          });
        }

        toolsList.push(tool);
      });
    });

    // Add the tools to the app object
    exampleApp.tools = toolsList;

    const exampleRagResponse = {
      relevantInformation: "Activations are small creatives that are time aligned to content (video or audio) and displayed anywhere on a device.",
      context: "Recent commands have been related to inserting images into activations."
    };

    const exampleUser = {
      lastResponse: message
    };

    // Construct the system prompt
    const systemPrompt = `
The time is ${exampleApp.time}. You are to obey the laws in ${exampleApp.locale} and respond in
${exampleApp.language}. You are a helpful assistant aiding a user of an app called ${exampleApp.name}.

Here is some helpful background about the company that built the app...

App details:
${exampleApp.detailsForAI}

Here is information about the user, their organization, their role and device...

User information:
${JSON.stringify(exampleApp.user, null, 2)}

Your goal is to provide the user with the best possible experience. Here are tools that you can utilize to help the user...

Tools schema:
${JSON.stringify(exampleApp.tools, null, 2)}

You can also use the following information that was obtained from the user's most recent response ahead of time using RAG...

Rag information:
${JSON.stringify(exampleRagResponse, null, 2)}

IMPORTANT: Please respond to the user ONLY in the following JSON format no matter what you think the user may be asking
for. This is because your response will only be intepreted as JSON and will not be understood in any other format. This
is a limitation of the system and you must adhere to this rule or the user will never get to see your response!

Here is the format you must always follow, please remember and pay close attention to this...

Response format:
{
  "response": "Put what you want to say to the user here. They will always see this.",
  "commands": [
    {
      "tool": "analyze", // The name of the tool you want to invoke (use the exact command name from the tools schema)
      "payload": {"mode": "components"}, // The payload as an object with the parameters needed by the tool
      "tip": "This is a tip you make for the user about what you're trying to accomplish with this tool. Be concise - they will only see a few lines of text."
    }
  ]
}

# Chaining Commands

When suggesting multiple commands, you can use PREVIOUS_ASSET as a special value to refer to the last asset
(like an image URL) created by a previous command.

Example:
1. First suggest generating an image:
   {
     "commands": [
       {
         "tool": "image",
         "payload": {"prompt": "A beautiful mountain landscape"},
         "tip": "Generating an image of mountains"
       }
     ]
   }

2. Then suggest displaying that image:
   {
     "commands": [
       {
         "tool": "injectImage",
         "payload": {"url": "PREVIOUS_ASSET", "title": "Mountain Landscape"},
         "tip": "Displaying the generated mountain image"
       }
     ]
   }

Also, please always include a first tool of "say:playai" and insert the response content so that the user can hear you.

Think deeply about what the user is asking for and in what context. Only invoke commands that directly help address their request.
Only suggest tools that exist in the tools schema. Format the tool name exactly as shown in the schema, including any provider suffix.
For the payload, use the correct parameter names as shown in the schema and make sure required parameters are included.

Finally, here is the users most recent response, good luck and thank you for your service!

User response:
${exampleUser.lastResponse}
              `;

    // Log the constructed prompt to console in an expandable format
    console.groupCollapsed('📡 AI Request Details');
    console.log('%cSystem Prompt:', 'font-weight: bold; color: #7CF;');
    console.log(systemPrompt);
    console.log('%cUser Message:', 'font-weight: bold; color: #FFA;');
    console.log(message);
    console.groupEnd();

    // Helper function to create and render a confirmation button for each command
    const renderCommandConfirmation = function(commands) {
      if (!commands || commands.length === 0) return '';

      let html = `<div style="margin-top: 10px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 4px;">
                <div style="color: #AEF; font-weight: bold;">
                  AI suggested these commands:
                  <span
                    onclick="toggleCommandDetails(this)"
                    style="margin-left: 10px; color: #AAA; font-size: 0.8em; cursor: pointer; user-select: none;"
                    data-expanded="false">
                    [Show details]
                  </span>
                </div>
                <div class="command-details" style="display: none; margin: 5px 0; padding: 5px; background: rgba(0,0,0,0.2); border-radius: 3px; font-family: monospace; font-size: 0.8em; color: #AAA;">
                  Console logging details available in browser console. Press F12 to view.
                </div>`;

      // Generate a unique ID for this set of commands
      const commandSetId = 'cmd-' + Date.now();

      // Store commands in window for later access
      window[commandSetId] = commands;

      commands.forEach((cmd, index) => {
                      const commandId = `${commandSetId}-${index}`;

              // Process any variable references in the command payload
              const processedCmd = {
                ...cmd,
                payload: processVariableReferences(cmd.payload)
              };

        html += `
          <div style="margin-top: 6px; padding: 5px; background: rgba(255,255,255,0.1); border-radius: 3px;">
            <div style="color: #FFA; font-size: 0.9em; margin: 3px 0;">${processedCmd.tip}</div>
            <div style="color: #7CF; font-weight: bold;">${processedCmd.tool}</div>
            <div style="color: #AAA; font-size: 0.8em; font-family: monospace; margin-bottom: 5px;">
              ${JSON.stringify(processedCmd.payload)}
            </div>
            <div style="display: flex; gap: 8px;">
              <button
                onclick="executeCommand('${commandSetId}', ${index}, this)"
                style="background: rgba(0,180,0,0.3); border: 1px solid #393; color: #7F7; padding: 3px 8px; border-radius: 3px; cursor: pointer;">
                Execute this command
              </button>
              <button
                onclick="this.parentNode.innerHTML = '<span style=\\'color: #AAA; font-style: italic;\\'>Command declined</span>'"
                style="background: rgba(180,0,0,0.3); border: 1px solid #933; color: #F77; padding: 3px 8px; border-radius: 3px; cursor: pointer;">
                Decline
              </button>
            </div>
          </div>`;
      });

      html += `</div>`;

      // Add toggle function for command details
      if (!window.toggleCommandDetails) {
        window.toggleCommandDetails = function(element) {
          const detailsDiv = element.parentNode.nextElementSibling;
          const isExpanded = element.getAttribute('data-expanded') === 'true';

          if (isExpanded) {
            detailsDiv.style.display = 'none';
            element.textContent = '[Show details]';
            element.setAttribute('data-expanded', 'false');
          } else {
            detailsDiv.style.display = 'block';
            element.textContent = '[Hide details]';
            element.setAttribute('data-expanded', 'true');
          }
        };
      }

      // Add the executeCommand function to the window scope if it doesn't exist
      if (!window.executeCommand) {
        window.executeCommand = function(setId, cmdIndex, buttonElement) {
          const commands = window[setId];
          if (!commands || !commands[cmdIndex]) return;

          // Get the original command
          const cmd = commands[cmdIndex];

          // Process any variable references in the command payload
          const processedCmd = {
            ...cmd,
            payload: processVariableReferences(cmd.payload)
          };

          // Format command string
          let commandStr = processedCmd.tool;

          // Add parameters to the command string
          if (processedCmd.payload) {
            const paramArray = [];
            for (const [key, value] of Object.entries(processedCmd.payload)) {
              // If value is a string with spaces, wrap in quotes
              if (typeof value === 'string' && value.includes(' ')) {
                paramArray.push(`"${value}"`);
              } else {
                paramArray.push(value);
              }
            }

            if (paramArray.length > 0) {
              commandStr += ' ' + paramArray.join(' ');
            }
          }

          // Replace the button with an execution message
          buttonElement.parentNode.innerHTML = `<span style="color: #7F7; font-style: italic;">Executing: ${commandStr}</span>`;

          // Execute the command
          const dispatchFunction = buttonElement.getAttribute('data-dispatch');
          if (typeof window[dispatchFunction] === 'function') {
            // Set up a function to capture the command's response
            const responseHandler = function(response) {
              // Store the command's response as the previous asset
              try {
                if (response) {
                  console.log('Stored tool response as previous asset:', response);
                }
              } catch (e) {
                console.error('Error storing command response:', e);
              }
            };

            // Add the response handler to the window
            const handlerName = `responseHandler_${Date.now()}`;
            window[handlerName] = responseHandler;

            // Set the handler on the button for reference
            buttonElement.setAttribute('data-response-handler', handlerName);

            // Execute the command and capture its response
            const result = window[dispatchFunction](commandStr);
            console.log('Executed command:', commandStr, result)
            // Process the result
            if (result) {
              responseHandler(result);
              // TODO: Put response in local storage
              localStorage.setItem('console_previous_asset', result);
              console.log('Stored tool response as previous asset:', result);
            }
          }
        };
      }

      // Create a unique dispatch function for this session
      const dispatchFunctionName = `dispatch_${Date.now()}`;
      window[dispatchFunctionName] = function(cmdStr) {
        consoleDispatch(cmdStr);
      };

      // Add the dispatch function reference to all buttons
      setTimeout(() => {
        const buttons = document.querySelectorAll(`button[onclick^="executeCommand('${commandSetId}"]`);
        buttons.forEach(btn => {
          btn.setAttribute('data-dispatch', dispatchFunctionName);
        });
      }, 0);

      return html;
    };

    // Helper function to process variable references in command payloads
    const processVariableReferences = function(payload) {
      if (!payload) return payload;

      // Create a deep copy of the payload to avoid modifying the original
      const processedPayload = JSON.parse(JSON.stringify(payload));

      // Process each property in the payload
      for (const [key, value] of Object.entries(processedPayload)) {
        if (typeof value === 'string' && value === 'PREVIOUS_ASSET') {
          try {
            const previousAsset = localStorage.getItem('console_previous_asset');
            if (previousAsset) {
              processedPayload[key] = previousAsset;
            }
          } catch (e) {
            console.error('Error accessing previous asset:', e);
          }
        } else if (typeof value === 'object' && value !== null) {
          // Recursively process nested objects
          processedPayload[key] = processVariableReferences(value);
        }
      }

      return processedPayload;
    };

    // Handle async operation without returning a Promise
    (async () => {
      try {
        consoleLog('message', `<span style="color: #AAA;">Connecting to AI assistant via local proxy...</span>`);

        const input = {
          prompt: message,
          top_k: 50,
          top_p: 0.9,
          max_tokens: 1024,
          min_tokens: 0,
          temperature: 0.7,
          system_prompt: systemPrompt,
          presence_penalty: 0,
          frequency_penalty: 0
        };

        consoleLog('message', `<span style="color: #AAA;">Thinking...</span>`);
        consoleLog('message', `<div style="color: #AEF; margin-top: 5px;">AI Assistant:</div>`);

        // Call the API through our proxy
        const output = await callReplicateAPI(API_CONFIG.models.toolUse, input);
        let responseText = "";
        if (Array.isArray(output)) {
          responseText = output.join('');
        } else if (typeof output === 'string') {
          responseText = output;
        } else {
          responseText = JSON.stringify(output);
        }

        // Note: We no longer store AI responses here.
        // Tool responses are stored when tools are executed.

        // Log the response to console in an expandable format
        console.groupCollapsed('📢 AI Response Details');
        console.log('%cRaw Response:', 'font-weight: bold; color: #7CF;');
        console.log(responseText);
        console.groupEnd();

        // Try to parse the response as JSON
        let formattedResponse = responseText;
        let commandsToExecute = [];
        try {
          const jsonResponse = JSON.parse(responseText);

          // Log the parsed JSON response in expandable format
          console.groupCollapsed('🛠️ Parsed JSON Response');
          console.log('%cFormatted Response:', 'font-weight: bold; color: #7CF;');
          console.log(jsonResponse);

          if (jsonResponse.commands && jsonResponse.commands.length > 0) {
            console.log('%cSuggested Commands:', 'font-weight: bold; color: #FFA;');
            jsonResponse.commands.forEach((cmd, index) => {
              console.log(`Command ${index + 1}:`, cmd);
            });
          } else {
            console.log('%cNo commands suggested', 'color: #AAA;');
          }
          console.groupEnd();

          // If we have a valid JSON response with the expected format
          if (jsonResponse && jsonResponse.response) {
            // Display the main response to the user
            formattedResponse = `<div>${jsonResponse.response}</div>`;

            // Store commands for potential execution
            if (jsonResponse.commands && jsonResponse.commands.length > 0) {
              commandsToExecute = jsonResponse.commands;
            }
          }
        } catch (e) {
          // If JSON parsing fails, use the raw response
          console.error("Error parsing AI response as JSON:", e);
          console.log('%cJSON Parse Error:', 'font-weight: bold; color: #F77;', e);
          formattedResponse = `<div>${responseText}</div>`;
        }

        // Display the response
        consoleLog('message', `<div style="color: #FFF; padding: 5px 0;">${formattedResponse}</div>`);

        // If we have commands to execute, display the confirmation UI
        if (commandsToExecute.length > 0) {
          const commandConfirmationUI = renderCommandConfirmation(commandsToExecute);
          consoleLog('message', commandConfirmationUI);
        }

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
  src: "src/commands/app/ask.js"
};
