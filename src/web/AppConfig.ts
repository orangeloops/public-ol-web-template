import "./locales";

import {CoreHelper} from "../core/utils/CoreHelper";
import {AppConfig as BaseConfig} from "../core/AppConfig";

CoreHelper.mergeWith(BaseConfig, {
  Components: {
    SignIn: {
      options: {
        signInButton: {
          position: "center",
        },
      },
    },
  },
});

export {BaseConfig as AppConfig};
