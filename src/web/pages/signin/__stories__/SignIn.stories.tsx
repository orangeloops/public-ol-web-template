import * as React from "react";
import {storiesOf} from "@storybook/react";
import {withApp} from "../../../__stories__/StorybookHelper";
import {SignIn} from "../SignIn";

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

const createComponent = () => <SignIn />;

storiesOf("Pages", module)
  .addDecorator(withApp({}))
  .add("SignIn", () => createComponent(), parameters);
