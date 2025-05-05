// Really simple event bus based on Mitt.js

/*
  import createBus from './bus.js'

  // Create a new event bus
  const bus = createBus()

  // listen to an event
  bus.on('foo', e => console.log('foo', e) )

  // listen to all events
  bus.on('*', (type, e) => console.log(type, e) )

  // fire an event
  bus.emit('foo', { a: 'b' })

  // clearing all events
  bus.all.clear()

  // working with handler references:
  function onFoo() {}
  bus.on('foo', onFoo)   // listen
  bus.off('foo', onFoo)  // unlisten
 */

export default function (all) {
  all = all || new Map()

  return {
    all,

    // Register an event handler for the given type.
    on(type, handler) {
      const handlers = all.get(type)
      if (handlers) handlers.push(handler)
        else all.set(type, [handler])
    },

    // Remove an event handler for the given type.
    // If `handler` is omitted, all handlers of the given type are removed.
    off(type, handler) {
      const handlers = all.get(type)
      if (handlers) {
        if (handler) handlers.splice(handlers.indexOf(handler) >>> 0, 1)
          else all.set(type, [])
      }
    },

    // Invoke all handlers for the given type.
    // If present, `'*'` handlers are invoked after type-matched handlers.
    emit(type, evt) {
      console.log('Emitting event:', type, evt);

      let handlers = all.get(type);
      if (handlers) handlers.slice().map((handler) => { handler(evt) })
      handlers = all.get('*')
      if (handlers) handlers.slice().map((handler) => { handler(type, evt) })
    }
  };
}