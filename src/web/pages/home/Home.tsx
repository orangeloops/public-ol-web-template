import * as React from "react";
import {observer} from "mobx-react";

import styles from "./Home.module.scss";
import {AppStore} from "../../stores/AppStore";

export const Home: React.FunctionComponent = observer(() => {
  React.useEffect(() => {
    return () => {
      const appStore = AppStore.getInstance();
      appStore.hideAllMessages();
    };
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.background} />

        <div className={styles.contentContainer}>
          <div className={styles.content}>Hello world!</div>
        </div>
      </div>
    </div>
  );
});
