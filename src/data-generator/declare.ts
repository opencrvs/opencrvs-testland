import { faker } from '@faker-js/faker'
import { differenceInDays, differenceInYears, sub } from 'date-fns'
import fetch from 'node-fetch'
import { createAddressInput } from './address'
import { GATEWAY_HOST } from './constants'
import {
  BirthRegistrationInput,
  CreateDeathDeclarationMutation,
  DeathRegistrationInput,
  FetchBirthRegistrationQuery,
  FetchDeathRegistrationQuery,
  PersonInput,
  SearchEventsQuery
} from './gateway'
import { Facility, Location } from './location'
import { User } from './users'
import { log } from './util'
import { birthNotification } from './birthNotification'
import {
  CREATE_DEATH_DECLARATION,
  FETCH_DEATH_REGISTRATION_QUERY,
  FETCH_REGISTRATION_QUERY,
  SEARCH_EVENTS
} from './queries'
import {
  BIRTH_ATTACHMENTS,
  DEATH_ATTACHMENTS,
  education,
  identity,
  maritalStatus,
  location as locationTypes,
  address,
  informant,
  mannerOfDeath,
  birth,
  attendant,
  causeOfDeathMethod
} from './options'

const HOME_BIRTH_WEIGHT = 0.2
const HOME_DEATH_WEIGHT = 0.2
/*
 * Number of attachments per record. Please see `BIRTH_ATTACHMENTS`
 * and `DEATH_ATTACHMENTS`, this number cannot exceed the biggest
 * index of either of them.
 */
const NUMBER_OF_ATTACHMENTS_PER_RECORD = process.env
  .NUMBER_OF_ATTACHMENTS_PER_RECORD
  ? parseInt(process.env.NUMBER_OF_ATTACHMENTS_PER_RECORD, 10)
  : 2

function randomWeightInKg() {
  return Math.round(2.5 + 2 * Math.random())
}

function getIDFromResponse(resBody: fhir.Bundle): string {
  if (
    !resBody ||
    !resBody.entry ||
    !resBody.entry[0] ||
    !resBody.entry[0].response ||
    !resBody.entry[0].response.location
  ) {
    throw new Error(`FHIR did not send a valid response`)
  }
  // return the Composition's id
  return resBody.entry[0].response.location.split('/')[3]
}

export async function sendBirthNotification(
  { username, token }: Partial<User>,
  sex: 'male' | 'female',
  birthDate: Date,
  createdAt: Date,
  facility: Facility,
  district: Location,
  office: Facility
): Promise<string> {
  const lastName = faker.person.lastName()
  const firstName = faker.person.firstName()
  const motherFirstName = faker.person.firstName('female')
  const requestStart = Date.now()

  const notification = birthNotification({
    child: {
      firstName,
      lastName,
      weight: randomWeightInKg().toString(),
      gender: sex
    },
    father: {
      firstName: faker.person.firstName('male'),
      lastName,
      nid: faker.number.bigInt({ min: 1000000000, max: 9999999999 }).toString(),
      dateOfBirth: sub(birthDate, { years: 20 }).toISOString().split('T')[0]
    },
    mother: {
      firstName: motherFirstName,
      lastName,
      dateOfBirth: sub(birthDate, { years: 20 }).toISOString().split('T')[0],
      nid: faker.number.bigInt({ min: 1000000000, max: 9999999999 }).toString()
    },
    createdAt: createdAt.toISOString(),
    address: [
      {
        type: 'PRIMARY_ADDRESS',
        line: ['12', 'Usual Street', 'Usual Residental Area', '', '', 'URBAN'],
        city: faker.location.city(),
        district: district.id,
        state: district.partOf.split('/')[1],
        postalCode: faker.location.zipCode(),
        country: 'FAR'
      }
    ],
    phoneNumber:
      '+2607' + faker.number.bigInt({ min: 10000000, max: 99999999 }),
    email: faker.internet.email({
      firstName: motherFirstName,
      lastName: lastName
    }),
    dateOfBirth: birthDate.toISOString().split('T')[0],
    placeOfBirth: `Location/${facility.id}`,
    officeLocation: office.partOf,
    office: `Location/${office.id}`
  })

  const createBirthNotification = await fetch(`${GATEWAY_HOST}/notification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-correlation-id': `birth-notification-${firstName}-${lastName}`
    },
    body: JSON.stringify(notification)
  })

  if (!createBirthNotification.ok) {
    log(
      'Failed to create a birth notification',
      await createBirthNotification.text()
    )
    throw new Error('Failed to create a birth notification')
  }

  const response = await createBirthNotification.json()

  const requestEnd = Date.now()
  log(
    'Creating birth notification',
    firstName,
    lastName,
    'born',
    birthDate.toISOString().split('T')[0],
    'created by',
    username,
    `(took ${requestEnd - requestStart}ms)`
  )

  return getIDFromResponse(response)
}

export function createBirthDeclarationData(
  sex: 'male' | 'female' | undefined,
  birthDate: Date,
  declarationTime: Date,
  location: Location,
  facility: Facility,
  base64Attachment: string
): BirthRegistrationInput {
  const timeFilling = Math.round(100000 + Math.random() * 100000) // 100 - 200 seconds
  const familyName = faker.person.lastName()
  const firstNames = faker.person.firstName()
  const motherFirstName = faker.person.firstName('female')
  const isLateRegistration = differenceInDays(new Date(), birthDate) > 365

  const mother: PersonInput = {
    nationality: ['FAR'],
    occupation: 'Bookkeeper',
    educationalAttainment: education.primaryIsced_1,
    dateOfMarriage: sub(birthDate, { years: 2 }).toISOString().split('T')[0],
    identifier: [
      {
        id: faker.number
          .bigInt({ min: 1000000000, max: 9999999999 })
          .toString(),
        type: identity.nationalId
      }
    ],
    name: [
      {
        use: 'en',
        firstNames: motherFirstName,
        familyName: familyName
      }
    ],
    birthDate: sub(birthDate, { years: 20 }).toISOString().split('T')[0],
    maritalStatus: maritalStatus.married,
    address: [
      createAddressInput(location, address.primaryAddress),
      createAddressInput(location, address.primaryAddress)
    ]
  }

  return {
    createdAt: declarationTime.toISOString(),
    registration: {
      informantType: informant.mother,
      otherInformantType: '',
      contactPhoneNumber:
        '+2607' + faker.number.bigInt({ min: 10000000, max: 99999999 }),
      contactEmail: faker.internet.email({
        firstName: motherFirstName,
        lastName: familyName
      }),
      status: [
        {
          timestamp: sub(declarationTime, {
            seconds: timeFilling / 1000
          }),
          timeLoggedMS: timeFilling * 1000
        }
      ],
      draftId: faker.string.uuid(),
      attachments: faker.helpers
        .arrayElements(BIRTH_ATTACHMENTS, NUMBER_OF_ATTACHMENTS_PER_RECORD)
        .map((attachment) => ({
          ...attachment,
          contentType: 'image/png',
          data: 'data:image/png;base64,' + base64Attachment
        })),
      inCompleteFields: !sex ? 'child/child-view-group/gender' : undefined
    },
    father: {
      detailsExist: false,
      reasonNotApplying: 'Father unknown'
    },
    questionnaire: [
      ...(isLateRegistration
        ? [
            {
              fieldId: 'birth.child.child-view-group.reasonForLateRegistration',
              value: 'Late registration'
            }
          ]
        : []),
      {
        fieldId: 'birth.mother.mother-view-group.motherIdType',
        value: 'NATIONAL_ID'
      }
    ],
    child: {
      name: [
        {
          use: 'en',
          firstNames,
          familyName
        }
      ],
      gender: sex,
      birthDate: birthDate.toISOString().split('T')[0],
      multipleBirth: Math.round(Math.random() * 5)
    },
    attendantAtBirth: attendant.physician,
    birthType: birth.single,
    weightAtBirth: Math.round(2.5 + 2 * Math.random() * 10) / 10,
    eventLocation:
      Math.random() < HOME_BIRTH_WEIGHT
        ? {
            address: {
              country: 'FAR',
              state: location.partOf.replace('Location/', ''),
              district: location.id,
              city: faker.location.city(),
              postalCode: faker.location.zipCode(),
              line: [
                faker.location.streetAddress(),
                faker.location.zipCode(),
                'URBAN'
              ]
            },
            type: locationTypes.privateHome
          }
        : {
            _fhirID: facility.id
          },
    mother
  }
}

export async function createBirthDeclaration(
  { username, token }: User,
  sex: 'male' | 'female' | undefined,
  birthDate: Date,
  declarationTime: Date,
  location: Location,
  facility: Facility,
  base64Attachment: string
) {
  const details = createBirthDeclarationData(
    sex,
    birthDate,
    declarationTime,
    location,
    facility,
    base64Attachment
  )

  const name = details.child?.name
    ?.map((name) => `${name?.firstNames} ${name?.familyName}`)
    .join(' ')
  const requestStart = Date.now()
  const createDeclarationRes = await fetch(`${GATEWAY_HOST}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-correlation-id': `declare-${name}`
    },
    body: JSON.stringify({
      query: `
        mutation submitMutation($details: BirthRegistrationInput!) {
          createBirthRegistration(details: $details) {
            compositionId
          }
        }`,
      variables: {
        details
      }
    })
  })
  const requestEnd = Date.now()
  log(
    'Creating',
    name,
    'born',
    birthDate.toISOString().split('T')[0],
    'declared',
    declarationTime.toISOString().split('T')[0],
    'days in between',
    differenceInDays(declarationTime, birthDate),
    'created by',
    username,
    `(took ${requestEnd - requestStart}ms)`
  )
  const result = await createDeclarationRes.json()
  if (!result?.data?.createBirthRegistration?.compositionId) {
    log(result)
    throw new Error('Birth declaration was not created')
  }
  return result.data.createBirthRegistration.compositionId
}

export async function createDeathDeclaration(
  { username, token }: User,
  deathTime: Date,
  sex: 'male' | 'female' | undefined,
  declarationTime: Date,
  location: Location,
  facility: Facility,
  base64Attachment: string
) {
  const familyName = faker.person.lastName()
  const firstNames = faker.person.firstName()
  const spouseFirstName = faker.person.firstName()

  const requestStart = Date.now()

  const birthDate = sub(deathTime, { years: Math.random() * 100 })
  const deathDay = deathTime
  const timeFilling = Math.round(100000 + Math.random() * 100000) // 100 - 200 seconds
  const details: DeathRegistrationInput = {
    causeOfDeathEstablished: 'true',
    causeOfDeathMethod: causeOfDeathMethod.physician,
    deathDescription: '',
    createdAt: declarationTime.toISOString(),
    registration: {
      informantType: 'SPOUSE',
      contactPhoneNumber:
        '+2607' + faker.number.bigInt({ min: 10000000, max: 99999999 }),
      contactEmail: faker.internet.email({
        firstName: spouseFirstName,
        lastName: familyName
      }),
      attachments: faker.helpers
        .arrayElements(DEATH_ATTACHMENTS, NUMBER_OF_ATTACHMENTS_PER_RECORD)
        .map((attachment) => ({
          ...attachment,
          contentType: 'image/png',
          data: 'data:image/png;base64,' + base64Attachment
        })),
      draftId: faker.string.uuid(),
      status: [
        {
          timestamp: sub(declarationTime, {
            seconds: timeFilling / 1000
          }),
          timeLoggedMS: timeFilling * 1000
        }
      ],
      inCompleteFields: !sex ? 'child/child-view-group/gender' : undefined
    },
    causeOfDeath: 'Natural cause',
    deceased: {
      identifier: [
        {
          id: faker.number
            .bigInt({ min: 1000000000, max: 9999999999 })
            .toString(),
          type: identity.nationalId
        },
        {
          id: faker.number
            .bigInt({ min: 100000000, max: 999999999 })
            .toString(),
          type: identity.socialSecurityNumber
        }
      ],
      nationality: ['FAR'],
      name: [
        {
          use: 'en',
          firstNames: firstNames,
          familyName: familyName
        }
      ],
      birthDate: birthDate.toISOString().split('T')[0],
      gender: sex,
      maritalStatus: maritalStatus.married,
      address: [createAddressInput(location, address.primaryAddress)],
      age: Math.max(1, differenceInYears(deathDay, birthDate)),
      deceased: {
        deceased: true,
        deathDate: deathDay.toISOString().split('T')[0]
      }
    },
    mannerOfDeath: mannerOfDeath.naturalCauses,
    maleDependentsOfDeceased: Math.round(Math.random() * 5),
    femaleDependentsOfDeceased: Math.round(Math.random() * 5),
    eventLocation:
      Math.random() < HOME_DEATH_WEIGHT
        ? {
            address: {
              type: address.primaryAddress,
              line: ['', '', '', '', '', ''],
              country: 'FAR',
              state: location.partOf.replace('Location/', ''),
              district: location.id
            },
            type: locationTypes.deceasedUsualResidence
          }
        : {
            _fhirID: facility.id
          },
    informant: {
      birthDate: sub(declarationTime, { years: 20 })
        .toISOString()
        .split('T')[0],
      occupation: 'consultant',
      nationality: ['FAR'],
      identifier: [
        {
          id: faker.number
            .bigInt({ min: 1000000000, max: 9999999999 })
            .toString(),
          type: identity.nationalId
        }
      ],
      name: [
        {
          use: 'en',
          firstNames: spouseFirstName,
          familyName: familyName
        }
      ],
      address: [createAddressInput(location, address.primaryAddress)]
    },
    father: {
      name: [
        {
          use: 'en',
          familyName: familyName
        }
      ]
    },
    mother: {
      name: [
        {
          use: 'en',
          familyName: familyName
        }
      ]
    }
  }

  const createDeclarationRes = await fetch(`${GATEWAY_HOST}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-correlation-id': `declare-death-${firstNames}-${familyName}`
    },
    body: JSON.stringify({
      variables: {
        details
      },
      query: CREATE_DEATH_DECLARATION
    })
  })
  const requestEnd = Date.now()
  log(
    'Creating a death declaration for',
    firstNames,
    familyName,
    'born',
    birthDate.toISOString().split('T')[0],
    'died',
    deathDay.toISOString().split('T')[0],
    'declared',
    declarationTime.toISOString().split('T')[0],
    'days in between',
    differenceInDays(declarationTime, deathDay),
    'created by',
    username,
    `(took ${requestEnd - requestStart}ms)`
  )
  const result = (await createDeclarationRes.json()) as {
    data: CreateDeathDeclarationMutation
  }
  if (!result?.data?.createDeathRegistration?.compositionId) {
    log(result)

    throw new Error('Death declaration was not created')
  }
  return result.data.createDeathRegistration.compositionId
}

export async function fetchRegistration(user: User, compositionId: string) {
  const fetchDeclarationRes = await fetch(`${GATEWAY_HOST}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user.token}`,
      'x-correlation-id': `fetch-declaration-${compositionId}`
    },
    body: JSON.stringify({
      query: FETCH_REGISTRATION_QUERY,
      variables: {
        id: compositionId
      }
    })
  })

  const res = (await fetchDeclarationRes.json()) as {
    data: FetchBirthRegistrationQuery
  }
  if (!res.data?.fetchBirthRegistration) {
    throw new Error(
      `Fetching birth declaration data for ${compositionId} failed`
    )
  }

  return res.data.fetchBirthRegistration
}

export async function fetchDeathRegistration(
  user: User,
  compositionId: string
) {
  const fetchDeclarationRes = await fetch(`${GATEWAY_HOST}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user.token}`,
      'x-correlation-id': `fetch-declaration-${compositionId}`
    },
    body: JSON.stringify({
      query: FETCH_DEATH_REGISTRATION_QUERY,
      variables: {
        id: compositionId
      }
    })
  })

  const res = (await fetchDeclarationRes.json()) as {
    data: FetchDeathRegistrationQuery
  }
  if (!res.data?.fetchDeathRegistration) {
    throw new Error(
      `Fetching death declaration data for ${compositionId} failed`
    )
  }

  return res.data.fetchDeathRegistration
}

export async function fetchAlreadyGeneratedInterval(
  token: string,
  locationId: string
): Promise<Date[]> {
  const fetchFirst = async (sort: 'desc' | 'asc') => {
    const res = await fetch(`${GATEWAY_HOST}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-correlation-id': `fetch-interval-oldest`
      },
      body: JSON.stringify({
        query: SEARCH_EVENTS,
        variables: {
          sort,
          advancedSearchParameters: {
            declarationJurisdictionId: locationId
          }
        }
      })
    })
    const body = (await res.json()) as {
      data: SearchEventsQuery
      errors: any[]
    }

    if (body.errors) {
      log(body.errors)
      throw new Error('Fetching generated intervals failed')
    }

    const data = body.data

    return data.searchEvents?.results?.map(
      (d) => new Date(d!.registration!.dateOfDeclaration)
    )[0]
  }

  return (await Promise.all([fetchFirst('asc'), fetchFirst('desc')])).filter(
    (x): x is Date => Boolean(x)
  )
}
