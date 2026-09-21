import { faker } from '@faker-js/faker'
import { log } from './util'
import { Facility, getFacilities, Location } from './location'
import fetch from 'node-fetch'
import { getToken, getTokenForSystemClient } from './auth'
import { GATEWAY_HOST } from './constants'
import { expand } from 'regex-to-strings'
import { convertToMSISDN } from '@countryconfig/utils'
import { readFileSync } from 'fs'
import { join } from 'path'
import { MutationCreateOrUpdateUserArgs } from './gateway'
import { getSystemRolesQuery } from '@countryconfig/data-generator/queries'
import { SystemRole as GQLSystemRole } from '@countryconfig/data-generator/gateway'

export type User = {
  username: string
  password: string
  token: string
  stillInUse: boolean
  primaryOfficeId: string
  isSystemUser: boolean
}

type Config = {
  fieldAgents: number
  hospitalFieldAgents: number
  registrationAgents: number
  localRegistrars: number
}

enum SystemRole {
  NationalSystemAdmin = 'NATIONAL_SYSTEM_ADMIN',
  FieldAgent = 'FIELD_AGENT',
  LocalRegistrar = 'LOCAL_REGISTRAR',
  LocalSystemAdmin = 'LOCAL_SYSTEM_ADMIN',
  RegistrationAgent = 'REGISTRATION_AGENT',
  NationalRegistrar = 'NATIONAL_REGISTRAR',
  StateRegistrar = 'STATE_REGISTRAR',
  DistrictRegistrar = 'DISTRICT_REGISTRAR'
}

interface ISystemInfo {
  clientId: string
  shaSecret: string
}

const nationalSystemAdmin: User[] = []

const SIGNATURE = readFileSync(
  join(__dirname, 'assets', '528KB-random.png')
).toString('base64')

export async function getAgentRoles(token: string): Promise<GQLSystemRole[]> {
  const res = await fetch(`${GATEWAY_HOST}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      query: getSystemRolesQuery,
      variables: {
        active: true
      }
    })
  })

  if (!res.ok) {
    throw new Error(
      `Could not fetch agent roles, ${res.statusText} ${res.status}`
    )
  }
  const roles = await res.json()
  return roles.data.getSystemRoles
}

export async function createUser(
  token: string,
  primaryOfficeId: string,
  countryAlpha3: string,
  phoneNumberRegex: string,
  overrides: Record<string, string>
) {
  const firstName = faker.person.firstName()
  const familyName = faker.person.lastName()
  log('Creating user', firstName, familyName, overrides)

  const phoneNumberExpander = expand(phoneNumberRegex)
  const generatedPhoneNumber = phoneNumberExpander.getIterator().next().value
  countryAlpha3 = countryAlpha3.toUpperCase() === 'FAR' ? 'ZMB' : countryAlpha3

  const user: Partial<MutationCreateOrUpdateUserArgs['user']> = {
    name: [
      {
        use: 'en',
        firstNames: firstName,
        familyName: familyName
      }
    ],
    identifier: [
      {
        system: 'NATIONAL_ID',
        value: faker.number
          .bigInt({ min: 100000000, max: 999999999 })
          .toString()
      }
    ],
    username:
      firstName.toLocaleLowerCase() + '.' + familyName.toLocaleLowerCase(),
    mobile: convertToMSISDN(generatedPhoneNumber, countryAlpha3),
    email: faker.internet.email({ provider: 'example.com' }),
    primaryOffice: primaryOfficeId,
    ...overrides
  }

  if (
    overrides?.systemRole === SystemRole.LocalRegistrar ||
    overrides?.systemRole === SystemRole.RegistrationAgent
  ) {
    user.signature = {
      data: 'data:image/png;base64,' + SIGNATURE,
      type: 'image/png'
    }
  }

  const createUserRes = await fetch(`${GATEWAY_HOST}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-correlation-id': `createuser-${firstName}-${familyName}`
    },
    body: JSON.stringify({
      query: `
      mutation createOrUpdateUser($user: UserInput!) {
        createOrUpdateUser(user: $user) {
          username
          id
        }
      }
    `,
      variables: { user }
    })
  })

  const resp = await createUserRes.json()

  log('User created')
  const { data } = resp as {
    data: { createOrUpdateUser: { username: string; id: string } }
  }

  const userToken = await getToken(data.createOrUpdateUser.username, 'test')

  const res = await fetch(`${GATEWAY_HOST}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
      'x-correlation-id': `createuser-${firstName}-${familyName}`
    },
    body: JSON.stringify({
      query: `
      mutation activateUser($userId: String!, $password: String!, $securityQNAs: [SecurityQuestionAnswer]!) {
        activateUser(userId: $userId, password: $password, securityQNAs: $securityQNAs)
      }
    `,
      variables: {
        userId: data.createOrUpdateUser.id,
        password: 'test',
        securityQNAs: []
      }
    })
  })

  if (res.status !== 200) {
    throw new Error('Could not activate user')
  }

  return {
    ...data.createOrUpdateUser,
    token: userToken,
    primaryOfficeId,
    stillInUse: true,
    password: 'test',
    isSystemUser: false
  }
}

export async function getUsers(token: string, locationId: string) {
  const getUsersRes = await fetch(`${GATEWAY_HOST}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-correlation-id': `getusers`
    },
    body: JSON.stringify({
      operationName: null,
      variables: {
        locationId: locationId,
        count: 100
      },
      query: `
        query ($count: Int, $skip: Int, $locationId: String) {
          searchUsers(count: $count, skip: $skip, locationId: $locationId) {
            totalItems
            results {
              id
              primaryOffice {
                id
              }
              username
              systemRole
            }
          }
        }
      `
    })
  })

  const res = (await getUsersRes.json()) as {
    data: {
      searchUsers: {
        results: Array<{
          username: string
          systemRole: SystemRole
          role: string
          primaryOffice: { id: string }
        }>
      }
    }
  }

  return res.data.searchUsers.results
}

export async function getUserByRole(token: string, systemRole: string) {
  const getUsersRes = await fetch(`${GATEWAY_HOST}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-correlation-id': `getusers`
    },
    body: JSON.stringify({
      operationName: null,
      variables: {
        systemRole,
        count: 100
      },
      query: `
        query ($count: Int, $skip: Int, $systemRole: String) {
          searchUsers(count: $count, skip: $skip, systemRole: $systemRole) {
            totalItems
            results {
              id
              primaryOffice {
                id
              }
              username
              systemRole
            }
          }
        }
      `
    })
  })

  const res = (await getUsersRes.json()) as {
    data: {
      searchUsers: {
        results: Array<{
          username: string
          systemRole: SystemRole
          role: string
          primaryOffice: { id: string }
        }>
      }
    }
  }

  return res.data.searchUsers.results
}

const registerSystemClient = async (
  name: string,
  type: string,
  token: string
) => {
  const createUserRes = await fetch(`${GATEWAY_HOST}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      query: `
      mutation registerSystem($system: SystemInput) {
        registerSystem(system: $system) {
          clientSecret
          system {
            clientId
            shaSecret
          }
        }
      }
    `,
      variables: { system: { name, type } }
    })
  })

  return await createUserRes.json()
}

export async function createSystemClient(
  officeId: string,
  systemClientName: string,
  scope:
    | 'HEALTH'
    | 'NATIONAL_ID'
    | 'EXTERNAL_VALIDATION'
    | 'AGE_CHECK'
    | 'RECORD_SEARCH',
  natlSystemAdmin: User
): Promise<User> {
  const credentialsRes = await registerSystemClient(
    systemClientName,
    scope,
    natlSystemAdmin.token
  )
  const credentials: {
    system: ISystemInfo
    clientSecret: string
  } = credentialsRes.data.registerSystem

  const systemToken = await getTokenForSystemClient(
    credentials.system.clientId,
    credentials.clientSecret
  )

  return {
    token: systemToken,
    username: credentials.system.clientId,
    password: credentials.clientSecret,
    stillInUse: true,
    primaryOfficeId: officeId,
    isSystemUser: true
  }
}

export async function createUsers(
  token: string,
  location: Location,
  countryCode: string,
  phoneNumberRegex: string,
  config: Config
) {
  log('Fetching existing users')
  const existingUsers = await getUsers(token, location.id)
  log('Found', existingUsers.length, 'existing users')

  const fieldAgents: User[] = await Promise.all(
    existingUsers
      .filter(({ systemRole }) => systemRole === 'FIELD_AGENT')
      .map(async (user) => ({
        username: user.username,
        password: 'test',
        token: await getToken(user.username, 'test'),
        stillInUse: true,
        primaryOfficeId: user.primaryOffice.id,
        isSystemUser: false
      }))
  )
  const registrationAgents: User[] = await Promise.all(
    existingUsers
      .filter(({ systemRole }) => systemRole === 'REGISTRATION_AGENT')
      .map(async (user) => ({
        username: user.username,
        password: 'test',
        token: await getToken(user.username, 'test'),
        stillInUse: true,
        primaryOfficeId: user.primaryOffice.id,
        isSystemUser: false
      }))
  )
  const registrars: User[] = await Promise.all(
    existingUsers
      .filter(({ systemRole }) => systemRole === 'LOCAL_REGISTRAR')
      .map(async (user) => ({
        username: user.username,
        password: 'test',
        token: await getToken(user.username, 'test'),
        stillInUse: true,
        primaryOfficeId: user.primaryOffice.id,
        isSystemUser: false
      }))
  )

  if (!nationalSystemAdmin.length) {
    const natlUserRes = await getUserByRole(token, 'NATIONAL_SYSTEM_ADMIN')
    const mappedNatlUserRes = await Promise.all(
      natlUserRes
        .filter(({ username }) => username !== 'o.admin')
        .map(async (user) => {
          return {
            username: user.username,
            password: 'test',
            token: await getToken(user.username, 'test'),
            stillInUse: true,
            primaryOfficeId: user.primaryOffice.id,
            isSystemUser: false
          }
        })
    )
    nationalSystemAdmin.push(mappedNatlUserRes[0])
  }

  // These cannot be fetched through gateway, so we'll always have to regenerate them
  const hospitals: User[] = []

  const facilities = await getFacilities()

  const crvsOffices = facilities
    .filter(({ type }: Facility) => type === 'CRVS_OFFICE')
    .filter(({ partOf }: Facility) => partOf === 'Location/' + location.id)

  const healthFacilities = facilities
    .filter(({ type }: Facility) => type === 'HEALTH_FACILITY')
    .filter(({ partOf }: Facility) => partOf === 'Location/' + location.id)

  if (crvsOffices.length === 0) {
    throw new Error(`Cannot find any CRVS offices for ${location.name}`)
  }

  const userRoles = (await getAgentRoles(token))?.reduce(
    (rolesObj, userRole) => {
      return {
        ...rolesObj,
        [userRole.value]: userRole.roles.map((role) => role._id)
      }
    },
    {}
  ) as Record<string, string[]>

  const FIELD_AGENT_ROLES = userRoles.FIELD_AGENT
  const randomOffice =
    crvsOffices[Math.floor(Math.random() * crvsOffices.length)]
  log('Creating field agents')
  for (let i = fieldAgents.length; i < config.fieldAgents; i++) {
    const randomFieldAgentRole =
      FIELD_AGENT_ROLES[Math.floor(Math.random() * FIELD_AGENT_ROLES.length)]
    fieldAgents.push(
      await createUser(token, randomOffice.id, countryCode, phoneNumberRegex, {
        systemRole: 'FIELD_AGENT',
        role: randomFieldAgentRole
      })
    )
  }

  log('Field agents created')
  log('Creating', config.hospitalFieldAgents, 'hospitals')
  const natlSystemAdminUser = nationalSystemAdmin[0]
  for (let i = 0; i < config.hospitalFieldAgents; i++) {
    const user = await createSystemClient(
      randomOffice.id,
      faker.helpers.arrayElement(healthFacilities).name,
      'HEALTH',
      natlSystemAdminUser
    )
    hospitals.push(user)
  }

  log('Hospitals created')

  const REGISTRATION_AGENT_ROLES = userRoles.REGISTRATION_AGENT
  log('Creating registration agents')
  for (let i = registrationAgents.length; i < config.registrationAgents; i++) {
    const randomRegistrationAgentRole =
      REGISTRATION_AGENT_ROLES[
        Math.floor(Math.random() * REGISTRATION_AGENT_ROLES.length)
      ]
    registrationAgents.push(
      await createUser(token, randomOffice.id, countryCode, phoneNumberRegex, {
        systemRole: 'REGISTRATION_AGENT',
        role: randomRegistrationAgentRole
      })
    )
  }
  log('Registration agents created')

  const LOCAL_REGISTRAR_ROLES = userRoles.LOCAL_REGISTRAR
  log('Creating local registrars')
  for (let i = registrars.length; i < config.localRegistrars; i++) {
    const randomLocalRegRole =
      LOCAL_REGISTRAR_ROLES[
        Math.floor(Math.random() * LOCAL_REGISTRAR_ROLES.length)
      ]
    registrars.push(
      await createUser(token, randomOffice.id, countryCode, phoneNumberRegex, {
        systemRole: 'LOCAL_REGISTRAR',
        role: randomLocalRegRole
      })
    )
  }
  log('Local registrars created')

  return { fieldAgents, hospitals, registrationAgents, registrars }
}
