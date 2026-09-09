/**
 * Pa11y CI configuration for the TBCM web application.
 *
 * Every route below belongs to `apps/web`. The suite signs in once per URL
 * through Keycloak, because the app keeps its tokens in `localStorage` and
 * Pa11y has no way to seed them the way the Playwright suite does.
 *
 * Related: `apps/web/e2e/accessibility.spec.ts` runs axe against the same
 * WCAG 2.1 AA standard on stubbed routes and needs no live stack, so prefer it
 * for fast feedback. This config is the full-stack pass.
 */

const BASE_URL = process.env.PA11Y_BASE_URL || 'http://localhost:3000';

// Pa11y bundles Chrome 77, which cannot parse the modern syntax Next.js emits.
// Under it the app never hydrates, so no `actions` below would ever fire. Drive
// the locally installed Chrome instead, matching `apps/web/playwright.config.ts`.
const CHROME_PATH =
  process.env.PA11Y_CHROME_PATH ||
  (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : '/usr/bin/google-chrome');

const defaults = {
  timeout: 30000,
  standard: 'WCAG2AA',
  runners: ['axe'],
  viewport: {
    width: 1300,
    height: 1200,
  },
  chromeLaunchConfig: {
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  },
};

const log = {
  debug: console.log,
  error: console.error,
  info: console.log,
};

// The landing page hands off to the API, which redirects to Keycloak. The
// realm is expected to present its standard username/password form; a realm
// configured with an identity-provider chooser needs an extra click here.
const loginActions = [
  'wait for element #landing-sign-in to be visible',
  'click element #landing-sign-in',
  'wait for element #username to be visible',
  `set field #username to ${process.env.E2E_TEST_USERNAME}`,
  `set field #password to ${process.env.E2E_TEST_PASSWORD}`,
  'click element #kc-login',
  // Signing in drops the user on the planning wizard.
  `wait for path to be /planning`,
  'wait for element .animate-spin to be removed',
];

/** Signs in, then navigates to an authenticated route and waits for it to settle. */
const visit = (path, extraActions = []) => ({
  url: BASE_URL,
  actions: [
    ...loginActions,
    `navigate to ${BASE_URL}${path}`,
    `wait for path to be ${path}`,
    'wait for element .animate-spin to be removed',
    ...extraActions,
  ],
});

const urls = [
  {
    // Landing page — the only route reachable without signing in.
    url: BASE_URL,
    actions: ['wait for element #landing-sign-in to be visible'],
  },
  visit('/planning', ['screen capture captures/planning.png']),
  visit('/care-settings', [
    'wait for element table to be visible',
    'screen capture captures/care-settings.png',
  ]),
  visit('/care-settings/copy', ['screen capture captures/care-settings-copy.png']),
  visit('/care-terminologies', ['screen capture captures/care-terminologies.png']),
  visit('/occupational-scope', ['screen capture captures/occupational-scope.png']),
  visit('/content-management', ['screen capture captures/content-management.png']),
  visit('/user-management', ['screen capture captures/user-management.png']),
  visit('/dashboard', ['screen capture captures/dashboard.png']),
];

if (process.env.DEBUG) {
  urls.forEach(url => (url.log = log));
}

module.exports = {
  defaults,
  urls,
};
