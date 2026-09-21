import { expect, test, type Page } from '@playwright/test'

import { login, getToken } from '../../helpers'
import { CREDENTIALS, SAFE_WORKQUEUE_TIMEOUT_MS } from '../../constants'
import { createDeclaration, Declaration } from '../test-data/birth-declaration'
import { ActionType } from '@opencrvs/toolkit/events'
import { formatV2ChildName } from '../birth/helpers'
import {
  ensureInExternalValidationIsEmpty,
  ensureOutboxIsEmpty,
  expectInUrl,
  selectAction
} from '../../utils'
import { getRowByTitle } from '../print-certificate/birth/helpers'

test.describe
  .serial('5(b) Validate Ready for review tab for local registrar', () => {
  let page: Page
  let declaration: Declaration
  let eventId: string

  test.beforeAll(async ({ browser }) => {
    const token = await getToken(
      CREDENTIALS.FIELD_AGENT.USERNAME,
      CREDENTIALS.FIELD_AGENT.PASSWORD
    )
    const res = await createDeclaration(token, undefined, ActionType.DECLARE)
    declaration = res.declaration
    eventId = res.eventId

    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('5.0 Login', async () => {
    await login(page, CREDENTIALS.LOCAL_REGISTRAR)
  })

  test('5.1 Go to Ready for review tab', async () => {
    await page.waitForTimeout(SAFE_WORKQUEUE_TIMEOUT_MS) // wait for the event to be in the workqueue.
    await page.getByText('Ready for review').click()
    await expect(
      page.getByRole('button', { name: formatV2ChildName(declaration) })
    ).toBeVisible()
    await expect(page.getByTestId('search-result')).toContainText(
      'Ready for review'
    )
  })

  test('5.2 validate the list', async () => {
    const header = page.locator('div[class^="TableHeader"]')
    const columns = await header.locator(':scope > div').allInnerTexts()
    expect(columns).toStrictEqual([
      'Title',
      'Event',
      'Date of Event',
      'Sent for review',
      ''
    ])

    const row = getRowByTitle(page, formatV2ChildName(declaration))
    const cells = row.locator(':scope > div')

    expect(cells.nth(0)).toHaveText(formatV2ChildName(declaration))
    expect(cells.nth(1)).toHaveText('Birth')
    expect(cells.nth(2)).toHaveText(declaration['child.dob'].split('T')[0])
  })

  test('5.4 Click a name', async () => {
    await page
      .getByRole('button', { name: formatV2ChildName(declaration) })
      .click()

    // User should navigate to record audit page
    expect(page.url().includes(`events/overview/${eventId}`)).toBeTruthy()
  })

  test('5.5 Click validate action', async () => {
    await selectAction(page, 'Review')
    expect(
      page.url().includes(`events/validate/${eventId}/review`)
    ).toBeTruthy()
  })
  test('5.5 Complete Registration', async () => {
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page.getByText('Register the birth?')).toBeVisible()
    await page.locator('#confirm_Validate').click()

    // Should redirect back to Ready for review workqueue
    await expect(page.locator('#content-name')).toHaveText('Ready for review')

    await ensureOutboxIsEmpty(page)
    await ensureInExternalValidationIsEmpty(page)
    await expectInUrl(page, 'workqueue/in-review-all')

    await expect(
      page.getByRole('button', { name: formatV2ChildName(declaration) })
    ).not.toBeVisible()

    await page.getByText('Ready to print').click()
    await expect(
      page.getByRole('button', { name: formatV2ChildName(declaration) })
    ).toBeVisible()
  })
})
