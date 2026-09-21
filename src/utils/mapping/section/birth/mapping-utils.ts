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

import { certificateHandlebars } from '@countryconfig/form/birth/certificate-handlebars'
import { ISectionMapping } from '@countryconfig/form/types/types'

// You should never need to edit this function.  If there is a bug here raise an issue in [Github](https://github.com/opencrvs/opencrvs-farajaland)
export function getSectionMapping(mappingId: string): ISectionMapping {
  switch (mappingId) {
    case 'registration':
      return {
        template: [
          {
            fieldName: certificateHandlebars.registrationNumber,
            operation: 'registrationNumberTransformer'
          },
          {
            fieldName: certificateHandlebars.qrCode,
            operation: 'QRCodeTransformer'
          },
          {
            fieldName: certificateHandlebars.certificateDate,
            operation: 'certificateDateTransformer',
            parameters: ['en', 'dd MMMM yyyy']
          },
          {
            fieldName: certificateHandlebars.registrar,
            operation: 'userTransformer',
            parameters: ['REGISTERED']
          },
          {
            fieldName: certificateHandlebars.registrationAgent,
            operation: 'userTransformer',
            parameters: ['VALIDATED']
          },
          // one has to update the SIGNATURE_REQUIRED_FOR_ROLES array in application-config-default.ts
          // and add a system role in the array e.g. 'FIELD_AGENT' for the signature of that user
          // {
          //   fieldName: 'fieldAgent',
          //   operation: 'userTransformer',
          //   parameters: ['VALIDATED', 'IN_PROGRESS', 'DECLARED']
          // },
          {
            fieldName: certificateHandlebars.registrarName,
            operation: 'registrarNameUserTransformer'
          },
          {
            fieldName: certificateHandlebars.role,
            operation: 'roleUserTransformer'
          },
          {
            fieldName: certificateHandlebars.registrarSignature,
            operation: 'registrarSignatureUserTransformer'
          },
          {
            fieldName: certificateHandlebars.registrationDate,
            operation: 'registrationDateTransformer',
            parameters: ['en', 'dd MMMM yyyy']
          },
          {
            fieldName: certificateHandlebars.registrationLocation,
            operation: 'registrationLocationUserTransformer'
          }
        ],
        mutation: {
          operation: 'setBirthRegistrationSectionTransformer'
        },
        query: {
          operation: 'getBirthRegistrationSectionTransformer'
        }
      }
    case 'child':
      return {
        template: [
          {
            fieldName: 'childIdentifier',
            operation: 'childIdentityToFieldTransformer',
            parameters: [['NATIONAL_ID']]
          },
          {
            fieldName: 'birthConfigurableIdentifier1',
            operation: 'childIdentityToFieldTransformer',
            parameters: [['BIRTH_CONFIGURABLE_IDENTIFIER_1']]
          },
          {
            fieldName: 'birthConfigurableIdentifier2',
            operation: 'childIdentityToFieldTransformer',
            parameters: [['BIRTH_CONFIGURABLE_IDENTIFIER_2']]
          },
          {
            fieldName: 'birthConfigurableIdentifier3',
            operation: 'childIdentityToFieldTransformer',
            parameters: [['BIRTH_CONFIGURABLE_IDENTIFIER_3']]
          }
        ],
        mutation: {
          operation: 'childFieldToIdentityTransformer',
          parameters: [
            [
              'BIRTH_CONFIGURABLE_IDENTIFIER_1',
              'BIRTH_CONFIGURABLE_IDENTIFIER_2',
              'BIRTH_CONFIGURABLE_IDENTIFIER_3'
            ]
          ]
        },
        query: {
          operation: 'childIdentityToFieldTransformer',
          parameters: [
            [
              'BIRTH_CONFIGURABLE_IDENTIFIER_1',
              'BIRTH_CONFIGURABLE_IDENTIFIER_2',
              'BIRTH_CONFIGURABLE_IDENTIFIER_3'
            ]
          ]
        }
      }
    case 'mother':
      return {
        query: {
          operation: 'emptyMotherSectionTransformer'
        }
      }
    case 'father':
      return {
        query: {
          operation: 'emptyFatherSectionTransformer'
        }
      }
    default:
      throw Error(`Mapping not supported for ${mappingId}`)
  }
}
