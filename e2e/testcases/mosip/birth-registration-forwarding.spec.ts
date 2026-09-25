import { expect, test } from '@playwright/test'
import { createClient } from '@opencrvs/toolkit/api'
import { ActionType } from '@opencrvs/toolkit/events'
import { omit } from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { CREDENTIALS, GATEWAY_HOST } from '../../constants'
import { getToken, login } from '../../helpers'
import {
  createDeclaration,
  getDeclaration
} from '../test-data/birth-declaration'
import {
  navigateToCertificatePrintAction,
  selectCertificationType,
  selectRequesterType
} from '../print-certificate/birth/helpers'

async function getEventById(eventId: string, token: string) {
  const client = createClient(`${GATEWAY_HOST}/events`, `Bearer ${token}`)
  return client.event.get.query({ eventId })
}

test('Birth registration forwarding to MOSIP attributes the certificate to the registrar', async ({
  page
}) => {
  const token = await getToken(CREDENTIALS.REGISTRAR)

  const { declaration, eventId } =
    await test.step('register a birth via the MOSIP forwarding flow (accepted asynchronously)', async () => {
      const declarationForMosipForwarding = await getDeclaration({
        token,
        partialDeclaration: {
          'mother.verified': 'authenticated'
        }
      })

      const res = await createDeclaration(
        token,
        omit(declarationForMosipForwarding, ['mother.idType', 'mother.nid'])
      )

      // No registration number synchronously — MOSIP accepts it asynchronously.
      expect(res.registrationNumber).toBeUndefined()
      expect(
        (res.declaration as Record<string, unknown>)['mother.verified']
      ).toBe('authenticated')

      return { declaration: res.declaration, eventId: res.eventId }
    })

  await test.step('register action is requested then accepted through MOSIP flow', async () => {
    await expect
      .poll(
        async () => {
          const event = await getEventById(eventId, token)
          const registerActions = event.actions.filter(
            (action: { type: string }) => action.type === 'REGISTER'
          )

          const hasRequestedRegisterAction = registerActions.some(
            (action: { status: string }) => action.status === 'Requested'
          )
          const acceptedAction = registerActions.find(
            (action: { status: string }) => action.status === 'Accepted'
          )

          if (!hasRequestedRegisterAction || !acceptedAction) {
            return false
          }

          const acceptedActionRegistrationNumber = (
            acceptedAction as { registrationNumber?: string }
          ).registrationNumber

          return Boolean(acceptedActionRegistrationNumber)
        },
        {
          timeout: 30_000,
          intervals: [500, 1000, 2000]
        }
      )
      .toBe(true)
  })

  await test.step('release the assignment kept by the asynchronous registration', async () => {
    // An async REGISTER is only Requested, so the registrar keeps the record.
    // Unassign it so the UI assigns it again, which downloads the full record.
    const client = createClient(`${GATEWAY_HOST}/events`, `Bearer ${token}`)
    await client.event.actions.assignment.unassign.mutate({
      eventId,
      transactionId: uuidv4(),
      type: ActionType.UNASSIGN
    })
  })

  await test.step('log in as the registrar', async () => {
    await login(page, CREDENTIALS.REGISTRAR)
  })

  await test.step('open the birth certificate preview', async () => {
    await page.getByRole('button', { name: 'Pending certification' }).click()
    await navigateToCertificatePrintAction(
      page,
      declaration,
      CREDENTIALS.REGISTRAR
    )
    await selectCertificationType(page, 'Birth Certificate')
    await selectRequesterType(page, 'Print and issue to Informant (Mother)')
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Verified' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
  })

  await test.step('"Registered by" shows the registrar who requested the registration', async () => {
    await expect(page.locator('#print')).toContainText('Kennedy Mweene')
  })
})
