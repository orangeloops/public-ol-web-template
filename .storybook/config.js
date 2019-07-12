"use strict";

import {addParameters, addDecorator, configure} from "@storybook/react";
import {create} from "@storybook/theming";
import {withKnobs} from "@storybook/addon-knobs";
import {withRouter} from "../src/web/__stories__/StorybookHelper";

addParameters({
  options: {
    theme: create({
      base: "light",
      brandTitle: "Phoenix Web",
      brandUrl: "https://www.orangeloops.com",
      brandImage: null,
    }),
    storySort: (a, b) => a[1].id.localeCompare(b[1].id),
  },
});

addDecorator(withKnobs);
addDecorator(withRouter());

const req = require.context("../src/web", true, /.stories.tsx?/);

configure(() => req.keys().forEach(filename => req(filename)), module);
