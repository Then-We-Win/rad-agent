export default {
  guide: 'Lists all available command providers',
  documentation: `
# Providers Command

Lists all available command providers in the console.

## Syntax
\`\`\`
providers
\`\`\`

## Output
- List of all registered providers
- Count of commands in each provider

## Notes
- Use \`help:providername\` to see commands for a specific provider
- The default provider is used when no provider is specified in a command
  `,
  command: function() {
    const providers = Object.keys(app.config.globalProperties.$console.providers).sort()

    let output = `<div class="console-guide-heading">Available Providers:</div>`

    providers.forEach(provider => {
      const commandCount = Object.keys(app.config.globalProperties.$console.providers[provider]).length
      output += `<div class="console-guide-detail">• <span class="console-provider-name">${provider}</span> - ${commandCount} command${commandCount !== 1 ? 's' : ''}</div>`
    })

    output += `<div class="console-command-hint">Use 'help:providername' to see commands for a specific provider.</div>`

    return output
  },
  schema: {
    type: "object",
    properties: {}
  },
  src: "index.js"
}