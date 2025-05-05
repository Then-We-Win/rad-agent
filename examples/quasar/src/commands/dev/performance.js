export default {
  guide: 'Shows Vue application performance metrics',
  command: function() {
    const metrics = {
      memory: typeof window.performance !== 'undefined' &&
              window.performance.memory ?
              window.performance.memory : null,
      timing: typeof window.performance !== 'undefined' ?
              window.performance.timing : null,
      navigation: typeof window.performance !== 'undefined' ?
                 window.performance.navigation : null
    };
  },
  documentation: ``,
  image: "/api/placeholder/450/280",
  schema: {
    type: "object",
    properties: {},
  }
}