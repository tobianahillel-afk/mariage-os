import { expect, test } from "@playwright/test";

test("renders the private Mariage OS landing shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Mariage OS" })).toBeVisible();
  await expect(
    page.getByText("Votre espace privé pour préparer le mariage ensemble."),
  ).toBeVisible();
  await expect(page.locator('[data-shell="landing"]')).toBeVisible();
});
