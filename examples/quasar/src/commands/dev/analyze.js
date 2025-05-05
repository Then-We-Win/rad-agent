export default {
  guide: 'Analyze component and module sizes in the application bundle',
  image: "/api/placeholder/500/300",
  src: "src/commands/dev.js",
  component: "BuildAnalyzer",
  schema: {
    type: "object",
    properties: {
      mode: {
        type: "string",
        enum: ["components", "modules"],
        description: "Analysis mode (components or modules)",
        default: "components"
      }
    }
  },
  documentation: ``,
  command: function(args) {
    const mode = args[0] || 'components';

    // Simulate analyzing bundle data
    if (mode === 'components') {
      return `
        <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px;">
          <div style="color: #FFF; font-weight: bold; margin-bottom: 10px;">Component Size Analysis</div>

          <div style="margin-bottom: 15px;">
            <div style="color: #7CF; margin-bottom: 5px;">Top Components by Size:</div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <div style="width: 120px; color: #AAA;">DataTable</div>
              <div style="height: 16px; background: #58F; width: 80%"></div>
              <div style="margin-left: 10px; color: #FFF;">254 KB</div>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <div style="width: 120px; color: #AAA;">ChartViewer</div>
              <div style="height: 16px; background: #58F; width: 65%"></div>
              <div style="margin-left: 10px; color: #FFF;">203 KB</div>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <div style="width: 120px; color: #AAA;">UserDashboard</div>
              <div style="height: 16px; background: #58F; width: 45%"></div>
              <div style="margin-left: 10px; color: #FFF;">142 KB</div>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <div style="width: 120px; color: #AAA;">FormBuilder</div>
              <div style="height: 16px; background: #58F; width: 35%"></div>
              <div style="margin-left: 10px; color: #FFF;">110 KB</div>
            </div>
          </div>

          <div style="color: #AAA; font-size: 0.9em;">
            Total bundle size: 1.24 MB (gzipped: 428 KB)
          </div>
        </div>
      `;
    } else if (mode === 'modules') {
      return `
        <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px;">
          <div style="color: #FFF; font-weight: bold; margin-bottom: 10px;">Module Size Analysis</div>

          <div style="margin-bottom: 15px;">
            <div style="color: #7CF; margin-bottom: 5px;">Top Modules by Size:</div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <div style="width: 120px; color: #AAA;">vue-apexcharts</div>
              <div style="height: 16px; background: #F85; width: 90%"></div>
              <div style="margin-left: 10px; color: #FFF;">312 KB</div>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <div style="width: 120px; color: #AAA;">quasar</div>
              <div style="height: 16px; background: #F85; width: 75%"></div>
              <div style="margin-left: 10px; color: #FFF;">264 KB</div>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <div style="width: 120px; color: #AAA;">@iconify/vue</div>
              <div style="height: 16px; background: #F85; width: 40%"></div>
              <div style="margin-left: 10px; color: #FFF;">145 KB</div>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <div style="width: 120px; color: #AAA;">app code</div>
              <div style="height: 16px; background: #F85; width: 30%"></div>
              <div style="margin-left: 10px; color: #FFF;">108 KB</div>
            </div>
          </div>

          <div style="color: #AAA; font-size: 0.9em;">
            Total module count: 42 modules
          </div>
        </div>
      `;
    } else {
      return `<span style="color: #F88;">Invalid mode: ${mode}. Use "components" or "modules".</span>`;
    }
  }
}