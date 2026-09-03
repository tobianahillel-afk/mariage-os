import { startApplication } from "@app/bootstrap/start-application";
import "./styles.css";

const root = document.querySelector<HTMLElement>("#app");

if (root === null) {
  throw new Error("Mariage OS bootstrap root #app is missing.");
}

startApplication(root);
