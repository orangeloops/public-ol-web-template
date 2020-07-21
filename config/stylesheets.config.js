"use strict";

module.exports = {
  // https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less
  antd: {
    variables: {
      "@primary-color": "#4182ce",
      "@font-family": "App, Helvetica, Arial, sans-serif",
    },
  },
  sdk: {
    variables: {},
  },
  cssLoader: {
    options: {},
  },
  postcssLoader: {
    options: (stylelint) => ({
      // ident: "postcss",
      plugins: () =>
        [
          require("postcss-import"),
          require("postcss-preset-env")({
            features: {
              "custom-properties": {
                preserve: false,
                warnings: true,
              },
            },
          }),
          require("postcss-flexbugs-fixes"),
          require("autoprefixer")({
            flexbox: "no-2009",
            remove: false,
          }),
          stylelint && require("stylelint"),
          require("postcss-reporter"),
        ].filter(Boolean),
    }),
  },
  favicons: {
    // https://github.com/itgalaxy/favicons#usage
    appleStatusBarStyle: "#222",
    background: "#222",
    theme_color: "#222",
    icons: {},
  },
};
