// src/commands/app/emit.js
// Event emission command for app provider

/**
 * This command emits events to the console bus.
 * Any component that has registered events via the 'events' property
 * will be notified when an event is emitted matching their subscription.
 */
export default {
  guide: 'Emit an event to the console bus: emit [event] [data]',
  command: function(args) {
    if (!args || args.length === 0) {
      return '<span style="color: #F88;">Please provide an event name to emit</span>';
    }

    // Extract the event name (first argument)
    const eventName = args[0];

    // The rest of the arguments combine to make the data payload
    // Skip the first argument (the event name)
    let eventData = null;
    if (args.length > 1) {
      const dataArgs = args.slice(1).join(' ');

      // Try to parse as JSON if it starts with { or [
      if (dataArgs.trim().startsWith('{') || dataArgs.trim().startsWith('[')) {
        try {
          eventData = JSON.parse(dataArgs);
        } catch (e) {
          return `<span style="color: #F88;">Error parsing JSON data: ${e.message}</span>`;
        }
      } else {
        // Otherwise treat as a string
        eventData = dataArgs;
      }
    }

    // Get registered events and listeners if possible
    const registeredEvents = [];
    if (this.$consoleBus && this.$consoleBus.all) {
      // For mitt-style event emitters that expose "all" property
      const allEvents = this.$consoleBus.all;
      for (const [event, handlers] of allEvents) {
        registeredEvents.push({
          name: event,
          listenerCount: Array.isArray(handlers) ? handlers.length : 1
        });
      }
    } else if (this.$consoleBus && typeof this.$consoleBus.listeners === 'function') {
      // For Node-style event emitters
      try {
        // Get all event names if eventNames() method is available
        const eventNames = typeof this.$consoleBus.eventNames === 'function'
          ? this.$consoleBus.eventNames()
          : [];

        for (const event of eventNames) {
          const listeners = this.$consoleBus.listeners(event);
          registeredEvents.push({
            name: event,
            listenerCount: listeners.length
          });
        }
      } catch (e) {
        // If we can't get event names, just note that in the response
        registeredEvents.push({
          note: "Unable to retrieve full event listener details"
        });
      }
    }

    // Emit the event using the console bus
    if (this.$consoleBus) {
      // Use the mitt-style API
      this.$consoleBus.emit(eventName, eventData);

      // Create the standardized response object
      const responseObject = {
        // Primary response data - the main output of the command
        response: {
          emitted: {
            name: eventName,
            data: eventData
          }
        },
        // Metadata - additional information useful for debugging or chaining
        meta: {
          command: "emit",
          timestamp: new Date().toISOString(),
          registeredEvents: registeredEvents
        }
      };

      // Convert to JSON and display with the JSON viewer component
      const jsonString = JSON.stringify(responseObject, null, 2)
        .replace(/'/g, '&#39;'); // Escape single quotes for HTML attribute

      return `<andypf-json-viewer data='${jsonString}' theme="monokai" show-toolbar="false" expanded="false"></andypf-json-viewer>`;
    } else {
      return `<span style="color: #F88;">Console event bus ($consoleBus) not available. Make sure it's properly initialized.</span>`;
    }
  },
  schema: {
    type: "object",
    required: ["event"],
    properties: {
      event: {
        type: "string",
        description: "Name of the event to emit"
      },
      data: {
        type: "string",
        description: "Data to send with the event (string or JSON)"
      }
    }
  },
  src: "src/commands/app/emit.js"
};