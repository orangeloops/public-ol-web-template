"use strict";

module.exports = function(api) {
  api.cache.using(() => process.env.NODE_ENV);

  const presets = [
    [
      "@babel/env",
      {
        modules: api.env("test") ? undefined : false,
        useBuiltIns: "entry",
        corejs: {
          version: 3,
        },
        debug: false,
      },
    ],
    "@babel/typescript",
    "@babel/react",
  ];

  const plugins = [
    "@babel/plugin-transform-runtime",
    [
      "@babel/plugin-proposal-decorators",
      {
        legacy: true,
      },
    ],
    [
      "@babel/plugin-proposal-class-properties",
      {
        loose: true,
      },
    ],
    [
      "import",
      {
        libraryName: "antd",
        libraryDirectory: api.env("test") ? undefined : "es",
        style: true,
      },
    ],
    "@babel/plugin-proposal-optional-catch-binding",
    "@babel/plugin-proposal-optional-chaining",
    "@babel/plugin-syntax-dynamic-import",
    "lodash",
  ];

  return {
    presets: presets,
    plugins: plugins,
    env: {
      test: {
        presets: presets,
      },
    },
  };
};
