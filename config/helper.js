"use strict";

const ModuleDependencyWarning = require("webpack/lib/ModuleDependencyWarning");

module.exports = {
  IgnoreNotFoundExportPlugin: class IgnoreNotFoundExportPlugin {
    apply(compiler) {
      const messageRegExp = /export '.*'( \(reexported as '.*'\))? was not found in/;

      const doneHook = stats => (stats.compilation.warnings = stats.compilation.warnings.filter(warning => !(warning instanceof ModuleDependencyWarning && messageRegExp.test(warning.message))));

      if (compiler.hooks) compiler.hooks.done.tap("IgnoreNotFoundExportPlugin", doneHook);
      else compiler.plugin("done", doneHook);
    }
  },
};
