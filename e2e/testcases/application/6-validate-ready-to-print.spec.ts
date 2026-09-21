import { expect, test, type Page } from '@playwright/test'

import { login, getToken } from '../../helpers'
import { CREDENTIALS, SAFE_WORKQUEUE_TIMEOUT_MS } from '../../constants'
import { createDeclaration, Declaration } from '../test-data/birth-declaration'
import { formatV2ChildName } from '../birth/helpers'
import { selectAction } from '../../utils'

test.describe.serial('6 Validate Ready to print tab', () => {
  let page: Page
  let declaration: Declaration
  let eventId: string

  test.beforeAll(async ({ browser }) => {
    const token = await getToken(
      CREDENTIALS.LOCAL_REGISTRAR.USERNAME,
      CREDENTIALS.LOCAL_REGISTRAR.PASSWORD
    )
    const res = await createDeclaration(token)
    declaration = res.declaration
    eventId = res.eventId

    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('6.0 Login', async () => {
    await login(page, CREDENTIALS.LOCAL_REGISTRAR)
  })

  test('6.1 Go to Ready to print tab', async () => {
    await page.waitForTimeout(SAFE_WORKQUEUE_TIMEOUT_MS) // wait for the event to be in the workqueue.
    await page.getByText('Ready to print').click()
    await expect(
      page.getByRole('button', { name: formatV2ChildName(declaration) })
    ).toBeVisible()
    await expect(page.getByTestId('search-result')).toContainText(
      'Ready to print'
    )
  })

  test('6.2 validate the list', async () => {
    const button = page.getByRole('button', {
      name: formatV2ChildName(declaration)
    })

    const header = page.locator('div[class^="TableHeader"]')
    const columns = await header.locator(':scope > div').allInnerTexts()
    expect(columns).toStrictEqual([
      'Title',
      'Event',
      'Date of Event',
      'Registered',
      ''
    ])

    const row = button.locator('xpath=ancestor::*[starts-with(@id, "row_")]')
    const cells = row.locator(':scope > div')

    expect(cells.nth(0)).toHaveText(formatV2ChildName(declaration))
    expect(cells.nth(1)).toHaveText('Birth')
    expect(cells.nth(2)).toHaveText(declaration['child.dob'].split('T')[0])
  })

  test('6.4 Click a name', async () => {
    await page
      .getByRole('button', { name: formatV2ChildName(declaration) })
      .click()

    // User should navigate to record audit page
    expect(page.url().includes(`events/overview/${eventId}`)).toBeTruthy()
  })

  test('6.5 Click Print action', async () => {
    await selectAction(page, 'Print')
    expect(
      page
        .url()
        .includes(`/events/print-certificate/${eventId}/pages/collector`)
    ).toBeTruthy()
  })
})
