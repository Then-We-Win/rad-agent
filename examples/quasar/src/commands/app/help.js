export default {
  guide: 'Lists all available commands or shows guide for a specific command or provider: help [commandName[:provider]] or help:provider',
  documentation: ``,
  command: function(args) {
    const defaultProvider = this.$console.defaultConfig.defaultProvider

    if (args && args.length > 0) {
      let commandWithProvider = args[0]
      let commandName, providerName

      if (commandWithProvider.includes(':')) {
        [commandName, providerName] = commandWithProvider.split(':')
      } else {
        commandName = commandWithProvider
        providerName = defaultProvider
      }

      if (!this.$console.defaultConfig.caseSensitive) {
        commandName = commandName.toLowerCase()
        providerName = providerName.toLowerCase()
      }

      // If provider doesn't exist
      if (!this.$console.providers[providerName]) {
        return `<span style="color: #F88;">Unknown provider: ${providerName}</span>`
      }

      // If command exists in provider
      if (this.$console.providers[providerName][commandName]) {
        const cmd = this.$console.providers[providerName][commandName]

        // Format basic information
        let output = `<div class="console-guide-heading">${commandName}${providerName !== defaultProvider ? ':' + providerName : ''}</div>` +
                     `<div class="console-guide-detail">${cmd.guide}</div>`

        // Add component info if available
        if (cmd.component) {
          output += `<div class="console-guide-subheading">Component:</div>` +
                    `<div class="console-guide-detail">${cmd.component}</div>`
        }

        // Add source info if available
        if (cmd.src) {
          output += `<div class="console-guide-subheading">Source:</div>` +
                    `<div class="console-guide-detail">${cmd.src}</div>`
        }

        // Add schema information if available
        if (cmd.schema) {
          output += `<div class="console-guide-subheading">Arguments:</div>`

          if (cmd.schema.properties) {
            output += `<div class="console-guide-detail">`
            Object.keys(cmd.schema.properties).forEach(prop => {
              const property = cmd.schema.properties[prop]
              const required = cmd.schema.required && cmd.schema.required.includes(prop)
              output += `• ${prop}${required ? ' (required)' : ''}: ${property.description || property.type}<br>`
            })
            output += `</div>`
          }
        }

        return output
      } else {
        return `<span style="color: #F88;">Unknown command: ${commandName} for provider ${providerName}</span>`
      }
    }

    // Display all commands by provider
    let output = `<div class="console-command-list"><span style="color: #AEF;">Available providers:</span> `

    const providers = Object.keys(this.$console.providers).sort()

    output += providers.map(provider =>
      `<span class="console-provider-name">${provider}</span>`
    ).join(' | ')

    output += `</div>`

    // For each provider, list its commands
    providers.forEach(provider => {
      const commands = Object.keys(this.$console.providers[provider]).sort()

      if (commands.length > 0) {
        output += `<div class="console-command-list"><span class="console-provider-name">${provider}</span> commands: `

        output += commands.map(command =>
          `<span class="console-command-name">${command}${provider !== defaultProvider ? ':' + provider : ''}</span>`
        ).join(' | ')

        output += `</div>`
      }
    })

    output += `<div class="console-command-hint">Type 'help [command]' or 'help [command:provider]' for more information.</div>`

    return output
  },
  schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "Command name to get help for"
      }
    }
  },
  src: "src/commands/dev/help.js"
}