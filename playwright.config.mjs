import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const live = !!process.env.LIVE;

// Par défaut : site servi en local, API GitHub et polices interceptées (aucun réseau).
// LIVE=1 : uniquement les tests @live, qui interrogent la production (hors CI).
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: live
    ? [{ name: 'live', testMatch: /live-links\.spec\.js/, timeout: 60_000 }]
    : [
        { name: 'desktop', testIgnore: /live-links\.spec\.js/, use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile', testIgnore: /live-links\.spec\.js/, use: { ...devices['Pixel 7'] } },
      ],
  webServer: live
    ? undefined
    : {
        command: `node tests/server.mjs ${PORT}`,
        url: `http://127.0.0.1:${PORT}/`,
        reuseExistingServer: !process.env.CI,
      },
});
