export default {
  guide: 'Inspects internal Vue component properties: inspect [path]',
  documentation: `
# Inspect Command

The inspect command allows you to explore Vue component properties and state.

## Syntax
\`\`\`
inspect [path]
\`\`\`

## Parameters
- \`path\` (optional): Dot-notation path to a specific property

## Examples
\`\`\`
inspect            # Show available top-level properties
inspect $data      # Inspect component data
inspect $refs.list # Inspect a specific ref
\`\`\`
  `,
  command: function(args) {
    if (!args || args.length === 0) {
      let output = `<span style="color: #8CF;">Available top-level properties to explore:</span><br>`

      // List Vue instance properties
      const vueProps = ['$data', '$props', '$el', '$options', '$parent', '$root', '$slots', '$refs', '$attrs']

      output += vueProps.map(prop =>
        `<span style="color: #AAA;">• </span><span style="color: #FFA;">${prop}</span>`
      ).join('<br>')

      output += `<br><br><span style="color: #AAA;">Usage: inspect [property.path]</span>`
      return output
    }

    const path = args[0]
    try {
      // Use this.$parent to get the parent component of the console
      const component = this.$parent || this

      // Navigate through the object path
      const result = getValueByPath(component, path)

      // Display the result
      if (result === undefined) {
        return `<span style="color: #F88;">Path not found: ${path}</span>`
      }

      if (typeof result === 'object' && result !== null) {
        return formatObjectResult(result, path)
      } else {
        return `<span style="color: #8CF;">${path}</span>: <span style="color: #FFA;">${JSON.stringify(result)}</span>`
      }
    } catch (error) {
      return `<span style="color: #F88;">Error accessing path: ${error.message}</span>`
    }
  },
  schema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Dot-notation path to the property to inspect"
      }
    }
  },
  src: "index.js"
}
