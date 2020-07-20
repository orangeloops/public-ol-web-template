import * as _ from "lodash";
import * as React from "react";

import {Spin} from "antd";
import {LoadingOutlined} from "@ant-design/icons";
import {observer} from "mobx-react";

import styles from "./Loading.module.scss";
import {WebHelper} from "../../utils/WebHelper";

export type LoadingProps = {
  text?: string;
};

export const Loading: React.FunctionComponent<LoadingProps> = observer((props) => {
  const {text} = props;
  const loadingText = typeof text === "string" && text.length > 0 ? text : WebHelper.formatMessage("Common-loadingText");

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <div className={styles.logo} />

        <div className={styles.content}>{loadingText}</div>

        <div className="ol-loading-spin">
          <Spin indicator={<LoadingOutlined className="ol-loading-spin-icon" />} delay={500} />
        </div>
      </div>
    </div>
  );
});
