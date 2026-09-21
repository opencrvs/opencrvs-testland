import { faker } from '@faker-js/faker'
import { Location } from './location'

export function createAddressInput(location: Location, type: string) {
  return {
    country: 'FAR',
    state: location.partOf.split('/')[1],
    district: location.id,
    city: faker.location.city(),
    postalCode: faker.location.zipCode(),
    type,
    line: [
      faker.location.streetAddress(),
      faker.location.zipCode(),
      'URBAN',
      '',
      '',
      'URBAN'
    ]
  }
}
