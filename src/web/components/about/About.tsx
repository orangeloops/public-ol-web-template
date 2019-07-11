import * as _ from "lodash";
import * as React from "react";
import {BaseComponent} from "../BaseComponent";
import {observer} from "mobx-react";
import {boundMethod} from "autobind-decorator";

import {Button, Modal} from "antd";

import styles from "./About.module.scss";

type AboutProps = {
  onClose?: () => void;
};

@observer
export class About extends BaseComponent<AboutProps> {
  @boundMethod
  private handleClose() {
    const {onClose} = this.props;

    if (!_.isNil(onClose)) onClose();
  }

  render() {
    const footer = (
      <Button type="primary" onClick={this.handleClose}>
        {this.formatMessage("Common-ok")}
      </Button>
    );

    return (
      <Modal title={this.formatMessage("About-title")} visible={true} width={300} footer={footer} onCancel={this.handleClose}>
        <div className={styles.container}>
          <div className={styles.companyContainer}>
            <div className={styles.text + " " + styles.bold}>{this.formatMessage("About-builtBy")}</div>
            <div className={styles.companyIcon} />
          </div>
        </div>
      </Modal>
    );
  }
}
