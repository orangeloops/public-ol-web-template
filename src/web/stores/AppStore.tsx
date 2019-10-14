import * as _ from "lodash";
import {action, observable} from "mobx";
import * as React from "react";
import {History, Location} from "history";
import {AppConfig} from "../AppConfig";
import {CoreHelper} from "../../core/utils/CoreHelper";
import {DataStore} from "../../core/stores/DataStore";

import {Icon, message} from "antd";
import {MessageType as AntMessageType} from "antd/lib/message";

// Internalization
import {en_US} from "../../core/locales/en_US";
import {es_ES} from "../../core/locales/es_ES";

import "moment/locale/en-ca";
import "moment/locale/es";

require("intl/locale-data/jsonp/en.js");
require("intl/locale-data/jsonp/es.js");

const antd_locales = {
  [en_US.code]: require("antd/lib/locale-provider/en_US"),
  [es_ES.code]: require("antd/lib/locale-provider/es_ES"),
};

export type MessageType = "success" | "error" | "info";

type MessageHide = {
  id: string;
  hide: AntMessageType;
};

export type AppMode = "mobile" | "desktop";

export type InputMode = "touch" | "mouse";

export type AppComponentType = "drawer_panel";

export type AppComponentState = {
  visible: boolean;
  props?: any;
};

export type AppStoreState = {
  mode: AppMode | undefined;
  inputMode: InputMode;

  messageHide: MessageHide[];
  stateByComponentType: Map<AppComponentType, AppComponentState>;
};

export class AppStore {
  private static instance: any = null;

  static history: History;
  static location: Location;

  static Intl = {
    antd_locales: antd_locales,
  };

  private initialConfig: any;

  mobileBreakpoint = 769; // sm breakpoint

  dataStore = new DataStore();

  // STATE
  @observable
  state: AppStoreState = {
    mode: this.evaluateMode(),
    inputMode: "touch",

    messageHide: [],
    stateByComponentType: new Map(),
  };

  private isTouch = false;
  private inputModeTimer: any | undefined;

  constructor() {
    if (!_.isNil(AppStore.instance)) return AppStore.instance;

    AppStore.instance = this;

    this.handlerWindowResize = this.handlerWindowResize.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleMouseOver = this.handleMouseOver.bind(this);

    window.addEventListener("resize", this.handlerWindowResize);

    if (document.documentElement) document.documentElement.setAttribute("data-browser", navigator.userAgent);

    document.addEventListener("touchstart", this.handleTouchStart);
    document.addEventListener("mouseover", this.handleMouseOver);

    this.initialConfig = _.cloneDeep(AppConfig);

    this.dataStore.setLocale(AppConfig.Settings.Localization.defaultLocale);

    return AppStore.instance;
  }

  private handleTouchStart() {
    const {inputMode} = this.state;

    clearTimeout(this.inputModeTimer);

    this.isTouch = true;
    if (inputMode !== "touch") this.setInputMode("touch");

    this.inputModeTimer = setTimeout(() => (this.isTouch = false), 500);
  }

  private handleMouseOver() {
    const {isTouch} = this;
    const {inputMode} = this.state;

    if (!isTouch && inputMode === "touch") this.setInputMode("mouse");
  }

  private evaluateMode(): AppMode {
    const {mobileBreakpoint} = this;

    return !_.isNil(mobileBreakpoint) ? (window.innerWidth < mobileBreakpoint ? "mobile" : "desktop") : "desktop";
  }

  private handlerWindowResize() {
    const mode = this.evaluateMode();

    this.setMode(mode);
  }

  navigateTo(path: string, replace = false) {
    console.assert(!_.isNil(path) && path.length > 0);

    const prefix = ``;

    const url = `${!path.startsWith(prefix) ? prefix : ""}${path.startsWith("/") ? "" : "/"}${path}`;

    if (replace) AppStore.history.replace(url);
    else AppStore.history.push(url);
  }

  // region ACTIONS

  @action
  setConfig(config: any) {
    console.assert(!_.isNil(config));

    CoreHelper.mergeWith(AppConfig, config, true, (value: any, sourceValue: any, key: string) => {
      switch (key) {
        case "schemas":
          return sourceValue;
        default:
          return _.isArray(value) ? sourceValue : undefined;
      }
    });

    this.dataStore.setLocale(AppConfig.Settings.Localization.defaultLocale);
  }

  @action
  resetConfig() {
    CoreHelper.mergeWith(AppConfig, this.initialConfig);
  }

  @action
  setInputMode(inputMode: InputMode) {
    this.state.inputMode = inputMode;
  }

  @action
  setMode(mode: AppMode) {
    console.assert(!_.isNil(mode));

    this.state.mode = mode;
  }

  @action
  showMessage(content: string | React.ReactNode, type: MessageType, duration: number = AppConfig.Modules.App.message.duration): string {
    if (this.state.messageHide.length >= 5) this.hideOldestMessage();

    const messageId = CoreHelper.getUUID();

    let fixedContent = content;
    if (typeof content === "string")
      fixedContent = (
        <div className="ol-message-wrapper">
          <span className="ol-message-content">{content}</span>
          {type === "error" && (
            <span className="ol-message-close-icon" onClick={() => this.hideMessage(messageId)}>
              <Icon type="close" />
            </span>
          )}
        </div>
      );

    let messageHide: MessageHide;

    switch (type) {
      case "success":
        messageHide = {
          id: messageId,
          hide: message.success(fixedContent, duration),
        };
        break;
      case "error":
        messageHide = {
          id: messageId,
          hide: message.error(fixedContent, 0),
        };
        break;
      case "info":
      default:
        messageHide = {
          id: messageId,
          hide: message.info(fixedContent, duration),
        };
        break;
    }

    this.state.messageHide.push(messageHide);
    return messageId;
  }

  @action
  hideMessage(id: string) {
    const messageToDeleteIndex = this.state.messageHide.findIndex(mh => mh.id === id);

    if (messageToDeleteIndex >= 0) {
      this.state.messageHide[messageToDeleteIndex].hide();

      this.state.messageHide.splice(messageToDeleteIndex, 1);
    }
  }

  @action
  hideOldestMessage() {
    this.state.messageHide[0].hide();

    this.state.messageHide.splice(0, 1);
  }

  @action
  hideAllMessages() {
    this.state.messageHide.forEach(mh => mh.hide());

    this.state.messageHide = [];
  }

  @action
  showComponent<P extends {} = {}>(type: AppComponentType, props?: P) {
    const {stateByComponentType} = this.state;

    const componentState = stateByComponentType.get(type);

    if (!_.isNil(componentState)) {
      componentState.visible = true;
      componentState.props = props;
    } else {
      stateByComponentType.set(type, {
        visible: true,
        props: props,
      });
    }
  }

  @action
  hideComponent(type: AppComponentType) {
    const {stateByComponentType} = this.state;

    const componentState = stateByComponentType.get(type);
    if (!_.isNil(componentState)) componentState.visible = false;
  }

  @action
  isComponentVisible(type: AppComponentType): boolean {
    const {stateByComponentType} = this.state;

    const component = stateByComponentType.get(type);

    return !_.isNil(component) && component.visible;
  }

  // endregion
}
