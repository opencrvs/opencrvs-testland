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
  and,
  ConditionalType,
  field,
  FieldConfigInput,
  FieldReference,
  FieldType,
  or,
  SelectOption,
  TranslationConfig,
  user,
  ValidationConfig
} from '@opencrvs/toolkit/events'
import { createSelectOptions } from '../utils'
import { connectToMOSIPIdReader, getMOSIPIntegrationFields } from '../mosip'
import {
  farajalandNameConfig,
  nationalIdValidator,
  passportValidator
} from '../birth/validators'
import { not } from '@opencrvs/toolkit/conditionals'

export const IdType = {
  NATIONAL_ID: 'NATIONAL_ID',
  PASSPORT: 'PASSPORT',
  NONE: 'NONE'
} as const

const idTypeMessageDescriptors = {
  NATIONAL_ID: {
    defaultMessage: 'National ID',
    description: 'Option for form field: Form of ID',
    id: 'form.field.label.iDTypeNationalID'
  },
  PASSPORT: {
    defaultMessage: 'Passport',
    description: 'Option for form field: Form of ID',
    id: 'form.field.label.iDTypePassport'
  },
  NONE: {
    defaultMessage: 'No ID',
    description: 'Option for form field: Form of ID',
    id: 'form.field.label.iDTypeNone'
  }
} satisfies Record<keyof typeof IdType, TranslationConfig>

export const idTypeOptions = createSelectOptions(
  IdType,
  idTypeMessageDescriptors
)

export const getIdTypeOptions = (prefix: string) =>
  [
    {
      value: IdType.NATIONAL_ID,
      label: idTypeMessageDescriptors.NATIONAL_ID,
      conditionals: [
        {
          type: ConditionalType.SHOW,
          conditional: field(`${prefix}.nationality`).isEqualTo('FAR')
        }
      ]
    },
    {
      value: IdType.PASSPORT,
      label: idTypeMessageDescriptors.PASSPORT
    },
    {
      value: IdType.NONE,
      label: idTypeMessageDescriptors.NONE
    }
  ] satisfies SelectOption[]

// @TODO: Consider whether these can become boolean fields
export const YesNoTypes = {
  YES: 'YES',
  NO: 'NO'
} as const

const yesNoMessageDescriptors = {
  YES: {
    defaultMessage: 'Yes',
    id: 'form.field.label.Yes',
    description: 'Label for form field radio option Yes'
  },
  NO: {
    defaultMessage: 'No',
    id: 'form.field.label.No',
    description: 'Label for form field radio option No'
  }
} satisfies Record<keyof typeof YesNoTypes, TranslationConfig>

export const yesNoRadioOptions = createSelectOptions(
  YesNoTypes,
  yesNoMessageDescriptors
)

export const getIdentityFields = ({
  prefix,
  showConditional,
  parent,
  uniqueNidAgainst = [],
  dobValidation = [],
  hideIdFieldsForHospitalClerk = false
}: {
  prefix: string
  showConditional: any
  parent?: FieldReference
  uniqueNidAgainst?: string[]
  dobValidation?: ValidationConfig[]
  hideIdFieldsForHospitalClerk?: boolean
}): FieldConfigInput[] => {
  // Show conditional for the ID-specific fields. Name and date of birth keep
  // using `showConditional` so they stay visible for hospital clerks.
  const idFieldsShowConditional = hideIdFieldsForHospitalClerk
    ? and(showConditional, not(user.hasRole('HOSPITAL_CLERK')))
    : showConditional

  const conditionals = [
    {
      type: ConditionalType.SHOW,
      conditional: showConditional
    }
  ]

  return [
    connectToMOSIPIdReader(
      {
        id: `${prefix}.nationality`,
        type: FieldType.COUNTRY,
        required: true,
        label: {
          defaultMessage: 'Nationality',
          description: 'This is the label for the field',
          id: 'event.death.action.declare.form.section.informant.field.nationality.label'
        },
        conditionals: [
          {
            type: ConditionalType.SHOW,
            conditional: idFieldsShowConditional
          }
        ],
        defaultValue: 'FAR',
        parent
      },
      {
        valuePath: 'data.nationality',
        disableIf: ['authenticated']
      }
    ),
    {
      id: `${prefix}.idType`,
      type: FieldType.SELECT,
      required: true,
      label: {
        defaultMessage: 'Form of ID',
        description: 'This is the label for the field',
        id: 'event.death.action.declare.form.section.informant.field.idType.label'
      },
      options: getIdTypeOptions(prefix),
      conditionals: [
        {
          type: ConditionalType.SHOW,
          conditional: idFieldsShowConditional
        },
        {
          type: ConditionalType.ENABLE,
          conditional: and(
            not(field(`${prefix}.verified`).isEqualTo('verified')),
            not(field(`${prefix}.verified`).isEqualTo('authenticated')),
            not(field(`${prefix}.verified`).isEqualTo('pending'))
          )
        }
      ],
      parent: [
        ...(Array.isArray(parent) ? parent : parent ? [parent] : []),
        field(`${prefix}.nationality`)
      ]
    },
    // fields:
    // ${prefix}.verified, ${prefix}.query-params, ${prefix}.verify-nid-http-fetch,
    // ${prefix}.fetch-loader, ${prefix}.id-reader
    ...getMOSIPIntegrationFields(prefix, {
      resetParent: parent,
      existingConditionals: {
        status: [
          {
            type: ConditionalType.SHOW,
            conditional: and(
              idFieldsShowConditional,
              field(`${prefix}.nationality`).isEqualTo('FAR'),
              or(
                field(`${prefix}.idType`).isEqualTo(IdType.NATIONAL_ID),
                field(`${prefix}.idType`).isEqualTo(IdType.PASSPORT)
              )
            )
          }
        ],
        idReader: [
          {
            type: ConditionalType.SHOW,
            conditional: and(
              idFieldsShowConditional,
              field(`${prefix}.nationality`).isEqualTo('FAR'),
              field(`${prefix}.idType`).isEqualTo(IdType.NATIONAL_ID)
            )
          }
        ]
      }
    }),
    connectToMOSIPIdReader(
      {
        id: `${prefix}.nid`,
        type: FieldType.ID,
        required: true,
        label: {
          defaultMessage: 'National ID no.',
          description: 'This is the label for the field',
          id: 'event.birth.action.declare.form.section.person.field.nid.label'
        },
        conditionals: [
          {
            type: ConditionalType.SHOW,
            conditional: and(
              field(`${prefix}.idType`).isEqualTo(IdType.NATIONAL_ID),
              field(`${prefix}.nationality`).isEqualTo('FAR'),
              idFieldsShowConditional
            )
          }
        ],
        validation: [
          nationalIdValidator(`${prefix}.nid`),
          ...(uniqueNidAgainst.length > 0
            ? [
                {
                  message: {
                    defaultMessage: 'National id must be unique',
                    description:
                      'This is the error message for non-unique ID Number',
                    id: 'event.death.action.declare.form.nid.unique'
                  },
                  validator: and(
                    ...uniqueNidAgainst.map((otherId) =>
                      not(field(`${prefix}.nid`).isEqualTo(field(otherId)))
                    )
                  )
                }
              ]
            : [])
        ],
        parent
      },
      {
        valuePath: 'data.nid',
        hideIf: ['authenticated'],
        disableIf: ['pending', 'verified']
      }
    ),
    connectToMOSIPIdReader(
      {
        id: `${prefix}.passport`,
        type: FieldType.TEXT,
        required: true,
        label: {
          defaultMessage: 'Passport No',
          description: 'This is the label for the field',
          id: 'event.birth.action.declare.form.section.person.field.passport.label'
        },
        conditionals: [
          {
            type: ConditionalType.SHOW,
            conditional: and(
              field(`${prefix}.idType`).isEqualTo(IdType.PASSPORT),
              showConditional
            )
          }
        ],
        validation: [passportValidator(`${prefix}.passport`)],
        parent
      },
      {
        valuePath: 'data.passport',
        hideIf: ['authenticated'],
        disableIf: ['pending', 'verified']
      }
    ),
    connectToMOSIPIdReader(
      {
        id: `${prefix}.name`,
        configuration: farajalandNameConfig,
        type: FieldType.NAME,
        required: true,
        hideLabel: true,
        label: {
          defaultMessage: 'Full name',
          description: 'This is the label for the field',
          id: `event.birth.action.declare.form.section.${prefix}.field.name.label`
        },
        conditionals,
        parent
      },
      {
        valuePath: 'data.name',
        disableIf: ['pending', 'verified', 'authenticated']
      }
    ),
    connectToMOSIPIdReader(
      {
        id: `${prefix}.dob`,
        type: FieldType.DATE,
        required: true,
        analytics: true,
        validation: [
          ...dobValidation,
          {
            message: {
              defaultMessage: 'Must be a valid Birthdate',
              description: 'This is the error message for invalid date',
              id: 'event.death.action.declare.form.section.informant.field.dob.error'
            },
            validator: field(`${prefix}.dob`).isBefore().now()
          }
        ],
        label: {
          defaultMessage: 'Date of birth',
          description: 'This is the label for the field',
          id: 'event.death.action.declare.form.section.informant.field.dob.label'
        },
        conditionals,
        parent
      },
      {
        valuePath: 'data.birthDate',
        disableIf: ['pending', 'verified', 'authenticated']
      }
    )
  ]
}
