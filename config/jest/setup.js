"use strict";

// Ensure environment variables are read.
require("../env");

import {configure} from "mobx";

const fetchPolyfill = require("whatwg-fetch");

global.fetch = fetchPolyfill.fetch;
global.Request = fetchPolyfill.Request;
global.Headers = fetchPolyfill.Headers;
global.Response = fetchPolyfill.Response;

const axios = require("axios");
const httpAdapter = require("axios/lib/adapters/http");

axios.defaults.adapter = httpAdapter;

const moment = require("moment-timezone");
jest.doMock("moment", () => {
  moment.tz.setDefault("America/New_York");
  return moment;
});

// React 16: https://gist.github.com/gaearon/9a4d54653ae9c50af6c54b4e0e56b583
global.requestAnimationFrame = function(callback) {
  setTimeout(callback, 0);
};
