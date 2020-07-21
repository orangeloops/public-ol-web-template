"use strict";

import {addParameters, addDecorator, configure} from "@storybook/react";
import {create} from "@storybook/theming";
import {withKnobs} from "@storybook/addon-knobs";
import StoryRouter from 'storybook-react-router';
import {INITIAL_VIEWPORTS} from "@storybook/addon-viewport";

addParameters({
  options: {
    theme: create({
      base: "light",
      brandTitle: "Web Template",
      brandUrl: "https://www.orangeloops.com",
      brandImage: null,
    }),
    storySort: (a, b) => a[1].id.localeCompare(b[1].id),
  },
  viewport: {
    viewports: INITIAL_VIEWPORTS,
  },
});

addDecorator(withKnobs);
addDecorator(StoryRouter());

const req = require.context("../src/web", true, /.stories.tsx?/);

configure(() => req.keys().forEach(filename => req(filename)), module);
