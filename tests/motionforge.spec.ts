import { expect, test } from '@playwright/test';

test('edits styles, diagnostics, viewport, and export code', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'MotionForge' })).toBeVisible();
  await expect(page.getByTestId('canvas-preview')).toBeVisible();
  await expect(page.getByText(/Desktop · 1280 × 720/)).toBeVisible();

  await page.getByTestId('add-heading').click();

  const headingText = 'E2E centered heading';
  await expect(page.getByLabel('Text content')).toHaveValue('New heading');
  await page.getByLabel('Text content').fill(headingText);

  const previewHeading = page.getByTestId('canvas-preview').locator('h1', { hasText: headingText });
  await expect(previewHeading).toBeVisible();

  await page.getByLabel('Text align').selectOption('center');
  await expect(previewHeading).toHaveClass(/text-center/);

  await page.getByLabel('Display').selectOption('grid');
  await expect(page.getByLabel('Flex direction')).toBeDisabled();

  await page.getByLabel('Display').selectOption('flex');
  await expect(page.getByLabel('Grid columns')).toBeDisabled();

  await page.getByLabel('Custom Tailwind classes').fill('w-full w-1/2');
  await expect(page.getByText('Conflicting width classes')).toBeVisible();

  await page.getByLabel('Position').selectOption('relative');
  await page.getByLabel('Top').fill('20px');
  await page.getByLabel('Position').selectOption('static');
  await expect(page.getByText('Position offsets may not apply')).toBeVisible();

  await page.getByRole('button', { name: 'Mobile' }).click();
  await expect(page.getByTestId('canvas-frame')).toHaveAttribute('data-viewport', 'mobile');
  await expect(page.getByText(/Mobile · 390 × 844/)).toBeVisible();

  await page.getByRole('button', { name: 'Export Code' }).click();
  await expect(page.getByRole('heading', { name: 'Export generated code' })).toBeVisible();
  await expect(page.getByTestId('react-code')).toContainText(headingText);
  await expect(page.getByTestId('react-code')).toContainText('text-center');
  await expect(page.getByTestId('react-code')).toContainText('w-1/2');
});
