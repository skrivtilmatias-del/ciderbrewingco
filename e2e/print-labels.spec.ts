import { test, expect } from '@playwright/test';

test.describe('Print Labels Page', () => {
  test('should render print page with labels grid', async ({ page }) => {
    // Mock batch data by navigating with query params
    const testIds = 'batch-1,batch-2,batch-3';
    await page.goto(`/print/labels?mode=batch&ids=${testIds}`);

    // Wait for content to load
    await page.waitForSelector('.print-sheet', { timeout: 5000 });

    // Check that print sheet is rendered
    const printSheet = page.locator('.print-sheet');
    await expect(printSheet).toBeVisible();

    // Check that labels are rendered
    const labels = page.locator('.print-label');
    const count = await labels.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should render QR codes as SVG', async ({ page }) => {
    const testIds = 'batch-1';
    await page.goto(`/print/labels?mode=batch&ids=${testIds}`);

    await page.waitForSelector('.print-qr', { timeout: 5000 });

    // Check for SVG QR code
    const qrSvg = page.locator('.print-qr svg');
    await expect(qrSvg.first()).toBeVisible();
    
    // Verify it's actually SVG (crisp, not raster)
    const tagName = await qrSvg.first().evaluate(el => el.tagName);
    expect(tagName.toLowerCase()).toBe('svg');
  });

  test('should apply print styles correctly', async ({ page }) => {
    const testIds = 'batch-1,batch-2';
    await page.goto(`/print/labels?mode=batch&ids=${testIds}`);

    await page.waitForSelector('.print-label', { timeout: 5000 });

    // Emulate print media
    await page.emulateMedia({ media: 'print' });

    // Take screenshot of print view
    await page.screenshot({ 
      path: 'e2e/screenshots/print-labels.png',
      fullPage: true 
    });

    // Verify grid layout
    const sheet = page.locator('.print-sheet');
    const display = await sheet.evaluate(el => 
      window.getComputedStyle(el).display
    );
    expect(display).toBe('grid');
  });

  test('should handle blend mode', async ({ page }) => {
    const testIds = 'blend-1,blend-2';
    await page.goto(`/print/labels?mode=blend&ids=${testIds}`);

    await page.waitForSelector('.print-sheet', { timeout: 5000 });

    const labels = page.locator('.print-label');
    const count = await labels.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show loader while fetching data', async ({ page }) => {
    // Start navigation but don't wait for load
    const navigation = page.goto('/print/labels?mode=batch&ids=test-id');

    // Should show loader initially
    await expect(page.locator('svg.animate-spin')).toBeVisible();

    // Wait for navigation to complete
    await navigation;
  });
});
