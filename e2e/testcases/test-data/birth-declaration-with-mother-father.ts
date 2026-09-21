import { v4 as uuidv4 } from 'uuid'
import { GATEWAY_HOST } from '../../constants'
import { faker } from '@faker-js/faker'
import { getAllLocations, getLocationIdByName } from '../birth/helpers'
import { createClient } from '@opencrvs/toolkit/api'
import {
  ActionDocument,
  ActionType,
  ActionUpdate,
  AddressType
} from '@opencrvs/toolkit/events'
import { getSignatureFile, uploadFile } from './utils'
import { subYears, format } from 'date-fns'

type InformantRelation = 'MOTHER' | 'BROTHER'

function getInformantDetails(informantRelation: InformantRelation) {
  if (informantRelation === 'MOTHER') {
    return {
      'informant.relation': informantRelation,
      'informant.email': 'mothers@email.com'
    }
  }

  return {
    'informant.relation': informantRelation,
    'informant.email': 'brothers@email.com',
    'informant.name': {
      firstname: faker.person.firstName(),
      surname: faker.person.lastName()
    },
    'informant.dob': '2008-09-12',
    'informant.nationality': 'FAR',
    'informant.idType': 'NATIONAL_ID',
    'informant.nid': faker.string.numeric(10)
  }
}

async function getPlaceOfBirth(type: 'PRIVATE_HOME' | 'HEALTH_FACILITY') {
  if (type === 'HEALTH_FACILITY') {
    const locations = await getAllLocations('HEALTH_FACILITY')
    const locationId = getLocationIdByName(
      locations,
      'Ibombo Rural Health Centre'
    )

    return {
      'child.placeOfBirth': 'HEALTH_FACILITY',
      'child.birthLocation': locationId
    }
  }

  if (type === 'PRIVATE_HOME') {
    const locations = await getAllLocations('ADMIN_STRUCTURE')
    const district = getLocationIdByName(locations, 'Ibombo')

    if (!district) {
      throw new Error('District not found')
    }

    return {
      'child.placeOfBirth': 'PRIVATE_HOME',
      'child.birthLocation.privateHome': {
        country: 'FAR',
        addressType: AddressType.DOMESTIC,
        administrativeArea: district,
        streetLevelDetails: { town: 'Dhaka' }
      }
    }
  }

  throw new Error('Invalid place of birth type')
}

export async function getDeclaration({
  informantRelation = 'MOTHER',
  partialDeclaration = {},
  placeOfBirthType = 'PRIVATE_HOME'
}: {
  informantRelation?: InformantRelation
  partialDeclaration?: any
  placeOfBirthType?: 'PRIVATE_HOME' | 'HEALTH_FACILITY'
}) {
  const locations = await getAllLocations('ADMIN_STRUCTURE')
  const province = getLocationIdByName(locations, 'Central')
  const district = getLocationIdByName(locations, 'Ibombo')

  if (!province || !district) {
    throw new Error('Province or district not found')
  }

  const mockDeclaration = {
    'father.detailsNotAvailable': true,
    // Add default reason if: (a) user didn’t specify 'father.detailsNotAvailable', or (b) specified it but forgot the reason
    ...(!('father.detailsNotAvailable' in partialDeclaration) ||
    (partialDeclaration['father.detailsNotAvailable'] === true &&
      !('father.reason' in partialDeclaration))
      ? { 'father.reason': 'Father is missing.' }
      : {}),
    'mother.name': {
      firstname: faker.person.firstName(),
      surname: faker.person.lastName()
    },
    'mother.dob': '1995-09-12',
    'mother.dobUnknown': false,
    'mother.nationality': 'FAR',
    'mother.idType': 'NATIONAL_ID',
    'mother.educationalAttainment': 'NO_SCHOOLING',
    'mother.maritalStatus': 'MARRIED',
    'mother.nid': faker.string.numeric(10),
    'mother.address': {
      country: 'FAR',
      administrativeArea: district,
      addressType: AddressType.DOMESTIC
    },
    'child.name': {
      firstname: faker.person.firstName(),
      surname: faker.person.lastName()
    },
    'child.gender': 'female',
    'child.dob': new Date(Date.now() - 60 * 60 * 24 * 1000)
      .toISOString()
      .split('T')[0], // yesterday
    ...(await getPlaceOfBirth(placeOfBirthType)),
    ...getInformantDetails(informantRelation)
  }

  // 💡 Merge overriden fields
  return {
    ...mockDeclaration,
    ...('father.detailsNotAvailable' in partialDeclaration &&
      !partialDeclaration['father.detailsNotAvailable'] && {
        'father.detailsNotAvailable': false,
        'father.name': {
          firstname: faker.person.firstName('male'),
          surname: faker.person.lastName('male')
        },
        'father.dob': format(subYears(new Date(), 30), 'yyyy-MM-dd'),
        'father.idType': 'NATIONAL_ID',
        'father.nid': faker.string.numeric(10),
        'father.nationality': 'FAR',
        'father.maritalStatus': 'SINGLE',
        'father.educationalAttainment': 'NONE',
        'father.occupation': 'Unemployed',
        ...(partialDeclaration['father.addressSameAs'] === 'NO' && {
          'father.address': {
            country: 'FAR',
            addressType: 'DOMESTIC' as const,
            province,
            district,
            urbanOrRural: 'URBAN' as const
          }
        })
      }),
    ...partialDeclaration
  }
}

export type Declaration = Awaited<ReturnType<typeof getDeclaration>>

export interface CreateDeclarationResponse {
  eventId: string
  declaration: Declaration
  trackingId?: string
  registrationNumber?: string
}

export async function createDeclaration(
  token: string,
  dec?: Partial<ActionUpdate>,
  action: ActionType = ActionType.REGISTER,
  placeOfBirthType?: 'PRIVATE_HOME' | 'HEALTH_FACILITY'
): Promise<CreateDeclarationResponse> {
  const declaration = await getDeclaration({
    partialDeclaration: dec,
    placeOfBirthType
  })

  const client = createClient(GATEWAY_HOST + '/events', `Bearer ${token}`)

  const createResponse = await client.event.create.mutate({
    type: 'birth',
    transactionId: uuidv4()
  })

  const eventId = createResponse.id as string

  const filename = await uploadFile(getSignatureFile(), token)

  const annotation = {
    'review.comment': 'My comment',
    'review.signature': filename
  }
  const declareRes = await client.event.actions.declare.request.mutate({
    eventId: eventId,
    transactionId: uuidv4(),
    declaration,
    annotation,
    keepAssignment: action !== ActionType.DECLARE
  })

  if (action === ActionType.DECLARE) {
    const declareAction = declareRes.actions.find(
      (action: ActionDocument) => action.type === 'DECLARE'
    )

    if (!declareAction || !('declaration' in declareAction)) {
      throw new Error('Declaration info not found in action')
    }

    return {
      eventId,
      declaration: declareAction?.declaration as Declaration
    }
  }

  const validateRes = await client.event.actions.validate.request.mutate({
    eventId: eventId,
    transactionId: uuidv4(),
    declaration,
    annotation,
    duplicates: [],
    keepAssignment: true
  })

  if (action === ActionType.VALIDATE) {
    const validateAction = validateRes.actions.find(
      (action: ActionDocument) => action.type === 'VALIDATE'
    )

    return {
      eventId,
      declaration: validateAction?.declaration as Declaration
    }
  }

  const registerRes = await client.event.actions.register.request.mutate({
    eventId: eventId,
    transactionId: uuidv4(),
    declaration,
    annotation
  })

  const registerAction = registerRes.actions.find(
    (action: ActionDocument) =>
      action.type === 'REGISTER' && action.status === 'Accepted'
  )

  const registerRequestAction = registerRes.actions.find(
    (action: ActionDocument) =>
      action.type === 'REGISTER' && action.status === 'Requested'
  )

  const trackingId = registerRes?.trackingId as string
  const registrationNumber = registerAction?.registrationNumber as string

  return {
    eventId,
    declaration: registerRequestAction?.declaration as Declaration,
    trackingId,
    registrationNumber
  }
}

export async function rejectDeclaration(
  token: string,
  eventId: string
): Promise<any> {
  const client = createClient(GATEWAY_HOST + '/events', `Bearer ${token}`)

  const rejectResponse = await client.event.actions.reject.request.mutate({
    eventId,
    declaration: {},
    transactionId: uuidv4(),
    reason: { message: 'For test' }
  })

  return rejectResponse
}
