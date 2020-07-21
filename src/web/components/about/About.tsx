import * as React from "react";
import {observer} from "mobx-react";
import {WebHelper} from "../../utils/WebHelper";

import {Button, Modal} from "antd";

import styles from "./About.module.scss";

export type AboutProps = {
  onClose?: () => void;
};

export const About: React.FC<AboutProps> = observer((props) => {
  const {onClose} = props;

  const handleClose = React.useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  const footer = (
    <Button type="primary" onClick={handleClose}>
      {WebHelper.formatMessage("Common-ok")}
    </Button>
  );

  return (
    <Modal title={WebHelper.formatMessage("About-title")} visible={true} width={300} footer={footer} onCancel={handleClose}>
      <div className={styles.container}>
        <div className={styles.companyContainer}>
          <div className={styles.text + " " + styles.bold}>{WebHelper.formatMessage("About-builtBy")}</div>
          <div className={styles.companyIcon} />
        </div>
      </div>
    </Modal>
  );
});
