// src/commands/app/resource.js
// Command for resource management

export default {
  guide: 'Manage resources: resource [action] [resource-type] [options]',
  documentation: `
# Resource Command

This command allows you to manage resources in the application.

## Syntax
\`\`\`
resource [action] [resource-type] [options]
\`\`\`

## Actions
- \`new\`: Create a new resource
- \`list\`: List resources of the specified type
- \`get\`: Get a specific resource by ID
- \`delete\`: Delete a resource by ID

## Parameters
- \`action\`: The operation to perform (required)
- \`resource-type\`: Type of resource (e.g., activation, content, campaign) (required)
- \`options\`: Additional options specific to the action (optional)

## Examples
\`\`\`
resource new activation     # Create a new activation
resource list content       # List all content items
resource get activation 42  # Get activation with ID 42
resource delete content 12  # Delete content with ID 12
\`\`\`
  `,
  command: function(args) {
    if (!args || args.length < 2) {
      return '<span style="color: #F88;">Insufficient arguments. Usage: resource [action] [resource-type] [options]</span>';
    }

    const action = args[0];
    const resourceType = args[1];
    const options = args.slice(2);

    // Handle different actions
    switch (action) {
      case 'new':
        return this.handleNewResource(resourceType, options);
      case 'list':
        return this.handleListResources(resourceType, options);
      case 'get':
        return this.handleGetResource(resourceType, options);
      case 'delete':
        return this.handleDeleteResource(resourceType, options);
      default:
        return `<span style="color: #F88;">Unknown action: ${action}. Valid actions are: new, list, get, delete</span>`;
    }
  },

  // Helper methods to handle each action
  handleNewResource: function(resourceType, options) {
    // Emit event that components can listen for
    this.$consoleBus.emit('resource.new', { type: resourceType, options });

    // Navigate directly to the resource path without an ID
    // This matches your existing pattern where components check for absence of ID to show the "new" interface
    this.$router.push({
      path: `/${resourceType}`,
      query: { ...this.$route.query }
    });

    return `<span style="color: #7F7;">Creating new ${resourceType}...</span>`;
  },

  handleListResources: function(resourceType, options) {
    // Navigate to the resources list page
    this.$router.push({
      path: `/${resourceType}s`,
      query: { ...this.$route.query }
    });

    return `<span style="color: #7CF;">Navigating to ${resourceType} list...</span>`;
  },

  handleGetResource: function(resourceType, options) {
    if (!options || options.length === 0) {
      return `<span style="color: #F88;">Please provide a resource ID.</span>`;
    }

    const id = options[0];

    // Navigate to the resource detail page
    this.$router.push({
      path: `/${resourceType}`,
      query: { ...this.$route.query, id }
    });

    return `<span style="color: #7CF;">Loading ${resourceType} with ID: ${id}...</span>`;
  },

  handleDeleteResource: function(resourceType, options) {
    if (!options || options.length === 0) {
      return `<span style="color: #F88;">Please provide a resource ID to delete.</span>`;
    }

    const id = options[0];

    // In a real implementation, you would call an API to delete the resource
    // For now, we'll just emit an event that other components can listen for
    this.$consoleBus.emit('resource.delete', { type: resourceType, id });

    return `<span style="color: #F77;">Deleting ${resourceType} with ID: ${id}...</span>`;
  },

  schema: {
    type: "object",
    required: ["action", "resourceType"],
    properties: {
      action: {
        type: "string",
        enum: ["new", "list", "get", "delete"],
        description: "Action to perform on the resource"
      },
      resourceType: {
        type: "string",
        description: "Type of resource (e.g., activation, content, campaign)"
      },
      options: {
        type: "array",
        description: "Additional options specific to the action"
      }
    }
  },
  src: "src/commands/app/resource.js"
};