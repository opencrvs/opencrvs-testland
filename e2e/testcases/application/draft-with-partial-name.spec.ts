import { expect, test, type Page } from '@playwright/test'

import { formatName, login } from '../../helpers'
import { CREDENTIALS } from '../../constants'
import { faker } from '@faker-js/faker'
import { ensureOutboxIsEmpty } from '../../utils'

test.describe.serial('Validate draft with partial name', () => {
  let page: Page
  const name1 = {
    firstNames: faker.person.firstName('male')
  }
  const name2 = {
    familyName: faker.person.lastName('male')
  }

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('Record does not appear in draft ', async () => {
    await login(page, CREDENTIALS.FIELD_AGENT)
    await page.getByRole('button', { name: 'My drafts' }).click()

    await expect(page.getByTestId('search-result')).not.toContainText(
      formatName(name1)
    )
    await expect(page.getByTestId('search-result')).not.toContainText(
      formatName(name2)
    )
  })

  test('Create a draft with only firstname', async () => {
    await page.click('#header-new-event')
    await page.getByLabel('Birth').click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await page.locator('#firstname').fill(name1.firstNames)

    await page.getByRole('button', { name: 'Save & Exit' }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await ensureOutboxIsEmpty(page)
  })

  test('Create a draft with only lastname', async () => {
    await page.click('#header-new-event')
    await page.getByLabel('Birth').click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await page.locator('#surname').fill(name2.familyName)

    await page.getByRole('button', { name: 'Save & Exit' }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await ensureOutboxIsEmpty(page)
  })

  test('Records appear in draft ', async () => {
    await page.getByRole('button', { name: 'My drafts' }).click()

    await expect(page.getByTestId('search-result')).toContainText(
      formatName(name1)
    )
    await expect(page.getByTestId('search-result')).toContainText(
      formatName(name2)
    )
  })

  test('Records do not appear in draft for other user: RA ', async () => {
    await login(page, CREDENTIALS.REGISTRATION_AGENT)
    await page.getByRole('button', { name: 'My drafts' }).click()

    await expect(page.getByTestId('search-result')).not.toContainText(
      formatName(name1)
    )
    await expect(page.getByTestId('search-result')).not.toContainText(
      formatName(name2)
    )
  })

  test('Records do not appear in draft for other user: LR ', async () => {
    await login(page, CREDENTIALS.LOCAL_REGISTRAR)
    await page.getByRole('button', { name: 'My drafts' }).click()

    await expect(page.getByTestId('search-result')).not.toContainText(
      formatName(name1)
    )
    await expect(page.getByTestId('search-result')).not.toContainText(
      formatName(name2)
    )
  })
})
