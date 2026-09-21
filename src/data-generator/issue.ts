import fetch from 'node-fetch'
import { User } from './users'

import { idsToFHIRIds, log, removeEmptyFields } from './util'
import {
  AttachmentInput,
  BirthRegistrationInput,
  DeathRegistrationInput,
  MarkBirthAsIssuedMutation,
  MarkDeathAsIssuedMutation,
  PaymentOutcomeType,
  PaymentType
} from './gateway'
import { omit } from 'lodash'
import { GATEWAY_HOST } from './constants'
import { MARK_BIRTH_AS_ISSUED, MARK_DEATH_AS_ISSUED } from './queries'
import { differenceInDays } from 'date-fns'
import { ConfigResponse } from './config'
import { fetchDeathRegistration, fetchRegistration } from './declare'
import { location } from './options'

export function createBirthIssuingDetails(
  createdAt: Date,
  declaration: Awaited<ReturnType<typeof fetchRegistration>>,
  config: ConfigResponse
) {
  const withIdsRemoved = idsToFHIRIds(
    omit(declaration, ['__typename', 'id', 'registration.type']),
    [
      'eventLocation.id',
      'mother.id',
      'father.id',
      'child.id',
      'registration.id',
      'informant.id'
    ]
  )

  const completionDays = differenceInDays(
    createdAt,
    new Date(declaration.child?.birthDate!)
  )

  const paymentAmount =
    completionDays < config.config.BIRTH.REGISTRATION_TARGET
      ? config.config.BIRTH.FEE.ON_TIME
      : completionDays < config.config.BIRTH.LATE_REGISTRATION_TARGET
        ? config.config.BIRTH.FEE.LATE
        : config.config.BIRTH.FEE.DELAYED
  log(
    'Collecting certification payment of',
    paymentAmount,
    'for completion days',
    completionDays
  )
  const data = {
    ...withIdsRemoved,
    eventLocation: {
      _fhirID: withIdsRemoved.eventLocation?._fhirID
    },
    registration: {
      ...withIdsRemoved.registration,
      attachments: withIdsRemoved.registration?.attachments?.filter(
        (x): x is AttachmentInput => x !== null
      ),
      status: [
        {
          timestamp: createdAt.toISOString()
        }
      ],
      certificates: [
        {
          hasShowedVerifiedDocument: false,
          payments: [
            {
              type: PaymentType.Manual,
              total: paymentAmount,
              amount: paymentAmount,
              outcome: PaymentOutcomeType.Completed,
              date: createdAt
            }
          ],
          collector: {
            relationship: 'MOTHER'
          }
        }
      ]
    }
  }
  return removeEmptyFields(data)
}

export function createDeathIssuingDetails(
  createdAt: Date,
  declaration: Awaited<ReturnType<typeof fetchDeathRegistration>>,
  config: ConfigResponse
): DeathRegistrationInput {
  const withIdsRemoved = idsToFHIRIds(
    omit(declaration, ['__typename', 'id', 'registration.type']),
    [
      'id',
      'eventLocation.id',
      'mother.id',
      'father.id',
      'informant.individual.id',
      'informant.id',
      'deceased.id',
      'registration.id'
    ]
  )

  const completionDays = differenceInDays(
    createdAt,
    declaration.deceased?.deceased?.deathDate
      ? new Date(declaration.deceased?.deceased?.deathDate)
      : new Date()
  )

  const paymentAmount =
    completionDays < config.config.DEATH.REGISTRATION_TARGET
      ? config.config.DEATH.FEE.ON_TIME
      : config.config.DEATH.FEE.DELAYED

  log(
    'Collecting certification payment of',
    paymentAmount,
    'for completion days',
    completionDays
  )

  const data: DeathRegistrationInput = {
    ...withIdsRemoved,
    deceased: {
      ...withIdsRemoved.deceased,
      identifier: withIdsRemoved.deceased?.identifier?.filter(
        (id) => id?.type != 'DEATH_REGISTRATION_NUMBER'
      )
    },
    eventLocation:
      withIdsRemoved.eventLocation?.type === location.privateHome
        ? {
            address: withIdsRemoved.eventLocation?.address,
            type: withIdsRemoved.eventLocation?.type
          }
        : {
            _fhirID: withIdsRemoved.eventLocation?._fhirID
          },
    registration: {
      ...withIdsRemoved.registration,
      attachments: withIdsRemoved.registration?.attachments?.filter(
        (x): x is AttachmentInput => x !== null
      ),
      draftId: withIdsRemoved._fhirIDMap?.composition,
      certificates: [
        {
          hasShowedVerifiedDocument: false,
          payments: [
            {
              type: PaymentType.Manual,
              total: paymentAmount,
              amount: paymentAmount,
              outcome: PaymentOutcomeType.Completed,
              date: createdAt
            }
          ],
          collector: {
            relationship: 'INFORMANT'
          }
        }
      ],
      status: [
        {
          timestamp: createdAt.toISOString(),
          timeLoggedMS: Math.round(9999 * Math.random())
        }
      ]
    }
  }

  return removeEmptyFields(data)
}

export async function markBirthAsIssued(
  id: string,
  user: User,
  details: BirthRegistrationInput
) {
  const { token, username } = user

  const requestStart = Date.now()

  const certifyDeclarationRes = await fetch(`${GATEWAY_HOST}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-correlation-id': `certification-${id}`
    },
    body: JSON.stringify({
      query: MARK_BIRTH_AS_ISSUED,
      variables: {
        id: id,
        details
      }
    })
  })
  const requestEnd = Date.now()
  const result = (await certifyDeclarationRes.json()) as {
    errors: any[]
    data: MarkBirthAsIssuedMutation
  }

  if (result.errors) {
    console.error(JSON.stringify(result.errors, null, 2))
    throw new Error('Birth declaration could not be issued')
  }

  log(
    'Birth declaration',
    result.data.markBirthAsIssued,
    'is now issued by',
    username,
    `(took ${requestEnd - requestStart}ms)`
  )

  return result.data.markBirthAsIssued
}

export async function markDeathAsIssued(
  id: string,
  user: User,
  details: DeathRegistrationInput
) {
  const { token, username } = user

  const requestStart = Date.now()

  const certifyDeclarationRes = await fetch(`${GATEWAY_HOST}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-correlation-id': `death-certification-${id}`
    },
    body: JSON.stringify({
      query: MARK_DEATH_AS_ISSUED,
      variables: {
        id,
        details
      }
    })
  })
  const requestEnd = Date.now()
  const result = (await certifyDeclarationRes.json()) as {
    errors: any[]
    data: MarkDeathAsIssuedMutation
  }
  if (result.errors) {
    console.error(JSON.stringify(result.errors, null, 2))
    details.registration?.certificates?.forEach((cert) => {
      if (cert?.data) {
        cert.data = 'REDACTED'
      }
    })
    console.error(JSON.stringify(details))
    throw new Error('Death declaration could not be issued')
  }

  log(
    'Death declaration',
    result.data.markDeathAsIssued,
    'is now issued by',
    username,
    `(took ${requestEnd - requestStart}ms)`
  )

  return result.data.markDeathAsIssued
}
