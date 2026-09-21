import { expect, test, type Page } from '@playwright/test'

import { Declaration } from '../../test-data/birth-declaration'
import { getToken } from '../../../helpers'
import { createDeclaration } from '../../test-data/birth-declaration'
import { CREDENTIALS } from '../../../constants'
import { login } from '../../../helpers'
import {
  navigateToCertificatePrintAction,
  selectRequesterType
} from './helpers'
import { selectAction } from '../../../utils'
import { formatV2ChildName } from '../../birth/helpers'

test.describe.serial('44.14.0 Validate "Certified copy" option', () => {
  let declaration: Declaration
  let page: Page

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

  test('44.14.0.1 Log in', async () => {
    await login(page)
  })

  test('44.14.0.1 Navigate to certificate print action', async () => {
    await page.getByRole('button', { name: 'Ready to print' }).click()
    await navigateToCertificatePrintAction(page, declaration)
  })

  test('44.14.1 "Certified Copy" is not available in certificate types', async () => {
    await page
      .locator('#certificateTemplateId .react-select__dropdown-indicator')
      .click()
    await expect(
      page.getByText('Birth Certificate', { exact: true })
    ).toHaveCount(2) // One as a selected option, another in dropdown
    await expect(
      page.getByText('Birth Certificate Certified Copy', { exact: true })
    ).not.toBeVisible()
    await page.locator('body').click()
  })

  test('44.14.2 Print certificate', async () => {
    await selectRequesterType(page, 'Print and issue to Informant (Mother)')

    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Verified' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await page.getByRole('button', { name: 'Yes, print certificate' }).click()
    await page.getByRole('button', { name: 'Print', exact: true }).click()
  })

  test('44.14.3 "Certified Copy" is now available in certificate types', async () => {
    await page
      .getByRole('textbox', { name: 'Search for a tracking ID' })
      .fill(formatV2ChildName(declaration))

    await page.getByRole('button', { name: 'Search' }).click()
    await page
      .getByRole('button', {
        name: formatV2ChildName(declaration),
        exact: true
      })
      .click()

    await selectAction(page, 'Print')
    await page
      .locator('#certificateTemplateId .react-select__dropdown-indicator')
      .click()
    await expect(
      page.getByText('Birth Certificate Certified Copy', { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText('Birth Certificate', { exact: true })
    ).not.toBeVisible()
  })
})
