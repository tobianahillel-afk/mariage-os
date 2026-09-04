import { createDefaultBrowserLocalRuntime } from "@app/bootstrap/browser-local-runtime";
import { createBrowserShellRuntime } from "@app/bootstrap/browser-shell-runtime";
import { startApplication } from "@app/bootstrap/start-application";
import "./styles.css";

const APP_VERSION = "0.0.0";
const root = document.querySelector<HTMLElement>("#app");

if (root === null) {
  throw new Error("Mariage OS bootstrap root #app is missing.");
}

const runtime = createBrowserShellRuntime({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
});
const localRuntime = createDefaultBrowserLocalRuntime(APP_VERSION);

await startApplication(root, {
  pathname: window.location.pathname,
  sessionReader: runtime.sessionReader,
  projectAccess: runtime.projectAccess,
  localStoreFactory: localRuntime.localStoreFactory,
  deviceId: localRuntime.deviceId,
  online: localRuntime.online,
  appVersion: localRuntime.appVersion,
});
