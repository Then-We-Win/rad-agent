// src/commands/playht/say.js
// Text-to-speech command for PlayHT provider

import { API_CONFIG, callReplicateAPI } from '../replicate/util/config';

export default {
  guide: 'Generate speech from text using PlayHT: say [text] [voice] [language]',
  documentation: `
# PlayHT Say Command

Generate natural-sounding speech from text using PlayHT's AI voice models.

## Syntax
\`\`\`
say "Your text here" [voice] [language]
\`\`\`

## Parameters
- \`text\` (required): The text you want to convert to speech
- \`voice\` (optional): Voice to use (defaults to "Nia")
- \`language\` (optional): Language of the text (defaults to "english")

## Available Voices
- "Nia" (Young female US conversational voice)
- "Nova" (Female US narration voice)
- "Adam" (Male US conversational voice)
- "Ethan" (Male US narration voice)
- "Ryan" (Male US conversational voice)
- "Hudson" (Male British voice)

## Examples
\`\`\`
say "Hello world, how are you today?"
say "Bonjour le monde" "Nova" "french"
\`\`\`
  `,
  command: function(args) {
    if (!args || args.length === 0) {
      return '<span style="color: #F88;">Please provide text to convert to speech</span>';
    }

    // Parse args properly to respect quotes
    let text, voice, language;

    // Join all args and then re-parse to handle quotes properly
    const fullArgsString = args.join(' ');

    // Extract parts in quotes as a single argument
    const quotedParts = fullArgsString.match(/"([^"]*)"|'([^']*)'|([^ ]+)/g) || [];

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

    // Assign the parts to our variables
    [text, voice, language] = cleanParts;

    // Default values if not provided
    voice = voice || "Nia (Young female US conversational voice)";
    language = language || "english";

    if (!text || text.trim() === '') {
      return '<span style="color: #F88;">Please provide non-empty text to convert to speech</span>';
    }

    // Map simple voice names to full descriptions if needed
    const voiceMap = {
      "nia": "Nia (Young female US conversational voice)",
      "angelo": "Angelo (Young male US conversational voice)",
      "adam": "Adam (Male US conversational voice)",
      "ethan": "Ethan (Male US narration voice)",
      "ryan": "Ryan (Male US conversational voice)",
      "hudson": "Hudson (Male British voice)"
    };

    // Apply the mapping if a simple name was provided
    const lowerVoice = voice.toLowerCase();
    if (voiceMap[lowerVoice]) {
      voice = voiceMap[lowerVoice];
    }

    // Store a reference to the console's log method
    const consoleLog = this.log.bind(this);

    consoleLog('message', `<span style="color: #7CF;">Generating speech for: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"</span>`);

    // Handle async operation without returning a Promise
    (async () => {
      try {
        const input = {
          text: text,
          voice: voice,
          prompt: "",
          prompt2: "",
          voice_2: "None",
          language: language,
          turnPrefix: "Voice 1:",
          temperature: 1.02,
          turnPrefix2: "Voice 2:",
          voice_conditioning_seconds: 20,
          voice_conditioning_seconds_2: 20
        };

        consoleLog('message', `<span style="color: #AAA;">Connecting to PlayHT API via local proxy...</span>`);

        // Call the API through the replicate proxy
        const output = await callReplicateAPI("playht/play-dialog", input);

        if (output) {
          const audioUrl = output;
          consoleLog('message', `<div>
            <audio controls src="${audioUrl}" style="width: 100%; max-width: 600px;"></audio>
            <div style="color: #AAA; font-size: 0.9em; margin-top: 5px;">
              Voice: ${voice} | Language: ${language}
            </div>
          </div>`);
        } else {
          consoleLog('message', '<span style="color: #F88;">Failed to generate speech: No output received from API</span>');
        }
      } catch (error) {
        console.error('PlayHT API error:', error);
        consoleLog('message', `<span style="color: #F88;">Error generating speech: ${error.message || 'Unknown error'}</span>`);
      }
    })();

    // Return immediately, the async function will handle the response
    return `<span style="color: #7CF;">Processing speech request...</span>`;
  },
  schema: {
    type: "object",
    required: ["text"],
    properties: {
      text: {
        type: "string",
        description: "Text to convert to speech"
      },
      voice: {
        type: "string",
        description: "Voice to use for speech generation",
        default: "Nia (Young female US conversational voice)"
      },
      language: {
        type: "string",
        description: "Language of the text",
        default: "english"
      }
    }
  },
  src: "src/commands/playht/say.js"
};