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

import { and } from '@opencrvs/toolkit/conditionals'
import {
  ESIGNET_REDIRECT_URL,
  MOSIP_API_USERINFO_URL,
  OPENID_PROVIDER_CLIENT_ID,
  OPENID_PROVIDER_CLAIMS
} from '@countryconfig/constants'

function objectHasProperty(
  property: string,
  type: 'string' | 'number' | 'boolean' | 'array' | 'object',
  format?: string
) {
  return {
    type: 'object',
    properties: {
      [property]: {
        type,
        format
      }
    },
    required: [property]
  }
}

export const qrCodeConfig = {
  validation: {
    rule: and(
      objectHasProperty('firstName', 'string'),
      objectHasProperty('familyName', 'string'),
      objectHasProperty('gender', 'string'),
      objectHasProperty('birthDate', 'string'),
      objectHasProperty('nid', 'string')
    ),
    errorMessage: {
      defaultMessage: 'This QR code is not recognised. Please try again.',
      description: 'Error message for QR code validation',
      id: 'form.field.qr.validation.error'
    }
  }
}

export const esignetConfig = {
  fieldName: 'esignet',
  esignetAuthUrl: ESIGNET_REDIRECT_URL,
  openIdProviderClientId: OPENID_PROVIDER_CLIENT_ID,
  openIdProviderClaims: OPENID_PROVIDER_CLAIMS,
  callback: {
    fieldName: 'esignetCallback',
    mosipAPIUserInfoUrl: MOSIP_API_USERINFO_URL
  },
  loaderFieldName: 'esignetLoader'
}
