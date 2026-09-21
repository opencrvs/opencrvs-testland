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

// A file just to store the constants used in data-generator

/** Mapping of attachment types to identifiers */
const attachmentType = {
  attestedLetterOfDeath: 'ATTESTED_LETTER_OF_DEATH',
  birthCertificate: 'BIRTH_CERTIFICATE',
  burialReceipt: 'BURIAL_RECEIPT',
  coronersReport: 'CORONERS_REPORT',
  hospitalCertificateOfDeath: 'HOSPITAL_CERTIFICATE_OF_DEATH',
  marriageNotice: 'MARRIAGE_NOTICE',
  medicallyCertifiedCauseOfDeath: 'MEDICALLY_CERTIFIED_CAUSE_OF_DEATH',
  nationalId: 'NATIONAL_ID',
  notificationOfBirth: 'NOTIFICATION_OF_BIRTH',
  other: 'OTHER',
  passport: 'PASSPORT',
  policeCertificateOfDeath: 'POLICE_CERTIFICATE_OF_DEATH',
  proofOfAssignedResponsibility: 'PROOF_OF_ASSIGNED_RESPONSIBILITY',
  proofOfLegalGuardianship: 'PROOF_OF_LEGAL_GUARDIANSHIP',
  verbalAutopsyReport: 'VERBAL_AUTOPSY_REPORT'
}

/** Mapping types of attachment subjects to identifiers */
const attachmentSubject = {
  bride: 'BRIDE',
  child: 'CHILD',
  childAge: 'CHILD_AGE',
  deceasedDeathCauseProof: 'DECEASED_DEATH_CAUSE_PROOF',
  deceasedDeathProof: 'DECEASED_DEATH_PROOF',
  deceasedIdProof: 'DECEASED_ID_PROOF',
  father: 'FATHER',
  groom: 'GROOM',
  informantIdProof: 'INFORMANT_ID_PROOF',
  legalGuardianProof: 'LEGAL_GUARDIAN_PROOF',
  marriageNoticeProof: 'MARRIAGE_NOTICE_PROOF',
  mother: 'MOTHER',
  other: 'OTHER',
  parent: 'PARENT'
}

export const DEATH_ATTACHMENTS = [
  {
    subject: attachmentSubject.deceasedIdProof,
    type: attachmentType.nationalId
  },
  {
    subject: attachmentSubject.deceasedIdProof,
    type: attachmentType.passport
  },
  {
    subject: attachmentSubject.deceasedIdProof,
    type: attachmentType.birthCertificate
  },
  {
    subject: attachmentSubject.informantIdProof,
    type: attachmentType.nationalId
  },
  {
    subject: attachmentSubject.informantIdProof,
    type: attachmentType.other
  }
] as const

export const BIRTH_ATTACHMENTS = [
  {
    subject: attachmentSubject.child,
    type: attachmentType.notificationOfBirth
  },
  {
    subject: attachmentSubject.mother,
    type: attachmentType.nationalId
  },
  {
    subject: attachmentSubject.mother,
    type: attachmentType.passport
  },
  {
    subject: attachmentSubject.mother,
    type: attachmentType.birthCertificate
  },
  {
    subject: attachmentSubject.mother,
    type: attachmentType.other
  }
] as const

/** Mapping of education types to identifiers */
export const education = {
  firstStageTertiaryIsced_5: 'FIRST_STAGE_TERTIARY_ISCED_5',
  noSchooling: 'NO_SCHOOLING',
  postSecondaryIsced_4: 'POST_SECONDARY_ISCED_4',
  primaryIsced_1: 'PRIMARY_ISCED_1'
} as const

/** Mapping of location types to identifiers */
export const location = {
  adminStructure: 'ADMIN_STRUCTURE',
  crvsOffice: 'CRVS_OFFICE',
  deceasedUsualResidence: 'DECEASED_USUAL_RESIDENCE',
  healthFacility: 'HEALTH_FACILITY',
  hospital: 'HOSPITAL',
  idpCamp: 'IDP_CAMP',
  militaryBaseOrCantonment: 'MILITARY_BASE_OR_CANTONMENT',
  other: 'OTHER',
  otherHealthInstitution: 'OTHER_HEALTH_INSTITUTION',
  primaryAddress: 'PRIMARY_ADDRESS',
  privateHome: 'PRIVATE_HOME',
  secondaryAddress: 'SECONDARY_ADDRESS',
  unhcrCamp: 'UNHCR_CAMP'
}

/** Mapping of identity types to identifiers */
export const identity = {
  nationalId: 'NATIONAL_ID',
  birthRegistrationNumber: 'BIRTH_REGISTRATION_NUMBER',
  deathRegistrationNumber: 'DEATH_REGISTRATION_NUMBER',
  passport: 'PASSPORT',
  drivingLicense: 'DRIVING_LICENSE',
  refugeeNumber: 'REFUGEE_NUMBER',
  alienNumber: 'ALIEN_NUMBER',
  other: 'OTHER',
  noId: 'NO_ID',
  socialSecurityNumber: 'SOCIAL_SECURITY_NO'
}

/** Mapping of marital status types to identifiers */
export const maritalStatus = {
  divorced: 'DIVORCED',
  married: 'MARRIED',
  notStated: 'NOT_STATED',
  separated: 'SEPARATED',
  single: 'SINGLE',
  widowed: 'WIDOWED'
}

/** Mapping of address types to identifiers. Note that location and addresses are different, as persons address cannot be a hospital for example. */
export const address = {
  adminStructure: 'ADMIN_STRUCTURE',
  crvsOffice: 'CRVS_OFFICE',
  deceasedUsualResidence: 'DECEASED_USUAL_RESIDENCE',
  healthFacility: 'HEALTH_FACILITY',
  idpCamp: 'IDP_CAMP',
  militaryBaseOrCantonment: 'MILITARY_BASE_OR_CANTONMENT',
  other: 'OTHER',
  primaryAddress: 'PRIMARY_ADDRESS',
  privateHome: 'PRIVATE_HOME',
  secondaryAddress: 'SECONDARY_ADDRESS',
  unhcrCamp: 'UNHCR_CAMP'
}

/** Mapping of informant types to identifiers */
export const informant = {
  bride: 'BRIDE',
  brother: 'BROTHER',
  daughter: 'DAUGHTER',
  daughterInLaw: 'DAUGHTER_IN_LAW',
  father: 'FATHER',
  granddaughter: 'GRANDDAUGHTER',
  grandfather: 'GRANDFATHER',
  grandmother: 'GRANDMOTHER',
  grandson: 'GRANDSON',
  groom: 'GROOM',
  informant: 'INFORMANT',
  legalGuardian: 'LEGAL_GUARDIAN',
  mother: 'MOTHER',
  other: 'OTHER',
  otherFamilyMember: 'OTHER_FAMILY_MEMBER',
  sister: 'SISTER',
  son: 'SON',
  sonInLaw: 'SON_IN_LAW',
  spouse: 'SPOUSE'
}

/** Mapping manners of death to identifiers */
export const mannerOfDeath = {
  accident: 'ACCIDENT',
  homicide: 'HOMICIDE',
  mannerUndetermined: 'MANNER_UNDETERMINED',
  naturalCauses: 'NATURAL_CAUSES',
  suicide: 'SUICIDE'
}

/** Mapping types of birth to identifiers */
export const birth = {
  higherMultipleDelivery: 'HIGHER_MULTIPLE_DELIVERY',
  quadruplet: 'QUADRUPLET',
  single: 'SINGLE',
  triplet: 'TRIPLET',
  twin: 'TWIN'
}

/** Mapping attendant types to identifiers */
export const attendant = {
  layperson: 'LAYPERSON',
  midwife: 'MIDWIFE',
  none: 'NONE',
  nurse: 'NURSE',
  nurseMidwife: 'NURSE_MIDWIFE',
  other: 'OTHER',
  otherParamedicalPersonnel: 'OTHER_PARAMEDICAL_PERSONNEL',
  physician: 'PHYSICIAN',
  traditionalBirthAttendant: 'TRADITIONAL_BIRTH_ATTENDANT'
}

/** Mapping of cause-of-death method types into identifiers  */
export const causeOfDeathMethod = {
  layReported: 'LAY_REPORTED',
  medicallyCertified: 'MEDICALLY_CERTIFIED',
  physician: 'PHYSICIAN',
  verbalAutopsy: 'VERBAL_AUTOPSY'
}
