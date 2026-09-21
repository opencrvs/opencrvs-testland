import { getSectionMapping } from '@countryconfig/utils/mapping/section/marriage/mapping-utils'
import { getInformantConditionalForMarriageDocUpload } from '../common/default-validation-conditionals'
import { formMessageDescriptors } from '../common/messages'
import {
  ISelectOption,
  ISerializedFormSection,
  SerializedFormField
} from '../types/types'
import { getDocUploaderForMarriage } from './required-fields'

export const registrationSection = {
  id: 'registration',
  viewType: 'hidden',
  name: {
    defaultMessage: 'Registration',
    description: 'Form section name for Registration',
    id: 'form.section.declaration.name'
  },
  groups: [],
  mapping: getSectionMapping('registration')
} as ISerializedFormSection

export const marriageDocumentType = {
  MARRIAGE_NOTICE: 'MARRIAGE_NOTICE',
  BIRTH_CERTIFICATE: 'BIRTH_CERTIFICATE',
  NATIONAL_ID: 'NATIONAL_ID',
  PASSPORT: 'PASSPORT',
  OTHER: 'OTHER'
}

export const getDocSelectOptions: ISelectOption[] = [
  {
    value: marriageDocumentType.NATIONAL_ID,
    label: formMessageDescriptors.docTypeNID
  },
  {
    value: marriageDocumentType.PASSPORT,
    label: formMessageDescriptors.docTypePassport
  },
  {
    value: marriageDocumentType.BIRTH_CERTIFICATE,
    label: formMessageDescriptors.docTypeBirthCert
  },
  {
    value: marriageDocumentType.OTHER,
    label: formMessageDescriptors.docTypeOther
  }
]

export const documentsSection = {
  id: 'documents',
  viewType: 'form',
  name: formMessageDescriptors.documentsName,
  title: {
    defaultMessage: 'Attaching supporting documents',
    description: 'Form section title for Documents',
    id: 'form.section.documents.title'
  },
  groups: [
    {
      id: 'documents-view-group',
      fields: [
        getDocUploaderForMarriage(
          'uploadDocForMarriageProof',
          'proofOfMarriageNotice',
          'MARRIAGE_NOTICE_PROOF',
          [
            {
              value: marriageDocumentType.MARRIAGE_NOTICE,
              label: formMessageDescriptors.docTypeMarriageNotice
            }
          ],
          []
        ),
        getDocUploaderForMarriage(
          'uploadDocForGroom',
          'proofOfGroomsID',
          'GROOM',
          getDocSelectOptions,
          []
        ),
        getDocUploaderForMarriage(
          'uploadDocForBride',
          'proofOfBridesID',
          'BRIDE',
          getDocSelectOptions,
          []
        ),
        getDocUploaderForMarriage(
          'uploadDocForInformant',
          'proofOfInformantsID',
          'INFORMANT',
          getDocSelectOptions,
          getInformantConditionalForMarriageDocUpload
        )
      ]
    }
  ]
} as ISerializedFormSection

/*
 * In this reference configuration the signature
 * fields for both the preview & review section are same
 * but they can potentially be different e.g. it could be
 * made such that the signatures are only required when
 * registering a submitted declaration
 */
const signatureFields = [
  {
    name: 'brideSignature',
    label: {
      defaultMessage: 'Signature of Bride',
      description: "Label for bride's signature input",
      id: 'review.inputs.brideSignature'
    },
    required: true,
    validator: [],
    type: 'SIGNATURE',
    allowedFileFormats: ['image/png'],
    mapping: {
      mutation: {
        operation: 'fieldValueSectionExchangeTransformer',
        parameters: ['registration', 'brideSignature']
      },
      query: {
        operation: 'fieldValueSectionExchangeTransformer',
        parameters: ['registration', 'brideSignature']
      }
    }
  },
  {
    name: 'groomSignature',
    label: {
      defaultMessage: 'Signature of groom',
      description: "Label for groom's signature input",
      id: 'review.inputs.groomSignature'
    },
    required: true,
    validator: [],
    type: 'SIGNATURE',
    allowedFileFormats: ['image/png'],
    mapping: {
      mutation: {
        operation: 'fieldValueSectionExchangeTransformer',
        parameters: ['registration', 'groomSignature']
      },
      query: {
        operation: 'fieldValueSectionExchangeTransformer',
        parameters: ['registration', 'groomSignature']
      }
    }
  },
  {
    name: 'witnessOneSignature',
    label: {
      defaultMessage: 'Signature of witnessOne',
      description: "Label for witnessOne's signature input",
      id: 'review.inputs.witnessOneSignature'
    },
    required: true,
    validator: [],
    type: 'SIGNATURE',
    allowedFileFormats: ['image/png'],
    mapping: {
      mutation: {
        operation: 'fieldValueSectionExchangeTransformer',
        parameters: ['registration', 'witnessOneSignature']
      },
      query: {
        operation: 'fieldValueSectionExchangeTransformer',
        parameters: ['registration', 'witnessOneSignature']
      }
    }
  },
  {
    name: 'witnessTwoSignature',
    label: {
      defaultMessage: 'Signature of witnessTwo',
      description: "Label for witnessTwo's signature input",
      id: 'review.inputs.witnessTwoSignature'
    },
    required: true,
    validator: [],
    type: 'SIGNATURE',
    allowedFileFormats: ['image/png'],
    mapping: {
      mutation: {
        operation: 'fieldValueSectionExchangeTransformer',
        parameters: ['registration', 'witnessTwoSignature']
      },
      query: {
        operation: 'fieldValueSectionExchangeTransformer',
        parameters: ['registration', 'witnessTwoSignature']
      }
    }
  }
] satisfies SerializedFormField[]

export const previewSection = {
  id: 'preview',
  viewType: 'preview',
  name: formMessageDescriptors.previewName,
  title: formMessageDescriptors.previewTitle,
  groups: [
    {
      id: 'preview-view-group',
      fields: signatureFields
    }
  ]
} satisfies ISerializedFormSection

export const reviewSection = {
  id: 'review',
  viewType: 'review',
  name: formMessageDescriptors.reviewName,
  title: formMessageDescriptors.reviewTitle,
  groups: [
    {
      id: 'review-view-group',
      fields: signatureFields
    }
  ]
} satisfies ISerializedFormSection
