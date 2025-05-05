// src/commands/minimax/music.js
// Music generation command for Minimax provider

import { API_CONFIG, callReplicateAPI } from '../replicate/util/config';

export default {
  guide: 'Generate music from lyrics using Minimax AI: music [lyrics] [bitrate] [sample_rate]',
  documentation: `
# Minimax Music Command

Generate original music from lyrics using Minimax AI.

## Syntax
\`\`\`
music "Your lyrics here" [bitrate] [sample_rate]
\`\`\`

## Parameters
- \`lyrics\` (required): The lyrics for your song
- \`bitrate\` (optional): Audio bitrate in bits per second (defaults to 256000)
- \`sample_rate\` (optional): Audio sample rate in Hz (defaults to 44100)

## Examples
\`\`\`
music "Tell me your story in the moonlight, shadows dancing on the wall"
music "Electronic beats, digital dreams" 320000 48000
\`\`\`
  `,
  command: function(args) {
    if (!args || args.length === 0) {
      return '<span style="color: #F88;">Please provide lyrics to generate music</span>';
    }

    // Parse args properly to respect quotes
    let lyrics, bitrate, sampleRate;

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
    [lyrics, bitrate, sampleRate] = cleanParts;

    // Default values if not provided
    bitrate = parseInt(bitrate) || 256000;
    sampleRate = parseInt(sampleRate) || 44100;

    if (!lyrics || lyrics.trim() === '') {
      return '<span style="color: #F88;">Please provide non-empty lyrics to generate music</span>';
    }

    // Store a reference to the console's log method
    const consoleLog = this.log.bind(this);

    consoleLog('message', `<span style="color: #7CF;">Generating music for lyrics: "${lyrics.substring(0, 50)}${lyrics.length > 50 ? '...' : ''}"</span>`);

    // Handle async operation without returning a Promise
    (async () => {
      try {
        const input = {
          lyrics: lyrics,
          bitrate: bitrate,
          sample_rate: sampleRate,
          // The song_file parameter isn't needed for initial generation
          // but we'll include the field for API compatibility
          song_file: ""
        };

        consoleLog('message', `<span style="color: #AAA;">Connecting to Minimax API via local proxy...</span>`);
        consoleLog('message', `<span style="color: #AAA;">This may take several minutes depending on the length of the lyrics...</span>`);

        // Call the API through the replicate proxy
        const output = await callReplicateAPI("minimax/music-01", input);

        if (output && output.length > 0) {
          const audioUrl = output[0];
          consoleLog('message', `<div>
            <audio controls src="${audioUrl}" style="width: 100%; max-width: 600px;"></audio>
            <div style="color: #AAA; font-size: 0.9em; margin-top: 5px;">
              Bitrate: ${bitrate} bps | Sample Rate: ${sampleRate} Hz
            </div>
            <div style="color: #AAA; font-size: 0.9em; margin-top: 5px;">
              Lyrics: "${lyrics.substring(0, 100)}${lyrics.length > 100 ? '...' : ''}"
            </div>
          </div>`);
        } else {
          consoleLog('message', '<span style="color: #F88;">Failed to generate music: No output received from API</span>');
        }
      } catch (error) {
        console.error('Minimax API error:', error);
        consoleLog('message', `<span style="color: #F88;">Error generating music: ${error.message || 'Unknown error'}</span>`);
      }
    })();

    // Return immediately, the async function will handle the response
    return `<span style="color: #7CF;">Processing music generation request...</span>`;
  },
  schema: {
    type: "object",
    required: ["lyrics"],
    properties: {
      lyrics: {
        type: "string",
        description: "Lyrics to generate music from"
      },
      bitrate: {
        type: "number",
        description: "Audio bitrate in bits per second",
        default: 256000
      },
      sample_rate: {
        type: "number",
        description: "Audio sample rate in Hz",
        default: 44100
      }
    }
  },
  src: "src/commands/minimax/music.js"
};