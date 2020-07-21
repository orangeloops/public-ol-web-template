"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_sass_1 = __importDefault(require("node-sass"));
var camelcase_1 = __importDefault(require("camelcase"));
var param_case_1 = __importDefault(require("param-case"));
var source_to_class_names_1 = require("./source-to-class-names");
var fs_1 = require("fs-extra");
exports.NAME_FORMATS = [
  "camel",
  "kebab",
  "param",
  "dashes",
  "none"
];
var importer = function (aliases, aliasPrefixes) { return function (url) {
  if (url in aliases) {
    return {
      file: aliases[url]
    };
  }
  var prefixMatch = Object.keys(aliasPrefixes).find(function (prefix) {
    return url.startsWith(prefix);
  });
  if (prefixMatch) {
    return {
      file: aliasPrefixes[prefixMatch] + url.substr(prefixMatch.length)
    };
  }
  return null;
}; };
exports.fileToClassNames = function (file, _a) {
  var _b = _a === void 0 ? {} : _a, _c = _b.includePaths, includePaths = _c === void 0 ? [] : _c, _d = _b.aliases, aliases = _d === void 0 ? {} : _d, _e = _b.aliasPrefixes, aliasPrefixes = _e === void 0 ? {} : _e, _f = _b.nameFormat, nameFormat = _f === void 0 ? "camel" : _f;
  var transformer = classNameTransformer(nameFormat);
  return new Promise(function (resolve, reject) {
    const content = fs_1.readFileSync(file, "utf-8");
    node_sass_1.default.render({
      data:
        "@import \"@app/src/assets/stylesheets/abstracts/_variables.scss\";\n" +
        "@import \"@app/src/assets/stylesheets/abstracts/_functions.scss\";\n" +
        "@import \"@app/src/assets/stylesheets/abstracts/_mixins.scss\";\n" +
        content,
      includePaths: includePaths,
      importer: importer(aliases, aliasPrefixes)
    }, function (err, result) {
      if (err) {
        reject(err);
        return;
      }
      source_to_class_names_1.sourceToClassNames(result.css).then(function (_a) {
        var exportTokens = _a.exportTokens;
        var classNames = Object.keys(exportTokens);
        var transformedClassNames = classNames.map(transformer);
        resolve(transformedClassNames);
      });
    });
  });
};
var classNameTransformer = function (nameFormat) {
  switch (nameFormat) {
    case "kebab":
    case "param":
      return function (className) { return param_case_1.default(className); };
    case "camel":
      return function (className) { return camelcase_1.default(className); };
    case "dashes":
      return function (className) {
        return /-/.test(className) ? camelcase_1.default(className) : className;
      };
    case "none":
      return function (className) { return className; };
  }
};
