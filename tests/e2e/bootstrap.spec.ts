import { expect, test } from "@playwright/test";

test("renders the Lot 0 engineering bootstrap", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Mariage OS" }),
  ).toBeVisible();
  await expect(
    page.getByText("Socle d’ingénierie Lot 0 initialisé."),
  ).toBeVisible();
  await expect(
    page.getByText("Aucune fonctionnalité métier n’est encore implémentée."),
  ).toBeVisible();
});
