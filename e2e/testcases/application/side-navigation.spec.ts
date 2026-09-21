import { test, type Page, expect } from '@playwright/test'
import { login } from '../../helpers'
import { CREDENTIALS } from '../../constants'

test.describe.serial('Side navigation', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('1.1. Check LOCAL REGISTRAR navigation items', async () => {
    await login(page, CREDENTIALS.LOCAL_REGISTRAR, false)

    // V2 workques is super set of V1 workqueues.
    const localRegisrarWorkqueues = [
      'Outbox',
      'My drafts',
      'Assigned to you',
      'Recent',
      'Notifications',
      'Ready for review',
      'Requires updates',
      'In external validation',
      'Ready to Print'
    ]

    // All workqueues are present on home page.
    for (const item of localRegisrarWorkqueues) {
      page.getByRole('button', { name: item })
    }

    const localRegistrarNavItemsWithFrame = ['Organisation', 'Team']

    const localRegistrarNavItemsWithoutFrame = [
      'Registrations Dashboard',
      'Completeness Dashboard',
      'Registry'
    ]

    for (const item of localRegistrarNavItemsWithFrame) {
      await page.getByRole('button', { name: item }).click()

      // All workqueues are present on each page. V1 have different workqueues, so we should notice.
      for (const item of localRegisrarWorkqueues) {
        page.getByRole('button', { name: item })
      }
      // All workqueues are present on each page. V1 have different workqueues, so we should notice.
      for (const item of localRegistrarNavItemsWithoutFrame) {
        page.getByRole('button', { name: item })
      }
    }

    for (const item of localRegistrarNavItemsWithoutFrame) {
      await page.getByRole('button', { name: item }).click()
      await expect(page.locator('Farajaland CRS')).toBeHidden()

      // Only one button available (X)
      await page.getByRole('button').click()
    }
  })

  test('1.2. Check REGISTRATION AGENT navigation items', async () => {
    await login(page, CREDENTIALS.REGISTRATION_AGENT, false)

    // V2 workques is super set of V1 workqueues.
    const registrationAgentWorkqueues = [
      'Outbox',
      'My drafts',
      'Assigned to you',
      'Recent',
      'Notifications',
      'Ready for review',
      'Requires updates',
      'In external validation',
      'Ready to Print'
    ]

    // All workqueues are present on home page.
    for (const item of registrationAgentWorkqueues) {
      page.getByText(item)
    }

    const registrationAgentNavItemsWithFrame = ['Organisation', 'Team']

    const registrationAgentNavItemsWithoutFrame = [
      'Registrations Dashboard',
      'Completeness Dashboard',
      'Registry'
    ]

    for (const item of registrationAgentNavItemsWithFrame) {
      await page.getByText(item).click()

      // All workqueues are present on each page. V1 have different workqueues, so we should notice.
      for (const item of registrationAgentWorkqueues) {
        page.getByText(item)
      }
      // All workqueues are present on each page. V1 have different workqueues, so we should notice.
      for (const item of registrationAgentNavItemsWithoutFrame) {
        page.getByText(item)
      }
    }

    for (const item of registrationAgentNavItemsWithoutFrame) {
      await page.getByText(item).click()
      await expect(page.locator('Farajaland CRS')).toBeHidden()

      // Only one button available (X)
      await page.getByRole('button').click()
    }
  })

  test('1.3. Check NATIONAL_SYSTEM_ADMIN navigation items', async () => {
    await login(page, CREDENTIALS.NATIONAL_SYSTEM_ADMIN, false)

    const nationalSystemAdminNavItemsWithFrame = ['Organisation', 'Team']

    const nationalSystemAdminNavItemsWithoutFrame = [
      'Registrations Dashboard',
      'Completeness Dashboard',
      'Registry'
    ]

    // Should not have any workqueues, check that none of the workqueues are present
    const registrationAgentWorkqueues = [
      'Outbox',
      'My drafts',
      'Assigned to you',
      'Recent',
      'Notifications',
      'Ready for review',
      'Requires updates',
      'In external validation',
      'Ready to Print'
    ]

    const nationalSystemAdminNestedNavItemsWithFrame = [
      ['Communications', 'Email all users'],
      ['Configuration', 'Integrations']
    ]

    for (const item of nationalSystemAdminNavItemsWithFrame) {
      await page.getByRole('button', { name: item }).click()

      for (const item of registrationAgentWorkqueues) {
        await expect(page.locator(item)).toBeHidden()
      }

      for (const items of nationalSystemAdminNestedNavItemsWithFrame) {
        page.getByRole('button', { name: items[0] })
        await expect(page.locator(items[1])).toBeHidden()
      }

      for (const item of nationalSystemAdminNavItemsWithoutFrame) {
        page.getByRole('button', { name: item })
      }
    }

    for (const items of nationalSystemAdminNestedNavItemsWithFrame) {
      await expect(page.locator(items[1])).toBeHidden()

      await page.getByRole('button', { name: items[0] }).click()

      await page.getByRole('button', { name: items[1] }).click()
    }

    for (const item of nationalSystemAdminNavItemsWithoutFrame) {
      await page.getByRole('button', { name: item }).click()
      await expect(page.locator('Farajaland CRS')).toBeHidden()

      // Only one button available (X)
      await page.getByRole('button').click()
    }
  })
})
