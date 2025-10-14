import { test, expect } from '@playwright/test';

test.describe('QR Code Resolver with Authentication', () => {
  const testEmail = 'test@example.com';
  const testPassword = 'TestPassword123!';

  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should redirect unauthenticated user to login for batch QR', async ({ page }) => {
    // Visit batch QR redirect without authentication
    await page.goto('/r/b/test-batch-id?ts=1000000000&sig=test');

    // Should redirect to login with next parameter
    await expect(page).toHaveURL(/\/auth\?next=/);
    
    // Verify next parameter contains batch route
    const url = new URL(page.url());
    const nextParam = url.searchParams.get('next');
    expect(nextParam).toContain('batch=test-batch-id');
  });

  test('should redirect unauthenticated user to login for blend QR', async ({ page }) => {
    // Visit blend QR redirect without authentication
    await page.goto('/r/l/test-blend-id?ts=1000000000&sig=test');

    // Should redirect to login with next parameter
    await expect(page).toHaveURL(/\/auth\?next=/);
    
    // Verify next parameter contains blend route
    const url = new URL(page.url());
    const nextParam = url.searchParams.get('next');
    expect(nextParam).toContain('blend/test-blend-id');
  });

  test('should show error for expired QR code', async ({ page }) => {
    // Visit with expired timestamp (more than 30 minutes old)
    const expiredTimestamp = Math.floor(Date.now() / 1000) - 2000; // 33+ minutes ago
    await page.goto(`/r/b/test-batch-id?ts=${expiredTimestamp}&sig=test&ttl=1800`);

    // Should show error message
    await expect(page.locator('text=Invalid QR Code')).toBeVisible();
    await expect(page.locator('text=expired')).toBeVisible();
  });

  test('authenticated user should redirect directly to batch', async ({ page }) => {
    // First, simulate login by setting session in localStorage
    await page.goto('/auth');
    
    // Fill login form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    // Note: This test assumes user exists. In real CI, you'd create test user first
    // For now, we just verify the redirect flow works
    
    // Now visit batch QR with "authenticated" state (mock)
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: { access_token: 'mock-token' }
      }));
    });

    await page.goto('/r/b/test-batch-id?ts=1000000000&sig=test');
    
    // Should eventually redirect to batch page (not login)
    await page.waitForURL(/\?batch=/, { timeout: 5000 });
  });
});
