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
import { bool, cleanEnv, makeValidator, port, str, url } from 'envalid'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * A UUID, or an empty string when the variable is left unconfigured. Used for
 * seeded integration credentials: user-mgnt validates the client id it returns
 * as a UUID, so a malformed seed must fail fast at startup rather than surface
 * as a runtime 500 during integration registration.
 */
const uuidOrEmpty = makeValidator<string>((value) => {
  if (value === '' || UUID_REGEX.test(value)) {
    return value
  }
  throw new Error('Expected a UUID')
})

export const env = cleanEnv(process.env, {
  DOMAIN: str({ devDefault: '*' }),
  GATEWAY_URL: url({ devDefault: 'http://localhost:7070' }),
  LOGIN_URL: url({ devDefault: 'http://localhost:3020/' }),
  CLIENT_APP_URL: url({ devDefault: 'http://localhost:3000/' }),
  FHIR_URL: url({ devDefault: 'http://localhost:3447/fhir' }),
  COUNTRY_CONFIG_HOST: str({ default: '0.0.0.0' }),
  COUNTRY_CONFIG_PORT: port({ default: 3040 }),
  AUTH_URL: url({ devDefault: 'http://localhost:4040' }),
  COUNTRY_CONFIG_URL: url({ devDefault: 'http://localhost:3040' }),
  APPLICATION_CONFIG_URL: url({ devDefault: 'http://localhost:2021/' }),
  SENTRY_DSN: str({ default: undefined }),
  CHECK_INVALID_TOKEN: bool({
    default: true,
    devDefault: false,
    desc: 'Check if the token has been invalidated in the auth service before it has expired'
  }),
  CONFIRM_REGISTRATION_URL: url({
    devDefault: 'http://localhost:5050/confirm/registration'
  }),
  USER_MANAGEMENT_URL: url({ devDefault: 'http://localhost:3030' }),
  QA_ENV: bool({ default: false }),
  ESIGNET_REDIRECT_URL: url({ devDefault: 'http://localhost:20260/authorize' }),
  OPENID_PROVIDER_CLIENT_ID: str({ devDefault: 'mock-client_id' }),
  OPENID_PROVIDER_CLAIMS: str({
    devDefault: 'name,family_name,given_name,middle_name,birthdate,address'
  }),
  MOSIP_API_USERINFO_URL: url({
    devDefault: 'http://localhost:2024/esignet/get-oidp-user-info'
  }),
  ANALYTICS_DATABASE_URL: url({
    default: undefined,
    devDefault:
      'postgres://events_analytics:analytics_password@localhost:5432/events',
    desc: 'The database URL for reads and writes to `analytics.events`. See `/infrastructure/postgres/setup-analytics.sh` for how the default database is set up for your country.'
  }),
  MOSIP_INTEROP_URL: url({
    default: 'http://mosip-api:2024',
    devDefault: 'http://localhost:2024',
    desc: 'URL for MOSIP interoperability API'
  }),
  MOSIP_INTEGRATION_CLIENT_ID: uuidOrEmpty({
    default: '',
    desc: "OpenCRVS system client ID to seed for the MOSIP integration on startup. Must be a UUID and match the mosip-api's OPENCRVS_CLIENT_ID. Leave empty to have user-mgnt generate credentials instead (NSA reveals them via the Integrations page)."
  }),
  MOSIP_INTEGRATION_CLIENT_SECRET: str({
    default: '',
    desc: "OpenCRVS system client secret to seed for the MOSIP integration on startup. Must match the mosip-api's OPENCRVS_CLIENT_SECRET. Leave empty to have user-mgnt generate the secret instead."
  }),
  FORWARD_ACTIONS_TO: str({
    default: '',
    devDefault: '',
    desc: 'Comma separated list of URLs to forward action events to'
  })
})
