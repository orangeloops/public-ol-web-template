import * as _ from "lodash";
import {observer, Observer, Provider} from "mobx-react";
import * as React from "react";
import * as ReactDOM from "react-dom";
import {Route, RouteComponentProps, Switch} from "react-router-dom";
import * as serviceWorker from "./serviceWorker";
import {AppConfig} from "./AppConfig";
import {DataStore} from "../core/stores/DataStore";
import {WebHelper} from "./utils/WebHelper";
import {AppStore} from "./stores/AppStore";
import {Loading} from "./pages/loading/Loading";
import {SignIn} from "./pages/signin/SignIn";
import {Home} from "./pages/home/Home";
import {Locale} from "../core/locales/Locale";

import "moment-timezone";
import "../assets/stylesheets/main.scss";

import {LocaleProvider, message} from "antd";
import {mockAPIClient} from "../core/apiclients/rest/__mocks__/APIClient.mock";
import {APIClient} from "../core/apiclients/rest/APIClient";

export type AppProps = {
  config?: any;
  locale?: Locale;
};

export type AppState = {
  config: typeof AppConfig;
};

APIClient.configureClient({
  userAgent: "",
});
mockAPIClient();

@observer
export class App extends React.Component<AppProps, AppState> {
  static defaultProps = {};

  state: AppState = {} as AppState;

  protected controls = {
    switchContainer: React.createRef<HTMLDivElement>(),
    messageContainer: React.createRef<HTMLDivElement>(),
  };

  appStore: AppStore;
  dataStore: DataStore;

  constructor(props: AppProps) {
    super(props);

    this.appStore = new AppStore();
    this.dataStore = new DataStore();

    message.config({
      getContainer: () => this.handleGetMessageContainer(),
      transitionName: "fade",
    });
  }

  static getDerivedStateFromProps(nextProps: AppProps, prevState: AppState) {
    const appStore = new AppStore();
    const dataStore = new DataStore();

    if (!_.isNil(nextProps.locale) && (!dataStore.currentLocale || nextProps.locale.code !== dataStore.currentLocale.code)) dataStore.setLocale(nextProps.locale);

    if (!_.isNil(nextProps.config) && !_.isEqual(nextProps.config, prevState.config)) appStore.setConfig(nextProps.config);

    return {...prevState, config: nextProps.config};
  }

  private handleGetMessageContainer(): HTMLElement {
    if (!_.isNil(this.controls.messageContainer.current)) return this.controls.messageContainer.current;
    else return document.body;
  }

  static start(options: {config?: any} = {}) {
    ReactDOM.render(<App config={options.config} />, document.getElementById("root"));

    // If you want your app to work offline and load faster, you can change
    // unregister() to register() below. Note this comes with some pitfalls.
    // Learn more about service workers: https://bit.ly/CRA-PWA
    // serviceWorker.register();
    serviceWorker.unregister();
  }

  render() {
    const antd_locale = this.dataStore.currentLocale ? AppStore.Intl.antd_locales[this.dataStore.currentLocale.code] : undefined;

    return (
      <LocaleProvider locale={antd_locale}>
        <Provider>
          <>
            <Observer>
              {() => {
                if (!this.dataStore.isInitialized) {
                  if (!this.dataStore.isInitializing) this.dataStore.initialize();

                  return <Loading />;
                }

                const content = (
                  <div className="ol-app-main-container">
                    {!_.isNil(this.props.children) ? (
                      this.props.children
                    ) : (
                      <div ref={this.controls.switchContainer} className="ol-app-switch-container">
                        <div ref={this.controls.messageContainer} className="ol-app-message-container" />

                        <Switch>
                          <Route exact path={"/signIn"} render={() => (!_.isNil(this.props.children) ? this.props.children : <SignIn />)} />
                          <Route exact path={""} render={() => (!_.isNil(this.props.children) ? this.props.children : <Home />)} />

                          {!_.isNil(this.props.children) && <Route path="/" render={() => this.props.children} />}
                        </Switch>
                      </div>
                    )}
                  </div>
                );

                return (
                  <WebHelper.Router>
                    <Route
                      path="/"
                      render={(props: RouteComponentProps<any>) => {
                        if (_.isNil(AppStore.history)) {
                          AppStore.history = props.history;
                        }

                        AppStore.location = props.location;

                        return content;
                      }}
                    />
                  </WebHelper.Router>
                );
              }}
            </Observer>
          </>
        </Provider>
      </LocaleProvider>
    );
  }
}
