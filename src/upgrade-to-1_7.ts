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
import { createReadStream, rmdirSync, writeFileSync } from 'fs'
import { camelCase, snakeCase } from 'lodash'
import { join } from 'path'
import { logger } from './logger'
import { stringify } from 'csv-stringify/sync'
import fs from 'fs'
import csv2json from 'csv2json'
import { inspect } from 'util'
import { format, resolveConfig } from 'prettier'

/*
 * inlining these two functions to not
 * trigger envalid when running the script
 */
async function writeJSONToCSV(
  filename: string,
  data: Array<Record<string, any>>
) {
  const csv = stringify(data, {
    header: true
  })
  return fs.promises.writeFile(filename, csv, 'utf8')
}

async function readCSVToJSON<T>(filename: string) {
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

const DEFAULT_ROLE_SCOPES_PRE_1_7 = {
  FIELD_AGENT: `[
    SCOPES.RECORD_DECLARE_BIRTH,
    SCOPES.RECORD_DECLARE_DEATH,
    SCOPES.RECORD_DECLARE_MARRIAGE,
    SCOPES.RECORD_SUBMIT_INCOMPLETE,
    SCOPES.RECORD_SUBMIT_FOR_REVIEW,
    SCOPES.SEARCH_BIRTH,
    SCOPES.SEARCH_DEATH,
    SCOPES.SEARCH_MARRIAGE
  ]`,
  REGISTRATION_AGENT: `[
    SCOPES.RECORD_DECLARE_BIRTH,
    SCOPES.RECORD_DECLARE_DEATH,
    SCOPES.RECORD_DECLARE_MARRIAGE,
    SCOPES.RECORD_DECLARATION_EDIT,
    SCOPES.RECORD_SUBMIT_FOR_APPROVAL,
    SCOPES.RECORD_SUBMIT_FOR_UPDATES,
    SCOPES.RECORD_DECLARATION_ARCHIVE,
    SCOPES.RECORD_DECLARATION_REINSTATE,
    SCOPES.RECORD_REGISTRATION_REQUEST_CORRECTION,
    SCOPES.RECORD_PRINT_ISSUE_CERTIFIED_COPIES,
    SCOPES.PERFORMANCE_READ,
    SCOPES.PERFORMANCE_READ_DASHBOARDS,
    SCOPES.ORGANISATION_READ_LOCATIONS_MY_OFFICE,
    SCOPES.SEARCH_BIRTH,
    SCOPES.SEARCH_DEATH,
    SCOPES.SEARCH_MARRIAGE
  ]`,
  LOCAL_REGISTRAR: `[
    SCOPES.RECORD_DECLARE_BIRTH,
    SCOPES.RECORD_DECLARE_DEATH,
    SCOPES.RECORD_DECLARE_MARRIAGE,
    SCOPES.RECORD_DECLARATION_EDIT,
    SCOPES.RECORD_SUBMIT_FOR_UPDATES,
    SCOPES.RECORD_REVIEW_DUPLICATES,
    SCOPES.RECORD_DECLARATION_ARCHIVE,
    SCOPES.RECORD_DECLARATION_REINSTATE,
    SCOPES.RECORD_REGISTER,
    SCOPES.RECORD_REGISTRATION_CORRECT,
    SCOPES.RECORD_UNASSIGN_OTHERS,
    SCOPES.RECORD_PRINT_ISSUE_CERTIFIED_COPIES,
    SCOPES.RECORD_CONFIRM_REGISTRATION,
    SCOPES.RECORD_REJECT_REGISTRATION,
    SCOPES.PERFORMANCE_READ,
    SCOPES.PERFORMANCE_READ_DASHBOARDS,
    SCOPES.PROFILE_ELECTRONIC_SIGNATURE,
    SCOPES.ORGANISATION_READ_LOCATIONS_MY_OFFICE,
    SCOPES.USER_READ_MY_OFFICE,
    SCOPES.SEARCH_BIRTH,
    SCOPES.SEARCH_DEATH,
    SCOPES.SEARCH_MARRIAGE
  ]`,
  LOCAL_SYSTEM_ADMIN: `[
    SCOPES.USER_READ_MY_OFFICE,
    SCOPES.USER_CREATE_MY_JURISDICTION,
    SCOPES.ORGANISATION_READ_LOCATIONS_MY_JURISDICTION,
    SCOPES.PERFORMANCE_READ,
    SCOPES.PERFORMANCE_READ_DASHBOARDS,
    SCOPES.PERFORMANCE_EXPORT_VITAL_STATISTICS
  ]`,
  NATIONAL_SYSTEM_ADMIN: `[
    SCOPES.USER_CREATE,
    SCOPES.USER_READ,
    SCOPES.USER_UPDATE,
    SCOPES.ORGANISATION_READ_LOCATIONS,
    SCOPES.PERFORMANCE_READ,
    SCOPES.PERFORMANCE_READ_DASHBOARDS,
    SCOPES.PERFORMANCE_EXPORT_VITAL_STATISTICS,
    SCOPES.CONFIG_UPDATE_ALL
  ]`,
  PERFORMANCE_MANAGEMENT: `[
    SCOPES.PERFORMANCE_READ,
    SCOPES.PERFORMANCE_READ_DASHBOARDS,
    SCOPES.PERFORMANCE_EXPORT_VITAL_STATISTICS
  ]`,
  NATIONAL_REGISTRAR: `[
    SCOPES.RECORD_DECLARE_BIRTH,
    SCOPES.RECORD_DECLARE_DEATH,
    SCOPES.RECORD_DECLARE_MARRIAGE,
    SCOPES.RECORD_DECLARATION_EDIT,
    SCOPES.RECORD_SUBMIT_FOR_UPDATES,
    SCOPES.RECORD_REVIEW_DUPLICATES,
    SCOPES.RECORD_DECLARATION_ARCHIVE,
    SCOPES.RECORD_DECLARATION_REINSTATE,
    SCOPES.RECORD_REGISTER,
    SCOPES.RECORD_REGISTRATION_CORRECT,
    SCOPES.RECORD_UNASSIGN_OTHERS,
    SCOPES.RECORD_PRINT_ISSUE_CERTIFIED_COPIES,
    SCOPES.RECORD_CONFIRM_REGISTRATION,
    SCOPES.RECORD_REJECT_REGISTRATION,
    SCOPES.PERFORMANCE_READ,
    SCOPES.PERFORMANCE_READ_DASHBOARDS,
    SCOPES.PERFORMANCE_EXPORT_VITAL_STATISTICS,
    SCOPES.PROFILE_ELECTRONIC_SIGNATURE,
    SCOPES.ORGANISATION_READ_LOCATIONS_MY_OFFICE,
    SCOPES.USER_READ_MY_OFFICE,
    SCOPES.SEARCH_BIRTH,
    SCOPES.SEARCH_DEATH,
    SCOPES.SEARCH_MARRIAGE
  ]`
} as const

const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom')

class FormattedScopes {
  scopes: string
  constructor(scopes: string) {
    this.scopes = scopes
  }
  [customInspectSymbol]() {
    return this.scopes
  }
}

async function main() {
  await upgradeRolesDefinitions()
}

async function upgradeRolesDefinitions() {
  const roles = await readCSVToJSON<any[]>(
    join(__dirname, './src/data-seeding/roles/source/roles.csv')
  ).catch((err) => {
    if (err.code === 'ENOENT') {
      logger.warn(
        'data-seeding/roles/source/roles.csv does not exist in the codebase. Looks like this codebase has been upgraded already.'
      )
    }

    process.exit(1)
  })

  const rolesWithGeneratedIds = roles.map((role) => ({
    id: snakeCase(role.label_en.replace(/[^a-zA-Z0-9 ]/g, '')).toUpperCase(),
    label: {
      defaultMessage: role.label_en,
      description: `Name for user role ${role.label_en}`,
      id: `userRole.${camelCase(role.label_en)}`
    },
    oldLabels: Object.fromEntries(
      Object.keys(role)
        .filter((key) => key.startsWith('label_'))
        .map((key) => [key.split('_')[1], role[key]])
    ),
    systemRole: role.systemRole,
    scopes:
      DEFAULT_ROLE_SCOPES_PRE_1_7[
        role.systemRole as keyof typeof DEFAULT_ROLE_SCOPES_PRE_1_7
      ]
  }))

  /*
   * Add language items to src/translations/client.csv
   */
  const copy = await readCSVToJSON<any[]>(
    join(__dirname, './src/translations/client.csv')
  )

  rolesWithGeneratedIds.forEach((role) => {
    if (copy.find((item) => item.id === role.label.id)) {
      logger.warn(
        `Skipping role ${role.id} as it already exists in the client.csv`
      )
      return
    }
    const copyItem = {
      id: role.label.id,
      description: role.label.description,
      ...role.oldLabels
    }
    logger.info(
      `Adding language items for role ${role.id}: ${JSON.stringify(copyItem)}`
    )
    copy.push(copyItem)
  })

  /*
   * Fix role references in default-employees.csv & prod-employees.csv from "National System Admin" to "NATIONAL_SYSTEM_ADMIN"
   */

  const defaultEmployees = await readCSVToJSON<any[]>(
    join(__dirname, './src/data-seeding/employees/source/default-employees.csv')
  )

  const defaultEmployeesWithRoles = defaultEmployees.map(
    ({ systemRole, ...employee }) => {
      if (!systemRole) {
        logger.warn(
          `Skipping employee "${employee.givenNames} ${employee.familyName}" as it already seems to have been migrated`
        )
        return employee
      }
      const role = rolesWithGeneratedIds.find(
        (role) => role.oldLabels.en === employee.role
      )
      if (!role) {
        logger.error(`Role with id ${employee.role} not found in roles.csv`)
        process.exit(1)
      }
      return {
        ...employee,
        role: role.id
      }
    }
  )

  let prodEmployeesWithRoles = null

  try {
    const prodEmployees = await readCSVToJSON<any[]>(
      join(__dirname, './src/data-seeding/employees/source/prod-employees.csv')
    )

    prodEmployeesWithRoles = prodEmployees.map(
      ({ systemRole, ...employee }) => {
        if (!systemRole) {
          logger.warn(
            `Skipping employee "${employee.givenNames} ${employee.familyName}" as it already seems to have been migrated`
          )
          return employee
        }
        const role = rolesWithGeneratedIds.find(
          (role) => role.oldLabels.en === employee.role
        )
        if (!role) {
          logger.error(`Role with id ${employee.role} not found in roles.csv`)
          process.exit(1)
        }
        return {
          ...employee,
          role: role.id
        }
      }
    )
  } catch (err) {
    if (err.code === 'ENOENT') {
      logger.warn(
        './src/data-seeding/employees/source/prod-employees.csv does not exist in the codebase. Skipping'
      )
    }
  }

  /*
   * Create the new "roles.ts" file with the updated roles and new format
   */

  const rolesWithoutDeprecatedFields = rolesWithGeneratedIds.map((role) => {
    const { oldLabels, systemRole, ...rest } = role
    return rest
  })

  const formattedRoles = rolesWithoutDeprecatedFields.map((role) => {
    return {
      ...role,
      scopes: new FormattedScopes(role.scopes)
    }
  })

  /*
   * Persist changes
   */
  logger.info('Creating roles file')
  writeFileSync(
    join(__dirname, './src/data-seeding/roles/roles.ts'),
    await format(
      `
      import { SCOPES, Scope } from '@opencrvs/toolkit/scopes'
      import { MessageDescriptor } from 'react-intl'

      type Role = {
        id: string
        label: MessageDescriptor
        scopes: Scope[]
      }

      export const roles: Role[] = ${inspect(formattedRoles, { depth: null })}
    `,
      {
        ...(await resolveConfig(__dirname)),
        parser: 'babel-ts'
      }
    )
  )

  logger.info('Updating copy file')
  await writeJSONToCSV(join(__dirname, './src/translations/client.csv'), copy)

  logger.info('Updating default employees file')
  await writeJSONToCSV(
    join(
      __dirname,
      './src/data-seeding/employees/source/default-employees.csv'
    ),
    defaultEmployeesWithRoles
  )
  if (prodEmployeesWithRoles) {
    logger.info('Updating prod employees file')
    await writeJSONToCSV(
      join(__dirname, './src/data-seeding/employees/source/prod-employees.csv'),
      prodEmployeesWithRoles
    )
  }

  logger.info('Removing old roles file')
  rmdirSync(join(__dirname, './src/data-seeding/roles/source'), {
    recursive: true
  })
}

main()
