import {observer} from "mobx-react";
import * as React from "react";
import {Button, Input} from "antd";

import styles from "./SignIn.module.scss";
import {AppStore} from "../../stores/AppStore";
import {DataStore} from "../../../core/stores/DataStore";

export const SignIn: React.FunctionComponent = observer(() => {
  const [loading, setLoading] = React.useState(false);

  const handleSignIn = React.useCallback(async () => {
    const dataStore = DataStore.getInstance();
    const appStore = AppStore.getInstance();
    const {authenticationState} = dataStore;

    if (authenticationState.loadingSignIn) return;

    setLoading(true);

    const signInResponse = await dataStore.signIn({email: "email", password: "password"});

    setLoading(false);

    if (signInResponse.success) {
      appStore.navigateTo("/");
    } else alert("Sign in unsuccessful");
  }, []);

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
            <Button className={styles.button} loading={loading} onClick={handleSignIn}>
              {loading ? "loading" : "Sign in"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
