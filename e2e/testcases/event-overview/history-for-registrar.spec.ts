import { test, expect, Page } from '@playwright/test'
import { createDeclaration, Declaration } from '../test-data/birth-declaration'
import { getToken, login } from '../../helpers'
import { CREDENTIALS, SAFE_WORKQUEUE_TIMEOUT_MS } from '../../constants'
import { ensureAssigned } from '../../utils'

test.describe
  .serial('History rows when Local Registrar registers a birth from scratch', () => {
  let page: Page
  let declaration: Declaration

  test.beforeAll(async ({ browser }) => {
    const token = await getToken(
      CREDENTIALS.LOCAL_REGISTRAR.USERNAME,
      CREDENTIALS.LOCAL_REGISTRAR.PASSWORD
    )
    const res = await createDeclaration(token)
    declaration = res.declaration
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('Login', async () => {
    await login(page)
  })
  test('Assign', async () => {
    await page.waitForTimeout(SAFE_WORKQUEUE_TIMEOUT_MS) // wait for the event to be in the workqueue.
    await page.getByText('Ready to print').click()

    const childName = `${declaration['child.name'].firstname} ${declaration['child.name'].surname}`
    await page.getByRole('button', { name: childName }).click()
    await ensureAssigned(page)
    await expect(page.getByTestId('assignedTo-value')).toHaveText(
      'Kennedy Mweene'
    )
  })
  test('validate Actions in history', async () => {
    const rows = page.locator('#listTable-task-history [id^="row_"]')

    const expectedActions = [
      'Assigned',
      'Sent for review',
      'Sent for approval',
      'Registered',
      'Unassigned',
      'Viewed',
      'Assigned'
    ]

    await expect(rows).toHaveCount(expectedActions.length)

    for (let i = 0; i < expectedActions.length; i++) {
      const actionCell = rows.nth(i).locator('span').first()
      await expect(actionCell).toHaveText(expectedActions[i])

      await actionCell.getByRole('button').click()

      const modal = page.getByTestId('event-history-modal')

      await expect(modal.getByRole('heading')).toHaveText(expectedActions[i])
      await modal.locator('#close-btn').click()
    }
  })
})
