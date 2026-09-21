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

import { MessageDescriptor } from 'react-intl'
import { ADMIN_LEVELS, defaultAddressConfiguration } from '../form/addresses'
import {
  ISerializedForm,
  SerializedFormField,
  Event,
  Conditional,
  IPreviewGroup,
  EventLocationAddressCases,
  AddressCases,
  AllowedAddressConfigurations,
  AddressSubsections,
  AddressCopyConfigCases,
  IAddressConfiguration,
  IFormFieldMapping,
  IQueryMapper,
  IMutationMapper,
  IHandlebarTemplates
} from '../form/types/types'
import {
  getAddressFields,
  getXAddressSameAsY
} from '../form/addresses/address-fields'
import { getPreviewGroups } from '../form/common/preview-groups'
import { cloneDeep } from 'lodash'
import { expressionToConditional } from '../form/common/default-validation-conditionals'

// Use this function to edit the visibility of fields depending on user input
function getLocationLevelConditionals(
  section: string,
  useCase: string,
  defaultConditionals: Conditional[]
) {
  let customConditionals: Conditional[] = []
  switch (ADMIN_LEVELS) {
    case 1:
      customConditionals = [
        {
          action: 'hide',
          expression: `!values.state${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        }
      ]
      break
    case 2:
      customConditionals = [
        {
          action: 'hide',
          expression: `!values.state${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.district${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        }
      ]
      break
    case 3:
      customConditionals = [
        {
          action: 'hide',
          expression: `!values.state${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.district${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.locationLevel3${sentenceCase(
            useCase
          )}${sentenceCase(section)}`
        }
      ]
      break
    case 4:
      customConditionals = [
        {
          action: 'hide',
          expression: `!values.state${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.district${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.locationLevel3${sentenceCase(
            useCase
          )}${sentenceCase(section)}`
        },
        {
          action: 'hide',
          expression: `!values.locationLevel4${sentenceCase(
            useCase
          )}${sentenceCase(section)}`
        }
      ]
      break
  }
  return defaultConditionals.concat(customConditionals)
}

// Use this function to edit the visibility of fields depending on user input
export function getPlaceOfEventConditionals(
  section: string,
  location: string,
  useCase: string
) {
  switch (location) {
    case 'country':
      return [
        {
          action: 'hide',
          expression:
            useCase !== EventLocationAddressCases.PLACE_OF_MARRIAGE
              ? `values.${useCase}!="OTHER" && values.${useCase}!="PRIVATE_HOME"`
              : ''
        }
      ]
    case 'state':
      return [
        {
          action: 'hide',
          expression: `!values.country${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression:
            useCase !== EventLocationAddressCases.PLACE_OF_MARRIAGE
              ? `values.${useCase}!="OTHER" && values.${useCase}!="PRIVATE_HOME"`
              : ''
        },
        {
          action: 'hide',
          expression: `!isDefaultCountry(values.country${sentenceCase(
            useCase
          )}${sentenceCase(section)})`
        }
      ]
    case 'district':
      return [
        {
          action: 'hide',
          expression: `!values.country${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.state${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression:
            useCase !== EventLocationAddressCases.PLACE_OF_MARRIAGE
              ? `values.${useCase}!="OTHER" && values.${useCase}!="PRIVATE_HOME"`
              : ''
        },
        {
          action: 'hide',
          expression: `!isDefaultCountry(values.country${sentenceCase(
            useCase
          )}${sentenceCase(section)})`
        }
      ]
    case 'locationLevel3':
      return [
        {
          action: 'hide',
          expression: `!values.country${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.state${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.district${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression:
            useCase !== EventLocationAddressCases.PLACE_OF_MARRIAGE
              ? `values.${useCase}!="OTHER" && values.${useCase}!="PRIVATE_HOME"`
              : ''
        },
        {
          action: 'hide',
          expression: `!isDefaultCountry(values.country${sentenceCase(
            useCase
          )}${sentenceCase(section)})`
        }
      ]
    case 'locationLevel4':
      return [
        {
          action: 'hide',
          expression: `!values.country${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.state${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.district${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.locationLevel3${sentenceCase(
            useCase
          )}${sentenceCase(section)}`
        },
        {
          action: 'hide',
          expression:
            useCase !== EventLocationAddressCases.PLACE_OF_MARRIAGE
              ? `values.${useCase}!="OTHER" && values.${useCase}!="PRIVATE_HOME"`
              : ''
        },
        {
          action: 'hide',
          expression: `!isDefaultCountry(values.country${sentenceCase(
            useCase
          )}${sentenceCase(section)})`
        }
      ]
    case 'locationLevel5':
      return [
        {
          action: 'hide',
          expression: `!values.country${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.state${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.district${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.locationLevel3${sentenceCase(
            useCase
          )}${sentenceCase(section)}`
        },
        {
          action: 'hide',
          expression: `!values.locationLevel4${sentenceCase(
            useCase
          )}${sentenceCase(section)})`
        },
        {
          action: 'hide',
          expression:
            useCase !== EventLocationAddressCases.PLACE_OF_MARRIAGE
              ? `values.${useCase}!="OTHER" && values.${useCase}!="PRIVATE_HOME"`
              : ''
        },
        {
          action: 'hide',
          expression: `!isDefaultCountry(values.country${sentenceCase(
            useCase
          )}${sentenceCase(section)})`
        }
      ]
    case 'ruralOrUrban':
      return getLocationLevelConditionals(section, useCase, [
        {
          action: 'hide',
          expression: `!values.country${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression:
            useCase !== EventLocationAddressCases.PLACE_OF_MARRIAGE
              ? `values.${useCase}!="OTHER" && values.${useCase}!="PRIVATE_HOME"`
              : ''
        },
        {
          action: 'hide',
          expression: `!isDefaultCountry(values.country${sentenceCase(
            useCase
          )}${sentenceCase(section)})`
        }
      ])
    case 'urban':
      return getLocationLevelConditionals(section, useCase, [
        {
          action: 'hide',
          expression: `!values.country${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression:
            useCase !== EventLocationAddressCases.PLACE_OF_MARRIAGE
              ? `values.${useCase}!="OTHER" && values.${useCase}!="PRIVATE_HOME"`
              : ''
        },
        {
          action: 'hide',
          expression: `values.ruralOrUrban${sentenceCase(
            useCase
          )}${sentenceCase(section)} !== "URBAN"`
        },
        {
          action: 'hide',
          expression: `!isDefaultCountry(values.country${sentenceCase(
            useCase
          )}${sentenceCase(section)})`
        }
      ])
    case 'rural':
      return getLocationLevelConditionals(section, useCase, [
        {
          action: 'hide',
          expression: `!values.country${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression:
            useCase !== EventLocationAddressCases.PLACE_OF_MARRIAGE
              ? `values.${useCase}!="OTHER" && values.${useCase}!="PRIVATE_HOME"`
              : ''
        },
        {
          action: 'hide',
          expression: `values.ruralOrUrban${sentenceCase(
            useCase
          )}${sentenceCase(section)} !== "RURAL"`
        },
        {
          action: 'hide',
          expression: `!isDefaultCountry(values.country${sentenceCase(
            useCase
          )}${sentenceCase(section)})`
        }
      ])
    case 'international':
      return [
        {
          action: 'hide',
          expression: `isDefaultCountry(values.country${sentenceCase(
            useCase
          )}${sentenceCase(section)})`
        },
        {
          action: 'hide',
          expression:
            useCase !== EventLocationAddressCases.PLACE_OF_MARRIAGE
              ? `values.${useCase}!="OTHER" && values.${useCase}!="PRIVATE_HOME"`
              : ''
        }
      ]
    default:
      throw Error(
        'Supplied event location is unsupported by current conditionals'
      )
  }
}

// Use this function to edit the visibility of fields depending on user input
export function getAddressConditionals(
  section: string,
  location: string,
  useCase: string
) {
  switch (location) {
    case 'country':
      return [
        {
          action: 'disable',
          expression: `values?.fieldsModifiedByNidUserInfo?.includes('country${sentenceCase(
            useCase
          )}${sentenceCase(section)}')`
        }
      ]
    case 'state':
      return [
        {
          action: 'hide',
          expression: `!values.country${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!isDefaultCountry(values.country${sentenceCase(
            useCase
          )}${sentenceCase(section)})`
        }
      ]
    case 'district':
      return [
        {
          action: 'hide',
          expression: `!values.country${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.state${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!isDefaultCountry(values.country${sentenceCase(
            useCase
          )}${sentenceCase(section)})`
        }
      ]
    case 'locationLevel3':
      return [
        {
          action: 'hide',
          expression: `!values.country${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.state${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.district${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!isDefaultCountry(values.country${sentenceCase(
            useCase
          )}${sentenceCase(section)})`
        }
      ]
    case 'locationLevel4':
      return [
        {
          action: 'hide',
          expression: `!values.country${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.state${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.district${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.locationLevel3${sentenceCase(
            useCase
          )}${sentenceCase(section)}`
        },
        {
          action: 'hide',
          expression: `!isDefaultCountry(values.country${sentenceCase(
            useCase
          )}${sentenceCase(section)})`
        }
      ]
    case 'locationLevel5':
      return [
        {
          action: 'hide',
          expression: `!values.country${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.state${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.district${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!values.locationLevel3${sentenceCase(
            useCase
          )}${sentenceCase(section)}`
        },
        {
          action: 'hide',
          expression: `!values.locationLevel4${sentenceCase(
            useCase
          )}${sentenceCase(section)}`
        },
        {
          action: 'hide',
          expression: `!isDefaultCountry(values.country${sentenceCase(
            useCase
          )}${sentenceCase(section)})`
        }
      ]
    case 'ruralOrUrban':
      return getLocationLevelConditionals(section, useCase, [
        {
          action: 'hide',
          expression: `!values.country${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `!isDefaultCountry(values.country${sentenceCase(
            useCase
          )}${sentenceCase(section)})`
        }
      ])
    case 'urban':
      return getLocationLevelConditionals(section, useCase, [
        {
          action: 'hide',
          expression: `!values.country${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `values.ruralOrUrban${sentenceCase(
            useCase
          )}${sentenceCase(section)} !== "URBAN"`
        },
        {
          action: 'hide',
          expression: `!isDefaultCountry(values.country${sentenceCase(
            useCase
          )}${sentenceCase(section)})`
        }
      ])
    case 'rural':
      return getLocationLevelConditionals(section, useCase, [
        {
          action: 'hide',
          expression: `!values.country${sentenceCase(useCase)}${sentenceCase(
            section
          )}`
        },
        {
          action: 'hide',
          expression: `values.ruralOrUrban${sentenceCase(
            useCase
          )}${sentenceCase(section)} !== "RURAL"`
        },
        {
          action: 'hide',
          expression: `!isDefaultCountry(values.country${sentenceCase(
            useCase
          )}${sentenceCase(section)})`
        }
      ])
    case 'international':
      return [
        {
          action: 'hide',
          expression: `isDefaultCountry(values.country${sentenceCase(
            useCase
          )}${sentenceCase(section)})`
        }
      ]
    default:
      throw Error('Supplied location is unsupported by current conditionals')
  }
}

// ====== THE FOLLOWING UTILITY FUNCTIONS SHOULD NOT BE EDITED DURING COUNTRY CONFIGURATION! ========
// ====================== IF YOU BELIEVE THERE IS A BUG HERE, RAISE IN GITHUB! ======================

// You should never need to edit this function.  If there is a bug here raise an issue in [Github](https://github.com/opencrvs/opencrvs-farajaland)
export const sentenceCase = (str: string): string =>
  str.replace(/\w\S*/g, (txt: string) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })

// You should never need to edit this function.  If there is a bug here raise an issue in [Github](https://github.com/opencrvs/opencrvs-farajaland)
export function getDependency(
  location: string,
  useCase: string,
  section: string
) {
  switch (location) {
    case 'state':
      return `country${sentenceCase(useCase)}${sentenceCase(section)}`
    case 'district':
      return `state${sentenceCase(useCase)}${sentenceCase(section)}`
    case 'locationLevel3':
      return `district${sentenceCase(useCase)}${sentenceCase(section)}`
    case 'locationLevel4':
      return `locationLevel3${sentenceCase(useCase)}${sentenceCase(section)}`
    case 'locationLevel5':
      return `locationLevel4${sentenceCase(useCase)}${sentenceCase(section)}`
    default:
      throw Error('Supplied address dependency is unsupported')
  }
}
// You should never need to edit this function.  If there is a bug here raise an issue in [Github](https://github.com/opencrvs/opencrvs-farajaland)
function getTemplateMapping(
  location: string,
  useCase: string,
  fieldName: string,
  fhirLineArrayPosition?: number
): IHandlebarTemplates {
  return isUseCaseForPlaceOfEvent(useCase)
    ? fhirLineArrayPosition
      ? {
          fieldName,
          operation: 'eventLocationAddressLineTemplateTransformer',
          parameters: [fhirLineArrayPosition, fieldName, location]
        }
      : {
          fieldName,
          operation: 'eventLocationAddressFHIRPropertyTemplateTransformer',
          parameters: [location]
        }
    : fhirLineArrayPosition
      ? {
          fieldName,
          operation: 'addressLineTemplateTransformer',
          parameters: [
            useCase.toUpperCase() === 'PRIMARY'
              ? AddressCases.PRIMARY_ADDRESS
              : AddressCases.SECONDARY_ADDRESS,
            fhirLineArrayPosition,
            fieldName,
            location
          ]
        }
      : {
          fieldName,
          operation: 'addressFHIRPropertyTemplateTransformer',
          parameters: [
            useCase.toUpperCase() === 'PRIMARY'
              ? AddressCases.PRIMARY_ADDRESS
              : AddressCases.SECONDARY_ADDRESS,
            location
          ]
        }
}

// You should never need to edit this function.  If there is a bug here raise an issue in [Github](https://github.com/opencrvs/opencrvs-farajaland)
function getMutationMapping({
  location,
  useCase,
  fhirLineArrayPosition,
  isLowestAdministrativeLevel
}: {
  location: string
  useCase: string
  fhirLineArrayPosition?: number
  isLowestAdministrativeLevel?: boolean
}): IMutationMapper {
  return isUseCaseForPlaceOfEvent(useCase)
    ? fhirLineArrayPosition || fhirLineArrayPosition === 0
      ? {
          operation: 'eventLocationMutationTransformer',
          parameters: [
            {
              useCase,
              lineNumber: fhirLineArrayPosition,
              isLowestAdministrativeLevel
            }
          ]
        }
      : {
          operation: 'eventLocationMutationTransformer',
          parameters: [
            {
              useCase,
              transformedFieldName: location,
              isLowestAdministrativeLevel
            }
          ]
        }
    : fhirLineArrayPosition || fhirLineArrayPosition === 0
      ? {
          operation: 'addressMutationTransformer',
          parameters: [
            {
              useCase:
                useCase.toUpperCase() === 'PRIMARY'
                  ? AddressCases.PRIMARY_ADDRESS
                  : AddressCases.SECONDARY_ADDRESS,
              lineNumber: fhirLineArrayPosition,
              isLowestAdministrativeLevel
            }
          ]
        }
      : {
          operation: 'addressMutationTransformer',
          parameters: [
            {
              useCase:
                useCase.toUpperCase() === 'PRIMARY'
                  ? AddressCases.PRIMARY_ADDRESS
                  : AddressCases.SECONDARY_ADDRESS,
              transformedFieldName: location,
              isLowestAdministrativeLevel
            }
          ]
        }
}

// You should never need to edit this function.  If there is a bug here raise an issue in [Github](https://github.com/opencrvs/opencrvs-farajaland)
function getQueryMapping(
  section: string,
  type:
    | 'TEXT'
    | 'RADIO_GROUP'
    | 'SELECT_WITH_OPTIONS'
    | 'SELECT_WITH_DYNAMIC_OPTIONS',
  location: string,
  useCase: string,
  fieldName: string,
  fhirLineArrayPosition?: number
): IQueryMapper {
  return isUseCaseForPlaceOfEvent(useCase)
    ? {
        operation: 'eventLocationQueryTransformer',
        parameters:
          type === 'SELECT_WITH_OPTIONS' ||
          type === 'SELECT_WITH_DYNAMIC_OPTIONS' ||
          fieldName ===
            `city${sentenceCase(useCase)}${sentenceCase(section)}` ||
          fieldName ===
            `postalCode${sentenceCase(useCase)}${sentenceCase(section)}` ||
          fieldName ===
            `internationalPostalCode${sentenceCase(useCase)}${sentenceCase(
              section
            )}` ||
          fieldName ===
            `internationalState${sentenceCase(useCase)}${sentenceCase(
              section
            )}` ||
          fieldName ===
            `internationalDistrict${sentenceCase(useCase)}${sentenceCase(
              section
            )}` ||
          fieldName ===
            `internationalCity${sentenceCase(useCase)}${sentenceCase(section)}`
            ? [
                {
                  transformedFieldName: location,
                  lineNumber: fhirLineArrayPosition
                },
                {
                  fieldsToIgnoreForLocalAddress: [
                    `internationalDistrict${sentenceCase(
                      useCase
                    )}${sentenceCase(section)}`,
                    `internationalState${sentenceCase(useCase)}${sentenceCase(
                      section
                    )}`
                  ],
                  fieldsToIgnoreForInternationalAddress: [
                    `locationLevel3${sentenceCase(useCase)}${sentenceCase(
                      section
                    )}`,
                    `locationLevel4${sentenceCase(useCase)}${sentenceCase(
                      section
                    )}`,
                    `locationLevel5${sentenceCase(useCase)}${sentenceCase(
                      section
                    )}`,
                    `district${sentenceCase(useCase)}${sentenceCase(section)}`,
                    `state${sentenceCase(useCase)}${sentenceCase(section)}`
                  ]
                }
              ]
            : [{ lineNumber: fhirLineArrayPosition }]
      }
    : fhirLineArrayPosition || fhirLineArrayPosition === 0
      ? {
          operation: 'addressQueryTransformer',
          parameters: [
            {
              useCase:
                useCase.toUpperCase() === 'PRIMARY'
                  ? AddressCases.PRIMARY_ADDRESS
                  : AddressCases.SECONDARY_ADDRESS,
              lineNumber: fhirLineArrayPosition
            }
          ]
        }
      : {
          operation: 'addressQueryTransformer',
          parameters: [
            {
              useCase:
                useCase.toUpperCase() === 'PRIMARY'
                  ? AddressCases.PRIMARY_ADDRESS
                  : AddressCases.SECONDARY_ADDRESS,
              transformedFieldName: location
            }
          ]
        }
}

// You should never need to edit this function.  If there is a bug here raise an issue in [Github](https://github.com/opencrvs/opencrvs-farajaland)
export function getMapping({
  section,
  type,
  location,
  useCase,
  fieldName,
  fhirLineArrayPosition,
  isLowestAdministrativeLevel
}: {
  section: string
  type:
    | 'TEXT'
    | 'RADIO_GROUP'
    | 'SELECT_WITH_OPTIONS'
    | 'SELECT_WITH_DYNAMIC_OPTIONS'
  location: string
  useCase: string
  fieldName: string
  fhirLineArrayPosition?: number
  isLowestAdministrativeLevel?: boolean
}): IFormFieldMapping {
  if (type !== 'RADIO_GROUP') {
    return {
      template: getTemplateMapping(
        location,
        useCase,
        fieldName,
        fhirLineArrayPosition
      ),
      mutation: getMutationMapping({
        location,
        useCase,
        fhirLineArrayPosition,
        isLowestAdministrativeLevel
      }),
      query: getQueryMapping(
        section,
        type,
        location,
        useCase,
        fieldName,
        fhirLineArrayPosition
      )
    }
  } else {
    // Radio Groups in addresses have no need for certificate template
    return {
      mutation: getMutationMapping({
        location,
        useCase,
        fhirLineArrayPosition,
        isLowestAdministrativeLevel
      }),
      query: getQueryMapping(
        section,
        type,
        location,
        useCase,
        fieldName,
        fhirLineArrayPosition
      )
    }
  }
}

export function getEventLocationSelectionMapping(
  mappingId: string,
  certificateHandlebar: string = ''
): IFormFieldMapping {
  switch (mappingId) {
    case 'placeOfBirth':
    case 'placeOfDeath':
      return {
        mutation: {
          operation: 'eventLocationMutationTransformer',
          parameters: [{ useCase: mappingId }]
        },
        query: {
          operation: 'eventLocationTypeQueryTransformer',
          parameters: []
        }
      }
    case 'birthLocation':
      return {
        template: {
          fieldName: certificateHandlebar,
          operation: 'eventLocationNameQueryOfflineTransformer',
          parameters: ['facilities', 'placeOfBirth']
        },
        mutation: {
          operation: 'eventLocationMutationTransformer',
          parameters: [{ useCase: 'placeOfBirth' }]
        },
        query: {
          operation: 'eventLocationIDQueryTransformer',
          parameters: []
        }
      }
    case 'deathLocation':
      return {
        template: {
          fieldName: certificateHandlebar,
          operation: 'eventLocationNameQueryOfflineTransformer',
          parameters: ['facilities', 'placeOfDeath']
        },
        mutation: {
          operation: 'eventLocationMutationTransformer',
          parameters: [{ useCase: 'placeOfDeath' }]
        },
        query: {
          operation: 'eventLocationIDQueryTransformer',
          parameters: []
        }
      }
    default:
      throw Error(`Mapping not supported for ${mappingId}`)
  }
}

// You should never need to edit this function.  If there is a bug here raise an issue in [Github](https://github.com/opencrvs/opencrvs-farajaland)
export function getIdentifiersFromFieldId(fieldId: string) {
  const splitIds = fieldId.split('.')
  return {
    event: splitIds[0] as Event,
    sectionId: splitIds[1],
    groupId: splitIds[2],
    fieldName: splitIds[3]
  }
}

// You should never need to edit this function.  If there is a bug here raise an issue in [Github](https://github.com/opencrvs/opencrvs-farajaland)
export function getSectionIdentifiers(fieldId: string, form: ISerializedForm) {
  const { event, sectionId } = getIdentifiersFromFieldId(fieldId)

  const sectionIndex = form.sections.findIndex(({ id }) => id === sectionId)
  return {
    event,
    sectionIndex,
    sectionId
  }
}

// You should never need to edit this function.  If there is a bug here raise an issue in [Github](https://github.com/opencrvs/opencrvs-farajaland)
export function getGroupIdentifiers(fieldId: string, form: ISerializedForm) {
  const { event, groupId } = getIdentifiersFromFieldId(fieldId)

  const { sectionIndex, sectionId } = getSectionIdentifiers(fieldId, form)

  const groups = form.sections[sectionIndex].groups

  const groupIndex = groups.findIndex(({ id }) => id === groupId)

  return {
    event,
    sectionIndex,
    sectionId,
    groupIndex
  }
}

// You should never need to edit this function.  If there is a bug here raise an issue in [Github](https://github.com/opencrvs/opencrvs-farajaland)
export function getFieldIdentifiers(fieldId: string, form: ISerializedForm) {
  const { event, fieldName } = getIdentifiersFromFieldId(fieldId)

  const { sectionIndex, groupIndex, sectionId } = getGroupIdentifiers(
    fieldId,
    form
  )

  const fields = form.sections[sectionIndex].groups[groupIndex].fields

  const fieldIndex = fields.findIndex(({ name }) => name === fieldName)

  return {
    event,
    sectionIndex,
    sectionId,
    groupIndex,
    fieldIndex
  }
}

// You should never need to edit this function.  If there is a bug here raise an issue in [Github](https://github.com/opencrvs/opencrvs-farajaland)
export function isUseCaseForPlaceOfEvent(useCase: string): Boolean {
  return Object.values(
    EventLocationAddressCases as Record<string, string>
  ).includes(useCase)
}

// You should never need to edit this function.  If there is a bug here raise an issue in [Github](https://github.com/opencrvs/opencrvs-farajaland)
export const getAddressSubsection = (
  previewGroup: AddressSubsections,
  label: MessageDescriptor,
  conditionalCase?: string | Conditional[]
): SerializedFormField[] => {
  const fields: SerializedFormField[] = []
  const subsection: SerializedFormField = {
    name: previewGroup,
    type: 'HEADING3',
    label,
    previewGroup: previewGroup,
    initialValue: '',
    validator: []
  }

  if (conditionalCase) {
    subsection['conditionals'] =
      typeof conditionalCase === 'string'
        ? [expressionToConditional(conditionalCase)]
        : conditionalCase
  }

  fields.push(subsection)
  return fields
}

// You should never need to edit this function.  If there is a bug here raise an issue in [Github](https://github.com/opencrvs/opencrvs-farajaland)
function getAddressFieldsByConfiguration(
  configuration: AllowedAddressConfigurations,
  section: string,
  addressHierarchy: string[]
): SerializedFormField[] {
  switch (configuration.config) {
    case EventLocationAddressCases.PLACE_OF_BIRTH:
    case EventLocationAddressCases.PLACE_OF_DEATH:
    case EventLocationAddressCases.PLACE_OF_MARRIAGE:
      return getAddressFields('', configuration.config, addressHierarchy)
    case AddressCases.PRIMARY_ADDRESS:
      return getAddress(
        section,
        AddressCases.PRIMARY_ADDRESS,
        addressHierarchy,
        configuration.conditionalCase
      )
    case AddressCases.SECONDARY_ADDRESS:
      return getAddress(
        section,
        AddressCases.SECONDARY_ADDRESS,
        addressHierarchy,
        configuration.conditionalCase
      )
    case AddressCopyConfigCases.PRIMARY_ADDRESS_SAME_AS_OTHER_PRIMARY:
      if (
        !configuration.label ||
        !configuration.xComparisonSection ||
        !configuration.yComparisonSection
      ) {
        throw new Error(
          `Invalid address comparison case configuration for: ${configuration.config}`
        )
      }
      return getXAddressSameAsY(
        configuration.xComparisonSection,
        configuration.yComparisonSection,
        configuration.label,
        configuration.conditionalCase
      )
    case AddressSubsections.PRIMARY_ADDRESS_SUBSECTION:
    case AddressSubsections.SECONDARY_ADDRESS_SUBSECTION:
      if (!configuration.label) {
        throw new Error(
          `Invalid address subsection configuration for: ${configuration.config}`
        )
      }
      return getAddressSubsection(
        configuration.config,
        configuration.label,
        configuration.conditionalCase
      )
    default:
      return []
  }
}

// You should never need to edit this function.  If there is a bug here raise an issue in [Github](https://github.com/opencrvs/opencrvs-farajaland)
export function decorateFormsWithAddresses(
  defaultEventForm: ISerializedForm,
  event: string,
  addressHierarchy: string[]
): ISerializedForm {
  const newForm = cloneDeep(defaultEventForm)
  defaultAddressConfiguration.forEach(
    ({ precedingFieldId, configurations }: IAddressConfiguration) => {
      if (precedingFieldId.startsWith(event)) {
        const { sectionIndex, sectionId, groupIndex, fieldIndex } =
          getFieldIdentifiers(precedingFieldId, newForm)

        let addressFields: SerializedFormField[] = []
        let previewGroups: IPreviewGroup[] = []
        configurations.forEach((configuration) => {
          addressFields = addressFields.concat(
            getAddressFieldsByConfiguration(
              configuration,
              sectionId,
              addressHierarchy
            )
          )
          previewGroups = previewGroups.concat(getPreviewGroups(configuration))
        })
        newForm.sections[sectionIndex].groups[groupIndex].fields.splice(
          fieldIndex + 1,
          0,
          ...addressFields
        )

        const group = newForm.sections[sectionIndex].groups[groupIndex]
        if (group.previewGroups) {
          group.previewGroups = group.previewGroups.concat(previewGroups)
        } else {
          group.previewGroups = previewGroups
        }
      }
    }
  )

  return newForm
}

// You should never need to edit this function.  If there is a bug here raise an issue in [Github](https://github.com/opencrvs/opencrvs-farajaland)
function getAddress(
  section: string,
  addressCase: AddressCases,
  addressHierarchy: string[],
  conditionalCase?: string | Conditional[]
): SerializedFormField[] {
  const defaultFields: SerializedFormField[] = getAddressFields(
    section,
    addressCase,
    addressHierarchy
  )
  if (conditionalCase) {
    return addConditionalsToFields(defaultFields, conditionalCase)
  }

  return defaultFields
}

/**
 * Adds provided conditionals to each field. Mutates the given array.
 */
function addConditionalsToFields(
  fields: SerializedFormField[],
  conditionalCase: string | Conditional[]
) {
  fields.forEach((field) => {
    const conditionals =
      typeof conditionalCase === 'string'
        ? [expressionToConditional(conditionalCase)]
        : conditionalCase

    if (conditionals.length > 0) {
      field.conditionals = [...(field.conditionals || []), ...conditionals]
    }
  })

  return fields
}
