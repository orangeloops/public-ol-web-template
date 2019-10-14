import "reflect-metadata";

import MockAdapter from "axios-mock-adapter";
import {configure} from "enzyme";
import * as _ from "lodash";

import {APIClient} from "../apiclients/rest/APIClient";
import {DataStore} from "../stores/DataStore";

const Adapter = require("enzyme-adapter-react-16");

beforeAll(done => TestHelper.beforeAll(done));
beforeEach(done => TestHelper.beforeEach(done));

configure({adapter: new Adapter(), disableLifecycleMethods: true});

export abstract class TestHelper {
  static networkMock: MockAdapter;

  static getNetworkMockAdapter(): MockAdapter {
    if (!APIClient.client) APIClient.configureClient({userAgent: "test-user-agent"});

    if (TestHelper.networkMock) this.networkMock.reset();
    else TestHelper.networkMock = new MockAdapter(APIClient.client);

    return TestHelper.networkMock;
  }

  static log(message?: any, ...optionalParams: any[]) {
    console.log(message, optionalParams);
  }

  static beforeAll(done: () => void) {
    console.debug = console.log;

    done();
  }

  static beforeEach(done: () => void) {
    if (!_.isNil(TestHelper.networkMock)) TestHelper.networkMock.reset();

    delete DataStore["instance"];

    done();
  }

  static async wait(ms = 0) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}
