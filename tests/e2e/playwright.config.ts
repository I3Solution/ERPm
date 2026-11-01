import { defineConfig } from '@playwright/test';
import * as path from 'path';
import { ADMIN_PASSWORD, API_URL, CONNECTION, WEB_URL } from './support/env';

const root = path.resolve(__dirname, '..', '..');
const apiDll = path.join(root, 'ERPm-BE', 'src', 'ERPm.API', 'bin', 'Debug', 'net10.0', 'ERPm.API.dll');

// One shared database and one API: specs run one after another and each creates the data it needs with its own codes.
export default defineConfig({
  testDir: './specs',
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
  use: { baseURL: WEB_URL, locale: 'vi-VN', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: [
    {
      // The API build is started directly (`dotnet <dll>`), so nothing is rebuilt here.
      command: `dotnet "${apiDll}" --urls ${API_URL}`,
      cwd: path.join(root, 'ERPm-BE', 'src', 'ERPm.API'),
      url: `${API_URL}/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ASPNETCORE_ENVIRONMENT: 'Development',
        ConnectionStrings__DefaultConnection: CONNECTION,
        Database__AutoMigrate: 'true',
        BootstrapAdmin__UserName: 'admin',
        BootstrapAdmin__Password: ADMIN_PASSWORD
      }
    }
  ]
});
