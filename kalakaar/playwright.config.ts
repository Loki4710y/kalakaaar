import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT || 3100);
const chromePath = process.env.E2E_CHROMIUM_PATH; // optional: use a pre-installed Chromium

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || `http://localhost:${PORT}`,
    launchOptions: chromePath ? { executablePath: chromePath } : {},
  },
  // Starts the production server unless you point E2E_BASE_URL at a deployed site.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: `npx next start -p ${PORT}`, port: PORT, reuseExistingServer: true, timeout: 60_000 },
});
