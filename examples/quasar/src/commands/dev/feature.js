export default {
  guide: 'Manage application feature flags',
  documentation: ``,
  image: "/api/placeholder/500/350",
  src: "src/commands/dev.js",
  component: "FeatureFlagManager",
  schema: {
    type: "object",
    properties: {
      flagName: {
        type: "string",
        description: "Name of the feature flag"
      },
      state: {
        type: "string",
        enum: ["on", "off"],
        description: "New state for the feature flag"
      }
    },
    dependencies: {
      state: ["flagName"] // state parameter requires flagName to be specified
    }
  },
  command: function(args) {
    if (!args || args.length === 0) {
      // List all feature flags
      return `
        <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px;">
          <div style="color: #FFF; font-weight: bold; margin-bottom: 10px;">Application Feature Flags</div>

          <div style="margin-bottom: 10px;">
            <div style="display: flex; margin-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;">
              <div style="width: 140px; color: #7CF; font-weight: bold;">Flag</div>
              <div style="width: 80px; color: #7CF; font-weight: bold;">Status</div>
              <div style="flex-grow: 1; color: #7CF; font-weight: bold;">Description</div>
            </div>

            <div style="display: flex; margin-bottom: 5px;">
              <div style="width: 140px; color: #FFA;">newDashboard</div>
              <div style="width: 80px;"><span style="color: #7F7;">✓ ON</span></div>
              <div style="flex-grow: 1; color: #AAA;">New dashboard UI components</div>
            </div>

            <div style="display: flex; margin-bottom: 5px;">
              <div style="width: 140px; color: #FFA;">betaAPI</div>
              <div style="width: 80px;"><span style="color: #F77;">✗ OFF</span></div>
              <div style="flex-grow: 1; color: #AAA;">New API endpoints (beta)</div>
            </div>

            <div style="display: flex; margin-bottom: 5px;">
              <div style="width: 140px; color: #FFA;">darkMode</div>
              <div style="width: 80px;"><span style="color: #7F7;">✓ ON</span></div>
              <div style="flex-grow: 1; color: #AAA;">Dark mode theme support</div>
            </div>

            <div style="display: flex; margin-bottom: 5px;">
              <div style="width: 140px; color: #FFA;">analytics</div>
              <div style="width: 80px;"><span style="color: #7F7;">✓ ON</span></div>
              <div style="flex-grow: 1; color: #AAA;">Usage analytics tracking</div>
            </div>
          </div>

          <div style="color: #AAA; font-size: 0.9em;">
            Use "feature [name] [on|off]" to toggle features
          </div>
        </div>
      `;
    }

    const featureName = args[0];
    const action = args[1]?.toLowerCase();

    // Handle enabling/disabling a feature flag
    if (action === 'on' || action === 'off') {
      const newState = action === 'on';
      // Simulate toggling feature flag
      return `
        <div style="padding: 5px 0;">
          <div style="color: ${newState ? '#7F7' : '#F77'};">
            Feature "${featureName}" is now ${newState ? 'ENABLED' : 'DISABLED'}
          </div>
          <div style="color: #AAA; font-size: 0.9em; margin-top: 5px;">
            Changes will take effect on next page refresh
          </div>
        </div>
      `;
    }

    // If only feature name is provided, show details
    return `
      <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px;">
        <div style="color: #FFF; font-weight: bold; margin-bottom: 10px;">Feature: ${featureName}</div>

        <div style="margin-bottom: 15px;">
          <div style="display: flex; margin-bottom: 5px;">
            <div style="width: 100px; color: #7CF;">Status:</div>
            <div><span style="color: #7F7;">✓ ON</span></div>
          </div>

          <div style="display: flex; margin-bottom: 5px;">
            <div style="width: 100px; color: #7CF;">Type:</div>
            <div style="color: #AAA;">Boolean</div>
          </div>

          <div style="display: flex; margin-bottom: 5px;">
            <div style="width: 100px; color: #7CF;">Default:</div>
            <div style="color: #AAA;">Off</div>
          </div>

          <div style="display: flex; margin-bottom: 5px;">
            <div style="width: 100px; color: #7CF;">Scope:</div>
            <div style="color: #AAA;">Global</div>
          </div>

          <div style="display: flex; margin-bottom: 5px;">
            <div style="width: 100px; color: #7CF;">Added:</div>
            <div style="color: #AAA;">v1.2.0</div>
          </div>
        </div>

        <div style="color: #FFA; margin-bottom: 5px;">Description:</div>
        <div style="color: #AAA; margin-bottom: 15px;">
          This feature enables the new dashboard UI components with enhanced data visualization and improved performance.
          Still in beta testing phase.
        </div>

        <div style="display: flex; gap: 10px;">
          <div style="padding: 5px 10px; background: rgba(0,255,0,0.1); border-radius: 3px; cursor: pointer; color: #7F7;">
            Enable
          </div>
          <div style="padding: 5px 10px; background: rgba(255,0,0,0.1); border-radius: 3px; cursor: pointer; color: #F77;">
            Disable
          </div>
        </div>
      </div>
    `;
  },
}