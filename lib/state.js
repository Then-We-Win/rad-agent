/**
 * Simple State Manager - Framework-agnostic implementation
 *
 * This provides a minimalist state management solution that can work
 * with any JavaScript framework or vanilla JS.
 */

/**
 * Creates a state store with subscription capabilities
 * @param {Object} initialState - Initial state object
 * @returns {Object} Store API
 */
export function createStore(initialState = {}) {
  // Internal state
  let state = {...initialState};

  // Set of subscribers
  const subscribers = new Set();

  /**
   * Notify all subscribers of state change
   */
  const notifySubscribers = () => {
    subscribers.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in state subscriber:', error);
      }
    });
  };

  /**
   * Get the current state
   * @returns {Object} Current state (shallow copy)
   */
  const getState = () => ({...state});

  /**
   * Update the state
   * @param {Object|Function} updater - New state object or updater function
   */
  const setState = (updater) => {
    if (typeof updater === 'function') {
      // Function updater gets current state and returns new state
      state = {...state, ...updater(state)};
    } else if (typeof updater === 'object' && updater !== null) {
      // Object updater is merged with current state
      state = {...state, ...updater};
    } else {
      throw new Error('setState expects an object or function');
    }

    // Notify subscribers about the update
    notifySubscribers();
  };

  /**
   * Subscribe to state changes
   * @param {Function} callback - Function to call on state change
   * @returns {Function} Unsubscribe function
   */
  const subscribe = (callback) => {
    if (typeof callback !== 'function') {
      throw new Error('Subscribe expects a function');
    }

    subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      subscribers.delete(callback);
    };
  };

  /**
   * Reset state to initial or provided value
   * @param {Object} [newState=initialState] - State to reset to
   */
  const resetState = (newState = initialState) => {
    state = {...newState};
    notifySubscribers();
  };

  // Create a selector function for derived state
  const select = (selectorFn) => {
    if (typeof selectorFn !== 'function') {
      throw new Error('select expects a function');
    }

    // Return a function that applies the selector to current state
    return () => selectorFn(state);
  };

  // Public API
  return {
    getState,
    setState,
    subscribe,
    resetState,
    select
  };
}

/**
 * Creates a slice of the main store for modular state management
 * @param {Object} store - Main store
 * @param {string} sliceName - Name of this slice
 * @param {Object} initialState - Initial state for this slice
 * @returns {Object} Slice API
 */
export function createSlice(store, sliceName, initialState = {}) {
  // Initialize this slice in the store if not present
  const currentState = store.getState();
  if (!(sliceName in currentState)) {
    store.setState({
      [sliceName]: initialState
    });
  }

  /**
   * Get state for this slice
   * @returns {Object} Current slice state
   */
  const getState = () => store.getState()[sliceName];

  /**
   * Update state for just this slice
   * @param {Object|Function} updater - New state object or updater function
   */
  const setState = (updater) => {
    if (typeof updater === 'function') {
      // Function updater
      store.setState(state => ({
        [sliceName]: {...state[sliceName], ...updater(state[sliceName])}
      }));
    } else {
      // Object updater
      store.setState({
        [sliceName]: {...store.getState()[sliceName], ...updater}
      });
    }
  };

  /**
   * Subscribe to changes in this slice only
   * @param {Function} callback - Function to call when slice changes
   * @returns {Function} Unsubscribe function
   */
  const subscribe = (callback) => {
    let previousState = getState();

    return store.subscribe(state => {
      const newState = state[sliceName];

      // Only call the callback if this slice changed
      if (newState !== previousState) {
        previousState = newState;
        callback(newState);
      }
    });
  };

  /**
   * Reset this slice to initial state
   */
  const resetState = () => {
    store.setState({
      [sliceName]: {...initialState}
    });
  };

  // Public API
  return {
    getState,
    setState,
    subscribe,
    resetState
  };
}

// Export a default store instance for simple usage
export const store = createStore();

// Default export
export default createStore;