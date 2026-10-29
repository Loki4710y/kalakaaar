import { test, expect } from '@playwright/test';

// Public pages must load without a crash, even when logged out.
const PUBLIC_PAGES = ['/', '/explore', '/artists', '/stories', '/collections', '/community', '/about', '/privacy', '/terms', '/auth', '/search'];

for (const path of PUBLIC_PAGES) {
  test(`public page ${path} loads without JS errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(res?.status(), `status for ${path}`).toBe(200);
    await page.waitForTimeout(800);
    expect(page.url()).toContain(path === '/' ? '' : path);
    await expect(page.locator('body')).not.toContainText('Something Went Unexpectedly Wrong');
    expect(errors, errors.join('\n')).toEqual([]);
  });
}

test('privacy and terms pages show real content and contact email', async ({ page }) => {
  for (const p of ['/privacy', '/terms']) {
    await page.goto(p);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('body')).toContainText('@');
  }
});

test('unknown route shows the branded 404', async ({ page }) => {
  const res = await page.goto('/this-page-does-not-exist-xyz');
  expect(res?.status()).toBe(404);
});

test('security headers are present', async ({ request }) => {
  const res = await request.get('/');
  const h = res.headers();
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['strict-transport-security']).toContain('max-age');
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['x-powered-by']).toBeUndefined();
});

test('robots, sitemap and manifest respond', async ({ request }) => {
  for (const p of ['/robots.txt', '/sitemap.xml', '/manifest.webmanifest']) {
    const res = await request.get(p);
    expect(res.status(), p).toBe(200);
  }
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots.toLowerCase()).toContain('disallow');
});

test('admin and private pages do not leak data when logged out', async ({ page }) => {
  await page.goto('/kalakaar-admin');
  await page.waitForTimeout(1500);
  // Must not show admin tables to an anonymous visitor.
  await expect(page.locator('body')).not.toContainText(/All Users|Pending Reports/i);
});

test('artist-only pages send logged-out visitors to sign in', async ({ page }) => {
  for (const p of ['/artist-portal', '/artist-portal/bulk', '/artist-portal/upload']) {
    await page.goto(p);
    await page.waitForURL(/\/auth/, { timeout: 8000 });
  }
});

test('sitemap has no placeholder URLs and pages do not claim the home page as canonical', async ({ request, page }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  expect(xml).not.toMatch(/\/(artwork|artist)\/\d+</);
  expect(xml).not.toMatch(/\/(collections\/c|stories\/s)\d+</);
  await page.goto('/explore');
  const canon = await page.locator('link[rel="canonical"]').count();
  if (canon > 0) expect(await page.locator('link[rel="canonical"]').first().getAttribute('href')).toContain('/explore');
});

test('private and thin pages are marked noindex, public pages are indexable', async ({ request }) => {
  const robotsOf = async (path: string) => ((await (await request.get(path)).text()).match(/name="robots" content="([^"]*)"/) || [])[1] || '';
  expect(await robotsOf('/search')).toContain('noindex');
  expect(await robotsOf('/auth')).toContain('noindex');
  expect(await robotsOf('/explore')).not.toContain('noindex');
  expect(await robotsOf('/about')).not.toContain('noindex');
});

test('list pages have their own title and canonical', async ({ request }) => {
  for (const path of ['/explore', '/artists', '/stories', '/collections', '/about']) {
    const html = await (await request.get(path)).text();
    expect(html).toContain(`rel="canonical" href="`);
    expect(html).toMatch(new RegExp(`rel="canonical" href="[^"]*${path}"`));
    expect(html.match(/<title>(.*?)<\/title>/)?.[1].length).toBeLessThan(70);
  }
});

// ---- page transitions -------------------------------------------------------------------------
const curtainState = (page: import('@playwright/test').Page) => page.locator('[data-route-curtain]').getAttribute('data-state');

test('moving to another section shows the curtain, then lands on the page and the curtain goes away', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(800);
  expect(await curtainState(page)).toBe('idle');
  await page.locator('header a[href="/explore"], nav a[href="/explore"]').first().click();
  await expect.poll(() => curtainState(page), { timeout: 3000 }).toMatch(/covering|covered/);
  await page.waitForURL('**/explore', { timeout: 15000 });
  await expect.poll(() => curtainState(page), { timeout: 8000 }).toBe('idle');
  await expect(page.locator('h1').first()).toBeVisible();
});

test('the first page is not delayed by a transition', async ({ page }) => {
  await page.goto('/explore');
  await expect(page.locator('.kk-page-enter')).toHaveCount(0);
  expect(await curtainState(page)).toBe('idle');
});

test('visitors who ask for reduced motion are never held up by the curtain', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.locator('header a[href="/explore"], nav a[href="/explore"]').first().click();
  expect(await curtainState(page)).toBe('idle');
  await page.waitForURL('**/explore', { timeout: 15000 });
  await ctx.close();
});

test('protected pages still send logged-out visitors to sign in', async ({ page }) => {
  for (const p of ['/settings', '/profile', '/wishlist']) {
    await page.goto(p);
    await page.waitForURL(/\/auth/, { timeout: 8000 });
  }
});
