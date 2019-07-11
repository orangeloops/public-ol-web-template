"use strict";

const configFactory = require("../config/webpack.config");
const custom = configFactory("storybook");

module.exports = async ({config, mode}) => {
  return {...config, module: {...config.module, rules: custom.module.rules}};
};