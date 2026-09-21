import { expect, test, type Page } from '@playwright/test'

import { login, getToken } from '../../helpers'
import { CREDENTIALS, SAFE_WORKQUEUE_TIMEOUT_MS } from '../../constants'
import { createDeclaration, Declaration } from '../test-data/birth-declaration'
import { formatV2ChildName } from '../birth/helpers'
import { ActionType } from '@opencrvs/toolkit/events'
import { getRowByTitle } from '../print-certificate/birth/helpers'

test.describe.serial('7 Validate Sent for approval tab', () => {
  let page: Page
  let declaration: Declaration
  let eventId: string

  test.beforeAll(async ({ browser }) => {
    const token = await getToken(
      CREDENTIALS.REGISTRATION_AGENT.USERNAME,
      CREDENTIALS.REGISTRATION_AGENT.PASSWORD
    )
    const res = await createDeclaration(token, undefined, ActionType.VALIDATE)
    declaration = res.declaration
    eventId = res.eventId

    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('7.0 Login', async () => {
    await login(page, CREDENTIALS.REGISTRATION_AGENT)
  })

  test('7.1 Go to Sent for approval tab', async () => {
    await page.waitForTimeout(SAFE_WORKQUEUE_TIMEOUT_MS) // wait for the event to be in the workqueue.
    await page.getByText('Sent for approval').click()
    await expect(
      page.getByRole('button', { name: formatV2ChildName(declaration) })
    ).toBeVisible()
    await expect(page.getByTestId('search-result')).toContainText(
      'Sent for approval'
    )
  })

  test('7.2 validate the list', async () => {
    const header = page.locator('div[class^="TableHeader"]')
    const columns = await header.locator(':scope > div').allInnerTexts()
    expect(columns).toStrictEqual([
      'Title',
      'Event',
      'Date of Event',
      'Sent for approval',
      ''
    ])

    const row = getRowByTitle(page, formatV2ChildName(declaration))
    const cells = row.locator(':scope > div')

    expect(cells.nth(0)).toHaveText(formatV2ChildName(declaration))
    expect(cells.nth(1)).toHaveText('Birth')
    expect(cells.nth(2)).toHaveText(declaration['child.dob'].split('T')[0])
  })

  test('7.4 Click a name', async () => {
    await page
      .getByRole('button', { name: formatV2ChildName(declaration) })
      .click()

    // User should navigate to record audit page
    expect(page.url().includes(`events/overview/${eventId}`)).toBeTruthy()
  })
})
