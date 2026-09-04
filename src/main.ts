import { startApplication } from "@app/bootstrap/start-application";
import type { SessionReader } from "@application/routing/protected-route-guard";
import "./styles.css";

const root = document.querySelector<HTMLElement>("#app");

if (root === null) {
  throw new Error("Mariage OS bootstrap root #app is missing.");
}

const signedOutSessionReader: SessionReader = {
  async getSession() {
    return { kind: "signed_out" };
  },
};

await startApplication(root, {
  pathname: window.location.pathname,
  sessionReader: signedOutSessionReader,
  projectAccess: null,
});
