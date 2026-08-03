import { expect, test } from '@playwright/test'
import { createClient } from '@opencrvs/toolkit/api'
import { CREDENTIALS, GATEWAY_HOST } from '../../constants'
import { getToken } from '../../helpers'
import { buildAdministrativeAreaPayload, fetchClientAPI } from './helpers'

// There is no REST GET /api/events/administrative-areas exposed yet
// (administrativeAreas.list has no openapi meta), so seeded rows are
// verified via the tRPC client instead of a follow-up REST call.
test.describe('POST /api/events/administrative-areas', () => {
  test('national system admin (config.update-all) can seed an administrative area', async () => {
    const systemAdminToken = await getToken(CREDENTIALS.NATIONAL_SYSTEM_ADMIN)
    const payload = buildAdministrativeAreaPayload()

    const response = await fetchClientAPI(
      '/api/events/administrative-areas',
      'POST',
      systemAdminToken,
      { administrativeAreas: [payload] }
    )

    expect(response.status).toBe(200)

    const client = createClient(
      `${GATEWAY_HOST}/events`,
      `Bearer ${systemAdminToken}`
    )
    const [seededArea] = await client.administrativeAreas.list.query({
      ids: [payload.id]
    })
    expect(seededArea).toMatchObject({
      id: payload.id,
      name: payload.name
    })
  })

  test('registrar without config.update-all/user.data-seeding is forbidden', async () => {
    const registrarToken = await getToken(CREDENTIALS.REGISTRAR)

    const response = await fetchClientAPI(
      '/api/events/administrative-areas',
      'POST',
      registrarToken,
      { administrativeAreas: [buildAdministrativeAreaPayload()] }
    )

    expect(response.status).toBe(403)
  })

  test('rejects an empty payload', async () => {
    const systemAdminToken = await getToken(CREDENTIALS.NATIONAL_SYSTEM_ADMIN)

    const response = await fetchClientAPI(
      '/api/events/administrative-areas',
      'POST',
      systemAdminToken,
      { administrativeAreas: [] }
    )

    expect(response.status).toBe(400)
  })
})
