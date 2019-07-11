import * as React from "react";
import {storiesOf} from "@storybook/react";
import {withApp} from "../../../__stories__/StorybookHelper";
import {Home} from "../Home";

const notes = `
# Home

This is some code showing usage of the component and other inline documentation

~~~js
<div>
  <ComponentFactory.Home/>;
</div>
~~~
`;

const parameters = {notes: {markdown: notes}};

const createComponent = () => <Home />;

storiesOf("Pages", module)
  .addDecorator(withApp({}))
  .add("Home", () => createComponent(), parameters);
