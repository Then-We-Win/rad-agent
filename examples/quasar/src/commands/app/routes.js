export default {
  guide: 'Shows all registered routes in the Vue Router',
  command: function() {
    const router = window.router || this.$router;
    if (!router) {
      return '<span style="color: #F88;">Vue Router not found. Make sure it\'s registered globally as window.router</span>';
    }
    const routes = router.options.routes || [];
  },
  documentation: ``,
  image: "/api/placeholder/500/300",
  schema: {
    type: "object",
    properties: {},
  }
}