import { expect, test, type Page } from '@playwright/test'
import { getToken, login } from '../../helpers'
import { faker } from '@faker-js/faker'
import { CREDENTIALS } from '../../constants'
import {
  createDeclaration,
  Declaration
} from '../test-data/birth-declaration-with-mother-father'
import { ensureAssigned, expectInUrl, selectAction } from '../../utils'
import { formatV2ChildName, REQUIRED_VALIDATION_ERROR } from '../birth/helpers'

test.describe.serial('Birth Record correction flow', () => {
  let declaration: Declaration
  let eventId: string
  let page: Page

  test.beforeAll(async ({ browser }) => {
    const token = await getToken(
      CREDENTIALS.LOCAL_REGISTRAR.USERNAME,
      CREDENTIALS.LOCAL_REGISTRAR.PASSWORD
    )
    const res = await createDeclaration(
      token,
      undefined,
      undefined,
      'HEALTH_FACILITY'
    )
    declaration = res.declaration
    eventId = res.eventId

    page = await browser.newPage()
    await login(page, CREDENTIALS.LOCAL_REGISTRAR)
  })

  test('Navigate to the correction form', async () => {
    await page.getByRole('button', { name: 'Ready to print' }).click()
    await page
      .getByRole('button', { name: formatV2ChildName(declaration) })
      .click()
    await ensureAssigned(page)
    await selectAction(page, 'Correct record')
  })

  test('Try to continue without filling in required fields', async () => {
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.locator('#requester____type_error')).toHaveText(
      REQUIRED_VALIDATION_ERROR
    )
    await expect(page.locator('#reason____option_error')).toHaveText(
      REQUIRED_VALIDATION_ERROR
    )
  })

  test('Fill in the correction details form', async () => {
    await page.locator('#requester____type').click()
    await page.getByText('Informant (Mother)', { exact: true }).click()

    await page.locator('#reason____option').click()
    await page
      .getByText('Myself or an agent made a mistake (Clerical error)', {
        exact: true
      })
      .click()

    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Verified' }).click()
  })

  test('Fill in the supporting documents form', async () => {
    const path = require('path')
    const attachmentPath = path.resolve(__dirname, './image.png')
    const inputFile = await page.locator(
      'input[name="documents____supportingDocs"][type="file"]'
    )

    await page.getByTestId('select__documents____supportingDocs').click()
    await page.getByText('Affidavit', { exact: true }).click()

    await inputFile.setInputFiles(attachmentPath)

    await page.getByTestId('select__documents____supportingDocs').click()
    await page.getByText('Court Document', { exact: true }).click()
    await inputFile.setInputFiles(attachmentPath)

    await page.getByRole('button', { name: 'Continue' }).click()
  })

  test('Fill in the fees form', async () => {
    await page
      .locator('#fees____amount')
      .fill(faker.number.int({ min: 1, max: 1000 }).toString())

    await page.getByRole('button', { name: 'Continue' }).click()
  })

  test('Review page should be displayed and continue button should be disabled', async () => {
    await expectInUrl(page, `/events/request-correction/${eventId}/review`)
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  test('Go through the declaration correction form without changing any details', async () => {
    await page
      .getByRole('button', { name: 'Change all', exact: true })
      .first()
      .click()

    await expect(
      page.getByRole('button', { name: 'Go to review' })
    ).toBeEnabled()

    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(
      page.getByRole('button', { name: 'Go to review' })
    ).toBeEnabled()

    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(
      page.getByRole('button', { name: 'Go to review' })
    ).toBeEnabled()

    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(
      page.getByRole('button', { name: 'Go to review' })
    ).toBeEnabled()

    await page.getByRole('button', { name: 'Continue' }).click()
  })

  test('When back on review page, continue button should still be disabled', async () => {
    await expectInUrl(page, `/events/request-correction/${eventId}/review`)
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  test('After changing a value, continue button should be enabled', async () => {
    await page.getByTestId('change-button-informant.email').click()

    await page
      .getByTestId('text__informant____email')
      .fill(faker.internet.email())

    await page.getByRole('button', { name: 'Go to review' }).click()
    await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled()
  })

  test('After changing the value back to the original, continue button should be disabled', async () => {
    await page.getByTestId('change-button-informant.email').click()

    await page
      .getByTestId('text__informant____email')
      .fill(declaration['informant.email'])

    await page.getByRole('button', { name: 'Go to review' }).click()
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  test('After changing another value to an invalid value, continue button should still be disabled', async () => {
    await page.getByTestId('change-button-child.dob').click()
    // Future date
    await page.getByTestId('child____dob-yyyy').fill('2045')
    await page.getByRole('button', { name: 'Go to review' }).click()
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled()
    await expect(page.getByText('Must be a valid birth date')).toBeVisible()
  })

  const reasonForDelayedRegistration = faker.lorem.sentence(4)

  test('After changing the value to a valid value, continue button should be enabled', async () => {
    await page.getByTestId('change-button-child.dob').click()
    await page.getByTestId('child____dob-yyyy').fill('2024')
    await page.getByTestId('child____dob-mm').fill('06')
    await page.getByTestId('child____dob-dd').fill('24')
    await page
      .getByTestId('text__child____reason')
      .fill(reasonForDelayedRegistration)
    await page.getByRole('button', { name: 'Go to review' }).click()
    await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled()
  })

  test('Continue to the summary page', async () => {
    await page.getByRole('button', { name: 'Continue' }).click()
    await expectInUrl(page, `/events/request-correction/${eventId}/summary`)
    await expect(
      page.getByRole('button', { name: 'Go to review' })
    ).toBeEnabled()
    await expect(
      page.getByRole('button', { name: 'Correct record' })
    ).toBeEnabled()
  })

  test('Press Fees change link and change the fee amount', async () => {
    await page.getByTestId('change-fees.amount').click()
    await page
      .locator('#fees____amount')
      .fill(faker.number.int({ min: 1, max: 1000 }).toString())
  })

  test('Return to summary page', async () => {
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
  })

  test('Preview a file on summary page', async () => {
    await expect(
      page.getByRole('button', { name: 'Court Document' })
    ).toBeVisible()

    await page.getByRole('button', { name: 'Affidavit' }).click()

    await expect(
      page.getByRole('img', { name: 'Supporting Document' })
    ).toBeVisible()

    await page.locator('#preview_close').click()
  })

  test('Record correction', async () => {
    await page.getByRole('button', { name: 'Correct record' }).click()

    await expect(page.getByText('Correct record?')).toBeVisible()
    await expect(
      page.getByText(
        'The informant will be notified of this correction and a record of this decision will be recorded'
      )
    ).toBeVisible()

    await page.getByRole('button', { name: 'Confirm', exact: true }).click()

    await expectInUrl(page, `/workqueue/ready-to-print`)

    await page.waitForResponse((response) =>
      response
        .url()
        .includes('/api/events/event.actions.correction.approve.request')
    )
  })

  test('Record correction action appears in audit history', async () => {
    await page
      .getByRole('button', { name: formatV2ChildName(declaration) })
      .click()
    await ensureAssigned(page)

    // Go to second page of audit history list
    await page.getByRole('button', { name: 'Next page' }).click()
    await expect(
      page.getByRole('button', { name: 'Record corrected', exact: true })
    ).toBeVisible()
  })

  test('Record Correction audit history modal opens when action is clicked', async () => {
    await page
      .getByRole('button', { name: 'Record corrected', exact: true })
      .click()

    await expect(
      page.getByRole('heading', { name: 'Record corrected', exact: true })
    ).toBeVisible()
    await expect(page.getByText('Informant (Mother)')).toBeVisible()
    await expect(
      page.getByText('Myself or an agent made a mistake (Clerical error)')
    ).toBeVisible()

    await expect(page.getByText('Correction(s)', { exact: true })).toBeVisible()
    await expect(page.getByText("Child's details")).toBeVisible()
    await expect(page.getByText(reasonForDelayedRegistration)).toBeVisible()

    await page.locator('#close-btn').click()
  })
})
