import "core-js/stable";
import "regenerator-runtime/runtime";

import {start} from "./App";
import {AppConfig} from "./AppConfig";
import {GraphQLAPIClient} from "../core/apiclients/graphql/GraphQLAPIClient";
import {DataStore} from "../core/stores/DataStore";

if (process.env.IS_SERVER_MOCKED === "true") {
  const {createGraphQLAPIClientMock} = require("../core/apiclients/graphql/__mocks__/GraphQLAPIClientMock");
  const {userDefault} = require("../core/apiclients/graphql/__mocks__/User.mock");

  createGraphQLAPIClientMock({initialMockedData: {users: [userDefault]}});
} else
  GraphQLAPIClient.configureClient({
    userAgent: navigator.userAgent,
    shouldRefreshToken: () => false,
    onRefreshToken: (accessToken) => {
      const dataStore = DataStore.getInstance();

      Object.keys(accessToken).forEach((k) => {
        dataStore.authenticationState.accessToken![k] = accessToken[k];
      });
    },
  });

start({config: AppConfig});
