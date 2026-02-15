import { test, expect } from '@playwright/test';

test.describe('Human Design Chart App', () => {

  test('loads transit view by default', async ({ page }) => {
    await page.goto('/');
    // Wait for ephemeris to initialize
    await page.waitForSelector('#bodygraph-container svg', { timeout: 15000 });

    // Should show transit mode as active
    const transitBtn = page.locator('[data-mode="transit"]');
    await expect(transitBtn).toHaveClass(/font-medium/);

    // SVG should contain gate elements
    const svg = page.locator('#bodygraph-container svg');
    await expect(svg).toBeVisible();

    // Gate elements should exist
    const gate1 = svg.locator('#Gate1');
    await expect(gate1).toBeVisible();
  });

  test('k0 chart: Manifestor 1/3 Emotional Authority', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#bodygraph-container svg', { timeout: 15000 });

    // Add k0's chart: born 1976-03-08 00:40 EET (+2)
    await page.click('#add-person-btn');
    await page.fill('#person-name', 'k0');
    await page.fill('#person-date', '1976-03-08');
    await page.fill('#person-time', '00:40');
    await page.selectOption('#person-tz', '2'); // EET = +2
    await page.click('#save-person-btn');

    // Wait for chart to render
    await page.waitForTimeout(500);

    // Verify chart analysis
    await expect(page.locator('[data-testid="chart-type"]')).toHaveText('Manifestor');
    await expect(page.locator('[data-testid="chart-authority"]')).toHaveText('Emotional (Solar Plexus)');
    await expect(page.locator('[data-testid="chart-profile"]')).toHaveText('1/3');

    // Verify channels: 11-56, 12-22, 21-45, 23-43
    const channelsList = page.locator('[data-testid="channels-list"]');
    await expect(channelsList).toBeVisible();

    const channels = channelsList.locator('[data-testid="channel"]');
    const channelTexts = await channels.allTextContents();

    expect(channelTexts).toContain('11-56');
    expect(channelTexts).toContain('12-22');
    expect(channelTexts).toContain('21-45');
    expect(channelTexts).toContain('23-43');
  });

  test('person+person composite view shows both charts', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#bodygraph-container svg', { timeout: 15000 });

    // Add person A
    await page.click('#add-person-btn');
    await page.fill('#person-name', 'Person A');
    await page.fill('#person-date', '1976-03-08');
    await page.fill('#person-time', '00:40');
    await page.selectOption('#person-tz', '2');
    await page.click('#save-person-btn');
    await page.waitForTimeout(300);

    // Add person B
    await page.click('#add-person-btn');
    await page.fill('#person-name', 'Person B');
    await page.fill('#person-date', '1990-06-15');
    await page.fill('#person-time', '14:30');
    await page.selectOption('#person-tz', '2');
    await page.click('#save-person-btn');
    await page.waitForTimeout(300);

    // Select person B as "B"
    await page.click('.select-person-b');
    await page.waitForTimeout(300);

    // View mode should switch to person-person
    const ppBtn = page.locator('[data-mode="person-person"]');
    await expect(ppBtn).toHaveClass(/font-medium/);

    // Both charts should be shown in sidebar
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toContainText('Person A');
    await expect(sidebar).toContainText('Person B');
  });

  test('profile button shows login modal when not logged in', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#bodygraph-container svg', { timeout: 15000 });

    // Click profile button
    await page.click('#profile-btn');

    // Login modal should appear
    const loginModal = page.locator('#login-modal');
    await expect(loginModal).toBeVisible();

    // Should have extension and guest buttons
    await expect(page.locator('#login-extension-btn')).toBeVisible();
    await expect(page.locator('#login-guest-btn')).toBeVisible();

    // Cancel should close
    await page.click('#cancel-login-btn');
    await expect(loginModal).toBeHidden();
  });

  test('insight report button appears for person view', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#bodygraph-container svg', { timeout: 15000 });

    // Insight button should be hidden initially (transit mode)
    const insightSection = page.locator('#insight-section');
    await expect(insightSection).toBeHidden();

    // Add a person
    await page.click('#add-person-btn');
    await page.fill('#person-name', 'Test');
    await page.fill('#person-date', '1990-01-01');
    await page.fill('#person-time', '12:00');
    await page.click('#save-person-btn');
    await page.waitForTimeout(500);

    // Now in single view, insight button should be visible
    await expect(insightSection).toBeVisible();
    await expect(page.locator('#insight-btn')).toBeVisible();
  });

});
