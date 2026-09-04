import { createBrowserShellRuntime } from "@app/bootstrap/browser-shell-runtime";
import { startApplication } from "@app/bootstrap/start-application";
import "./styles.css";

const root = document.querySelector<HTMLElement>("#app");

if (root === null) {
  throw new Error("Mariage OS bootstrap root #app is missing.");
}

const runtime = createBrowserShellRuntime(import.meta.env);

await startApplication(root, {
  pathname: window.location.pathname,
  sessionReader: runtime.sessionReader,
  projectAccess: runtime.projectAccess,
});
