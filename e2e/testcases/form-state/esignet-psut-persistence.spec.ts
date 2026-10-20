import { Page, expect, test } from '@playwright/test'
import { createClient } from '@opencrvs/toolkit/api'
import {
  continueForm,
  drawSignature,
  getRandomDate,
  goToSection,
  login,
  triggerDeclarationAction
} from '../../helpers'
import { CREDENTIALS, GATEWAY_HOST } from '../../constants'
import { fillDate, openBirthDeclaration } from '../birth/helpers'

const MOCK_NID = '1234567898'
const EXPECTED_SUB = `12345678901234567890123456${MOCK_NID}`

async function openBirthDeclarationAndCaptureEventId(page: Page) {
  const createEventResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('event.create') &&
      response.request().method() === 'POST'
  )

  await openBirthDeclaration(page)

  const createEventResponse = await createEventResponsePromise
  const responseText = await createEventResponse.text()
  const eventId = responseText.match(/[0-9a-fA-F-]{36}/)?.[0]

  if (!eventId) {
    throw new Error('Could not capture eventId from event.create response')
  }

  return eventId
}

async function authenticateMotherWithESignet(page: Page, nid: string) {
  await page.locator('#mother____verify').click()

  await expect(page).toHaveURL(/authorize/)
  await page.locator('#id-input').fill(nid)
  await page.locator('#authenticate').click()
  await expect(page).not.toHaveURL(/authorize/)
}

async function fillChildDetails(page: Page) {
  await page.locator('#firstname').fill('E2E PSUT Child')
  await page.locator('#surname').fill('Persistence')

  await page.locator('#child____gender').click()
  await page.getByText('Female', { exact: true }).click()

  await fillDate(page, getRandomDate(0, 200))

  await page.locator('#child____placeOfBirth').click()
  await page.getByText('Health Institution', { exact: true }).click()
  await page.locator('#child____birthLocation').fill('Klow')
  await page.getByText('Klow Village Hospital', { exact: true }).click()

  await page.locator('#child____attendantAtBirth').click()
  await page.getByText('Physician', { exact: true }).click()

  await page.locator('#child____birthType').click()
  await page.getByText('Single', { exact: true }).click()

  await page.locator('#child____weightAtBirth').fill('2.5')
}

test.describe('E-Signet PSUT persistence', () => {
  let page: Page
  let token: string

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('Declare birth with mother E-Signet and confirm `sub` in backend payload', async () => {
    test.setTimeout(180_000)

    token = await login(page, CREDENTIALS.HOSPITAL_OFFICIAL)

    const eventId = await openBirthDeclarationAndCaptureEventId(page)

    await fillChildDetails(page)
    await continueForm(page)

    await page.locator('#informant____relation').click()
    await page.getByText('Mother', { exact: true }).click()
    await page.locator('#informant____email').fill('psut-mother@example.com')
    await continueForm(page)

    await authenticateMotherWithESignet(page, MOCK_NID)

    await expect(page.getByText('ID Authenticated')).toBeVisible({
      timeout: 60_000
    })

    if (await page.locator('#mother____addressSameAs_YES').isVisible()) {
      await page.locator('#mother____addressSameAs_YES').check()
    }

    if (await page.locator('#mother____maritalStatus').isVisible()) {
      await page.locator('#mother____maritalStatus').click()
      await page.getByText('Single', { exact: true }).click()
    }

    if (await page.locator('#mother____educationalAttainment').isVisible()) {
      await page.locator('#mother____educationalAttainment').click()
      await page.getByText('No schooling', { exact: true }).click()
    }

    await continueForm(page)

    await page.getByLabel("Father's details are not available").check()
    await page.locator('#father____reason').fill('Father details not available')

    await goToSection(page, 'review')

    await page.locator('#review____comment').fill('PSUT persistence check')
    await page.getByRole('button', { name: 'Sign', exact: true }).click()
    await drawSignature(page, 'review____signature_canvas_element', false)
    await page.getByRole('button', { name: 'Apply' }).click()

    await triggerDeclarationAction(page, 'Declare')

    const client = createClient(GATEWAY_HOST + '/events', `Bearer ${token}`)

    await expect
      .poll(
        async () => {
          const eventDocument = await client.event.get.query({
            eventId
          })
          const declareAction = eventDocument.actions.find(
            (action) =>
              action.type === 'DECLARE' && action.status === 'Requested'
          )

          return {
            sub:
              declareAction &&
              'declaration' in declareAction &&
              declareAction.declaration?.['mother.verify-nid-http-fetch']?.data
                ?.sub
          }
        },
        { timeout: 60_000, intervals: [1_000, 2_000, 5_000] }
      )
      .toMatchObject({ sub: EXPECTED_SUB })
  })
})
