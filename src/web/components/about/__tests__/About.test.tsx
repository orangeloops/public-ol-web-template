import {mount} from "enzyme";
import * as React from "react";
import {About} from "../About";
import {DataStore} from "../../../../core/stores/DataStore";

describe("About", () => {
  test("Render correctly", async () => {
    await DataStore.getInstance().initialize();
    const wrapper = mount(<About />);

    expect(wrapper).toMatchSnapshot();
  });
});
