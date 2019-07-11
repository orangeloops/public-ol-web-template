import {observer} from "mobx-react";
import * as React from "react";
import {BaseComponent} from "../../components/BaseComponent";
import {Button, Input} from "antd";
import {boundMethod} from "autobind-decorator";

import styles from "./SignIn.module.scss";

type SignInProps = {};

type SignInState = {
  loading: boolean;
  text: string;
};

@observer
export class SignIn extends BaseComponent<SignInProps, SignInState> {
  state: SignInState = {
    loading: false,
    text: "Sign in",
  } as SignInState;

  @boundMethod
  protected async handleSignIn() {
    const {dataStore, appStore} = this;
    const {authenticationState} = dataStore;

    if (authenticationState.loadingSignIn) return;

    this.setState({loading: true, text: "Loading"});

    const signInResponse = await dataStore.signIn({email: "email", password: "password"});

    this.setState({loading: false, text: "Sign in"});

    if (signInResponse.success) {
      appStore.navigateTo("/");
    } else alert("Sign in unsuccessful");
  }

  render() {
    const {loading, text} = this.state;

    return (
      <div className={styles.wrapperContainer}>
        <div className={styles.container}>
          <div className={styles.emailContainer}>
            <Input placeholder="email" />
          </div>
          <div className={styles.passwordContainer}>
            <Input placeholder="password" />
          </div>
          <div>
            <div className={styles.buttonContainer}>
              <Button className={styles.button} loading={loading} onClick={this.handleSignIn}>
                {text}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
