import * as React from "react";
import {DataStore} from "../../core/stores/DataStore";
import {WebHelper} from "../utils/WebHelper";
import {AppStore} from "../stores/AppStore";
import {LocaleKey, LocaleParams} from "../locales";

export abstract class BaseComponent<P = {}, S = {}> extends React.Component<P, S> {
  protected dataStore = new DataStore();
  protected appStore = new AppStore();

  protected get LoadingSpin(): React.ReactNode {
    return WebHelper.LoadingSpin;
  }

  protected formatMessage<TLocaleKey extends LocaleKey>(messageId: TLocaleKey, variables: LocaleParams[TLocaleKey] | undefined = undefined, defaultMessage: string | undefined = undefined, parseLineBreaks = false): string {
    const {code} = this.dataStore.currentLocale;

    const mobxWorkaround = (workaround: string) => {};
    mobxWorkaround(code);

    return WebHelper.formatMessage(messageId, variables, defaultMessage, parseLineBreaks);
  }
}
