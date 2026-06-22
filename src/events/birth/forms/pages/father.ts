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

import {
  AddressType,
  and,
  ConditionalType,
  defineFormPage,
  FieldType,
  never,
  field,
  user
} from '@opencrvs/toolkit/events'
import { or, not } from '@opencrvs/toolkit/conditionals'

import { InformantType } from './informant'

import {
  yesNoRadioOptions,
  YesNoTypes,
  emptyMessage,
  defaultStreetAddressConfiguration,
  getNestedFieldValidators,
  getIdentityFields
} from '@countryconfig/events/utils'
import { dobBeforeChildDobValidator } from '@countryconfig/events/birth/validators'

export const requireFatherDetails = or(
  field('father.detailsNotAvailable').isFalsy(),
  field('informant.relation').isEqualTo(InformantType.FATHER)
)

export const father = defineFormPage({
  id: 'father',
  title: {
    defaultMessage: "Father's details",
    description: 'Form section title for fathers details',
    id: 'form.section.father.title'
  },
  fields: [
    {
      id: 'father.detailsNotAvailable',
      type: FieldType.CHECKBOX,
      analytics: true,
      label: {
        defaultMessage: "Father's details unavailable",
        description: 'This is the label for the field',
        id: 'event.birth.action.declare.form.section.father.field.detailsNotAvailable.label'
      },
      conditionals: [
        {
          type: ConditionalType.SHOW,
          conditional: not(
            field('informant.relation').isEqualTo(InformantType.FATHER)
          )
        },
        {
          type: ConditionalType.DISPLAY_ON_REVIEW,
          conditional: field('father.detailsNotAvailable').isEqualTo(true)
        }
      ]
    },
    {
      id: 'father.details.divider',
      type: FieldType.DIVIDER,
      label: emptyMessage,
      conditionals: [
        {
          type: ConditionalType.SHOW,
          conditional: not(
            field('informant.relation').isEqualTo(InformantType.FATHER)
          )
        }
      ]
    },
    {
      id: 'father.reason',
      type: FieldType.TEXT,
      required: true,
      label: {
        defaultMessage: 'Reason',
        description: 'This is the label for the field',
        id: 'event.birth.action.declare.form.section.father.field.reason.label'
      },
      conditionals: [
        {
          type: ConditionalType.SHOW,
          conditional: and(
            field('father.detailsNotAvailable').isEqualTo(true),
            not(field('informant.relation').isEqualTo(InformantType.FATHER))
          )
        }
      ]
    },
    ...getIdentityFields({
      prefix: 'father',
      showConditional: requireFatherDetails,
      hideIdFieldsForHospitalClerk: true,
      uniqueNidAgainst: ['mother.nid', 'informant.nid'],
      dobValidation: [dobBeforeChildDobValidator('father')]
    }),
    {
      id: 'father.addressDivider',
      type: FieldType.DIVIDER,
      label: emptyMessage,
      conditionals: [
        {
          type: ConditionalType.SHOW,
          conditional: and(
            requireFatherDetails,
            not(user.hasRole('HOSPITAL_CLERK'))
          )
        }
      ]
    },
    {
      id: 'father.addressHelper',
      type: FieldType.HEADING,
      label: {
        defaultMessage: 'Place of residence',
        description: 'This is the label for the field',
        id: 'event.birth.action.declare.form.section.person.field.addressHelper.label'
      },
      configuration: {
        styles: { fontVariant: 'h3' }
      },
      conditionals: [
        {
          type: ConditionalType.DISPLAY_ON_REVIEW,
          conditional: never()
        },
        {
          type: ConditionalType.SHOW,
          conditional: and(
            requireFatherDetails,
            not(user.hasRole('HOSPITAL_CLERK'))
          )
        }
      ]
    },
    {
      id: 'father.addressSameAs',
      type: FieldType.RADIO_GROUP,
      options: yesNoRadioOptions,
      required: true,
      label: {
        defaultMessage: "Same as mother's address?",
        description: 'This is the label for the field',
        id: 'event.birth.action.declare.form.section.father.field.address.addressSameAs.label'
      },
      parent: field('mother.detailsNotAvailable'),
      // Keep default address when mother details is updated
      defaultValue: YesNoTypes.NO,
      conditionals: [
        {
          type: ConditionalType.SHOW,
          conditional: and(
            field('mother.detailsNotAvailable').isFalsy(),
            field('father.detailsNotAvailable').isFalsy(),
            not(user.hasRole('HOSPITAL_CLERK'))
          )
        },
        {
          type: ConditionalType.DISPLAY_ON_REVIEW,
          conditional: field('father.addressSameAs').isEqualTo(YesNoTypes.YES)
        }
      ]
    },
    {
      id: 'father.address',
      type: FieldType.ADDRESS,
      required: true,
      hideLabel: true,
      secured: true,
      label: {
        defaultMessage: 'Place of residence',
        description: 'This is the label for the field',
        id: 'event.birth.action.declare.form.section.person.field.address.label'
      },
      conditionals: [
        {
          type: ConditionalType.SHOW,
          conditional: and(
            requireFatherDetails,
            not(field('father.addressSameAs').isEqualTo(YesNoTypes.YES)),
            not(user.hasRole('HOSPITAL_CLERK'))
          )
        }
      ],
      validation: [
        {
          message: {
            defaultMessage: 'Invalid input',
            description: 'Error message when generic field is invalid',
            id: 'error.invalidInput'
          },
          validator: field('father.address').isValidAdministrativeLeafLevel()
        },
        ...getNestedFieldValidators(
          'father.address',
          defaultStreetAddressConfiguration
        )
      ],
      defaultValue: {
        country: 'FAR',
        addressType: AddressType.DOMESTIC,
        administrativeArea: user('administrativeAreaId')
      },
      configuration: {
        streetAddressForm: defaultStreetAddressConfiguration
      }
    }
  ]
})
