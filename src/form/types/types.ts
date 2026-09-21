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
import * as labels from '../common/messages'
import { Validator } from './validators'

// TODO: only list out supported mappings in core include custom form field mappings
// replace string with the names of all the functions.

export interface Conditionals {
  isDefaultCountry: Conditional
  causeOfDeathEstablished: Conditional
}
export interface ValidationResult {
  message: MessageDescriptor
  props?: { [key: string]: any }
}

export type RangeValidation = (
  min: number,
  max: number
) => (value: IFormFieldValue) => ValidationResult | undefined

export type MaxLengthValidation = (
  customisation: number
) => (value: IFormFieldValue) => ValidationResult | undefined

export type Validation = (
  value: IFormFieldValue,
  drafts?: IFormData,
  offlineCountryConfig?: any
) => ValidationResult | undefined

export enum Event {
  Birth = 'birth',
  Death = 'death',
  Marriage = 'marriage',

  TENNIS_CLUB_MEMBERSHIP = 'tennis-club-membership'
}

export type ValidationInitializer = (...value: any[]) => Validation

type IIgnoreFields = {
  fieldsToIgnoreForLocalAddress: string[]
  fieldsToIgnoreForInternationalAddress: string[]
}

export type IHandlebarTemplates = {
  fieldName: string
  operation: string
  parameters?: (string | (string | number) | number | string[])[]
}

type ISubMapper = {
  operation: string
  parameters?: (string | number)[]
}

type IAddressLineMapper = {
  transformedFieldName?: string
  useCase?: string
  lineNumber?: number
  isLowestAdministrativeLevel?: boolean
}

export type IQueryMapper = {
  operation: string
  parameters?: (
    | string
    | number
    | (string | number | IIgnoreFields)
    | ISubMapper
    | string[]
    | IAddressLineMapper
  )[]
}

export type IMutationMapper = {
  operation: string
  parameters?: (
    | string
    | number
    | (string | number)
    | ISubMapper
    | IAddressLineMapper
    | string[]
  )[]
}

export type ISectionMapping = {
  mutation?: IMutationMapper
  query?: IQueryMapper
  template?: IHandlebarTemplates[]
}

export type IFormFieldMapping = {
  mutation?: IMutationMapper
  query?: IQueryMapper
  template?: IHandlebarTemplates
}

// end TODO

export type ViewType = 'form' | 'preview' | 'review' | 'hidden'
export const TEXT = 'TEXT'
export const TEL = 'TEL'
export const NUMBER = 'NUMBER'
export const BIG_NUMBER = 'BIG_NUMBER'
export const RADIO_GROUP = 'RADIO_GROUP'
export const INFORMATIVE_RADIO_GROUP = 'INFORMATIVE_RADIO_GROUP'
export const CHECKBOX_GROUP = 'CHECKBOX_GROUP'
export const CHECKBOX = 'CHECKBOX'
export const DATE = 'DATE'
export const DATE_RANGE_PICKER = 'DATE_RANGE_PICKER'
export const TEXTAREA = 'TEXTAREA'
export const SUBSECTION_HEADER = 'SUBSECTION_HEADER'
export const FIELD_GROUP_TITLE = 'FIELD_GROUP_TITLE'
export const BULLET_LIST = 'BULLET_LIST'
export const PARAGRAPH = 'PARAGRAPH'
export const DOCUMENTS = 'DOCUMENTS'
export const SELECT_WITH_OPTIONS = 'SELECT_WITH_OPTIONS'
export const SELECT_WITH_DYNAMIC_OPTIONS = 'SELECT_WITH_DYNAMIC_OPTIONS'
export const FIELD_WITH_DYNAMIC_DEFINITIONS = 'FIELD_WITH_DYNAMIC_DEFINITIONS'
export const IMAGE_UPLOADER_WITH_OPTIONS = 'IMAGE_UPLOADER_WITH_OPTIONS'
export const DOCUMENT_UPLOADER_WITH_OPTION = 'DOCUMENT_UPLOADER_WITH_OPTION'
export const SIMPLE_DOCUMENT_UPLOADER = 'SIMPLE_DOCUMENT_UPLOADER'
export const WARNING = 'WARNING'
export const LINK = 'LINK'
export const DYNAMIC_LIST = 'DYNAMIC_LIST'
export const FETCH_BUTTON = 'FETCH_BUTTON'
export const LOCATION_SEARCH_INPUT = 'LOCATION_SEARCH_INPUT'
export const TIME = 'TIME'
export const NID_VERIFICATION_BUTTON = 'NID_VERIFICATION_BUTTON'
export const DIVIDER = 'DIVIDER'
export const HEADING3 = 'HEADING3'
export const SIGNATURE = 'SIGNATURE'
export const HTTP = 'HTTP'
export const BUTTON = 'BUTTON'
export const LINK_BUTTON = 'LINK_BUTTON'
export const ID_READER = 'ID_READER'
export const ID_VERIFICATION_BANNER = 'ID_VERIFICATION_BANNER'
export const LOADER = 'LOADER'

export enum RadioSize {
  LARGE = 'large',
  NORMAL = 'normal'
}

export enum REVIEW_OVERRIDE_POSITION {
  BEFORE = 'before',
  AFTER = 'after'
}

export enum IntegratingSystemType {
  Mosip = 'MOSIP',
  Osia = 'OSIA',
  Other = 'OTHER'
}

export interface IPreviewGroup {
  id: string
  label: MessageDescriptor
  fieldToRedirect?: string
  delimiter?: string
  required?: boolean
  initialValue?: string
}

type UnionKeys<T> = T extends any ? keyof T : never
type UnionPick<T, K extends any> = T extends any
  ? Pick<T, Extract<K, keyof T>>
  : never
type UnionOmit<T, K extends UnionKeys<T>> = UnionPick<
  T,
  Exclude<UnionKeys<T>, K>
>
interface Operation<
  OperationMap,
  Key extends keyof OperationMap = keyof OperationMap
> {
  operation: Key
}
type Params<Fn> = Fn extends (...args: infer A) => void ? A : never
type FilterType<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never
}

export interface CheckboxComponentOption {
  label: string
  value: string
}

export interface ICheckboxOption {
  value: CheckboxComponentOption['value']
  label: MessageDescriptor
}

export interface RadioComponentOption {
  label: string
  value: string | boolean
  conditionals?: Conditionals[]
  disabled?: boolean
}

export interface IRadioOption {
  value: RadioComponentOption['value']
  label: MessageDescriptor
  conditionals?: RadioComponentOption['conditionals']
}

export type IDynamicValueMapper = (key: string) => string

export type IDynamicFieldTypeMapper = (key: string) => string
export interface IFieldInput {
  name: string
  valueField: string
  type?: string
}

export interface IDynamicValues {
  [key: string]: any
}

export interface IRadioGroupFormField extends IFormFieldBase {
  type: typeof RADIO_GROUP
  options: IRadioOption[]
  size?: RadioSize
  notice?: MessageDescriptor
  flexDirection?: FLEX_DIRECTION
}

export type IDynamicFormFieldLabelMapper = (
  key: string
) => MessageDescriptor | undefined

export type IDynamicFormFieldHelperTextMapper = (
  key: string
) => MessageDescriptor | undefined

export type IDynamicFormFieldToolTipMapper = (
  key: string
) => MessageDescriptor | undefined

export type IDynamicFormFieldUnitMapper = (
  key: string
) => MessageDescriptor | undefined

export interface ISelectFormFieldWithOptions extends IFormFieldBase {
  type: typeof SELECT_WITH_OPTIONS
  options: ISelectOption[]
  optionCondition?: string
}
export interface ISelectFormFieldWithDynamicOptions extends IFormFieldBase {
  type: typeof SELECT_WITH_DYNAMIC_OPTIONS
  dynamicOptions: IDynamicOptions
}

export interface IDynamicFieldLabel {
  dependency: string
  labelMapper: IDynamicFormFieldLabelMapper
}

export interface IDynamicFieldHelperText {
  dependency: string
  helperTextMapper: IDynamicFormFieldHelperTextMapper
}

export interface IDynamicFieldTooltip {
  dependency: string
  tooltipMapper: IDynamicFormFieldToolTipMapper
}

export interface IDynamicFieldUnit {
  dependency: string
  unitMapper: IDynamicFormFieldUnitMapper
}

export interface IDynamicFieldType {
  kind: 'dynamic'
  dependency: string
  typeMapper: IDynamicFieldTypeMapper
}

export interface IDynamicFormFieldValidators {
  validator: ValidationInitializer
  dependencies: string[]
}

export interface IDynamicFormFieldDefinitions {
  label?: IDynamicFieldLabel
  helperText?: IDynamicFieldHelperText
  tooltip?: IDynamicFieldTooltip
  unit?: IDynamicFieldUnit
  type?: IDynamicFieldType | IStaticFieldType
  validator?: IDynamicFormFieldValidators[]
}

export interface IFormFieldWithDynamicDefinitions extends IFormFieldBase {
  type: typeof FIELD_WITH_DYNAMIC_DEFINITIONS
  dynamicDefinitions: IDynamicFormFieldDefinitions
}

export type INestedInputFields = {
  [key: string]: IFormField[]
}

export enum FLEX_DIRECTION {
  ROW = 'row',
  ROW_REVERSE = 'row-reverse',
  COLUMN = 'column',
  COLUMN_REVERSE = 'column-reverse',
  INITIAL = 'initial',
  INHERIT = 'inherit'
}

export interface IRadioGroupFormField extends IFormFieldBase {
  type: typeof RADIO_GROUP
  options: IRadioOption[]
  size?: RadioSize
  notice?: MessageDescriptor
  flexDirection?: FLEX_DIRECTION
}

export interface IInformativeRadioGroupFormField extends IFormFieldBase {
  type: typeof INFORMATIVE_RADIO_GROUP
  information: IFormSectionData
  dynamicInformationRetriever?: (obj: any) => IFormSectionData
  options: IRadioOption[]
}

export interface ITextFormField extends IFormFieldBase {
  type: typeof TEXT
  maxLength?: number
  dependency?: string
}

export interface ITelFormField extends IFormFieldBase {
  type: typeof TEL
  isSmallSized?: boolean
}
export interface INumberFormField extends IFormFieldBase {
  type: typeof NUMBER
  step?: number
  max?: number
  inputWidth?: number
  maxLength?: number
}
export interface IBigNumberFormField extends IFormFieldBase {
  type: typeof BIG_NUMBER
  step?: number
}
export interface ICheckboxGroupFormField extends IFormFieldBase {
  type: typeof CHECKBOX_GROUP
  options: ICheckboxOption[]
}
export interface ICheckboxFormField extends IFormFieldBase {
  type: typeof CHECKBOX
  checkedValue?: 'true' | 'false' | boolean
  uncheckedValue?: 'true' | 'false' | boolean
}
export interface IDateFormField extends IFormFieldBase {
  type: typeof DATE
  notice?: MessageDescriptor
  ignorePlaceHolder?: boolean
}
export interface IDateRangePickerFormField extends IFormFieldBase {
  type: typeof DATE_RANGE_PICKER
  notice?: MessageDescriptor
  ignorePlaceHolder?: boolean
}

export interface ITextareaFormField extends IFormFieldBase {
  type: typeof TEXTAREA
  maxLength?: number
}
export interface ISubsectionFormField extends IFormFieldBase {
  type: typeof SUBSECTION_HEADER
}
export interface IFieldGroupTitleField extends IFormFieldBase {
  type: typeof FIELD_GROUP_TITLE
}
export interface IDocumentsFormField extends IFormFieldBase {
  type: typeof DOCUMENTS
}
export interface IListFormField extends IFormFieldBase {
  type: typeof BULLET_LIST
  items: MessageDescriptor[]
}

export interface IDynamicItems {
  dependency: string
  valueMapper: IDynamicValueMapper
  items: { [key: string]: MessageDescriptor[] }
}

export interface IDynamicListFormField extends IFormFieldBase {
  type: typeof DYNAMIC_LIST
  dynamicItems: IDynamicItems
}
export interface IParagraphFormField extends IFormFieldBase {
  type: typeof PARAGRAPH
  fontVariant?: string
}
export interface IImageUploaderWithOptionsFormField extends IFormFieldBase {
  type: typeof IMAGE_UPLOADER_WITH_OPTIONS
  optionSection: IFormSection
}
export interface IDocumentUploaderWithOptionsFormField extends IFormFieldBase {
  type: typeof DOCUMENT_UPLOADER_WITH_OPTION
  options: ISelectOption[]
  optionCondition?: string
  hideOnEmptyOption?: boolean
  compressImagesToSizeMB?: number
  maxSizeMB?: number
}
export interface ISimpleDocumentUploaderFormField extends IFormFieldBase {
  type: typeof SIMPLE_DOCUMENT_UPLOADER
  allowedDocType?: string[]
}

export interface IDispatchOptions {
  action: string
  payloadKey: string
}
export interface ISearchLocation {
  id: string
  searchableText: string
  displayLabel: string
}
export interface ILocationSearchInputFormField extends IFormFieldBase {
  type: typeof LOCATION_SEARCH_INPUT
  searchableResource: Array<any>
  locationList?: ISearchLocation[]
  searchableType: string[]
  dispatchOptions?: IDispatchOptions
  dynamicOptions?: IDynamicOptions
}

export interface IWarningField extends IFormFieldBase {
  type: typeof WARNING
}

export interface ILink extends IFormFieldBase {
  type: typeof LINK
}

export interface IQueryMap {
  [key: string]: IQuery
}

export interface ILoaderButton extends IFormFieldBase {
  type: typeof FETCH_BUTTON
  queryMap: IQueryMap
  queryData?: IQuery
  querySelectorInput: IFieldInput
  onFetch?: (response: any) => void
  modalTitle: MessageDescriptor
  successTitle: MessageDescriptor
  errorTitle: MessageDescriptor
}

export interface ITimeFormFIeld extends IFormFieldBase {
  type: typeof TIME
  ignorePlaceHolder?: boolean
  use12HourFormat?: boolean
}

export interface INidVerificationButton extends IFormFieldBase {
  type: typeof NID_VERIFICATION_BUTTON
  labelForVerified: MessageDescriptor
  labelForUnverified: MessageDescriptor
  labelForOffline: MessageDescriptor
}

export interface IDividerField extends IFormFieldBase {
  type: typeof DIVIDER
}

export interface IHeading3Field extends IFormFieldBase {
  type: typeof HEADING3
}

export interface ISignatureFormField extends IFormFieldBase {
  type: typeof SIGNATURE
  maxSizeMb?: number
  allowedFileFormats?: (
    | 'image/png'
    | 'image/jpg'
    | 'image/jpeg'
    | 'image/svg'
  )[]
}

export interface IHttpFormField extends IFormFieldBase {
  type: typeof HTTP
  options: {
    headers: Record<string, string>
    body?: Record<string, unknown>
    params?: Record<string, string>
  } & Omit<Request, 'body' | 'headers'>
}
export interface IButtonFormField extends IFormFieldBase {
  type: typeof BUTTON
  icon?: string // Valid icon names from the Icon component
  buttonLabel: MessageDescriptor
  loadingLabel?: MessageDescriptor
  options: {
    trigger: string
    shouldHandleLoadingState?: boolean
  }
}

export interface ILinkButtonFormField extends IFormFieldBase {
  type: typeof LINK_BUTTON
  icon?: {
    desktop: string // Valid icon names from the Icon component
    mobile: string // Valid icon names from the Icon component
  }
  options: {
    url: string
    callback: {
      trigger: string
      /**
       * If the redirection url has the exact same param keys
       * with exact same values sepecified in the below `params`
       * field, only then the callback will be triggered
       */
      params: Record<string, string>
    }
  }
}

export interface QRReaderType {
  type: 'QR'
  validation: {
    rule: unknown
    errorMessage: MessageDescriptor
  }
}

export type ReaderType = QRReaderType | ILinkButtonFormField
export interface IDReaderFormField extends IFormFieldBase {
  type: typeof ID_READER
  dividerLabel: MessageDescriptor
  manualInputInstructionLabel: MessageDescriptor
  readers: [ReaderType, ...ReaderType[]]
}

export type BannerType =
  | 'authenticated'
  | 'verified'
  | 'failed'
  | 'failedFetchIdDetails'
interface IIDVerificationBannerFormField extends IFormFieldBase {
  type: typeof ID_VERIFICATION_BANNER
  bannerType: BannerType
  idFieldName: string
}

export interface ILoaderFormField extends IFormFieldBase {
  type: typeof LOADER
  loadingText: MessageDescriptor
}

export type IFormField =
  | ITextFormField
  | ITelFormField
  | INumberFormField
  | IBigNumberFormField
  | ISelectFormFieldWithOptions
  | ISelectFormFieldWithDynamicOptions
  | IFormFieldWithDynamicDefinitions
  | IRadioGroupFormField
  | IInformativeRadioGroupFormField
  | ICheckboxGroupFormField
  | ICheckboxFormField
  | IDateFormField
  | ITextareaFormField
  | ISubsectionFormField
  | IFieldGroupTitleField
  | IDocumentsFormField
  | IListFormField
  | IParagraphFormField
  | IImageUploaderWithOptionsFormField
  | IDocumentUploaderWithOptionsFormField
  | IWarningField
  | ILink
  | IDynamicListFormField
  | ILoaderButton
  | ISimpleDocumentUploaderFormField
  | ILocationSearchInputFormField
  | IDateRangePickerFormField
  | ITimeFormFIeld
  | INidVerificationButton
  | IDividerField
  | IHeading3Field
  | ISignatureFormField
  | IHttpFormField
  | IButtonFormField
  | ILinkButtonFormField
  | IDReaderFormField
  | IIDVerificationBannerFormField
  | ILoaderFormField

export interface SelectComponentOption {
  value: string
  label: string
  disabled?: boolean
}
export interface ISelectOption {
  value: SelectComponentOption['value']
  label: MessageDescriptor
}
export interface IDynamicOptions {
  dependency?: string
  jurisdictionType?: string
  resource?: string
  options?: { [key: string]: ISelectOption[] }
}

export type IFormFieldTemplateMapOperation =
  | [string, IFormFieldQueryMapFunction]
  | [string]

export interface IFormFieldBase {
  name: string
  type: IFormField['type']
  label: MessageDescriptor
  helperText?: MessageDescriptor
  tooltip?: MessageDescriptor
  validator: Validator[]
  required?: boolean
  // Whether or not to run validation functions on the field if it's empty
  // Default false
  validateEmpty?: boolean
  prefix?: string
  postfix?: string
  unit?: MessageDescriptor
  disabled?: boolean
  enabled?: string
  custom?: boolean
  initialValue?: InitialValue
  initialValueKey?: string
  extraValue?: IFormFieldValue
  conditionals?: Conditional[]
  description?: MessageDescriptor
  placeholder?: MessageDescriptor
  mapping?: IFormFieldMapping
  hideAsterisk?: boolean
  hideHeader?: boolean
  hidden?: boolean
  previewGroup?: string
  nestedFields?: { [key: string]: IFormField[] }
  hideValueInPreview?: boolean
  // This flag will only remove the change link from preview/review screen
  // Default false
  readonly?: boolean
  hideInPreview?: boolean
  ignoreNestedFieldWrappingInPreview?: boolean
  reviewOverrides?: {
    residingSection: string
    reference: {
      sectionID: string
      groupID: string
      fieldName: string
    }
    position?: REVIEW_OVERRIDE_POSITION
    labelAs?: MessageDescriptor
    conditionals?: Conditional[]
  }
  ignoreFieldLabelOnErrorMessage?: boolean
  ignoreBottomMargin?: boolean
  customQuestionMappingId?: string
}

export interface Conditional {
  description?: string
  /** 'hide' or 'disable' */
  action: string
  expression: string
}

export interface IFormSectionGroup {
  id: string
  title?: MessageDescriptor
  fields: IFormField[]
  previewGroups?: IPreviewGroup[]
  disabled?: boolean
  ignoreSingleFieldView?: boolean
  conditionals?: Conditional[]
  error?: MessageDescriptor
  preventContinueIfError?: boolean
}

export type IFormFieldMutationMapFunction = (
  transFormedData: TransformedData,
  draftData: IFormData,
  sectionId: string,
  fieldDefinition: IFormField,
  nestedFieldDefinition?: IFormField
) => void

export type IFormFieldQueryMapFunction = (
  transFormedData: IFormData,
  queryData: any,
  sectionId: string,
  fieldDefinition: IFormField,
  nestedFieldDefinition?: IFormField,
  offlineData?: any
) => void
/*
 * Takes in an array of function arguments (array, number, string, function)
 * and replaces all functions with the descriptor type
 *
 * So type Array<number | Function | string> would become
 * Array<number | Descriptor | string>
 */
type FunctionParamsToDescriptor<T, Descriptor> =
  // It's an array - recursively call this type for all items
  T extends Array<any>
    ? { [K in keyof T]: FunctionParamsToDescriptor<T[K], Descriptor> }
    : T extends IFormFieldQueryMapFunction | IFormFieldMutationMapFunction // It's a query transformation function - return a query transformation descriptor
      ? Descriptor
      : T // It's a none of the above - return self

export interface IStaticFieldType {
  kind: 'static'
  staticType: string
}

export interface ISerializedDynamicFormFieldDefinitions {
  label?: {
    dependency: string
    labelMapper: Operation<typeof labels>
  }
  helperText?: {
    dependency: string
    helperTextMapper: Operation<typeof labels>
  }
  tooltip?: {
    dependency: string
    tooltipMapper: Operation<typeof labels>
  }
  unit?: {
    dependency: string
    unitMapper: Operation<typeof labels>
  }
  type?:
    | IStaticFieldType
    | {
        kind: 'dynamic'
        dependency: string
        typeMapper: Operation<IDynamicFieldTypeMapper>
      }
  validator?: Array<{
    dependencies: string[]
    validator: Validator[]
  }>
}

type SerializedFormFieldWithDynamicDefinitions = UnionOmit<
  IFormFieldWithDynamicDefinitions,
  'dynamicDefinitions'
> & {
  dynamicDefinitions: ISerializedDynamicFormFieldDefinitions
}

type SerializedSelectFormFieldWithOptions = Omit<
  ISelectFormFieldWithOptions,
  'options'
> & {
  options: ISelectOption[] | { resource: string }
  optionCondition?: string
}

export interface IQuery {
  query: any
  inputs: IFieldInput[]
  variables?: IDynamicValues
  modalInfoText: MessageDescriptor
  errorText: MessageDescriptor
  networkErrorText: MessageDescriptor
  responseTransformer: (response: any) => void
}

export interface ISerializedQueryMap {
  [key: string]: Omit<IQuery, 'responseTransformer' | 'query'> & {
    responseTransformer: Operation<any>
    query: Operation<any>
  }
}

type ILoaderButtonWithSerializedQueryMap = Omit<ILoaderButton, 'queryMap'> & {
  queryMap: ISerializedQueryMap
}

export interface ISelectFormFieldWithOptions extends IFormFieldBase {
  type: typeof SELECT_WITH_OPTIONS
  options: ISelectOption[]
  optionCondition?: string
}

export type SerializedFormField = UnionOmit<
  | Exclude<
      IFormField,
      | IFormFieldWithDynamicDefinitions
      | ILoaderButton
      | ISelectFormFieldWithOptions
    >
  | SerializedSelectFormFieldWithOptions
  | SerializedFormFieldWithDynamicDefinitions
  | ILoaderButtonWithSerializedQueryMap,
  'validator' | 'mapping'
> & {
  validator: Validator[]
  mapping?: IFormFieldMapping
}

export type IFormSectionQueryMapFunction = (
  transFormedData: IFormData,
  queryData: any,
  sectionId: string,
  targetSectionId?: string,
  targetFieldName?: string,
  offlineData?: any,
  userDetails?: any
) => void

type PaymentType = 'MANUAL'

type PaymentOutcomeType = 'COMPLETED' | 'ERROR' | 'PARTIAL'

export type Payment = {
  paymentId?: string
  type: PaymentType
  total: number
  amount: number
  outcome: PaymentOutcomeType
  date: number
}

type Relation =
  | 'FATHER'
  | 'MOTHER'
  | 'SPOUSE'
  | 'SON'
  | 'DAUGHTER'
  | 'EXTENDED_FAMILY'
  | 'OTHER'
  | 'INFORMANT'
  | 'PRINT_IN_ADVANCE'

type RelationForCertificateCorrection =
  | 'FATHER'
  | 'MOTHER'
  | 'SPOUSE'
  | 'SON'
  | 'DAUGHTER'
  | 'EXTENDED_FAMILY'
  | 'OTHER'
  | 'INFORMANT'
  | 'PRINT_IN_ADVANCE'
  | 'CHILD'

export type IDeclarationCertificate = {
  collector?: Partial<{ type: Relation }>
  corrector?: Partial<{ type: RelationForCertificateCorrection }>
  hasShowedVerifiedDocument?: boolean
  payments?: Payment
  certificateTemplateId?: string
}

export interface IFileValue {
  optionValues: IFormFieldValue[]
  type: string
  data: string
  fileSize: number
}

interface FieldValueArray extends Array<IFormFieldValue> {}

export interface IAttachmentValue {
  name?: string
  type: string
  data: string
  uri?: string
}

export interface FieldValueMap {
  [key: string]: IFormFieldValue
}

export interface IContactPointPhone {
  registrationPhone: string
}

export interface IContactPoint {
  value: string
  nestedFields: IContactPointPhone
}

interface IInformantOtherInformantType {
  otherInformantType: string
}

export interface IInformant {
  value: string
  nestedFields: IInformantOtherInformantType
}

export interface IDateRangePickerValue {
  exact: string | undefined
  rangeStart: string | undefined
  rangeEnd: string | undefined
  isDateRangeActive: boolean | undefined
}

export type DependencyInfo = {
  expression: string
  dependsOn: string[]
}

export type InitialValue = IFormFieldValue | DependencyInfo

export type IFormFieldValue =
  | string
  | string[]
  | number
  | boolean
  | Date
  | IDeclarationCertificate
  | IFileValue
  | IAttachmentValue
  | FieldValueArray
  | FieldValueMap
  | IContactPoint
  | IInformant
  | IDateRangePickerValue

export interface IFormSectionData {
  [key: string]: IFormFieldValue
}

export interface IFormData {
  [key: string]: IFormSectionData
}

export type TransformedData = { [key: string]: any }

export type IFormSectionMutationMapFunction = (
  transFormedData: TransformedData,
  draftData: IFormData,
  sectionId: string
) => void

export type ISerializedFormSectionGroup = Omit<IFormSectionGroup, 'fields'> & {
  fields: SerializedFormField[]
}

export interface IFormSection {
  id: string
  viewType: ViewType
  name: MessageDescriptor
  title?: MessageDescriptor
  groups: IFormSectionGroup[]
  disabled?: boolean
  optional?: boolean
  notice?: MessageDescriptor
  mapping?: ISectionMapping
}

export type ISerializedFormSection = Omit<
  IFormSection,
  'groups' | 'mapping'
> & {
  groups: ISerializedFormSectionGroup[]
  mapping?: ISectionMapping
}

export interface ISerializedForm {
  sections: ISerializedFormSection[]
}
export interface IForms {
  version: string
  birth: ISerializedForm
  death: ISerializedForm
  marriage: ISerializedForm
}

export enum AddressSubsections {
  PRIMARY_ADDRESS_SUBSECTION = 'primaryAddress',
  SECONDARY_ADDRESS_SUBSECTION = 'secondaryAddress'
}

export enum AddressCases {
  PRIMARY_ADDRESS = 'PRIMARY_ADDRESS',
  SECONDARY_ADDRESS = 'SECONDARY_ADDRESS'
}
export enum EventLocationAddressCases {
  PLACE_OF_BIRTH = 'placeOfBirth',
  PLACE_OF_DEATH = 'placeOfDeath',
  PLACE_OF_MARRIAGE = 'placeOfMarriage'
}
export enum AddressCopyConfigCases {
  PRIMARY_ADDRESS_SAME_AS_OTHER_PRIMARY = 'primaryAddressSameAsOtherPrimary'
}

export interface IAddressConfiguration {
  precedingFieldId: string
  configurations: AllowedAddressConfigurations[]
}

export type AllowedAddressConfigurations = {
  config:
    | AddressCases
    | AddressSubsections
    | AddressCopyConfigCases
    | EventLocationAddressCases
  label?: MessageDescriptor
  xComparisonSection?: string
  yComparisonSection?: string
  conditionalCase?: string | Conditional[]
}

export type AdministrativeLevel = 1 | 2 | 3 | 4 | 5

export const moi = 'asd'
