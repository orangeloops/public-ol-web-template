"use strict";

const configFactory = require("../config/webpack.config");
const config = configFactory("storybook");

delete config.entry;

module.exports = config;
