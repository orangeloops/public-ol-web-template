import {mount} from "enzyme";
import * as React from "react";
import {About} from "../About";

describe("About", () => {
  test("Render correctly", () => {
    const wrapper = mount(<About />);

    expect(wrapper).toMatchSnapshot();
  });
});
