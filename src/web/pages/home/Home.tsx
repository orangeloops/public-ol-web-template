import * as React from "react";
import {observer} from "mobx-react";
import {BaseComponent} from "../../components/BaseComponent";

import styles from "./Home.module.scss";

export type HomeProps = {};

export type HomeState = {};

@observer
export class Home extends BaseComponent<HomeProps, HomeState> {
  state: HomeState = {} as HomeState;

  componentWillUnmount() {
    this.appStore.hideAllMessages();
  }

  protected get TopContent(): React.ReactNode {
    return <></>;
  }

  protected get MainContent(): React.ReactNode {
    return <> Hello world!</>;
  }

  render() {
    return (
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <div className={styles.background} />

          <div className={styles.contentContainer}>
            <div className={styles.content}>
              {this.TopContent}

              {this.MainContent}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
