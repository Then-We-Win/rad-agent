// src/commands/replicate/image.js
// Image generation command for Replicate provider

import { API_CONFIG, callReplicateAPI } from './util/config';

export default {
  guide: 'Generate an image using Replicate AI: image [prompt] [aspect_ratio] [output_format]',
  documentation: ``,
  command: function(args) {
    if (!args || args.length === 0) {
      return '<span style="color: #F88;">Please provide a prompt to generate an image</span>';
    }

    // Parse args properly to respect quotes
    let prompt, aspectRatio, outputFormat;

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
    [prompt, aspectRatio, outputFormat] = cleanParts;

    // Default values if not provided
    aspectRatio = aspectRatio || "1:1";
    outputFormat = outputFormat || "webp";

    // Validate aspect ratio
    const validAspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];
    if (!validAspectRatios.includes(aspectRatio)) {
      return `<span style="color: #F88;">Invalid aspect ratio: ${aspectRatio}. Valid options are: ${validAspectRatios.join(", ")}</span>`;
    }

    // Validate output format
    const validFormats = ["webp", "png", "jpg"];
    if (!validFormats.includes(outputFormat)) {
      return `<span style="color: #F88;">Invalid output format: ${outputFormat}. Valid options are: ${validFormats.join(", ")}</span>`;
    }

    // Store a reference to the console's log method
    const consoleLog = this.log.bind(this);

    consoleLog('message', `<span style="color: #7CF;">Generating image with prompt: "${prompt}"...</span>`);

    // Handle async operation without returning a Promise
    (async () => {
      try {
        const input = {
          prompt: prompt,
          go_fast: true,
          megapixels: "1",
          num_outputs: 1,
          aspect_ratio: aspectRatio,
          output_format: outputFormat,
          output_quality: 80,
          num_inference_steps: 4
        };

        consoleLog('message', `<span style="color: #AAA;">Connecting to Replicate API via local proxy...</span>`);

        // Call the API through our proxy
        const output = await callReplicateAPI(API_CONFIG.models.imageGeneration, input);

        if (output && output.length > 0) {
          const imageUrl = output[0];
          consoleLog('image', imageUrl);
          localStorage.setItem('console_previous_asset', imageUrl);
          consoleLog('message', `<div style="color: #AAA; font-size: 0.9em;">
            Prompt: "${prompt}" | Aspect ratio: ${aspectRatio} | Format: ${outputFormat}
          </div>`);
        } else {
          consoleLog('message', '<span style="color: #F88;">Failed to generate image: No output received from Replicate API</span>');
        }
      } catch (error) {
        console.error('Replicate API error:', error);
        consoleLog('message', `<span style="color: #F88;">Error generating image: ${error.message || 'Unknown error'}</span>`);
      }
    })();

    // Return immediately, the async function will handle the response
    return `<span style="color: #7CF;">Processing image request for prompt: "${prompt}"...</span>`;
  },
  schema: {
    type: "object",
    required: ["prompt"],
    properties: {
      prompt: {
        type: "string",
        description: "Text description of the image you want to generate"
      },
      aspect_ratio: {
        type: "string",
        enum: ["1:1", "16:9", "9:16", "4:3", "3:4"],
        default: "1:1",
        description: "Aspect ratio of the output image"
      },
      output_format: {
        type: "string",
        enum: ["webp", "png", "jpg"],
        default: "webp",
        description: "Image format for the generated output"
      }
    }
  },
  src: "src/commands/replicate/image.js"
};