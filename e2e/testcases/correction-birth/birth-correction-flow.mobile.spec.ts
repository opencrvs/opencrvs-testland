import { expect, test, type Page } from '@playwright/test'
import { getToken, login, logout } from '../../helpers'
import { faker } from '@faker-js/faker'
import { CREDENTIALS } from '../../constants'
import {
  createDeclaration,
  Declaration
} from '../test-data/birth-declaration-with-mother-father'
import {
  ensureAssigned,
  ensureOutboxIsEmpty,
  expectInUrl,
  navigateToWorkqueue,
  selectAction,
  type
} from '../../utils'
import { formatV2ChildName } from '../birth/helpers'
import { setMobileViewport } from '../../mobile-helpers'

test.describe.serial('Birth correction flow - Mobile', () => {
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
    await setMobileViewport(page)
  })

  test('Login', async () => {
    await login(page, CREDENTIALS.REGISTRATION_AGENT)
  })

  test('Navigate to the correction form', async () => {
    await navigateToWorkqueue(page, 'Ready to print')
    await page
      .getByRole('button', { name: formatV2ChildName(declaration) })
      .click()

    await selectAction(page, 'Correct record')
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

  const fee = faker.number.int({ min: 1, max: 1000 })

  test('Fill in the fees form', async () => {
    await page.locator('#fees____amount').fill(fee.toString())

    await page.getByRole('button', { name: 'Continue' }).click()
  })

  test('Review page should be displayed and continue button should be disabled', async () => {
    await expectInUrl(page, `/events/request-correction/${eventId}/review`)
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  const newFirstName = faker.person.firstName()
  const reasonForDelayedRegistration = faker.lorem.sentence(4)

  test('After changing child name, continue button should be enabled', async () => {
    await page.getByTestId('change-button-child.dob').click()
    await page.getByTestId('child____dob-yyyy').fill('2024')
    await page.getByTestId('child____dob-mm').fill('06')
    await page.getByTestId('child____dob-dd').fill('24')
    await page
      .getByTestId('text__child____reason')
      .fill(reasonForDelayedRegistration)

    await type(page, '#firstname', newFirstName)
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
      page.getByRole('button', { name: 'Submit correction request' })
    ).toBeEnabled()
  })

  test('Submit correction request', async () => {
    await page
      .getByRole('button', { name: 'Submit correction request' })
      .click()

    await expect(
      page.getByText('Send record correction for approval?')
    ).toBeVisible()
    await expect(
      page.getByText(
        'The Registrar will be notified of this correction request and a record of this request will be recorded'
      )
    ).toBeVisible()

    await page.getByRole('button', { name: 'Confirm', exact: true }).click()
    await expectInUrl(page, `/workqueue/ready-to-print`)
    await ensureOutboxIsEmpty(page)
  })

  test('Logout', async () => {
    await logout(page)
  })

  test.describe('Approve correction request', () => {
    test('Login as Local Registrar', async () => {
      await login(page, CREDENTIALS.LOCAL_REGISTRAR)
    })

    test("Find the event in the 'Ready for review' workflow", async () => {
      await navigateToWorkqueue(page, 'Ready for review')

      await page
        .getByRole('button', { name: formatV2ChildName(declaration) })
        .click()
    })

    test('Navigate to correction review', async () => {
      await selectAction(page, 'Review')

      await expect(page.getByText('RequesterInformant (Mother)')).toBeVisible()
      await expect(
        page.getByText(
          'Reason for correctionMyself or an agent made a mistake (Clerical error)'
        )
      ).toBeVisible()

      await expect(
        page.getByRole('heading', { name: "Child's details" })
      ).toBeVisible()
    })

    test('Validate correction values', async () => {
      await expect(page.getByText('Submitter' + 'Felix Katongo')).toBeVisible()
      await expect(
        page.getByText('Requester' + 'Informant (Mother)')
      ).toBeVisible()
      await expect(page.getByText('Fee total' + `$${fee}`)).toBeVisible()
      await expect(
        page
          .locator('#listTable-corrections-table-child')
          .getByText(
            "Child's name" +
              `${declaration['child.name'].firstname} ${declaration['child.name'].surname}` +
              `${newFirstName} ${declaration['child.name'].surname}`
          )
      ).toBeVisible()

      await expect(
        page
          .locator('#listTable-corrections-table-child')
          .getByText(
            'Reason for delayed registration' +
              '-' +
              reasonForDelayedRegistration
          )
      ).toBeVisible()

      await expect(
        page.getByTestId('row-value-child.name').getByRole('deletion')
      ).toHaveText(
        `${declaration['child.name'].firstname} ${declaration['child.name'].surname}`,
        { ignoreCase: true }
      )
    })

    test('Approve correction request', async () => {
      await page.getByRole('button', { name: 'Approve', exact: true }).click()
      await page.getByRole('button', { name: 'Confirm', exact: true }).click()

      await expectInUrl(page, `/workqueue/in-review-all`)
      await ensureOutboxIsEmpty(page)
      await navigateToWorkqueue(page, 'Ready to print')
      await page
        .getByRole('button', {
          name: formatV2ChildName({
            'child.name': {
              firstname: newFirstName,
              surname: declaration['child.name'].surname
            }
          })
        })
        .click()

      await expect(
        page.getByRole('heading', {
          name: formatV2ChildName({
            'child.name': {
              firstname: newFirstName,
              surname: declaration['child.name'].surname
            }
          })
        })
      ).toBeVisible({
        timeout: 60_000
      })
    })
  })
})
