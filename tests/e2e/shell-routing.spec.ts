import { expect, test } from "@playwright/test";

const projectId = "81111111-1111-4111-8111-111111111111";

async function renderAllowedProject(page: Parameters<typeof test>[0]["page"]) {
  await page.goto("/");
  await page.evaluate(async ({ id }) => {
    const module = await import("/src/app/bootstrap/start-application.ts");
    const root = document.querySelector<HTMLElement>("#app");
    if (root === null) {
      throw new Error("Missing application root.");
    }
    await module.startApplication(root, {
      pathname: `/app/p/${id}/settings`,
      sessionReader: {
        async getSession() {
          return {
            kind: "authenticated_verified" as const,
            userId: "browser-member",
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
    });
  }, { id: projectId });
}

test("signed-out protected deep link renders no private project shell", async ({
  page,
}) => {
  await page.goto(`/app/p/${projectId}/venues/example`);

  await expect(page.getByRole("heading", { name: "Connexion requise" })).toBeVisible();
  await expect(page.locator('[data-shell="private-project"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Se connecter" })).toHaveAttribute(
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
  const hrefs = await page.locator("nav a").evaluateAll((links) =>
    links.map((link) => link.getAttribute("href")),
  );
  expect(hrefs.length).toBeGreaterThan(10);
  expect(
    hrefs.every(
      (href) => href !== null && href.startsWith(`/app/p/${projectId}/`),
    ),
  ).toBe(true);
});

test("verified outsider gets the same generic project-unavailable shell", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async ({ id }) => {
    const module = await import("/src/app/bootstrap/start-application.ts");
    const root = document.querySelector<HTMLElement>("#app");
    if (root === null) {
      throw new Error("Missing application root.");
    }
    await module.startApplication(root, {
      pathname: `/app/p/${id}/dashboard`,
      sessionReader: {
        async getSession() {
          return {
            kind: "authenticated_verified" as const,
            userId: "browser-outsider",
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
    });
  }, { id: projectId });

  await expect(page.getByRole("heading", { name: "Projet indisponible" })).toBeVisible();
  await expect(page.locator('[data-shell="private-project"]')).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(projectId);
});

test("public RSVP route is token-minimal and contains no project navigation", async ({
  page,
}) => {
  const token = "browser-secret-capability-value";
  await page.goto(`/rsvp/${token}`);

  await expect(page.locator('[data-shell="public-rsvp"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Invitation & RSVP" })).toBeVisible();
  await expect(page.locator("nav")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(token);
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

test("navigation switches between desktop and mobile skeletons", async ({ page }) => {
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
