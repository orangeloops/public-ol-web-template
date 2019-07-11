import * as _ from "lodash";
import * as React from "react";
import {BaseComponent} from "../../components/BaseComponent";

import {Icon, Spin} from "antd";
import {observer} from "mobx-react";

import styles from "./Loading.module.scss";

type LoadingProps = {
  text?: string;
};

type LoadingState = {};

@observer
export class Loading extends BaseComponent<LoadingProps, LoadingState> {
  state: LoadingState = {} as LoadingState;

  protected get LoadingIndicator(): React.ReactNode {
    const icon = <Icon type="loading" className="ol-loading-spin-icon" />;

    return (
      <div className="ol-loading-spin">
        <Spin indicator={icon} delay={500} />
      </div>
    );
  }

  render() {
    const {text} = this.props;

    const loadingText = !_.isNil(text) && text.length > 0 ? text : this.formatMessage("Common-loadingText");

    return (
      <div className={styles.container}>
        <div className={styles.box}>
          <div className={styles.logo} />
          <div className={styles.content}>{loadingText}</div>

          {this.LoadingIndicator}
        </div>
      </div>
    );
  }
}
