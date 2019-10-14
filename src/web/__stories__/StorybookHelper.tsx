import * as _ from "lodash";
import * as React from "react";
import {select} from "@storybook/addon-knobs";
import {MockInterface} from "../../__mocks__/MockInterface";
import {AppProps, App} from "../App";
import {APIClient} from "../../core/apiclients/rest/APIClient";
import {CoreHelper} from "../../core/utils/CoreHelper";
import {DataStore} from "../../core/stores/DataStore";
import {AppStore} from "../stores/AppStore";
import {en_US} from "../../core/locales/en_US";
import {es_ES} from "../../core/locales/es_ES";
import {mockAPIClient} from "../../core/apiclients/rest/__mocks__/APIClient.mock";

let lastStoryId: string;

export type RenderFunction = () => React.ReactNode;
export const withApp = (props: AppProps = {}, mockData: MockInterface = {}) => (storyFunction: RenderFunction, context: any) => {
  if (_.isNil(props.config)) props.config = {};

  CoreHelper.mergeWith(CoreHelper.mergeWith(props.config, mockData.baseConfig), mockData.config);

  APIClient.configureClient({
    userAgent: "",
  });
  mockAPIClient();

  const storyId = `${context.kind}_${context.story}`;
  if (lastStoryId !== storyId) {
    lastStoryId = storyId;

    const dataStore = new DataStore();
    dataStore.reset();
  }

  if (!_.isNil(mockData.initializeStore)) mockData.initializeStore();

  const appStore = new AppStore();
  appStore.setConfig(props.config);

  const locales = {en_US, es_ES};

  return (
    <App {...props} locale={locales[select("locale", ["en_US", "es_ES"], "en_US", "Options")]}>
      {storyFunction()}
    </App>
  );
};

export const withCenter = () => (storyFunction: RenderFunction) => (
  <div
    style={{
      position: "fixed",
      top: "0px",
      left: "0px",
      bottom: "0px",
      right: "0px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "auto",
      backgroundColor: "#ededed",
    }}>
    <div style={{margin: "auto", backgroundColor: "white"}}>{storyFunction()}</div>
  </div>
);

export const withFullHeight = () => (storyFunction: RenderFunction) => <div className="ol-fullHeight">{storyFunction()}</div>;

export const withStyleCustom = (style: any) => (storyFunction: RenderFunction) => <div style={style}>{storyFunction()}</div>;

export const withSizeSmall = () => (storyFunction: RenderFunction) => <div style={{maxWidth: "300px", minWidth: "300px"}}>{storyFunction()}</div>;

export const withSizeMedium = () => (storyFunction: RenderFunction) => <div style={{maxWidth: "450px", minWidth: "300px"}}>{storyFunction()}</div>;

export const withSizeLarge = () => (storyFunction: RenderFunction) => <div style={{maxWidth: "800px", minWidth: "700px"}}>{storyFunction()}</div>;
