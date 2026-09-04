import { expect, test, type Page } from "@playwright/test";

const projectId = "81111111-1111-4111-8111-111111111111";
const secondProjectId = "82222222-2222-4222-8222-222222222222";
const userId = "71111111-1111-4111-8111-111111111111";
const deviceId = "61111111-1111-4111-8111-111111111111";
const operationId = "55555555-5555-4555-8555-555555555555";

async function renderAllowedProject(page: Page, id = projectId): Promise<void> {
  await page.goto("/");
  await page.evaluate(
    async ({
      id: targetProjectId,
      userId: targetUserId,
      deviceId: targetDeviceId,
    }) => {
      const startModulePath = "/src/app/bootstrap/start-application.ts";
      const storeModulePath =
        "/src/infrastructure/indexeddb/indexeddb-project-store.ts";
      const startModule = await import(startModulePath);
      const storeModule = await import(storeModulePath);
      const browserGlobal = globalThis as unknown as {
        document: { querySelector(selector: string): unknown | null };
        indexedDB: unknown;
      };
      const root = browserGlobal.document.querySelector("#app");
      if (root === null) {
        throw new Error("Missing application root.");
      }
      await startModule.startApplication(root, {
        pathname: `/app/p/${targetProjectId}/settings`,
        sessionReader: {
          async getSession() {
            return {
              kind: "authenticated_verified" as const,
              userId: targetUserId,
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
        localStoreFactory: new storeModule.IndexedDbProjectStoreFactory(
          browserGlobal.indexedDB,
        ),
        deviceId: targetDeviceId,
        online: true,
        appVersion: "0.0.0",
      });
    },
    { id, userId, deviceId },
  );
}

async function persistPendingMutation(page: Page): Promise<void> {
  await page.evaluate(
    async ({
      projectId: targetProjectId,
      userId: targetUserId,
      deviceId: targetDeviceId,
      operationId: targetOperationId,
    }) => {
      const scopeModulePath =
        "/src/application/local-data/local-project-scope.ts";
      const recordsModulePath = "/src/application/local-data/local-records.ts";
      const storeModulePath =
        "/src/infrastructure/indexeddb/indexeddb-project-store.ts";
      const scopeModule = await import(scopeModulePath);
      const recordsModule = await import(recordsModulePath);
      const storeModule = await import(storeModulePath);
      const browserGlobal = globalThis as unknown as { indexedDB: unknown };
      const scope = scopeModule.createLocalProjectScope(
        targetUserId,
        targetProjectId,
        targetDeviceId,
      );
      const store = await storeModule.IndexedDbProjectStore.open(
        browserGlobal.indexedDB,
        scope,
        "0.0.0",
      );
      await store.addPendingMutation(
        recordsModule.createPendingMutationEnvelope(scope, {
          operationId: targetOperationId,
          entityType: "project_preferences",
          entityId: "44444444-4444-4444-8444-444444444444",
          mutationType: "update_preferences",
          baseRevision: "rev-1",
          payload: { density: "compact" },
          createdAt: "2026-09-04T14:00:00.000Z",
          priorityClass: "metadata",
        }),
      );
      store.close();
    },
    { projectId, userId, deviceId, operationId },
  );
}

async function projectCanReadOperation(
  page: Page,
  targetProjectId: string,
): Promise<boolean> {
  return page.evaluate(
    async ({
      projectId: targetProject,
      userId: targetUser,
      deviceId: targetDevice,
      operationId: targetOperation,
    }) => {
      const scopeModulePath =
        "/src/application/local-data/local-project-scope.ts";
      const storeModulePath =
        "/src/infrastructure/indexeddb/indexeddb-project-store.ts";
      const scopeModule = await import(scopeModulePath);
      const storeModule = await import(storeModulePath);
      const browserGlobal = globalThis as unknown as { indexedDB: unknown };
      const scope = scopeModule.createLocalProjectScope(
        targetUser,
        targetProject,
        targetDevice,
      );
      const store = await storeModule.IndexedDbProjectStore.open(
        browserGlobal.indexedDB,
        scope,
        "0.0.0",
      );
      const mutation = await store.getPendingMutation(targetOperation);
      store.close();
      return mutation !== null;
    },
    {
      projectId: targetProjectId,
      userId,
      deviceId,
      operationId,
    },
  );
}

test("signed-out protected deep link renders no private project shell", async ({
  page,
}) => {
  await page.goto(`/app/p/${projectId}/venues/example`);

  await expect(
    page.getByRole("heading", { name: "Connexion requise" }),
  ).toBeVisible();
  await expect(page.locator('[data-shell="private-project"]')).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Se connecter" }),
  ).toHaveAttribute(
    "href",
    `/login?returnTo=${encodeURIComponent(`/app/p/${projectId}/venues/example`)}`,
  );
});

test("verified member receives project-scoped navigation only after live access", async ({
  page,
}) => {
  await renderAllowedProject(page);

  await expect(page.locator('[data-shell="private-project"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Réglages" })).toBeVisible();
  await expect(page.locator('[data-rsvp-intent-hook="true"]')).toBeVisible();
  await expect(page.locator('[data-sync-state="synced"]')).toContainText(
    "En ligne · synchronisé",
  );
  const hrefs = await page
    .locator("nav a")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(10);
  expect(
    hrefs.every(
      (href) => href !== null && href.startsWith(`/app/p/${projectId}/`),
    ),
  ).toBe(true);
});

test("pending mutation survives reload and remains isolated by account+project namespace", async ({
  page,
}) => {
  await renderAllowedProject(page);
  await persistPendingMutation(page);

  await page.reload();
  await renderAllowedProject(page);
  await expect(page.locator('[data-sync-state="pending"]')).toContainText(
    "1 modification en attente",
  );

  await renderAllowedProject(page, secondProjectId);
  await expect(page.locator('[data-sync-state="synced"]')).toContainText(
    "En ligne · synchronisé",
  );
  expect(await projectCanReadOperation(page, secondProjectId)).toBe(false);
});

test("verified outsider gets the same generic project-unavailable shell", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    async ({ id, userId: targetUserId }) => {
      const modulePath = "/src/app/bootstrap/start-application.ts";
      const module = await import(modulePath);
      const browserGlobal = globalThis as unknown as {
        document: { querySelector(selector: string): unknown | null };
      };
      const root = browserGlobal.document.querySelector("#app");
      if (root === null) {
        throw new Error("Missing application root.");
      }
      await module.startApplication(root, {
        pathname: `/app/p/${id}/dashboard`,
        sessionReader: {
          async getSession() {
            return {
              kind: "authenticated_verified" as const,
              userId: targetUserId,
              email: "outsider@example.invalid",
              assurance: "aal1" as const,
            };
          },
        },
        projectAccess: {
          async canReadProject() {
            return false;
          },
        },
        localStoreFactory: null,
        deviceId: null,
        online: true,
        appVersion: "0.0.0",
      });
    },
    { id: projectId, userId },
  );

  await expect(
    page.getByRole("heading", { name: "Projet indisponible" }),
  ).toBeVisible();
  await expect(page.locator('[data-shell="private-project"]')).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(projectId);
});

test("public RSVP route is token-minimal and contains no project navigation", async ({
  page,
}) => {
  const capability = "browser-opaque-capability-value";
  await page.goto(`/rsvp/${capability}`);

  await expect(page.locator('[data-shell="public-rsvp"]')).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Invitation & RSVP" }),
  ).toBeVisible();
  await expect(page.locator("nav")).toHaveCount(0);
  await expect(page.locator("[data-sync-state]")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(capability);
  await expect(page).toHaveTitle("Invitation & RSVP · Mariage OS");
  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute(
    "content",
    "no-referrer",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow, noarchive",
  );
});

test("navigation switches between desktop and mobile skeletons", async ({
  page,
}) => {
  await renderAllowedProject(page);

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.locator(".desktop-nav")).toBeVisible();
  await expect(page.locator(".mobile-nav")).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".desktop-nav")).toBeHidden();
  await expect(page.locator(".mobile-nav")).toBeVisible();
  await page.locator(".mobile-more summary").click();
  await expect(
    page.locator(".mobile-more-menu").getByRole("link", { name: "Réglages" }),
  ).toBeVisible();
});
