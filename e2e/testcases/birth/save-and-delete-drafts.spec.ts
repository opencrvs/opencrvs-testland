import { expect, Page, test } from '@playwright/test'
import { goToSection, login, logout } from '../../helpers'
import { CREDENTIALS } from '../../constants'
import { fillChildDetails, openBirthDeclaration } from './helpers'
import { ensureOutboxIsEmpty } from '../../utils'

/**
 * Skipping tests until the outbox workqueue is implemented.
 * Develop is already in broken state. We'll revisit this when we have ungloc the pipeline and can dedicate time on which change caused the error.
 */
test.describe('Save and delete drafts', () => {
  test.describe.serial('Save draft', () => {
    let childName = ''
    let page: Page
    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage()
      await login(page, CREDENTIALS.LOCAL_REGISTRAR)
      await openBirthDeclaration(page)
    })

    test('Save draft via Save & Exit', async () => {
      childName = await fillChildDetails(page)
      await page.getByRole('button', { name: 'Save & Exit' }).click()
      await expect(
        page.getByText(
          'All inputted data will be kept secure for future editing. Are you ready to save any changes to this declaration form?'
        )
      ).toBeVisible()

      await page.getByRole('button', { name: 'Confirm' }).click()

      await ensureOutboxIsEmpty(page)
      await page.getByRole('button', { name: 'My drafts' }).click()

      await page.getByRole('button', { name: childName, exact: true }).click()
      await expect(page.locator('#content-name')).toHaveText(childName)
    })

    test('Saved draft is not visible to other users', async () => {
      await logout(page)
      await login(page, CREDENTIALS.NATIONAL_REGISTRAR)

      await page.getByText('My drafts').click()

      await expect(
        page.getByRole('button', { name: childName, exact: true })
      ).not.toBeVisible()
    })

    test('Login as local registrar', async () => {
      await logout(page)
      await login(page, CREDENTIALS.LOCAL_REGISTRAR, true)
    })

    test('Delete saved draft', async () => {
      await page.getByRole('button', { name: 'My drafts' }).click()
      await page.getByRole('button', { name: childName, exact: true }).click()
      await page.getByRole('button', { name: 'Action', exact: true }).click()

      await page.getByText('Declare').click()
      await page.locator('#event-menu-dropdownMenu').click()
      await page.getByText('Delete declaration').click()
      await expect(
        page.getByText('Are you sure you want to delete this declaration?')
      ).toBeVisible()
      await page.getByRole('button', { name: 'Confirm' }).click()

      await ensureOutboxIsEmpty(page)
      await page.getByText('My drafts').click()

      await expect(
        page.getByRole('button', { name: childName, exact: true })
      ).not.toBeVisible()
    })
  })

  test.describe.serial('Exit without saving', () => {
    let page: Page
    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage()
      await login(page, CREDENTIALS.LOCAL_REGISTRAR)
      await openBirthDeclaration(page)
    })
    test('Exit without saving', async () => {
      const childName = await fillChildDetails(page)
      await goToSection(page, 'review')
      await page.getByRole('button', { name: 'Exit', exact: true }).click()

      await expect(
        page.getByText(
          'You have unsaved changes on your declaration form. Are you sure you want to exit without saving?'
        )
      ).toBeVisible()

      await page.getByRole('button', { name: 'Confirm', exact: true }).click()

      await ensureOutboxIsEmpty(page)
      await page.getByText('Ready for review').click()
      await page.getByRole('button', { name: 'Assigned to you' }).click()

      await expect(
        page.getByRole('button', { name: childName, exact: true })
      ).not.toBeVisible()
    })
  })
})
