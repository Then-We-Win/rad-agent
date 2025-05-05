export default {
  guide: 'Displays the current Vuex/Pinia store state',
  command: function(args) {
    const store = window.store || this.$store;
    if (!store) {
      return '<span style="color: #F88;">Vuex/Pinia store not found. Make sure it\'s registered globally</span>';
    }
  },
  documentation: ``,
  image: "/api/placeholder/480/300",
  schema: {
    type: "object",
    properties: {
      moduleName: {
        type: "string",
        description: "Store module name to display (optional)"
      }
    }
  }
}