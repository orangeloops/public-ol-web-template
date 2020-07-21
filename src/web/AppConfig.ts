import "./locales";

import {CoreHelper} from "../core/utils/CoreHelper";
import {AppConfig as CoreAppConfig, AppConfigType as CoreAppConfigType} from "../core/AppConfig";

export type UIAppConfig = {
  Modules: {
    App: {
      message: {
        duration: number;
      };
    };
  };
  Components: {
    SignIn: {
      options: {
        signInButton: {
          position: "center";
        };
      };
    };
  };
};

const UIAppConfig: UIAppConfig = {
  Modules: {
    App: {
      message: {
        duration: 5000,
      },
    },
  },
  Components: {
    SignIn: {
      options: {
        signInButton: {
          position: "center",
        },
      },
    },
  },
};

export type AppConfigType = CoreAppConfigType & UIAppConfig;
export const AppConfig: AppConfigType = CoreHelper.mergeWith(CoreAppConfig, UIAppConfig);
