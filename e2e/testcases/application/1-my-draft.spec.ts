import { expect, test, type Page } from '@playwright/test'

import { formatName, goToSection, login } from '../../helpers'
import { CREDENTIALS } from '../../constants'
import { faker } from '@faker-js/faker'
import { getRowByTitle } from '../print-certificate/birth/helpers'
import { ensureOutboxIsEmpty } from '../../utils'

test.describe.serial('1: Validate my draft tab', () => {
  let page: Page
  const name = {
    firstNames: faker.person.firstName('male'),
    familyName: faker.person.lastName('male')
  }

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('1.1 Record does not appear in draft ', async () => {
    await login(page, CREDENTIALS.FIELD_AGENT)
    await page.getByRole('button', { name: 'My drafts' }).click()

    await expect(page.getByTestId('search-result')).not.toContainText(
      formatName(name)
    )
  })

  test('1.2 Create a draft', async () => {
    await page.click('#header-new-event')
    await page.getByLabel('Birth').click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await page.locator('#firstname').fill(name.firstNames)
    await page.locator('#surname').fill(name.familyName)

    await page.getByRole('button', { name: 'Save & Exit' }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()
  })

  test('1.3 Record appears in draft ', async () => {
    await ensureOutboxIsEmpty(page)

    await page.getByRole('button', { name: 'My drafts' }).click()

    await expect(page.getByTestId('search-result')).toContainText(
      formatName(name)
    )
  })

  test('1.4 Record does not appear in draft for other user: RA ', async () => {
    await login(page, CREDENTIALS.REGISTRATION_AGENT)
    await page.getByRole('button', { name: 'My drafts' }).click()

    await expect(page.getByTestId('search-result')).not.toContainText(
      formatName(name)
    )
  })

  test('1.5 Record does not appear in draft for other user: LR ', async () => {
    await login(page, CREDENTIALS.LOCAL_REGISTRAR)
    await page.getByRole('button', { name: 'My drafts' }).click()

    await expect(page.getByTestId('search-result')).not.toContainText(
      formatName(name)
    )
  })

  test('1.6 Record does not appear in draft after notifying ', async () => {
    await login(page, CREDENTIALS.FIELD_AGENT, true)
    await page.getByRole('button', { name: 'My drafts' }).click()

    await getRowByTitle(page, formatName(name))
      .getByRole('button', {
        name: 'Declare'
      })
      .click()

    await goToSection(page, 'review')

    await page.getByRole('button', { name: 'Send for review' }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()

    await ensureOutboxIsEmpty(page)

    await expect(page.getByTestId('search-result')).toContainText('My drafts')
    await expect(page.getByTestId('search-result')).not.toContainText(
      formatName(name)
    )
  })
})
