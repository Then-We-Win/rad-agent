# Agentic OS

A powerful one-step agentic AI operating system for modern application development.

* Before 2024 developers worked primarally in an IDE and used a search tool to copy-paste ~50% of their code, and wrote the rest.
* In 2024 developers worked primarally in an IDE and used AI plugins or AI tools to generate ~90% of their code, and wrote the rest.
* In 2025, developers will work in their app itself, speaking to AI to generate close to 100% of their code. Coding skills are no longer needed.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Core Concepts](#core-concepts)
- [Commands Reference](#commands-reference)
- [Command Providers](#command-providers)
- [AI Integration](#ai-integration)
- [Command Piping](#command-piping)
- [Creating Custom Commands](#creating-custom-commands)

## Overview

Agentic OS provides a powerful interactive console for application development, supporting multiple languages, frameworks and styles. You can hook your application into the OS and immediately benefit from it's tooling.

If you're familiar with the command line, just imagine a command line that has:

* Full web capabilities, including links, styling, inline images, videos, sounds, etc.
* Full AI capabilites, letting the AI use it just like you do.
* Chaining and piping output from one command to another.
* Unlimited service providers. Stop worrying about your providers API and just use it in plain Engligh.
* Full application awareness (it understands and has access to your source code, able to write code back to your source, and make commits)
* Full state exploration (it can traverse your state at any time, take snapshots, use it for feedback and more)

intecate AI integration, piping, chaining and extensible command providers for Vue applications.

 command providers, command piping, and AI-assisted functionality. It's designed for developers to easily debug, analyze, and interact with their Vue applications at runtime.

## Getting Started

### Installation

```javascript
// In your app:
import console from 'vue-console'

app.use(console, {
  // Optional custom settings
  settings: {
    version: '1.0.0',
    hotkey: 192, // '~' key
    defaultProvider: 'app',
    // Additional settings...
  },
  // Optional pre-loaded providers with commands
  providers: {
    // Your custom providers here...
  }
})
```

### Basic Usage

- Press the tilde key (`~`) to open the console
- Type `help` to see available commands
- Use command completion with the `Tab` key
- Access command history with the up/down arrow keys

## Core Concepts

### Command Structure

Commands follow a consistent format:

```
commandName[:provider] [arguments]
```

- `commandName`: The name of the command to execute
- `provider`: Optional provider namespace (defaults to `app`)
- `arguments`: Space-separated arguments for the command

### Command Output Format

All commands return a standardized JSON output format:

```json
{
  "response": {
    // Primary command output data
  },
  "meta": {
    "command": "commandName",
    "timestamp": "ISO timestamp",
    // Additional metadata
  }
}
```

- `response`: Contains the primary command output that can be piped to other commands
- `meta`: Contains metadata about the command execution

## Commands Reference

### App Provider Commands

| Command | Description | Arguments |
|---------|-------------|-----------|
| `ask` | Chat with an AI assistant | `[message]` |
| `emit` | Emit an event to the console bus | `[event] [data]` |
| `help` | Show available commands or details for a specific command | `[commandName[:provider]]` |
| `providers` | List all registered command providers | none |

### Dev Provider Commands

| Command | Description | Arguments |
|---------|-------------|-----------|
| `analyze` | Analyze bundle size | `[mode]` (components or modules) |
| `events` | Monitor events emitted by a component | `[componentName]` |
| `feature` | Manage application feature flags | `[flagName] [state]` |
| `inspect` | Inspect internal Vue component properties | `[path]` |
| `performance` | Show Vue application performance metrics | none |
| `routes` | Show all registered routes in Vue Router | none |
| `state` | Inspect the state of a component | `[componentName]` |
| `store` | Display Vuex/Pinia store state | `[moduleName]` |

### Replicate Provider Commands

| Command | Description | Arguments |
|---------|-------------|-----------|
| `ask` | Chat with an AI assistant via Replicate API | `[message]` |
| `image` | Generate an image using Replicate AI | `[prompt] [aspect_ratio] [output_format]` |

## Command Providers

The console system uses providers to organize commands into namespaces. The default providers are:

- `app`: Core application commands
- `dev`: Development and debugging tools
- `replicate`: Replicate AI API integration

You can access commands from specific providers using the colon syntax:
```
commandName:provider [arguments]
```

## AI Integration

The console integrates with AI services to provide intelligent assistance:

### Ask Command

The `ask` command allows you to chat with an AI assistant:

```
ask What is Vue's reactivity system?
```

The assistant has context about your application and can suggest relevant commands based on your query.

### Image Generation

Generate images using AI with the `image:replicate` command:

```
image:replicate "A mountain landscape at sunset" 16:9 webp
```

## Command Piping

Commands can be piped together to create powerful workflows. The pipe operator (`|`) connects the output of one command to the input of another.

### Basic Piping

```
command1 [args] | command2 [args]
```

The output of `command1` becomes available to `command2` via the `$previous` variable.

### Accessing Specific Output Fields

You can access specific fields from the previous command using dot notation:

```
ask:claude 'What time is it?' | say:playai $previous.response.text
```

This would pass only the `text` field from the `response` object of the `ask:claude` command to the `say:playai` command.

### Multiple Pipes

Commands can be chained multiple times:

```
command1 | command2 | command3 $previous.response.field
```

Each command only has access to the output of the immediately preceding command.

## Creating Custom Commands

You can create custom commands by defining them in your Vue components:

```javascript
// In your Vue component
export default {
  // Component definition...
  commands: {
    'myCommand': {
      return {
        guide: 'Description of what the command does',
        command(args) {
          // Command implementation

          // Return standardized output format
          return {
            response: {
              // Primary output data
            },
            meta: {
              command: "myCommand",
              timestamp: new Date().toISOString(),
              // Additional metadata
            }
          };
        },
        schema: {
          type: "object",
          required: ["requiredArg"],
          properties: {
            requiredArg: {
              type: "string",
              description: "Description of the argument"
            },
            optionalArg: {
              type: "number",
              description: "Description of optional argument"
            }
          }
        }
      }
    },

    // Provider-specific command
    'customCommand:myProvider': {
      // Command definition...
    }
  }
}
```

### Command Schema

Defining a schema for your command enables:

- Automatic argument validation
- Intelligent autocompletion
- Better help documentation

The schema follows JSON Schema format with these properties:

- `type`: The schema type (typically "object")
- `required`: Array of required argument names
- `properties`: Object mapping argument names to their definitions
  - Each property can have `type`, `description`, `enum`, and other JSON Schema attributes

## Advanced Features

### Command History

The console maintains a history of previously executed commands, accessible using the up and down arrow keys.

### Custom Styling

The console's appearance can be customized through CSS. Key style classes include:

- `.console-panel`: The main console container
- `.console-display`: The output display area
- `.console-input`: The command input field

### Programmatic Control

You can control the console programmatically through the global `$console` object:

```javascript
// Toggle console visibility
app.config.globalProperties.$console.toggle()

// Log a message to the console
app.config.globalProperties.$console.log('message', 'Hello from code!')

// Execute a command programmatically
app.config.globalProperties.$console.dispatch('help')
```