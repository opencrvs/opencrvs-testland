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

import { getFieldMapping } from '@countryconfig/utils/mapping/field-mapping-utils'
import {
  formMessageDescriptors,
  informantMessageDescriptors
} from '../common/messages'
import {
  causeOfDeathReportedOptions,
  deathInformantTypeOptions,
  mannerOfDeathOptions,
  placeOfDeathOptions
} from '../common/select-options'
import { SerializedFormField, TEXTAREA, Conditional } from '../types/types'
import { certificateHandlebars } from './certficate-handlebars'
import { getEventLocationSelectionMapping } from '@countryconfig/utils/address-utils'

export const getDeathDate = (
  fieldName: string,
  conditionals: Conditional[],
  validator: any[]
): SerializedFormField => ({
  name: fieldName, // A field with this name MUST exist
  type: 'DATE',
  label: formMessageDescriptors.deathEventDate,
  required: true,
  conditionals,
  initialValue: '',
  validator,
  mapping: getFieldMapping('deathDate', certificateHandlebars.eventDate)
})

export const deathInformantType: SerializedFormField = {
  name: 'informantType',
  type: 'SELECT_WITH_OPTIONS',
  label: informantMessageDescriptors.birthInformantTitle,
  required: true,
  previewGroup: 'contactPointGroup',
  hideInPreview: false,
  initialValue: '',
  validator: [],
  placeholder: formMessageDescriptors.formSelectPlaceholder,
  mapping: getFieldMapping(
    'informantType',
    certificateHandlebars.informantType
  ),
  options: deathInformantTypeOptions
}

export const getMannerOfDeath: SerializedFormField = {
  name: 'mannerOfDeath',
  type: 'SELECT_WITH_OPTIONS',
  label: formMessageDescriptors.manner,
  required: false,
  initialValue: '',
  validator: [],
  placeholder: formMessageDescriptors.formSelectPlaceholder,
  options: mannerOfDeathOptions,
  mapping: getFieldMapping('mannerOfDeath', certificateHandlebars.mannerOfDeath)
}

export const getCauseOfDeath: SerializedFormField = {
  name: 'causeOfDeathEstablished',
  type: 'CHECKBOX',
  label: formMessageDescriptors.causeOfDeathEstablished,
  required: true,
  checkedValue: 'true',
  uncheckedValue: 'false',
  hideHeader: true,
  initialValue: 'false',
  validator: [],
  mapping: getFieldMapping(
    'causeOfDeathEstablished',
    certificateHandlebars.causeOfDeathEstablished
  )
}

export const getCauseOfDeathMethod: SerializedFormField = {
  name: 'causeOfDeathMethod',
  type: 'SELECT_WITH_OPTIONS',
  label: formMessageDescriptors.causeOfDeathMethod,
  required: true,
  initialValue: '',
  validator: [],
  placeholder: formMessageDescriptors.formSelectPlaceholder,
  conditionals: [
    {
      action: 'hide',
      expression: 'values.causeOfDeathEstablished !== "true"'
    }
  ],
  options: causeOfDeathReportedOptions,
  mapping: getFieldMapping(
    'causeOfDeathMethod',
    certificateHandlebars.causeOfDeathMethod
  )
}

export const getDeathDescription: SerializedFormField = {
  name: 'deathDescription',
  type: TEXTAREA,
  label: formMessageDescriptors.deathDescription,
  conditionals: [
    {
      action: 'hide',
      expression:
        'values.causeOfDeathEstablished !== "true" || values.causeOfDeathMethod !== "LAY_REPORTED" && values.causeOfDeathMethod !== "VERBAL_AUTOPSY"'
    }
  ],
  initialValue: '',
  validator: [],
  required: true,
  maxLength: 500,
  mapping: getFieldMapping(
    'deathDescription',
    certificateHandlebars.deathDescription
  )
}

export const getPlaceOfDeathFields = () =>
  [
    {
      name: 'placeOfDeath',
      type: 'SELECT_WITH_OPTIONS',
      previewGroup: 'placeOfDeath',
      ignoreFieldLabelOnErrorMessage: true,
      label: formMessageDescriptors.placeOfDeath,
      required: true,
      initialValue: '',
      validator: [],
      placeholder: formMessageDescriptors.formSelectPlaceholder,
      options: placeOfDeathOptions,
      mapping: getEventLocationSelectionMapping('placeOfDeath')
    },
    {
      name: 'deathLocation',
      type: 'LOCATION_SEARCH_INPUT',
      label: formMessageDescriptors.healthInstitution,
      previewGroup: 'placeOfDeath',
      required: true,
      initialValue: '',
      searchableResource: ['activeFacilities'],
      searchableType: ['HEALTH_FACILITY'],
      dynamicOptions: {
        resource: 'facilities'
      },
      validator: [
        {
          operation: 'facilityMustBeSelected'
        }
      ],
      conditionals: [
        {
          action: 'hide',
          expression: '(values.placeOfDeath!="HEALTH_FACILITY")'
        }
      ],
      mapping: getEventLocationSelectionMapping(
        'deathLocation',
        certificateHandlebars.placeOfDeath
      )
    }
  ] satisfies SerializedFormField[]
