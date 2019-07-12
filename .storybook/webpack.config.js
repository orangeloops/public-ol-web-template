"use strict";

const configFactory = require("../config/webpack.config");
const custom = configFactory("storybook");

delete custom.entry;

module.exports = custom;