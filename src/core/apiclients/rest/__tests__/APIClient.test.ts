import moment from "moment";

import {userDefault} from "../__mocks__/UserAPI.mock";
import {TestHelper} from "../../../utils/TestHelper";
import {APIClient} from "../APIClient";

const networkMock = TestHelper.getNetworkMockAdapter();

describe("APIClient", () => {
  describe("fetchUser", () => {
    test("fetches correctly", async () => {
      expect.assertions(6);

      const authToken = "some token";

      networkMock.onGet(`user`).reply(config => {
        expect(config.headers["x-token"]).toBe(authToken);

        return [
          200,
          {
            user: userDefault,
          },
        ];
      });

      const response = await APIClient.fetchUser({
        authToken,
      });

      expect(response.user).toBeTruthy();
      expect(response.user!.id).toBe(userDefault.id);
      expect(response.user!.name).toBe(userDefault.name);
      expect(moment.isMoment(response.user!.createdAt)).toBeTruthy();
      expect(response.user!.createdAt.isSame(userDefault.createdAt)).toBeTruthy();
    });
  });

  describe("signIn", () => {
    test("fetches correctly", async () => {
      expect.assertions(7);

      const email = "test@test.com";
      const password = "password";
      const authToken = "some auth token";

      networkMock.onPost(`signIn`).reply(config => {
        const data = JSON.parse(config.data);

        expect(data.email).toBe(email);
        expect(data.password).toBe(password);

        return [
          200,
          {
            user: userDefault,
          },
          {
            "x-token": authToken,
          },
        ];
      });

      const response = await APIClient.signIn({
        email,
        password,
      });

      expect(response.user).toBeTruthy();
      expect(response.user!.id).toBe(userDefault.id);
      expect(response.user!.name).toBe(userDefault.name);
      expect(moment.isMoment(response.user!.createdAt)).toBeTruthy();
      expect(response.user!.createdAt.isSame(userDefault.createdAt)).toBeTruthy();
    });
  });
});
