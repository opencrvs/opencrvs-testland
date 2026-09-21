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

import { formMessageDescriptors } from './messages'
import { SerializedFormField, Conditional, Event } from '../types/types'
import { genderOptions } from './select-options'
import { getFieldMapping } from '@countryconfig/utils/mapping/field-mapping-utils'
import { Validator } from '../types/validators'
import { MessageDescriptor } from 'react-intl'

export const getBirthDate = (
  fieldName: string,
  conditionals: Conditional[],
  validator: any[],
  certificateHandlebar: string,
  initialValue: string | { dependsOn: string[]; expression: string } = ''
): SerializedFormField => ({
  name: fieldName, // A field with this name MUST exist
  type: 'DATE',
  label: formMessageDescriptors.dateOfBirth,
  required: true,
  conditionals,
  initialValue,
  validator,
  mapping: getFieldMapping('birthDate', certificateHandlebar)
})

export const getGender = (
  certificateHandlebar: string,
  initialValue: string | { dependsOn: string[]; expression: string } = '',
  conditionals: Conditional[] = []
) =>
  ({
    name: 'gender', // A field with this name MUST exist
    type: 'SELECT_WITH_OPTIONS',
    label: formMessageDescriptors.sex,
    required: true,
    initialValue,
    validator: [],
    placeholder: formMessageDescriptors.formSelectPlaceholder,
    mapping: getFieldMapping('gender', certificateHandlebar),
    options: genderOptions,
    conditionals
  }) satisfies SerializedFormField

export const getFamilyNameField = (
  previewGroup: string,
  conditionals: Conditional[],
  certificateHandlebar: string,
  initialValue: string | { dependsOn: string[]; expression: string } = ''
) =>
  ({
    name: 'familyNameEng', // A field with this name MUST exist
    previewGroup,
    conditionals,
    type: 'TEXT',
    label: formMessageDescriptors.familyName,
    maxLength: 32,
    required: true,
    initialValue,
    validator: [
      {
        operation: 'englishOnlyNameFormat'
      }
    ],
    mapping: getFieldMapping('familyName', certificateHandlebar)
  }) satisfies SerializedFormField

export const getMiddleNameField = (
  previewGroup: string,
  conditionals: Conditional[],
  certificateHandlebar: string
) =>
  ({
    name: 'middleNameEng',
    previewGroup,
    type: 'TEXT',
    label: formMessageDescriptors.middleName,
    conditionals,
    maxLength: 32,
    required: false,
    initialValue: '',
    validator: [
      {
        operation: 'englishOnlyNameFormat'
      }
    ],
    mapping: getFieldMapping('middleName', certificateHandlebar)
  }) satisfies SerializedFormField

export const getFirstNameField = (
  previewGroup: string,
  conditionals: Conditional[],
  certificateHandlebar: string,
  initialValue: string | { dependsOn: string[]; expression: string } = ''
) =>
  ({
    name: 'firstNamesEng', // A field with this name MUST exist
    previewGroup,
    type: 'TEXT',
    label: {
      defaultMessage: 'First name(s)',
      description: 'Label for form field: First names',
      id: 'form.field.label.firstNames'
    },
    conditionals,
    maxLength: 32,
    required: true,
    initialValue,
    validator: [
      {
        operation: 'englishOnlyNameFormat'
      }
    ],
    mapping: getFieldMapping('firstNames', certificateHandlebar)
  }) satisfies SerializedFormField

export const getNationality = (
  certificateHandlebar: string,
  conditionals: Conditional[]
) =>
  ({
    name: 'nationality',
    type: 'SELECT_WITH_OPTIONS',
    label: formMessageDescriptors.nationality,
    required: true,
    initialValue: 'FAR',
    validator: [],
    placeholder: formMessageDescriptors.formSelectPlaceholder,
    options: {
      resource: 'countries'
    },
    conditionals,
    mapping: getFieldMapping('nationality', certificateHandlebar)
  }) satisfies SerializedFormField

export const otherInformantType = (event: Event) =>
  ({
    name: 'otherInformantType',
    type: 'TEXT',
    label:
      event == Event.Birth
        ? formMessageDescriptors.informantsRelationWithChild
        : event == Event.Death
          ? formMessageDescriptors.relationshipToDeceased
          : formMessageDescriptors.relationshipToSpouses,
    placeholder: formMessageDescriptors.relationshipPlaceHolder,
    required: true,
    initialValue: '',
    validator: [
      {
        operation: 'englishOnlyNameFormat'
      }
    ],
    conditionals: [
      {
        action: 'hide',
        expression: 'values.informantType !== "OTHER"'
      }
    ],
    mapping: getFieldMapping('otherInformantType')
  }) satisfies SerializedFormField

export const getNationalID = (
  fieldName: string,
  conditionals: Conditional[],
  validator: Validator[],
  certificateHandlebar: string
) =>
  ({
    name: fieldName,
    type: 'TEXT',
    label: formMessageDescriptors.iDTypeNationalID,
    required: true,
    initialValue: '',
    validator,
    conditionals,
    mapping: getFieldMapping('nationalId', certificateHandlebar)
  }) satisfies SerializedFormField

export const getDetailsExist = (
  label: MessageDescriptor,
  conditionals: Conditional[]
) =>
  ({
    name: 'detailsExist',
    type: 'CHECKBOX',
    label,
    required: true,
    checkedValue: false,
    uncheckedValue: true,
    hideHeader: true,
    initialValue: true,
    validator: [],
    conditionals,
    mapping: getFieldMapping('detailsExist'),
    ignoreBottomMargin: true
  }) satisfies SerializedFormField

export const getReasonNotExisting = (certificateHandlebar: string) =>
  ({
    name: 'reasonNotApplying',
    conditionals: [
      {
        action: 'hide',
        expression: 'values.detailsExist'
      }
    ],
    type: 'TEXT',
    label: formMessageDescriptors.reasonNA,
    validator: [],
    initialValue: '',
    required: true,
    mapping: getFieldMapping('reasonNotApplying', certificateHandlebar)
  }) satisfies SerializedFormField
