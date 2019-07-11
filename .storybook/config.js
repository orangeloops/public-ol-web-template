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
      brandUrl: "https://wwww.orangeloops.com/web",
      brandImage: null,
    }),
    sortStoriesByKind: true,
  },
});

addDecorator(withKnobs);
addDecorator(withRouter());

const req = require.context("../src/web", true, /.stories.tsx?/);

configure(() => req.keys().forEach(filename => req(filename)), module);
