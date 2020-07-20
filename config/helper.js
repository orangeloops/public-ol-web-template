"use strict";

const path = require("path");
const loaderUtils = require("loader-utils");
const ModuleDependencyWarning = require("webpack/lib/ModuleDependencyWarning");
const getCSSModuleLocalIdent = require("react-dev-utils/getCSSModuleLocalIdent");

const isTest = () => process.env.NODE_ENV === "test";

module.exports = {
  IgnoreNotFoundExportPlugin: class IgnoreNotFoundExportPlugin {
    apply(compiler) {
      const messageRegExp = /export '.*'( \(reexported as '.*'\))? was not found in/;

      const doneHook = (stats) => (stats.compilation.warnings = stats.compilation.warnings.filter((warning) => !(warning instanceof ModuleDependencyWarning && messageRegExp.test(warning.message))));

      if (compiler.hooks) compiler.hooks.done.tap("IgnoreNotFoundExportPlugin", doneHook);
      else compiler.plugin("done", doneHook);
    }
  },
  IgnoreCSSConflictingPlugin: class IgnoreCSSConflictingPlugin {
    apply(compiler) {
      compiler.hooks.afterEmit.tap("FilterWarning", (compilation) => {
        compilation.warnings = (compilation.warnings || []).filter((warning) => {
          return !warning.message.includes("Conflicting order between:");
        });
      });
    }
  },
  getCSSModuleLocalIdent(context, localIdentName, localName, options) {
    if (localName.startsWith("ant-") || localName.startsWith("gm-")) return localName;

    // Use the filename or folder name, based on some uses the index.js / index.module.(css|scss|sass) project style
    const fileNameOrFolder = context.resourcePath.match(/index\.module\.(css|scss|sass)$/) ? "[folder]" : "[name]";

    // Create a hash based on a the file location and class name. Will be unique across a project, and close to globally unique.
    const hash = !isTest() ? loaderUtils.getHashDigest(path.posix.relative(context.rootContext, context.resourcePath) + localName, "md5", "base64", 5) : "";

    const className = loaderUtils.interpolateName(context, fileNameOrFolder + "_" + localName + (hash.length > 0 ? "__" + hash : ""), options);
    // remove the .module that appears in every classname when based on the file.
    return className.replace(".module_", "_");
  },
};
