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

import { differenceInYears } from 'date-fns'
import {
  getEventType,
  getChild,
  getInformantRelation,
  getComposition,
  getChildBirthDate,
  getChildFullName,
  getChildGender,
  getEmailFromTaskResource,
  getInformantFullName,
  getPhoneNumberFromTaskResource,
  getDeceased,
  getPatientNationalId,
  findQuestionnaireResponse
} from './fhir'
import { fhirBundleToMOSIPPayload } from '@opencrvs/mosip'
import { createUniqueRegistrationNumberFromBundle } from '../api/event-registration/service'
import { getTaskResource, getTrackingIdFromTaskResource } from '.'
import { logger } from '@countryconfig/logger'

interface VerificationStatus {
  father: boolean
  mother: boolean
  informant: boolean
  spouse: boolean
}

/**
 * Determines whether the registration data should be forwarded to the identity system
 * for unique ID creation based on the custom country specific logic built on verification statuses.
 */
export function shouldForwardToIDSystem(
  bundle: fhir.Bundle,
  verificationStatus: Partial<VerificationStatus>
) {
  // IDA Auth
  const {
    father: isFatherVerified,
    mother: isMotherVerified,
    informant: isInformantVerified,
    spouse: isSpouseVerified
  } = verificationStatus

  // E-Signet
  const isFatherAuthenticated =
    findQuestionnaireResponse(
      bundle,
      'birth.father.father-view-group.verified'
    ) === 'authenticated'

  const isMotherAuthenticated =
    findQuestionnaireResponse(
      bundle,
      'birth.mother.mother-view-group.verified'
    ) === 'authenticated'

  const isInformantAuthenticated =
    findQuestionnaireResponse(
      bundle,
      'birth.informant.informant-view-group.verified'
    ) === 'authenticated'

  const isSpouseAuthenticated =
    findQuestionnaireResponse(
      bundle,
      'death.spouse.spouse-view-group.verified'
    ) === 'authenticated'

  const eventType = getEventType(bundle)
  if (eventType === 'BIRTH') {
    const child = getChild(bundle)
    const childBirthDate = new Date(child.birthDate as string)
    return (
      differenceInYears(new Date(), childBirthDate) < 10 &&
      (isFatherVerified ||
        isFatherAuthenticated ||
        isMotherVerified ||
        isMotherAuthenticated)
    )
  } else if (eventType === 'DEATH') {
    const relation = getInformantRelation(bundle)
    if (relation === 'SPOUSE') {
      return isSpouseVerified || isSpouseAuthenticated
    }
    return isInformantAuthenticated || isInformantVerified
  } else return true
}

/**
 * Converts the birth bundle from OpenCRVS to a MOSIP bundle
 */
export const fhirBirthToMosip = (bundle: fhir.Bundle) => {
  return fhirBundleToMOSIPPayload(bundle, {
    compositionId: (bundle) => {
      const composition = getComposition(bundle)
      return composition.id
    },
    trackingId: (bundle) => {
      const task = getTaskResource(bundle)
      return (task && getTrackingIdFromTaskResource(task)) || ''
    },
    notification: {
      recipientFullName: (bundle) => getInformantFullName(bundle) || '',
      recipientPhone: (bundle) => {
        const task = getTaskResource(bundle)
        return (task && getPhoneNumberFromTaskResource(task)) || ''
      },
      recipientEmail: (bundle) => {
        const task = getTaskResource(bundle)
        return (task && getEmailFromTaskResource(task)) || ''
      }
    },
    requestFields: {
      fullName: (bundle) => getChildFullName(bundle),
      dateOfBirth: (bundle) => getChildBirthDate(bundle) ?? '',
      gender: (bundle) => getChildGender(bundle) ?? '',
      birthCertificateNumber: (bundle) =>
        createUniqueRegistrationNumberFromBundle(bundle).registrationNumber
    },
    audit: {
      id: (bundle) => {
        const composition = getComposition(bundle)
        return composition.id
      }
    }
  })
}

/**
 * Converts the birth bundle from OpenCRVS to a MOSIP bundle
 */
export const fhirDeathToMosip = (bundle: fhir.Bundle) => {
  return fhirBundleToMOSIPPayload(bundle, {
    compositionId: (bundle) => {
      const composition = getComposition(bundle)
      return composition.id
    },
    trackingId: (bundle) => {
      const task = getTaskResource(bundle)
      return (task && getTrackingIdFromTaskResource(task)) || ''
    },
    notification: {
      recipientFullName: (bundle) => getInformantFullName(bundle) || '',
      recipientPhone: (bundle) => {
        const task = getTaskResource(bundle)
        return (task && getPhoneNumberFromTaskResource(task)) || ''
      },
      recipientEmail: (bundle) => {
        const task = getTaskResource(bundle)
        return (task && getEmailFromTaskResource(task)) || ''
      }
    },
    requestFields: {
      deathCertificateNumber: (bundle) =>
        createUniqueRegistrationNumberFromBundle(bundle).registrationNumber,
      nationalIdNumber: (bundle) => {
        let deceased
        try {
          deceased = getDeceased(bundle)
        } catch (error) {
          logger.error('Error getting deceased from bundle', error)
          return ''
        }
        try {
          return (deceased && getPatientNationalId(deceased)) || ''
        } catch (error) {
          // If using E-Signet, we don't know the National ID but for demonstrating purposes it's ok
          logger.error('Error getting national ID from deceased', error)
          return ''
        }
      }
    },
    audit: {
      id: (bundle) => {
        const composition = getComposition(bundle)
        return composition.id
      }
    }
  })
}
