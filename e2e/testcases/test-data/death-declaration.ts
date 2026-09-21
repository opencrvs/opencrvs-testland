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
import { omitBy } from 'lodash'

async function getPlaceOfDeath(
  type: 'DECEASED_USUAL_RESIDENCE' | 'HEALTH_FACILITY'
) {
  if (type === 'HEALTH_FACILITY') {
    const locations = await getAllLocations('HEALTH_FACILITY')
    const locationId = getLocationIdByName(
      locations,
      'Ibombo Rural Health Centre'
    )

    return {
      'deceased.deathLocation': locationId
    }
  }

  if (type === 'DECEASED_USUAL_RESIDENCE') {
    const locations = await getAllLocations('ADMIN_STRUCTURE')
    const province = getLocationIdByName(locations, 'Central')
    const district = getLocationIdByName(locations, 'Ibombo')

    if (!province || !district) {
      throw new Error('Province or district not found')
    }

    return {
      'deceased.address': {
        country: 'FAR',
        addressType: AddressType.DOMESTIC,
        administrativeArea: district
      }
    }
  }

  throw new Error('Invalid place of birth type')
}

export async function getDeclaration({
  partialDeclaration = {},
  placeOfDeathType: placeOfDeathType = 'DECEASED_USUAL_RESIDENCE'
}: {
  partialDeclaration?:
    | ((_: Record<string, any>) => Record<string, any>)
    | Record<string, any>
  placeOfDeathType?: 'DECEASED_USUAL_RESIDENCE' | 'HEALTH_FACILITY'
}) {
  const locations = await getAllLocations('ADMIN_STRUCTURE')
  const province = getLocationIdByName(locations, 'Central')
  const district = getLocationIdByName(locations, 'Ibombo')

  if (!province || !district) {
    throw new Error('Province or district not found')
  }

  const mockDeclaration = {
    'spouse.dob': '1975-02-18',
    'spouse.age': undefined,
    'spouse.nid': faker.string.numeric(10),
    'spouse.name': {
      firstname: faker.person.firstName('female'),
      surname: faker.person.lastName('female')
    },
    'deceased.dob': '1950-04-21',
    'deceased.nid': faker.string.numeric(10),
    'deceased.name': {
      firstname: faker.person.firstName('male'),
      surname: faker.person.lastName('male')
    },
    'spouse.idType': 'NATIONAL_ID',
    'deceased.gender': 'male',
    'deceased.idType': 'NATIONAL_ID',
    'informant.email': faker.internet.email(),
    'eventDetails.date': new Date(Date.now() - 60 * 60 * 24 * 1000)
      .toISOString()
      .split('T')[0], // yesterday
    'informant.relation': 'SPOUSE',
    'spouse.nationality': 'FAR',
    'deceased.nationality': 'FAR',
    'spouse.addressSameAs': 'YES',
    'deceased.maritalStatus': 'MARRIED',
    'eventDetails.placeOfDeath': placeOfDeathType,
    'eventDetails.mannerOfDeath': 'MANNER_NATURAL',
    'deceased.numberOfDependants': 3,
    'eventDetails.sourceCauseDeath': 'PHYSICIAN',
    'eventDetails.causeOfDeathEstablished': true,
    ...(await getPlaceOfDeath(placeOfDeathType))
  }

  const overrides =
    typeof partialDeclaration === 'function'
      ? partialDeclaration(mockDeclaration)
      : partialDeclaration

  // 💡 Merge overriden fields, clear payload
  return omitBy(
    {
      ...mockDeclaration,
      ...overrides
    },
    (d) => d === undefined
  ) as typeof mockDeclaration
}

export type Declaration = Awaited<ReturnType<typeof getDeclaration>>

export interface CreateDeclarationResponse {
  eventId: string
  declaration: Declaration
}

export async function createDeclaration(
  token: string,
  dec?: ((_: ActionUpdate) => Partial<ActionUpdate>) | Partial<ActionUpdate>,
  action: ActionType = ActionType.REGISTER,
  placeOfDeathType?: 'DECEASED_USUAL_RESIDENCE' | 'HEALTH_FACILITY'
): Promise<CreateDeclarationResponse> {
  const declaration = await getDeclaration({
    partialDeclaration: dec,
    placeOfDeathType: placeOfDeathType
  })

  const client = createClient(GATEWAY_HOST + '/events', `Bearer ${token}`)

  const createResponse = await client.event.create.mutate({
    type: 'death',
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

    return { eventId, declaration: declareAction?.declaration as Declaration }
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
    (action: ActionDocument) => action.type === 'REGISTER'
  )

  return { eventId, declaration: registerAction?.declaration as Declaration }
}
