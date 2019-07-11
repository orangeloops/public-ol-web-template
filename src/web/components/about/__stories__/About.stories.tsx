import * as React from "react";
import {storiesOf} from "@storybook/react";
import {withApp} from "../../../__stories__/StorybookHelper";
import {About} from "../About";

storiesOf("Components", module)
  .addDecorator(withApp({}))
  .add("About", () => <About />);
