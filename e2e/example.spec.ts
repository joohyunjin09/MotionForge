import { expect, test } from "@playwright/test";

test("loads MotionForge editor", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/MotionForge/);
  await expect(page.getByRole("heading", { name: "MotionForge" })).toBeVisible();
  await expect(page.getByTestId("canvas-preview")).toBeVisible();
});
