import type { Page } from "@playwright/test";

export interface SecurityProjectInput {
  readonly projectId: string;
  readonly userId: string;
  readonly deviceId: string;
}

async function renderSecurityProjectInBrowser(
  input: SecurityProjectInput,
): Promise<void> {
  const startPath = "/src/app/bootstrap/start-application.ts";
  const logoutPath = "/src/application/auth/safe-logout.ts";
  const storePath = "/src/infrastructure/indexeddb/indexeddb-project-store.ts";
  const contextPath =
    "/src/infrastructure/browser/browser-project-session-context-store.ts";
  const [startModule, logoutModule, storeModule, contextModule] =
    await Promise.all([
      import(startPath),
      import(logoutPath),
      import(storePath),
      import(contextPath),
    ]);
  const browserGlobal = globalThis as unknown as {
    document: { querySelector(selector: string): unknown | null };
    indexedDB: unknown;
    localStorage: unknown;
  };
  const root = browserGlobal.document.querySelector("#app");
  if (root === null) throw new Error("Missing application root.");

  const localStore = new storeModule.IndexedDbProjectStoreFactory(
    browserGlobal.indexedDB,
  );
  const sessionContext = new contextModule.BrowserProjectSessionContextStore(
    browserGlobal.localStorage,
  );
  const logoutCoordinator = new logoutModule.SafeLogoutCoordinator({
    auth: { async signOut() {} },
    localStoreFactory: localStore,
    localPurge: localStore,
    sessionContext,
    appVersion: "0.0.0",
  });
  await startModule.startApplication(root, {
    pathname: `/app/p/${input.projectId}/settings/security`,
    sessionReader: {
      async getSession() {
        return {
          kind: "authenticated_verified" as const,
          userId: input.userId,
          email: "member@example.invalid",
          assurance: "aal2" as const,
        };
      },
    },
    projectAccess: {
      async canReadProject() {
        return true;
      },
    },
    sessionContext,
    securityDiagnostics: null,
    logoutCoordinator,
    localStoreFactory: localStore,
    deviceId: input.deviceId,
    online: true,
    appVersion: "0.0.0",
  });
}

export async function renderSecurityProject(
  page: Page,
  input: SecurityProjectInput,
): Promise<void> {
  await page.goto("/");
  await page.evaluate(renderSecurityProjectInBrowser, input);
}
