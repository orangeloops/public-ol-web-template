import * as React from "react";
import {storiesOf} from "@storybook/react";
import {withApp} from "../../../__stories__/StorybookHelper";
import {Loading} from "../Loading";

const notes = `
# Loading

This is some code showing usage of the component and other inline documentation

~~~js
<div>
  <ComponentFactory.Loading/>;
</div>
~~~
`;

const parameters = {notes: {markdown: notes}};

const createComponent = () => <Loading />;

storiesOf("Pages", module)
  .addDecorator(withApp({}))
  .add("Loading", () => createComponent(), parameters);
