import { expect, test, type Page } from '@playwright/test'
import { getToken, login } from '../../helpers'
import { faker } from '@faker-js/faker'
import { CREDENTIALS } from '../../constants'
import { createDeclaration } from '../test-data/birth-declaration-with-mother-father'
import { formatV2ChildName } from '../birth/helpers'
import { ActionType } from '@opencrvs/toolkit/events'

test.describe.serial('Duplicate overview', () => {
  let trackingId: string
  let page: Page

  const details = {
    'child.name': {
      firstname: faker.person.firstName(),
      surname: faker.person.lastName()
    },
    'child.dob': new Date(Date.now() - 60 * 60 * 24 * 1000)
      .toISOString()
      .split('T')[0],
    'mother.name': {
      firstname: faker.person.firstName(),
      surname: faker.person.lastName()
    },
    'mother.dob': '1995-09-12',
    'mother.idType': 'NATIONAL_ID',
    'mother.nid': faker.string.numeric(10)
  }

  const name = formatV2ChildName(details)

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
  })
  test.describe('Shortcut declarations', async () => {
    test('First declaration', async () => {
      const token = await getToken(
        CREDENTIALS.LOCAL_REGISTRAR.USERNAME,
        CREDENTIALS.LOCAL_REGISTRAR.PASSWORD
      )
      const res = await createDeclaration(token, details)

      expect(res.trackingId).toBeDefined()

      trackingId = res.trackingId!
    })

    test('Second declaration', async () => {
      const token = await getToken(
        CREDENTIALS.LOCAL_REGISTRAR.USERNAME,
        CREDENTIALS.LOCAL_REGISTRAR.PASSWORD
      )
      await createDeclaration(token, details, ActionType.DECLARE)
    })
  })

  test("Navigate to potential duplicate's overview", async () => {
    await login(page, CREDENTIALS.LOCAL_REGISTRAR)
    await page.getByRole('button', { name: 'Ready for review' }).click()
    await page.getByRole('button', { name }).click()
  })

  test('Validate duplicate in overview page', async () => {
    await page.getByRole('button', { name: 'Assign record' }).click()
    await page.getByRole('button', { name: 'Assign', exact: true }).click()

    await expect(
      page.getByText(`Potential duplicate of record ${trackingId}`)
    ).toBeVisible()

    await page
      .getByRole('button', { name: 'Flagged as potential duplicate' })
      .click()

    await expect(
      page.locator('#event-history-modal').getByText('Matched to')
    ).toBeVisible()

    await expect(
      page.locator('#event-history-modal').getByText(trackingId)
    ).toBeVisible()
  })
})
