export default {
  guide: 'Inspects the state of a component',
  documentation: ``,
  image: "/api/placeholder/480/320",
  schema: {
    type: "object",
    required: ["componentName"],
    properties: {
      componentName: {
        type: "string",
        description: "Name of the component to inspect"
      }
    }
  },
  command: function(args) {
    if (!args || args.length === 0) {
      return `<span style="color: #F88;">Please specify a component name</span>`;
    }

    const componentName = args[0];
    const context = this.$console.getContext();
    const findComponentInstances = (parent, name) => {
    };

    const root = context.app._instance;
    const instances = findComponentInstances(root, componentName);

    if (instances.length === 0) {
      return `<span style="color: #F88;">No instances of ${componentName} found in the component tree</span>`;
    }
    const formatComponent = (comp) => {
    };

    return `
      <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px;">
        <!-- ...existing implementation -->
      </div>
    `;
  },
}