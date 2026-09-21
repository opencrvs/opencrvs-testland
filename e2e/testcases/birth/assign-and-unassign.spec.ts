import { expect, test, type Page } from '@playwright/test'

import { login, getToken } from '../../helpers'
import { CREDENTIALS, SAFE_WORKQUEUE_TIMEOUT_MS } from '../../constants'
import { createDeclaration, Declaration } from '../test-data/birth-declaration'
import { ensureAssigned, selectAction } from '../../utils'

test.describe.serial('Assign & Unassign', () => {
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

  test('Click on "Assign" from action menu', async () => {
    await page.waitForTimeout(SAFE_WORKQUEUE_TIMEOUT_MS) // wait for the event to be in the workqueue.
    await page.getByText('Ready to print').click()

    const childName = `${declaration['child.name'].firstname} ${declaration['child.name'].surname}`
    await page.getByRole('button', { name: childName }).click()
    await ensureAssigned(page)
    await expect(page.getByTestId('assignedTo-value')).toHaveText(
      'Kennedy Mweene'
    )
  })

  test('Click on "Unassign" from action menu', async () => {
    await selectAction(page, 'Unassign')
    // Wait for the unassign modal to appear
    await page.getByRole('button', { name: 'Unassign', exact: true }).click()
    await expect(page.getByTestId('assignedTo-value')).toHaveText(
      'Not assigned'
    )
  })
})
