import { expect, test } from '@playwright/test'
import { CREDENTIALS } from '../../constants'
import { getToken } from '../../helpers'
import {
  buildLocationPayload,
  createIntegrationContext,
  fetchClientAPI
} from './helpers'

test.describe('GET /api/events/locations', () => {
  let clientToken: string

  test.beforeAll(async () => {
    const context = await createIntegrationContext()
    clientToken = context.clientToken
  })

  test('HTTP 200 with locations payload', async () => {
    const response = await fetchClientAPI(
      '/api/events/locations',
      'GET',
      clientToken
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThan(0)
  })
})

test.describe('POST /api/events/locations', () => {
  test('national system admin (config.update-all) can seed a location', async () => {
    const systemAdminToken = await getToken(CREDENTIALS.NATIONAL_SYSTEM_ADMIN)
    const payload = buildLocationPayload()

    const response = await fetchClientAPI(
      '/api/events/locations',
      'POST',
      systemAdminToken,
      payload
    )

    expect(response.status).toBe(200)

    const listResponse = await fetchClientAPI(
      `/api/events/locations?locationIds=${payload.id}`,
      'GET',
      systemAdminToken
    )
    const [seededLocation] = await listResponse.json()
    expect(seededLocation).toMatchObject({
      id: payload.id,
      name: payload.name
    })
  })

  test('registrar without config.update-all/user.data-seeding is forbidden', async () => {
    const registrarToken = await getToken(CREDENTIALS.REGISTRAR)

    const response = await fetchClientAPI(
      '/api/events/locations',
      'POST',
      registrarToken,
      buildLocationPayload()
    )

    expect(response.status).toBe(403)
  })

  test('rejects a payload missing required fields', async () => {
    const systemAdminToken = await getToken(CREDENTIALS.NATIONAL_SYSTEM_ADMIN)

    const response = await fetchClientAPI(
      '/api/events/locations',
      'POST',
      systemAdminToken,
      {}
    )

    expect(response.status).toBe(400)
  })
})
