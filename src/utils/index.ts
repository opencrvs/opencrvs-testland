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

import fetch from 'node-fetch'
import { APPLICATION_CONFIG_URL, FHIR_URL } from '@countryconfig/constants'
import { callingCountries } from 'country-data'
import csv2json from 'csv2json'
import { createReadStream } from 'fs'
import fs from 'fs'
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber'
import { URL } from 'url'
import { build } from 'esbuild'
import { memoize } from 'lodash'
export const GENERATE_TYPE_RN = 'registrationNumber'
export const CHILD_CODE = 'child-details'
export const DECEASED_CODE = 'deceased-details'
export const OPENCRVS_SPECIFICATION_URL = 'http://opencrvs.org/specs/'
import { join } from 'path'
import { stringify } from 'csv-stringify/sync'
import { promisify } from 'util'

export interface ILocation {
  id?: string
  name?: string
  alias?: string
  status?: string
  address?: string
  physicalType?: string
  jurisdictionType?: string
  type?: string
  partOf?: string
  statistics: Array<{ name: string; year: number; value: number }>
}

interface ILoginBackground {
  backgroundColor: string
  backgroundImage: string
  imageFit: string
}
interface ICountryLogo {
  fileName: string
  file: string
}

export interface IApplicationConfig {
  APPLICATION_NAME: string
  COUNTRY: string
  COUNTRY_LOGO: ICountryLogo
  LOGIN_BACKGROUND: ILoginBackground
  USER_NOTIFICATION_DELIVERY_METHOD: string
  INFORMANT_NOTIFICATION_DELIVERY_METHOD: string
}
export interface IApplicationConfigResponse {
  config: IApplicationConfig
}

export function getCompositionId(resBody: fhir.Bundle) {
  const id = resBody.entry
    ?.map((e) => e.resource)
    .find((res) => res?.resourceType === 'Composition')?.id

  if (!id) {
    throw new Error('Could not find composition id in FHIR Bundle')
  }

  return id
}

export function getTaskResource(
  bundle: fhir.Bundle & fhir.BundleEntry
): fhir.Task | undefined {
  if (
    !bundle ||
    bundle.type !== 'document' ||
    !bundle.entry ||
    !bundle.entry[0] ||
    !bundle.entry[0].resource
  ) {
    throw new Error('Invalid FHIR bundle found')
  }

  if (bundle.entry[0].resource.resourceType === 'Composition') {
    return getTaskResourceFromFhirBundle(bundle as fhir.Bundle)
  } else if (bundle.entry[0].resource.resourceType === 'Task') {
    return bundle.entry[0].resource as fhir.Task
  } else {
    throw new Error('Unable to find Task Bundle from the provided data')
  }
}

export function getTaskResourceFromFhirBundle(fhirBundle: fhir.Bundle) {
  const taskEntry =
    fhirBundle.entry &&
    fhirBundle.entry.find((entry: fhir.BundleEntry) => {
      if (entry.resource && entry.resource.resourceType === 'Task') {
        return true
      }
      return false
    })

  return taskEntry && (taskEntry.resource as fhir.Task)
}

export function getTrackingIdFromTaskResource(taskResource: fhir.Task) {
  const trackingIdentifier =
    taskResource &&
    taskResource.identifier &&
    taskResource.identifier.find((identifier) => {
      return (
        identifier.system ===
          `${OPENCRVS_SPECIFICATION_URL}id/birth-tracking-id` ||
        identifier.system ===
          `${OPENCRVS_SPECIFICATION_URL}id/death-tracking-id` ||
        identifier.system ===
          `${OPENCRVS_SPECIFICATION_URL}id/marriage-tracking-id`
      )
    })
  if (!trackingIdentifier || !trackingIdentifier.value) {
    throw new Error("Didn't find any identifier for tracking id")
  }
  return trackingIdentifier.value
}

export const getFromFhir = (suffix: string) => {
  return fetch(`${FHIR_URL}${suffix.startsWith('/') ? '' : '/'}${suffix}`, {
    headers: {
      'Content-Type': 'application/json+fhir'
    }
  })
    .then((response) => {
      return response.json()
    })
    .catch((error) => {
      return Promise.reject(new Error(`FHIR request failed: ${error.message}`))
    })
}

export async function updateResourceInHearth(resource: fhir.ResourceBase) {
  const res = await fetch(
    `${FHIR_URL}/${resource.resourceType}/${resource.id}`,
    {
      method: 'PUT',
      body: JSON.stringify(resource),
      headers: {
        'Content-Type': 'application/fhir+json'
      }
    }
  )
  if (!res.ok) {
    throw new Error(
      `FHIR update to ${resource.resourceType} failed with [${
        res.status
      }] body: ${await res.text()}`
    )
  }

  return res.text()
}

export const convertToMSISDN = (phone: string, countryAlpha3: string) => {
  const countryCode = callingCountries[countryAlpha3.toUpperCase()].alpha2

  const phoneUtil = PhoneNumberUtil.getInstance()
  const number = phoneUtil.parse(phone, countryCode)

  return (
    phoneUtil
      .format(number, PhoneNumberFormat.INTERNATIONAL)
      // libphonenumber adds spaces and dashes to phone numbers,
      // which we do not want to keep for now
      .replace(/[\s-]/g, '')
  )
}

export async function writeJSONToCSV(
  filename: string,
  data: Array<Record<string, any>>
) {
  const csv = stringify(data, {
    header: true
  })
  return fs.promises.writeFile(filename, csv, 'utf8')
}

export async function readCSVToJSON<T>(filename: string) {
  return new Promise<T>((resolve, reject) => {
    const chunks: string[] = []
    createReadStream(filename)
      .on('error', reject)
      .pipe(
        csv2json({
          separator: ','
        })
      )
      .on('data', (chunk) => chunks.push(chunk))
      .on('error', reject)
      .on('end', () => {
        resolve(JSON.parse(chunks.join('')))
      })
  })
}

export async function getApplicationConfig() {
  const configURL = new URL('publicConfig', APPLICATION_CONFIG_URL).toString()
  const res = await fetch(configURL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  const configData = (await res.json()) as IApplicationConfigResponse
  return configData.config
}

export const buildTypeScriptToJavaScript = memoize(async (path: string) => {
  const result = await build({
    entryPoints: [path],
    write: false,
    loader: { '.ts': 'ts' },
    format: 'esm',
    platform: 'browser'
  })

  return result.outputFiles[0].text
})

type Year = {
  year: number
  male_population: number
  female_population: number
  population: number
  crude_birth_rate: number
}

export type LocationStatistic = {
  id: string
  name: string
  years: Year[]
}

export async function getStatistics(path?: string) {
  if (!path) {
    path = join(__dirname, '../data-seeding/locations/source/statistics.csv')
  }
  const data =
    await readCSVToJSON<Array<Record<string, string> & { adminPcode: string }>>(
      path
    )

  return data.map<LocationStatistic>((item) => {
    const { adminPcode, name, ...yearKeys } = item
    return {
      id: adminPcode,
      name,
      years: Object.keys(yearKeys)
        .map((key) => key.split('_').pop())
        .map(Number)
        .filter((value, index, list) => list.indexOf(value) == index)
        .map((year) => ({
          year,
          male_population: parseFloat(yearKeys[`male_population_${year}`]),
          female_population: parseFloat(yearKeys[`female_population_${year}`]),
          population: parseFloat(yearKeys[`population_${year}`]),
          crude_birth_rate: parseFloat(yearKeys[`crude_birth_rate_${year}`])
        }))
    }
  })
}

export const extractStatisticsMap = (statistics: LocationStatistic[]) => {
  const statisticsMap: Map<string, LocationStatistic> = new Map()
  for (const stat of statistics) {
    statisticsMap.set(stat.id, stat)
  }
  return statisticsMap
}

export function createCustomFieldHandlebarName(fieldId: string) {
  const fieldIdNameArray = fieldId.split('.').map((field, index) => {
    if (index !== 0) {
      return field.charAt(0).toUpperCase() + field.slice(1)
    } else {
      return field
    }
  })

  return `${fieldIdNameArray[0]}${fieldIdNameArray[1]}${
    fieldIdNameArray[fieldIdNameArray.length - 1]
  }`
}

export function uppercaseFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
