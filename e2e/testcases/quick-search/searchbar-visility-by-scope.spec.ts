import { test, expect } from '@playwright/test'
import { CREDENTIALS, SAFE_OUTBOX_TIMEOUT_MS } from '../../constants'
import { login } from '../../helpers'
const testCases = [
  {
    credential: CREDENTIALS.FIELD_AGENT,
    hasSearch: true
  },
  {
    credential: CREDENTIALS.REGISTRATION_AGENT,
    hasSearch: true
  },
  {
    credential: CREDENTIALS.LOCAL_REGISTRAR,
    hasSearch: true
  },
  {
    credential: CREDENTIALS.NATIONAL_REGISTRAR,
    hasSearch: true
  },
  {
    credential: CREDENTIALS.NATIONAL_SYSTEM_ADMIN,
    hasSearch: false
  },
  {
    credential: CREDENTIALS.LOCAL_SYSTEM_ADMIN,
    hasSearch: false
  },
  {
    credential: CREDENTIALS.PERFORMANCE_MANAGER,
    hasSearch: false
  }
]
test.describe('Search bar should be visible only if the user has search scope', () => {
  for (const { credential, hasSearch } of testCases) {
    test(`${credential.USERNAME} ${hasSearch ? 'has' : 'does not have'} search scope`, async ({
      page
    }) => {
      await login(page, credential)

      await expect(page.getByText('Farajaland CRS')).toBeVisible({
        timeout: SAFE_OUTBOX_TIMEOUT_MS
      })

      if (hasSearch) {
        await expect(page.locator('#searchText')).toBeVisible()
      } else {
        await expect(page.locator('#searchText')).not.toBeVisible()
      }
    })
  }
})
