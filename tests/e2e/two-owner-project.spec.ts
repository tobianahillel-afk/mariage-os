import { expect, test, type Page } from "@playwright/test";
import { renderSecurityProject } from "./security-project-harness.js";

const projectId = "81111111-1111-4111-8111-111111111111";

const ownerOne = {
  userId: "71111111-1111-4111-8111-111111111111",
  deviceId: "61111111-1111-4111-8111-111111111111",
} as const;

const ownerTwo = {
  userId: "72222222-2222-4222-8222-222222222222",
  deviceId: "62222222-2222-4222-8222-222222222222",
} as const;

async function expectProtectedProject(page: Page): Promise<void> {
  await expect(page.locator('[data-shell="private-project"]')).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Sécurité", exact: true }),
  ).toBeVisible();

  const navigation = page.getByRole("navigation", {
    name: "Navigation du projet",
  });
  await expect(navigation).toBeVisible();
  await expect(
    navigation.getByRole("link", { name: "Accueil" }),
  ).toHaveAttribute("href", `/app/p/${projectId}/dashboard`);
  await expect(
    navigation.getByRole("link", { name: "Réglages" }),
  ).toHaveAttribute("href", `/app/p/${projectId}/settings`);
}

test("two synthetic owners independently open the same protected project", async ({
  browser,
}) => {
  const ownerOneContext = await browser.newContext();
  const ownerTwoContext = await browser.newContext();

  try {
    const ownerOnePage = await ownerOneContext.newPage();
    const ownerTwoPage = await ownerTwoContext.newPage();

    await Promise.all([
      renderSecurityProject(ownerOnePage, { projectId, ...ownerOne }),
      renderSecurityProject(ownerTwoPage, { projectId, ...ownerTwo }),
    ]);

    await Promise.all([
      expectProtectedProject(ownerOnePage),
      expectProtectedProject(ownerTwoPage),
    ]);
  } finally {
    await Promise.all([ownerOneContext.close(), ownerTwoContext.close()]);
  }
});
