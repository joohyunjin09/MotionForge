import { expect, test, type Page } from "@playwright/test";

async function openAddElementGroup(page: Page, name: string) {
  const group = page.locator("details").filter({ has: page.locator("summary", { hasText: name }) });
  if ((await group.getAttribute("open")) === null) {
    await group.locator("summary").click();
  }
}

test("edits styles, diagnostics, viewport, and export code", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "MotionForge" })).toBeVisible();
  await expect(page.getByTestId("canvas-preview")).toBeVisible();
  await expect(page.getByText(/Desktop \u00b7 1280 \u00d7 720/)).toBeVisible();

  await openAddElementGroup(page, "Text");
  await page.getByTestId("add-heading").click();

  const headingText = "E2E centered heading";
  await expect(page.getByRole("textbox", { name: /Text content/ })).toHaveValue("New heading");
  await page.getByRole("textbox", { name: /Text content/ }).fill(headingText);

  const previewHeading = page.getByTestId("canvas-preview").locator("h2", { hasText: headingText });
  await expect(previewHeading).toBeVisible();

  await page.getByRole("combobox", { name: /Text align/ }).selectOption("center");
  await expect(previewHeading).toHaveClass(/text-center/);

  await page.getByRole("combobox", { name: /^Display$/ }).selectOption("grid");
  await expect(page.getByRole("combobox", { name: /Flex direction/ })).toBeDisabled();

  await page.getByRole("combobox", { name: /^Display$/ }).selectOption("flex");
  await expect(page.getByRole("textbox", { name: /Grid columns/ })).toBeDisabled();

  await page.getByRole("textbox", { name: /Custom Tailwind classes/ }).fill("w-full w-1/2");
  await expect(page.getByText("Conflicting width values")).toBeVisible();

  await page.getByRole("combobox", { name: /Position/ }).selectOption("relative");
  await page.getByRole("textbox", { name: /Top/ }).fill("20px");
  await page.getByRole("combobox", { name: /Position/ }).selectOption("static");
  await expect(page.getByText("Position offsets may not apply")).toBeVisible();

  await page.getByRole("button", { name: "Mobile", exact: true }).click();
  await expect(page.getByTestId("canvas-frame")).toHaveAttribute("data-viewport", "mobile");
  await expect(page.getByText(/Mobile \u00b7 390 \u00d7 844/)).toBeVisible();

  await page.getByRole("button", { name: "Export Code" }).click();
  await expect(page.getByRole("heading", { name: "Export generated code" })).toBeVisible();
  await expect(page.getByTestId("react-code")).toContainText(headingText);
  await expect(page.getByTestId("react-code")).toContainText("text-center");
  await expect(page.getByTestId("react-code")).toContainText("w-1/2");
});

test("reorders canvas elements with layout-aware pointer drag", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");

  await openAddElementGroup(page, "Text");
  await page.getByTestId("add-heading").click();
  const headingText = "Draggable heading";
  await page.getByRole("textbox", { name: /Text content/ }).fill(headingText);

  const previewHeading = page.getByTestId("canvas-preview").locator("h2", { hasText: headingText });
  const heroContainer = page.getByTestId("canvas-preview").locator('[data-motion-id="hero-container"]');
  await expect(previewHeading).toBeVisible();
  await expect(heroContainer).toBeVisible();

  const beforeBox = await previewHeading.boundingBox();
  const beforeContainerBox = await heroContainer.boundingBox();
  expect(beforeBox).not.toBeNull();
  expect(beforeContainerBox).not.toBeNull();
  expect(beforeBox!.y).toBeGreaterThan(beforeContainerBox!.y);

  await page.mouse.move(beforeBox!.x + beforeBox!.width / 2, beforeBox!.y + beforeBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(beforeContainerBox!.x + beforeContainerBox!.width / 2, beforeContainerBox!.y - 32, { steps: 8 });
  await page.mouse.up();

  const afterBox = await previewHeading.boundingBox();
  const afterContainerBox = await heroContainer.boundingBox();
  expect(afterBox).not.toBeNull();
  expect(afterContainerBox).not.toBeNull();
  expect(afterBox!.y).toBeLessThan(afterContainerBox!.y);
  await expect(page.getByRole("combobox", { name: /Position/ })).toHaveValue("");
  await expect(page.getByRole("textbox", { name: /Left/ })).toBeDisabled();
  await expect(page.getByRole("textbox", { name: /Top/ })).toBeDisabled();
});
