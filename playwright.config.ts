import { defineConfig, devices } from '@playwright/test'

const TEST_TIMEOUT = 90000

const subdomains = ['register'] // TODO: Add more subdomains if needed
const insecureOrigins = subdomains.map(
  (subdomain) =>
    `--unsafely-treat-insecure-origin-as-secure=https://${subdomain}.${process.env.DOMAIN}`
)

const ignoreHTTPSErrors = process.env.CI ? true : false
/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: TEST_TIMEOUT,
  testDir: './e2e/testcases',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Don't retry */
  retries: process.env.CI ? 3 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { open: 'never' }],
    ['playwright-ctrf-json-reporter', {}]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',
    /* Capture screenshot on failure */
    screenshot: 'on',
    /* Collect trace when the test failed. See https://playwright.dev/docs/trace-viewer */
    trace: 'on',
    // Ignore HTTPS errors (like untrusted or self-signed certificates) during Playwright tests on CI
    // This is useful for Let's Encrypt staging certificates that aren't publicly trusted.
    ignoreHTTPSErrors
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ignoreHTTPSErrors,
        launchOptions: {
          args: process.env.CI
            ? [
                '--ignore-certificate-errors',
                '--ignore-ssl-errors',
                '--allow-running-insecure-content',
                '--disable-web-security',
                ...insecureOrigins
              ]
            : []
        }
      }
    }

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] }
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] }
    // }

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ]

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
})
