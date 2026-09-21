import { ILocation } from '@countryconfig/utils'
import fetch from 'node-fetch'
import { GATEWAY_HOST } from './constants'

export type Location = {
  id: string
  name: string
  alias: string
  physicalType: string
  jurisdictionType?: string
  type: string
  partOf: string
}
export type Facility = {
  id: string
  name: string
  alias: string
  address: string
  physicalType: string
  type: string
  partOf: string
}

export async function getLocations() {
  const url = `${GATEWAY_HOST}/location?type=ADMIN_STRUCTURE&_count=0`

  const res = await fetch(url, {
    method: 'GET'
  })

  if (res && res.status !== 200) {
    throw Error(res.statusText)
  }

  const response = await res.json()
  const locations = {
    data: response.entry.reduce(
      (accumulator: { [key: string]: ILocation }, entry: fhir.BundleEntry) => {
        if (!entry.resource || !entry.resource.id) {
          throw new Error('Resource in entry not valid')
        }

        accumulator[entry.resource.id] = generateLocationResource(
          entry.resource as fhir.Location
        )

        return accumulator
      },
      {}
    )
  }
  return Object.values<Location>(locations.data).filter(
    ({ partOf }: any) => partOf !== 'Location/0'
  )
}

export async function getFacilities() {
  const resCRVSOffices = await fetch(
    `${GATEWAY_HOST}/location?type=CRVS_OFFICE&_count=0`
  )
  const resHealthFacilities = await fetch(
    `${GATEWAY_HOST}/location?type=HEALTH_FACILITY&_count=0`
  )

  const locationBundleCRVSOffices = await resCRVSOffices.json()
  const locationBundleHealthFacilities = await resHealthFacilities.json()

  const facilities = locationBundleCRVSOffices.entry.reduce(
    (accumulator: { [key: string]: ILocation }, entry: fhir.BundleEntry) => {
      if (!entry.resource || !entry.resource.id) {
        throw new Error('Resource in entry not valid')
      }

      accumulator[entry.resource.id] = generateLocationResource(
        entry.resource as fhir.Location
      )
      return accumulator
    },
    {}
  )

  locationBundleHealthFacilities.entry.reduce(
    (accumulator: { [key: string]: ILocation }, entry: fhir.BundleEntry) => {
      if (!entry.resource || !entry.resource.id) {
        throw new Error('Resource in entry not valid')
      }

      accumulator[entry.resource.id] = generateLocationResource(
        entry.resource as fhir.Location
      )
      return accumulator
    },
    facilities
  )
  return Object.values<Facility>(facilities)
}

export function generateLocationResource(
  fhirLocation: fhir.Location
): ILocation {
  const loc = {} as ILocation
  loc.id = fhirLocation.id
  loc.name = fhirLocation.name
  loc.alias =
    fhirLocation.alias && fhirLocation.alias[0] ? fhirLocation.alias[0] : ''
  loc.status = fhirLocation.status
  loc.physicalType =
    fhirLocation.physicalType &&
    fhirLocation.physicalType.coding &&
    fhirLocation.physicalType.coding[0].display
      ? fhirLocation.physicalType.coding[0].display
      : ''
  loc.type =
    fhirLocation.type &&
    fhirLocation.type.coding &&
    fhirLocation.type.coding[0].code
      ? fhirLocation.type.coding[0].code
      : ''
  loc.partOf =
    fhirLocation.partOf && fhirLocation.partOf.reference
      ? fhirLocation.partOf.reference
      : ''
  return loc
}
