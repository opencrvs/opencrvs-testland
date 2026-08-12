/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
 */
import * as Hapi from '@hapi/hapi'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import fetch from 'node-fetch'
import { logger } from '../../logger'
import { systemReadyHandler } from './handler'

vi.mock('node-fetch', () => ({ default: vi.fn() }))
vi.mock('../../logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))
// The MOSIP entry in INTEGRATIONS is built from these at module load
vi.mock('../../constants', () => ({
  MOSIP_INTEGRATION_CLIENT_ID: '5f10f0e9-dafa-48d6-b5e6-551809efa0ab',
  MOSIP_INTEGRATION_CLIENT_SECRET: '7514fe5f-6401-429b-8ac3-1f1c3dc40359',
  EVENTS_URL: 'http://events:5555/'
}))

const CONFIGURED_ID = '5f10f0e9-dafa-48d6-b5e6-551809efa0ab'

const mockFetch = vi.mocked(fetch)
const mockLogger = vi.mocked(logger)

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body)
  } as unknown as Awaited<ReturnType<typeof fetch>>
}

const request = {
  headers: { authorization: 'Bearer bootstrap-token' }
} as unknown as Hapi.Request

const h = {
  response: () => ({ code: (statusCode: number) => ({ statusCode }) })
} as unknown as Hapi.ResponseToolkit

/** Every POST /integrations call made during the run */
function registrationCalls() {
  return mockFetch.mock.calls.filter(
    ([, options]) => options?.method === 'POST'
  )
}

function warnings() {
  return mockLogger.warn.mock.calls.map(([message]) => String(message))
}

describe('systemReadyHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('seeds the configured credentials when the integration is new', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([]))
    mockFetch.mockResolvedValueOnce(jsonResponse({ clientId: CONFIGURED_ID }))

    await systemReadyHandler(request, h)

    const [, options] = registrationCalls()[0]
    expect(JSON.parse(String(options?.body))).toMatchObject({
      name: 'MOSIP',
      credentials: {
        clientId: CONFIGURED_ID,
        clientSecret: '7514fe5f-6401-429b-8ac3-1f1c3dc40359'
      }
    })
    expect(warnings()).toEqual([])
  })

  // A restart must never clobber a secret a National System Admin rotated
  it('skips silently when the registered client id matches the configured one', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse([{ id: CONFIGURED_ID, name: 'MOSIP' }])
    )

    await systemReadyHandler(request, h)

    expect(registrationCalls()).toHaveLength(0)
    expect(warnings()).toEqual([])
  })

  // The failure this warning exists for: the integration was registered with a
  // generated id, so the configured credentials 401 with nothing to explain it
  it('warns when the registered client id differs from the configured one', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse([
        { id: 'ac3daa16-bd38-41dd-9dbc-98a10b71bddd', name: 'MOSIP' }
      ])
    )

    await systemReadyHandler(request, h)

    // Still must not re-register, or it would invalidate credentials in use
    expect(registrationCalls()).toHaveLength(0)

    const [warning] = warnings()
    expect(warning).toContain('ac3daa16-bd38-41dd-9dbc-98a10b71bddd')
    expect(warning).toContain(CONFIGURED_ID)
    expect(warning).toContain('NOT in use')
  })

  it('does not register anything when listing integrations fails', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'nope' }, 500))

    await systemReadyHandler(request, h)

    expect(registrationCalls()).toHaveLength(0)
    expect(warnings()[0]).toContain('listing integrations failed')
  })

  /*
   * Events retries the trigger only on a failing status, and it makes that one
   * series of attempts at startup. Answering 200 with an integration
   * unregistered therefore strands it until events happens to restart, and the
   * symptom surfaces far away: the integrating system authenticates as a client
   * that does not exist.
   */
  describe('answers a status events can act on', () => {
    it('200 once every integration is registered', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]))
      mockFetch.mockResolvedValueOnce(jsonResponse({ clientId: CONFIGURED_ID }))

      expect(await systemReadyHandler(request, h)).toMatchObject({
        statusCode: 200
      })
    })

    it('200 when everything is already registered', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse([{ id: CONFIGURED_ID, name: 'MOSIP' }])
      )

      expect(await systemReadyHandler(request, h)).toMatchObject({
        statusCode: 200
      })
    })

    it('503 when listing integrations fails', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'nope' }, 500))

      expect(await systemReadyHandler(request, h)).toMatchObject({
        statusCode: 503
      })
    })

    it('503 when registering an integration fails', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]))
      mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'nope' }, 500))

      expect(await systemReadyHandler(request, h)).toMatchObject({
        statusCode: 503
      })
    })

    it('503 when registering an integration throws', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]))
      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))

      expect(await systemReadyHandler(request, h)).toMatchObject({
        statusCode: 503
      })
    })
  })
})
