import fetch from 'node-fetch'
import gql from 'graphql-tag'
import { print } from 'graphql/language/printer'

import { COUNTRY_CONFIG_HOST, GATEWAY_HOST } from './constants'
import { GetTotalMetricsQuery } from './gateway'

type StatisticUrls =
  | 'http://opencrvs.org/specs/id/statistics-male-populations'
  | 'http://opencrvs.org/specs/id/statistics-female-populations'
  | 'http://opencrvs.org/specs/id/statistics-total-populations'
  | 'http://opencrvs.org/specs/id/statistics-male-female-ratios'
  | 'http://opencrvs.org/specs/id/statistics-crude-birth-rates'

export type DistrictStatistic = {
  id: string
  statistics: Record<StatisticUrls, { [year: string]: number }>
}
type Statistics = Array<DistrictStatistic>

export async function getStatistics(token: string): Promise<Statistics> {
  const res = await fetch(`${COUNTRY_CONFIG_HOST}/statistics`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-correlation-id': 'statistics-' + Date.now().toString()
    }
  })
  return await res.json()
}

export const TOTAL_METRICS = print(gql`
  query getTotalMetrics(
    $event: String!
    $timeStart: String!
    $timeEnd: String!
    $locationId: String
  ) {
    getTotalMetrics(
      timeStart: $timeStart
      timeEnd: $timeEnd
      locationId: $locationId
      event: $event
    ) {
      estimated {
        totalEstimation
        maleEstimation
        femaleEstimation
        locationId
        locationLevel
        __typename
      }
      results {
        total
        gender
        eventLocationType
        practitionerRole
        timeLabel
        __typename
      }
      __typename
    }
  }
`)

export async function getLocationMetrics(
  token: string,
  timeStart: Date,
  timeEnd: Date,
  locationId: string,
  type: 'BIRTH' | 'DEATH'
) {
  const res = await fetch(`${GATEWAY_HOST}/graphql`, {
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      operationName: 'getTotalMetrics',
      variables: {
        timeStart: timeStart.toISOString(),
        timeEnd: timeEnd.toISOString(),
        event: type,
        locationId
      },
      query: TOTAL_METRICS
    }),
    method: 'POST'
  })

  const body = (await res.json()) as {
    data: GetTotalMetricsQuery
    errors: any[]
  }

  if (
    (body.errors && body.errors.length > 0) ||
    body.data?.getTotalMetrics == null
  ) {
    throw new Error(body.errors[0].message)
  }

  return body.data.getTotalMetrics
}
