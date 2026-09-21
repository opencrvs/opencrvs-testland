import { getSectionMapping } from '@countryconfig/utils/mapping/section/birth/mapping-utils'
import { formMessageDescriptors } from '../common/messages'
import { ISerializedFormSection } from '../types/types'
import { getFieldMapping } from '@countryconfig/utils/mapping/field-mapping-utils'
import { informantsSignature } from '../common/common-optional-fields'

export const registrationSection = {
  id: 'registration', // A hidden 'registration' section must be included to store identifiers in a form draft that are used in certificates
  viewType: 'hidden',
  name: {
    defaultMessage: 'Registration',
    description: 'Form section name for Registration',
    id: 'form.section.declaration.name'
  },
  groups: [],
  mapping: getSectionMapping('registration')
} as ISerializedFormSection

export const birthDocumentExtraValue = {
  CHILD: 'CHILD',
  FATHER: 'FATHER',
  MOTHER: 'MOTHER',
  PARENT: 'PARENT',
  OTHER: 'OTHER',
  INFORMANT_ID_PROOF: 'INFORMANT_ID_PROOF',
  LEGAL_GUARDIAN_PROOF: 'LEGAL_GUARDIAN_PROOF'
}

export const birthDocumentType = {
  BIRTH_CERTIFICATE: 'BIRTH_CERTIFICATE',
  NATIONAL_ID: 'NATIONAL_ID',
  PASSPORT: 'PASSPORT',
  OTHER: 'OTHER',
  NOTIFICATION_OF_BIRTH: 'NOTIFICATION_OF_BIRTH',
  PROOF_OF_LEGAL_GUARDIANSHIP: 'PROOF_OF_LEGAL_GUARDIANSHIP',
  PROOF_OF_ASSIGNED_RESPONSIBILITY: 'PROOF_OF_ASSIGNED_RESPONSIBILITY'
}

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
        {
          name: 'uploadDocForChildDOB',
          type: 'DOCUMENT_UPLOADER_WITH_OPTION',
          label: formMessageDescriptors.proofOfBirth,
          initialValue: '',
          extraValue: birthDocumentExtraValue.CHILD,
          hideAsterisk: true,
          validator: [],
          options: [
            {
              value: birthDocumentType.NOTIFICATION_OF_BIRTH,
              label: formMessageDescriptors.docTypeChildBirthProof
            }
          ],
          mapping: getFieldMapping('documents')
        },
        {
          name: 'uploadDocForMother',
          type: 'DOCUMENT_UPLOADER_WITH_OPTION',
          label: formMessageDescriptors.proofOfMothersID,
          initialValue: '',
          extraValue: birthDocumentExtraValue.MOTHER,
          hideAsterisk: true,
          validator: [],
          options: [
            {
              value: birthDocumentType.NATIONAL_ID,
              label: formMessageDescriptors.docTypeNID
            },
            {
              value: birthDocumentType.PASSPORT,
              label: formMessageDescriptors.docTypePassport
            },
            {
              value: birthDocumentType.BIRTH_CERTIFICATE,
              label: formMessageDescriptors.docTypeBirthCert
            },
            {
              value: birthDocumentType.OTHER,
              label: formMessageDescriptors.docTypeOther
            }
          ],
          conditionals: [
            {
              description: 'Hidden for Parent Details none or Mother only',
              action: 'hide',
              expression:
                'draftData && draftData.mother && !draftData.mother.detailsExist'
            }
          ],
          mapping: getFieldMapping('documents')
        },
        {
          name: 'uploadDocForFather',
          type: 'DOCUMENT_UPLOADER_WITH_OPTION',
          label: formMessageDescriptors.proofOfFathersID,
          initialValue: '',
          extraValue: birthDocumentExtraValue.FATHER,
          hideAsterisk: true,
          validator: [],
          options: [
            {
              value: birthDocumentType.NATIONAL_ID,
              label: formMessageDescriptors.docTypeNID
            },
            {
              value: birthDocumentType.PASSPORT,
              label: formMessageDescriptors.docTypePassport
            },
            {
              value: birthDocumentType.BIRTH_CERTIFICATE,
              label: formMessageDescriptors.docTypeBirthCert
            },
            {
              value: birthDocumentType.OTHER,
              label: formMessageDescriptors.docTypeOther
            }
          ],
          conditionals: [
            {
              description: 'Hidden for Parent Details none or Father only',
              action: 'hide',
              expression:
                'draftData && draftData.father && !draftData.father.detailsExist'
            }
          ],
          mapping: getFieldMapping('documents')
        },
        {
          name: 'uploadDocForInformant',
          type: 'DOCUMENT_UPLOADER_WITH_OPTION',
          label: formMessageDescriptors.proofOfInformantsID,
          initialValue: '',
          extraValue: birthDocumentExtraValue.INFORMANT_ID_PROOF,
          hideAsterisk: true,
          validator: [],
          options: [
            {
              value: birthDocumentType.NATIONAL_ID,
              label: formMessageDescriptors.docTypeNID
            },
            {
              value: birthDocumentType.PASSPORT,
              label: formMessageDescriptors.docTypePassport
            },
            {
              value: birthDocumentType.BIRTH_CERTIFICATE,
              label: formMessageDescriptors.docTypeBirthCert
            },
            {
              value: birthDocumentType.OTHER,
              label: formMessageDescriptors.docTypeOther
            }
          ],
          conditionals: [
            {
              action: 'hide',
              expression:
                "draftData?.informant?.informantType === 'MOTHER' || draftData?.informant?.informantType === 'FATHER'"
            }
          ],
          mapping: getFieldMapping('documents')
        },
        {
          name: 'uploadDocForProofOfLegalGuardian',
          type: 'DOCUMENT_UPLOADER_WITH_OPTION',
          label: formMessageDescriptors.otherBirthSupportingDocuments,
          initialValue: '',
          extraValue: birthDocumentExtraValue.LEGAL_GUARDIAN_PROOF,
          hideAsterisk: true,
          validator: [],
          options: [
            {
              value: birthDocumentType.PROOF_OF_LEGAL_GUARDIANSHIP,
              label: formMessageDescriptors.legalGuardianProof
            },
            {
              value: birthDocumentType.PROOF_OF_ASSIGNED_RESPONSIBILITY,
              label: formMessageDescriptors.assignedResponsibilityProof
            }
          ],
          conditionals: [
            {
              action: 'hide',
              expression:
                "draftData?.informant?.informantType === 'MOTHER' || draftData?.informant?.informantType === 'FATHER'"
            }
          ],
          mapping: getFieldMapping('documents')
        }
      ]
    }
  ]
} satisfies ISerializedFormSection

export const previewSection = {
  id: 'preview',
  viewType: 'preview',
  name: formMessageDescriptors.previewName,
  title: formMessageDescriptors.previewTitle,
  groups: [
    {
      id: 'preview-view-group',
      fields: [informantsSignature]
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
      fields: [informantsSignature]
    }
  ]
} satisfies ISerializedFormSection
