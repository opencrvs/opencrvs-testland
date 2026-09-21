import { getSectionMapping } from '@countryconfig/utils/mapping/section/death/mapping-utils'
import { formMessageDescriptors } from '../common/messages'
import { ISerializedFormSection } from '../types/types'
import { getFieldMapping } from '@countryconfig/utils/mapping/field-mapping-utils'
import { informantsSignature } from '../common/common-optional-fields'

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

export const deathDocumentExtraValue = {
  DECEASED_ID_PROOF: 'DECEASED_ID_PROOF',
  DECEASED_DEATH_PROOF: 'DECEASED_DEATH_PROOF',
  DECEASED_DEATH_CAUSE_PROOF: 'DECEASED_DEATH_CAUSE_PROOF',
  INFORMANT_ID_PROOF: 'INFORMANT_ID_PROOF'
}

export const deathDocumentType = {
  HOSPITAL_CERTIFICATE_OF_DEATH: 'HOSPITAL_CERTIFICATE_OF_DEATH',
  ATTESTED_LETTER_OF_DEATH: 'ATTESTED_LETTER_OF_DEATH',
  BURIAL_RECEIPT: 'BURIAL_RECEIPT',
  POLICE_CERTIFICATE_OF_DEATH: 'POLICE_CERTIFICATE_OF_DEATH',
  MEDICALLY_CERTIFIED_CAUSE_OF_DEATH: 'MEDICALLY_CERTIFIED_CAUSE_OF_DEATH',
  VERBAL_AUTOPSY_REPORT: 'VERBAL_AUTOPSY_REPORT',
  CORONERS_REPORT: 'CORONERS_REPORT',
  BIRTH_CERTIFICATE: 'BIRTH_CERTIFICATE',
  NATIONAL_ID: 'NATIONAL_ID',
  PASSPORT: 'PASSPORT',
  OTHER: 'OTHER'
}
export const documentsSection = {
  id: 'documents',
  viewType: 'form',
  name: formMessageDescriptors.documentsName,
  title: formMessageDescriptors.documentsTitle,
  groups: [
    {
      id: 'documents-view-group',
      fields: [
        {
          name: 'uploadDocForDeceased',
          type: 'DOCUMENT_UPLOADER_WITH_OPTION',
          label: formMessageDescriptors.deceasedIDProof,
          initialValue: '',
          extraValue: deathDocumentExtraValue.DECEASED_ID_PROOF,
          hideAsterisk: true,
          validator: [],
          options: [
            {
              value: deathDocumentType.NATIONAL_ID,
              label: formMessageDescriptors.docTypeNID
            },
            {
              value: deathDocumentType.PASSPORT,
              label: formMessageDescriptors.docTypePassport
            },
            {
              value: deathDocumentType.BIRTH_CERTIFICATE,
              label: formMessageDescriptors.docTypeBirthCert
            },
            {
              value: deathDocumentType.OTHER,
              label: formMessageDescriptors.docTypeOther
            }
          ],
          mapping: getFieldMapping('documents')
        },
        {
          name: 'uploadDocForInformant',
          type: 'DOCUMENT_UPLOADER_WITH_OPTION',
          label: formMessageDescriptors.proofOfInformantsID,
          initialValue: '',
          extraValue: deathDocumentExtraValue.INFORMANT_ID_PROOF,
          hideAsterisk: true,
          validator: [],
          options: [
            {
              value: deathDocumentType.NATIONAL_ID,
              label: formMessageDescriptors.docTypeNID
            },
            {
              value: deathDocumentType.PASSPORT,
              label: formMessageDescriptors.docTypePassport
            },
            {
              value: deathDocumentType.BIRTH_CERTIFICATE,
              label: formMessageDescriptors.docTypeBirthCert
            },
            {
              value: deathDocumentType.OTHER,
              label: formMessageDescriptors.docTypeOther
            }
          ],
          mapping: getFieldMapping('documents')
        },
        {
          name: 'uploadDocForDeceasedDeath',
          type: 'DOCUMENT_UPLOADER_WITH_OPTION',
          label: formMessageDescriptors.deceasedDeathProof,
          initialValue: '',
          extraValue: deathDocumentExtraValue.DECEASED_DEATH_PROOF,
          hideAsterisk: true,
          validator: [],
          options: [
            {
              value: deathDocumentType.ATTESTED_LETTER_OF_DEATH,
              label: formMessageDescriptors.docTypeLetterOfDeath
            },
            {
              value: deathDocumentType.POLICE_CERTIFICATE_OF_DEATH,
              label: formMessageDescriptors.docTypePoliceCertificate
            },
            {
              value: deathDocumentType.HOSPITAL_CERTIFICATE_OF_DEATH,
              label: formMessageDescriptors.docTypeHospitalDeathCertificate
            },
            {
              value: deathDocumentType.CORONERS_REPORT,
              label: formMessageDescriptors.docTypeCoronersReport
            },
            {
              value: deathDocumentType.BURIAL_RECEIPT,
              label: formMessageDescriptors.docTypeCopyOfBurialReceipt
            },
            {
              value: deathDocumentType.OTHER,
              label: formMessageDescriptors.docTypeOther
            }
          ],
          mapping: getFieldMapping('documents')
        },
        {
          name: 'uploadDocForCauseOfDeath',
          type: 'DOCUMENT_UPLOADER_WITH_OPTION',
          label: formMessageDescriptors.causeOfDeathProof,
          initialValue: '',
          extraValue: deathDocumentExtraValue.DECEASED_DEATH_CAUSE_PROOF,
          hideAsterisk: true,
          validator: [],
          conditionals: [
            {
              action: 'hide',
              expression:
                'draftData?.deathEvent?.causeOfDeathEstablished !== "true"'
            }
          ],
          options: [
            {
              value: deathDocumentType.MEDICALLY_CERTIFIED_CAUSE_OF_DEATH,
              label: formMessageDescriptors.medicallyCertified
            },
            {
              value: deathDocumentType.VERBAL_AUTOPSY_REPORT,
              label: formMessageDescriptors.verbalAutopsyReport
            },
            {
              value: deathDocumentType.OTHER,
              label: formMessageDescriptors.docTypeOther
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
