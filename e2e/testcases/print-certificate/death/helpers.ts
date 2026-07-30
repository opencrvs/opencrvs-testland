import { Page } from '@playwright/test'
import { Declaration } from '../../test-data/death-declaration'
import { selectAction } from '../../../utils'

export async function selectCertificationType(page: Page, type: string) {
  await page
    .locator('#certificateTemplateId .react-select__dropdown-indicator')
    .click()
  await page
    .locator('.react-select__menu')
    .getByText(type, { exact: true })
    .click()
}

export async function selectRequesterType(page: Page, type: string) {
  await page.locator('#collector____requesterId').click()
  await page.getByText(type, { exact: true }).click()
}

export async function navigateToCertificatePrintAction(
  page: Page,
  declaration: Declaration
) {
  const deceasedName = `${declaration['deceased.name'].firstname} ${declaration['deceased.name'].surname}`
  await page.getByRole('button', { name: deceasedName }).click()
  await selectAction(page, 'Print')
}

export function getRowByTitle(page: Page, title: string) {
  const button = page.getByRole('button', {
    name: title
  })
  const parentRow = button.locator(
    'xpath=ancestor::*[starts-with(@id, "row_")]'
  )
  return parentRow
}
