import "core-js/stable";
import "regenerator-runtime/runtime";

import {start} from "./App";
import {AppConfig} from "./AppConfig";
import {APIClient} from "../core/apiclients/rest/APIClient";
import {mockAPIClient} from "../core/apiclients/rest/__mocks__/APIClient.mock";

APIClient.configureClient({
  userAgent: "",
});
mockAPIClient();

start({config: AppConfig});
