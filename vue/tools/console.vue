<template>
  <div class="console-panel" :class="{ shown: isShown }">
    <div ref="display" class="console-display">
      <div v-for="(item, index) in logs" :key="index" v-html="item" >
      </div>
    </div>
    <input v-model="cmd" ref="input" :placeholder="config.placeholder" @keydown="keyhandler" class="console-input" />
  </div>
</template>

<script>
  // This is the infrastructure that toggles the console (via browser core so there is no interference)...
  function createHotkeyListener (self, key) {
    return function (e) {
      if (e.keyCode !== key) return
      self.toggle()
      e.preventDefault()
    }
  }

  export default {
    name: 'v-console',
    props: {
      settings: { type: Object, required: false }
    },
    computed: {
      config () {
        return this.settings || this.$console.defaultConfig
      }
    },
    data () {
      return {
        cmd: '', // The current console command
        logs: [], // The log stack
        history: [],
        historySelector: 0,
        isShown: false,
        consolePos: 0
      }
    },
    unmounted () {
      this.hotkeyListener && window.removeEventListener('keydown', this.hotkeyListener)
    },
    created () {
      this.hotkeyListener = createHotkeyListener(this, this.config.hotkey)
      window.addEventListener('keydown', this.hotkeyListener)
      this.config.welcome && this.log('message', this.config.welcome)
    },
    methods: {
      toggle () {
        console.log('toggling console...')
        if (this.config.onToggle) this.config.onToggle.bind(this)()

        if (this.isShown) {
          if (this.config.onHide) this.config.onHide.bind(this)()
          this.isShown = false
          this.$refs.input.blur()
        } else {
          if (this.config.onShow) this.config.onShow.bind(this)()
          this.isShown = true
          this.$nextTick(() => this.$refs.input.focus())
        }
      },
      keyhandler (e) {
        // e.preventDefault()
        // if (!this.config.caseSensitive) this.cmd = this.cmd.toLowerCase()
        switch (e.keyCode) {
          case 13: // Enter
            this.history.unshift(this.cmd) // Save history
            this.log('command', this.cmd) // Execute command
            if (this.history.length > this.config.historySize) this.history = this.history.splice(0, this.config.historySize)
            this.dispatch(this.cmd)
            this.historySelector = -1 // Select last history item
            this.cmd = '' // Clear command input
            break
          case 38: // Up Arrow
            if (this.history[this.historySelector + 1] !== undefined) {
              this.historySelector++
              this.cmd = this.history[this.historySelector]
            }
            break
          case 40: // Down Arrow
            if (this.history[this.historySelector - 1] !== undefined) {
              this.historySelector--
              this.cmd = this.history[this.historySelector]
            }
            break
          case 9: // Tab
            this.historySelector = -1
            this.history[0] = this.cmd = this.autoComplete()
            break
          default:
            this.historySelector = -1
        }
      },
      autoComplete () {
        if (this.cmd === '') return this.cmd
        const cmd = this.cmd

        // Extract command and provider parts for autocompletion
        const parts = cmd.split(':')
        const commandPart = parts[0]
        const providerPart = parts.length > 1 ? parts[1] : ''

        // Get all commands for autocompletion
        const allCommands = []

        // If we're typing a provider part, complete providers
        if (cmd.includes(':') && providerPart !== '') {
          const providers = Object.keys(this.$console.providers)
          const matchedProviders = providers.filter(provider =>
            provider.startsWith(providerPart)
          )

          if (matchedProviders.length === 1) {
            return `${commandPart}:${matchedProviders[0]} `
          }

          if (matchedProviders.length > 1) {
            this.log('message', `Available providers: ${matchedProviders.join(', ')}`)
            return cmd
          }

          return cmd
        }

        // Otherwise, complete commands
        Object.keys(this.$console.providers).forEach(provider => {
          Object.keys(this.$console.providers[provider]).forEach(cmdName => {
            // If provider is default (app), show both formats
            if (provider === this.$console.defaultConfig.defaultProvider) {
              allCommands.push(cmdName) // Without provider
            }
            allCommands.push(`${cmdName}:${provider}`) // With provider
          })
        })

        const filterFn = (handlerName) => {
          return handlerName.indexOf(cmd) === 0
        }

        const matched = allCommands.filter(filterFn)

        switch (matched.length) {
          case 0:
            return this.cmd
          case 1:
            return matched[0] + ' '
          default:
            this.log('message', `Matching commands: ${matched.join(', ')}`)
            return this.cmd
        }
      },
      log (type) { // Writes a command to the log...
        var args = Array.prototype.slice.call(arguments, 1)
        switch (type) {
          case 'command':
            this.logs.push('<span class="console-user-input">' + args.join(' ') + '</span>') // Sanitize
            break
          case 'message':
            this.logs.push(args.join(' '))
            break
          case 'documentation': // New type for documentation rendering
            this.logs.push('<div class="console-documentation">' + args.join(' ') + '</div>')
            break
          case 'schema': // New type for schema rendering
            this.logs.push('<div class="console-command-schema">' + args.join(' ') + '</div>')
            break
          case 'image': // New type for image rendering
            if (args[0]) {
              this.logs.push('<div class="console-image-container"><img src="' + args[0] + '" alt="Command reference"></div>')
            }
            break
          default:
            args.unshift(type)
            this.logs.push(args.join(' '))
        }
        this.$nextTick(() => {
          this.$refs.display.scrollTop = this.$refs.display.scrollHeight
        })
      },
      // Render markdown to HTML
      renderMarkdown (markdown) {
        if (!markdown) return '';

        // Simple markdown parser
        let html = markdown
          // Headers
          .replace(/^### (.*$)/gm, '<h3>$1</h3>')
          .replace(/^## (.*$)/gm, '<h2>$1</h2>')
          .replace(/^# (.*$)/gm, '<h1>$1</h1>')
          // Code blocks
          .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
          // Inline code
          .replace(/`([^`]+)`/g, '<code>$1</code>')
          // Lists
          .replace(/^\* (.*$)/gm, '<ul><li>$1</li></ul>')
          // Line breaks
          .replace(/\n/g, '<br>');

        return html;
      },
      // Helper to format command usage
      formatCommandUsage (cmd, cmdName, providerName) {
        if (!cmd || !cmd.schema) return '';

        const schema = cmd.schema;
        let usage = `<span style="color: #AAA;">Usage: ${cmdName}`;

        if (providerName !== this.config.defaultProvider) {
          usage += `:${providerName}`;
        }

        if (schema.properties) {
          Object.keys(schema.properties).forEach(prop => {
            const required = schema.required && schema.required.includes(prop);
            usage += required ? ` <${prop}>` : ` [${prop}]`;
          });
        }

        usage += '</span>';
        return usage;
      },
      // Validate command arguments against schema
      validateArgs (command, args) {
        // Parse command and provider
        const parts = command.split(':');
        const cmdName = parts[0];
        const providerName = parts.length > 1 ? parts[1] : this.config.defaultProvider;

        // Get the provider and command
        const provider = this.$console.providers[providerName];
        if (!provider) return null;

        const cmd = provider[cmdName];
        if (!cmd || !cmd.schema) return null;

        // Validate required arguments
        const schema = cmd.schema;
        if (schema.required && schema.required.length > 0) {
          if (!args || args.length < schema.required.length) {
            const missingArgs = schema.required.slice(args ? args.length : 0);

            let errorMessage = `<span style="color: #F88;">Missing required arguments: ${missingArgs.join(', ')}</span><br>`;
            errorMessage += this.formatCommandUsage(cmd, cmdName, providerName);

            return errorMessage;
          }
        }

        // Validate argument types if needed (simplified)
        if (schema.properties && args) {
          const errors = [];
          Object.keys(schema.properties).forEach((prop, index) => {
            if (index < args.length) {
              const property = schema.properties[prop];
              if (property.type === 'number' && isNaN(Number(args[index]))) {
                errors.push(`Argument '${prop}' must be a number`);
              } else if (property.type === 'object' && typeof args[index] === 'string') {
                try {
                  JSON.parse(args[index]);
                } catch (e) {
                  errors.push(`Argument '${prop}' must be a valid JSON object`);
                }
              }
            }
          });

          if (errors.length > 0) {
            let errorMessage = `<span style="color: #F88;">${errors.join('<br>')}</span><br>`;
            errorMessage += this.formatCommandUsage(cmd, cmdName, providerName);

            return errorMessage;
          }
        }

        // Check dependencies between parameters
        if (schema.dependencies) {
          for (const [param, deps] of Object.entries(schema.dependencies)) {
            const paramIndex = Object.keys(schema.properties).indexOf(param);
            if (paramIndex >= 0 && paramIndex < args.length) {
              // This parameter is provided, check its dependencies
              for (const dep of deps) {
                const depIndex = Object.keys(schema.properties).indexOf(dep);
                if (depIndex >= args.length || !args[depIndex]) {
                  return `<span style="color: #F88;">Parameter '${param}' requires '${dep}' to be specified</span><br>` +
                         this.formatCommandUsage(cmd, cmdName, providerName);
                }
              }
            }
          }
        }

        return null;
      },
      // Enhanced dispatch method with validation
      dispatch (str, invoker = 'console') {
        const readableTime = () => {
          const now = new Date()
          const pad = (n, width = 2) => String(n).padStart(width, '0')
          return (
            `${pad(now.getHours())}:` +
            `${pad(now.getMinutes())}:` +
            `${pad(now.getSeconds())}.` +
            `${pad(now.getMilliseconds(), 3)}`
          )
        }
        const cmdTime = readableTime()
        console.log('command', `(${invoker}@${cmdTime}) ${str}`)
        if (invoker !== 'console') this.log('command', `(${invoker}@${cmdTime}) ${str}`)
        if (!str || typeof str !== 'string') return;

        const parts = str.split(' ');
        const commandWithProvider = parts[0];
        const args = parts.slice(1);

        // Parse command and provider
        let commandName, providerName;
        if (commandWithProvider.includes(':')) {
          [commandName, providerName] = commandWithProvider.split(':');
        } else {
          commandName = commandWithProvider;
          providerName = this.config.defaultProvider;
        }

        // Normalize case if needed
        if (!this.config.caseSensitive) {
          commandName = commandName.toLowerCase();
          providerName = providerName.toLowerCase();
        }

        // Validate the command/provider exists
        if (!this.$console.providers[providerName]) {
          this.log('message', `<div class="console-guide-tip">Unknown provider: "${providerName}". Try ${this.config.helpCmd} to see available providers.</div>`);
          return;
        }

        // Get the command
        const cmd = this.$console.providers[providerName][commandName];
        if (!cmd) {
          this.log('message', `<div class="console-guide-tip">Unknown command: "${commandName}" for provider "${providerName}". Try ${this.config.helpCmd}</div>`);
          return;
        }

        // Validate arguments against schema if available
        const validationError = this.validateArgs(commandWithProvider, args);
        if (validationError) {
          this.log('message', validationError);
          return;
        }

        // Execute the command with the correct context
        const result = cmd.command.call(cmd.context || this, args);

        if (result) {
          this.log('message', result);
        }

        // If this is the help command with documentation, also show it
        if (commandName === this.config.helpCmd && args.length > 0) {
          // Try to find the command they want help with
          const helpTarget = args[0];
          let helpCmdName, helpProviderName;

          if (helpTarget.includes(':')) {
            [helpCmdName, helpProviderName] = helpTarget.split(':');
          } else {
            helpCmdName = helpTarget;
            helpProviderName = this.config.defaultProvider;
          }

          if (!this.config.caseSensitive) {
            helpCmdName = helpCmdName.toLowerCase();
            helpProviderName = helpProviderName.toLowerCase();
          }

          // Check if the target command exists
          if (this.$console.providers[helpProviderName] &&
              this.$console.providers[helpProviderName][helpCmdName]) {

            const helpCmd = this.$console.providers[helpProviderName][helpCmdName];

            // Show documentation if available
            if (helpCmd.documentation) {
              this.log('documentation', this.renderMarkdown(helpCmd.documentation));
            }

            // Show image if available
            if (helpCmd.image) {
              this.log('image', helpCmd.image);
            }

            // Show schema if available
            if (helpCmd.schema) {
              this.log('schema', this.formatSchema(helpCmd.schema));
            }
          }
        }
      },
      // Format schema for display
      formatSchema (schema) {
        if (!schema || !schema.properties) return '';

        let output = '<div style="color: #7CF; font-weight: bold; margin-bottom: 5px;">Command Parameters:</div>';

        Object.keys(schema.properties).forEach(prop => {
          const property = schema.properties[prop];
          const required = schema.required && schema.required.includes(prop);

          output += `<div style="margin: 3px 0;">`;
          output += `<span style="color: #FFA;">${prop}</span>`;
          output += required ?
            ` <span class="required">(required)</span>` :
            ` <span style="color: #AAA;">(optional)</span>`;

          if (property.type) {
            output += ` <span style="color: #AAA;">- ${property.type}</span>`;
          }

          if (property.enum) {
            output += ` <span style="color: #AAA;">[${property.enum.join('|')}]</span>`;
          }

          if (property.description) {
            output += `<br><span style="color: #CCC; margin-left: 10px;">${property.description}</span>`;
          }

          if (property.default !== undefined) {
            output += `<br><span style="color: #AAA; margin-left: 10px;">Default: ${property.default}</span>`;
          }

          output += `</div>`;
        });

        return output;
      }
    }
  }
</script>

<style>
.console-panel {
  z-index: 99999;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(50vh + 18px);
  background-color: rgba(0, 0, 0, 0.8);
  transition: margin-top 100ms ease-out 1ms, visibility 0s linear 100ms;
  margin-top: calc(-50% - 18px);
  visibility: hidden;
  pointer-events: none;
}

.console-panel.shown {
  margin-top: 0;
  visibility: visible;
  pointer-events: auto;
  transition: margin-top 100ms ease-out 1ms, visibility 0s linear 0s;
}


  .console-guide-tip { color: rgba(255, 255, 255, 0.9); }

  .console-guide-heading {
    font-size: 1.1em;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.9);
  }

  .console-guide-detail {
    font-size: 0.8em;
    padding-bottom: 1em;
    color: rgba(255, 255, 255, 0.8);
  }

  .console-display,
  .console-input {
    margin: 0;
    padding: 2px 5px;
    box-sizing: border-box;
    position: absolute;
    width: 100%;
    font: 14px/20px Menlo, monospace;
    color: #DDD;
    letter-spacing: 0.05em
  }

  .console-display {
    bottom: 18px;
    height: calc(100vh - 50vh);
    overflow-y: scroll;
  }

  .console-input {
    outline: none;
    background-color: transparent;
    border: 0;
    bottom: 0;
    line-height: 16px;
    padding: 4px 5px;
  }

  .console-user-input { color: #7E0 }

  .console-command-list {
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 5px;
  }

  .console-command-name {
    color: #7E0;
    font-weight: bold;
    padding: 0 2px;
  }

  .console-provider-name {
    color: #0AE;
    font-weight: normal;
    font-style: italic;
    font-size: 0.9em;
  }

  /* Enhanced styles for documentation */
  .console-documentation {
    color: #CCC;
    margin: 10px 0;
    padding: 10px;
    background: rgba(0,0,0,0.3);
    border-radius: 5px;
    max-height: 300px;
    overflow-y: auto;
  }

  .console-documentation h1 {
    font-size: 1.4em;
    color: #FFA;
    margin-top: 0;
    margin-bottom: 10px;
  }

  .console-documentation h2 {
    font-size: 1.2em;
    color: #FFA;
    margin-top: 15px;
    margin-bottom: 8px;
  }

  .console-documentation h3 {
    font-size: 1.1em;
    color: #FFA;
    margin-top: 12px;
    margin-bottom: 5px;
  }

  .console-documentation pre {
    background: rgba(0,0,0,0.4);
    padding: 10px;
    border-radius: 3px;
    overflow-x: auto;
  }

  .console-documentation code {
    font-family: Menlo, monospace;
    font-size: 0.9em;
  }

  .console-documentation ul {
    padding-left: 20px;
  }

  .console-command-info {
    display: flex;
    margin-bottom: 10px;
  }

  .console-command-meta {
    flex: 1;
    color: #AAA;
    font-size: 0.9em;
  }

  .console-command-meta span {
    display: block;
    margin-bottom: 3px;
  }

  .console-command-meta .label {
    color: #7CF;
    font-weight: bold;
  }

  .console-command-schema {
    background: rgba(0,0,0,0.2);
    padding: 8px;
    border-radius: 4px;
    margin-top: 5px;
    font-size: 0.9em;
  }

  .console-command-schema .required {
    color: #F77;
  }

  .console-image-container {
    margin: 10px 0;
    text-align: center;
  }

  .console-image-container img {
    max-width: 100%;
    border-radius: 5px;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .console-guide-subheading {
    color: #AEF;
    font-size: 0.9em;
    margin-top: 8px;
    margin-bottom: 3px;
  }
</style>