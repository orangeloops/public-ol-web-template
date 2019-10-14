"use strict";

import {addParameters, addDecorator, configure} from "@storybook/react";
import {create} from "@storybook/theming";
import {withKnobs} from "@storybook/addon-knobs";
import {INITIAL_VIEWPORTS} from "@storybook/addon-viewport";

addParameters({
  options: {
    theme: create({
      base: "light",
      brandTitle: "Phoenix Web",
      brandUrl: "https://www.orangeloops.com",
      brandImage: null,
    }),
    sortStoriesByKind: true,
  },
  viewport: {
    viewports: INITIAL_VIEWPORTS,
  },
});

addDecorator(withKnobs);

const req = require.context("../src/web", true, /.stories.tsx?/);

configure(() => req.keys().forEach(filename => req(filename)), module);
