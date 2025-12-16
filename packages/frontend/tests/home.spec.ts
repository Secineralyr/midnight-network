import { expect, test } from '@playwright/test';

test('home', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('midnight-network')).toBeVisible();
});
