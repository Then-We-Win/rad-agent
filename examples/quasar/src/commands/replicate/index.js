// Loads every file in the current directory as a module...

const modules = import.meta.glob("./*.js");

const loadModules = async () => {
  const exports = {};
  for (const path in modules) {
    const moduleName = path.replace("./", "").replace(".js", ""); // Extract module name
    exports[moduleName] = (await modules[path]()).default;
  }
  return exports;
};

export default await loadModules();
