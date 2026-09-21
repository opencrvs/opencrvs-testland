import fetch from 'node-fetch'
import { URL } from 'url'
import { CONFIG_HOST, COUNTRY_CONFIG_HOST } from './constants'

export async function getConfig(token: string): Promise<ConfigResponse> {
  const res = await fetch(new URL('/config', CONFIG_HOST).href, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${token}`
    }
  })

  if (!res.ok) {
    throw new Error(`Could not fetch config, ${res.statusText} ${res.status}`)
  }

  return res.json()
}

export async function getCountryAlpha3(): Promise<string> {
  const res = await fetch(
    new URL('/client-config.js', COUNTRY_CONFIG_HOST).href
  )
  if (!res.ok) {
    throw new Error(`Could not fetch config, ${res.statusText} ${res.status}`)
  }

  return Function(
    `let window={}; ${await res.text()} ; return window.config.COUNTRY`
  )()
}

export interface ConfigResponse {
  config: Config
  certificates: Certificate[]
  formConfig: FormConfig
}

interface Certificate {
  _id: string
  svgCode: string
  svgFilename: string
  user: string
  event: string
  status: string
  svgDateUpdated: number
  svgDateCreated: number
}

interface Config {
  APPLICATION_NAME: string
  FIELD_AGENT_AUDIT_LOCATIONS: string
  DECLARATION_AUDIT_LOCATIONS: string
  HIDE_EVENT_REGISTER_INFORMATION: boolean
  ADDRESSES: number
  _id: string
  BIRTH: Birth
  COUNTRY_LOGO: CountryLogo
  CURRENCY: Currency
  DEATH: Death
  PHONE_NUMBER_PATTERN: string
  NID_NUMBER_PATTERN: string
}

interface Birth {
  FEE: BirthFee
  REGISTRATION_TARGET: number
  LATE_REGISTRATION_TARGET: number
  _id: string
}

interface BirthFee {
  ON_TIME: number
  LATE: number
  DELAYED: number
}

interface CountryLogo {
  _id: string
  fileName: string
  file: string
}

interface Currency {
  languagesAndCountry: string[]
  _id: string
  isoCode: string
}

interface Death {
  FEE: DeathFee
  REGISTRATION_TARGET: number
  _id: string
}

interface DeathFee {
  ON_TIME: number
  DELAYED: number
}

interface FormConfig {
  questionConfig: any[]
  formDrafts: any[]
}
