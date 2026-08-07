import { expect, test, Page } from '@playwright/test'
import { createClient } from '@opencrvs/toolkit/api'
import { omit } from 'lodash'
import { CREDENTIALS, GATEWAY_HOST } from '../../constants'
import { getToken, login, auditRecord, switchEventTab } from '../../helpers'
import {
  createDeclaration,
  getDeclaration
} from '../test-data/birth-declaration'

import { formatV2ChildName } from '../birth/helpers'

async function getEventById(eventId: string, token: string) {
  const client = createClient(`${GATEWAY_HOST}/events`, `Bearer ${token}`)
  return client.event.get.query({ eventId })
}

/**
 * Asserts the MOSIP integration audit-history wording.
 *
 * When a birth registration is forwarded to MOSIP, the registrar's "Register"
 * is deferred (HTTP 202) and the MOSIP *system* integration confirms it
 * asynchronously, authoring the final REGISTER with the UIN. The audit history
 * therefore reads "Registered and UIN created" (attributed to the "MOSIP"
 * system, with no role/office), not the human-authored "Registered".
 * See `events.history.status` in `src/translations/client.csv`.
 *
 * Assumes the environment has MOSIP fully wired: the mock stack (mosip-api,
 * mosip-mock, esignet-mock) is running and the MOSIP system integration is
 * seeded with credentials matching mosip-api (OPENCRVS_CLIENT_ID /
 * OPENCRVS_CLIENT_SECRET), so `systemReadyHandler` registers it and the
 * deferred registration is confirmed by the MOSIP system.
 */
test.describe
  .serial('Audit history for a MOSIP-authored birth registration', () => {
  let page: Page
  let eventId: string
  let childName: string
  let trackingId: string | undefined
  let token: string

  test.beforeAll(async ({ browser }) => {
    // Create the page first so a setup failure below doesn't cascade into
    // afterAll (page.close on an undefined page).
    page = await browser.newPage()

    token = await getToken(CREDENTIALS.REGISTRAR)

    /*
     * A MOSIP-eligible birth: a verified/authenticated parent and a child under
     * CHILD_MAX_AGE_YEARS_FOR_MOSIP (the default child DOB is yesterday). This
     * makes `shouldForwardBirthRegistrationToMosip` return true, so the register
     * is deferred to MOSIP instead of being accepted immediately by the
     * registrar. Seeding `mother.verified` stands in for the E-Signet/ID-reader
     * verification a user would otherwise perform in the UI.
     */
    const declaration = await getDeclaration({
      token,
      partialDeclaration: { 'mother.verified': 'authenticated' }
    })

    /*
     * Once a parent is authenticated via MOSIP their ID type/number fields are
     * hidden (`hideIf: ['authenticated']`), and the events API rejects values
     * for hidden fields. The forward gate only needs `mother.verified` +
     * `child.dob`, so drop the now-hidden NID fields from the seed.
     */
    const res = await createDeclaration(
      token,
      omit(declaration, ['mother.idType', 'mother.nid'])
    )

    eventId = res.eventId
    childName = formatV2ChildName(declaration)
    trackingId = res.trackingId
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('Login', async () => {
    await login(page, CREDENTIALS.REGISTRAR)
  })

  test('MOSIP confirms the registration and the audit history reads "Registered and UIN created"', async () => {
    // MOSIP's asynchronous confirmation has to land before the UI steps even
    // begin, so this needs more than the default per-test budget
    test.setTimeout(180_000)

    /*
     * The registrar's Register was deferred; MOSIP confirms it asynchronously
     * and the *system* authors the final REGISTER. Poll the events API (cheap,
     * short-circuits the instant it lands) instead of reloading the browser, so
     * the UI is only opened once the record is already registered.
     */
    await expect
      .poll(
        async () => {
          const event = await getEventById(eventId, token)
          return event.actions.some(
            (action) =>
              action.type === 'REGISTER' &&
              action.status === 'Accepted' &&
              action.createdByUserType === 'system'
          )
        },
        { timeout: 90_000, intervals: [1_000, 2_000, 5_000] }
      )
      .toBe(true)

    await auditRecord({ page, trackingId, name: childName })

    /*
     * The full history renders only when the record is assigned to the viewer
     * AND present in the local cache (see useEventOverviewInfo); otherwise the
     * Audit tab is a skeleton. A deferred register keeps the registrar's
     * assignment, so unlike the usual flow there is no Assign click to pull the
     * record down — download it explicitly.
     */
    await expect(page.getByTestId('assignedTo-value')).toContainText(
      'Kennedy Mweene'
    )
    await page
      .getByRole('button', { name: 'Assign record', exact: true })
      .click()

    // auditRecord lands on Summary; the history table lives under Audit
    await switchEventTab(page, 'Audit')

    await expect(page.locator('#listTable-task-history')).toContainText(
      'Registered and UIN created'
    )

    // The confirming action is authored by the MOSIP system integration, so its
    // history row is attributed to "MOSIP" (no role/office).
    const registeredRow = page
      .locator('#listTable-task-history [id^="row_"]')
      .filter({ hasText: 'Registered and UIN created' })
      .first()
    await expect(registeredRow).toContainText('MOSIP')
  })
})
