import * as _ from "lodash";
import {observer, Provider} from "mobx-react";
import * as React from "react";
import * as ReactDOM from "react-dom";
import {Route, RouteComponentProps, Switch} from "react-router-dom";
import * as serviceWorker from "./serviceWorker";
import {DataStore} from "../core/stores/DataStore";
import {WebHelper} from "./utils/WebHelper";
import {AppStore} from "./stores/AppStore";
import {Loading} from "./pages/loading/Loading";
import {SignIn} from "./pages/signin/SignIn";
import {Home} from "./pages/home/Home";
import {Locale} from "../core/locales/Locale";

import "moment-timezone";
import "../assets/stylesheets/main.scss";

import {ConfigProvider, message} from "antd";
import {mockAPIClient} from "../core/apiclients/rest/__mocks__/APIClient.mock";
import {APIClient} from "../core/apiclients/rest/APIClient";
import {useComputedValue} from "./hooks";

export type AppProps = {
  config?: any;
  locale?: Locale;
};

APIClient.configureClient({
  userAgent: "",
});
mockAPIClient();

export const App: React.FunctionComponent<AppProps> = observer(props => {
  const appStore = new AppStore();
  const dataStore = new DataStore();
  const switchContainerRef = React.useRef<HTMLDivElement>(null);
  const messageContainerRef = React.useRef<HTMLDivElement>(null);
  const prevConfigRef = React.useRef<any>();
  const antd_locale = dataStore.currentLocale ? AppStore.Intl.antd_locales[dataStore.currentLocale.code] : undefined;

  useComputedValue(() => {
    message.config({
      getContainer: () => messageContainerRef.current || document.body,
      transitionName: "fade",
    });
  }, []);

  if (!_.isNil(props.locale) && (!dataStore.currentLocale || props.locale.code !== dataStore.currentLocale.code)) dataStore.setLocale(props.locale);
  if (!_.isNil(props.config) && !_.isEqual(props.config, prevConfigRef.current)) appStore.setConfig(props.config);

  prevConfigRef.current = props.config;

  if (!dataStore.isInitialized) {
    if (!dataStore.isInitializing) dataStore.initialize();

    return <Loading />;
  }

  const content = (
    <div className="ol-app-main-container">
      {!_.isNil(props.children) ? (
        props.children
      ) : (
        <div ref={switchContainerRef} className="ol-app-switch-container">
          <div ref={messageContainerRef} className="ol-app-message-container" />

          <Switch>
            <Route exact path={"/signIn"} render={() => (!_.isNil(props.children) ? props.children : <SignIn />)} />
            <Route exact path={""} render={() => (!_.isNil(props.children) ? props.children : <Home />)} />

            {!_.isNil(props.children) && <Route path="/" render={() => props.children} />}
          </Switch>
        </div>
      )}
    </div>
  );

  return (
    <ConfigProvider locale={antd_locale}>
      <Provider>
        <WebHelper.Router>
          <Route
            path="/"
            render={(props: RouteComponentProps<any>) => {
              if (_.isNil(AppStore.history)) AppStore.history = props.history;

              AppStore.location = props.location;

              return content;
            }}
          />
        </WebHelper.Router>
      </Provider>
    </ConfigProvider>
  );
});

export const start = (options: {config?: any} = {}) => {
  ReactDOM.render(<App config={options.config} />, document.getElementById("root"));

  // If you want your app to work offline and load faster, you can change
  // unregister() to register() below. Note this comes with some pitfalls.
  // Learn more about service workers: https://bit.ly/CRA-PWA
  serviceWorker.register();
};
