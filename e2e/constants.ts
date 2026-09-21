export const DOMAIN = process.env.DOMAIN || 'farajaland-e2e.opencrvs.dev'
export const SCHEME = process.env.SCHEME || 'https'
export const LOGIN_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3020'
    : SCHEME + '://login.' + DOMAIN

export const AUTH_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:4040'
    : SCHEME + '://auth.' + DOMAIN

export const CLIENT_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : SCHEME + '://register.' + DOMAIN

export const GATEWAY_HOST =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:7070'
    : SCHEME + '://gateway.' + DOMAIN

/*
 * This timeout is to ensure that all previous actions have been completed
 * including filling inputs and that the changed values have been reflected
 * also to the Redux state. 500ms is selected as a safe value.
 */
export const SAFE_INPUT_CHANGE_TIMEOUT_MS = 500

/*
 * This timeout ensures that
 * the declaration in outbox is sent to backend
 * and outbox is now empty
 */
export const SAFE_OUTBOX_TIMEOUT_MS = 30 * 1000
export const SAFE_IN_EXTERNAL_VALIDATION_MS = 30 * 1000
export const SAFE_WORKQUEUE_TIMEOUT_MS = 5 * 1000
const TEST_USER_PASSWORD = 'test'

export const CREDENTIALS = {
  FIELD_AGENT: {
    USERNAME: 'k.bwalya',
    PASSWORD: TEST_USER_PASSWORD
  },
  ANOTHER_FIELD_AGENT: {
    USERNAME: 'p.gondwe',
    PASSWORD: TEST_USER_PASSWORD
  },
  REGISTRATION_AGENT: {
    USERNAME: 'f.katongo',
    PASSWORD: TEST_USER_PASSWORD
  },
  LOCAL_REGISTRAR: {
    USERNAME: 'k.mweene',
    PASSWORD: TEST_USER_PASSWORD
  },
  NATIONAL_REGISTRAR: {
    USERNAME: 'j.musonda',
    PASSWORD: TEST_USER_PASSWORD
  },
  NATIONAL_SYSTEM_ADMIN: {
    USERNAME: 'j.campbell',
    PASSWORD: TEST_USER_PASSWORD
  },
  LOCAL_SYSTEM_ADMIN: {
    USERNAME: 'e.mayuka',
    PASSWORD: TEST_USER_PASSWORD
  },
  PERFORMANCE_MANAGER: {
    USERNAME: 'e.kazembe',
    PASSWORD: TEST_USER_PASSWORD
  }
}
