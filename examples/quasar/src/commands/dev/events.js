export default {
  guide: 'Monitors events emitted by a component',
  command: function(args) {
    if (!args || args.length === 0) {
      return `<span style="color: #F88;">Please specify a component name</span>`;
    }

    const componentName = args[0];
    // ... rest of existing implementation
  },
  documentation: ``,
  image: "/api/placeholder/460/260",
  schema: {
    type: "object",
    required: ["componentName"],
    properties: {
      componentName: {
        type: "string",
        description: "Name of the component to monitor for events"
      }
    }
  }
}