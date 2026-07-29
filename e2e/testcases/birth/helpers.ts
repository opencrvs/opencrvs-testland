import { expect, type Page } from '@playwright/test'
import { omit } from 'lodash'
import { formatName, joinValuesWith } from '../../helpers'
import { faker } from '@faker-js/faker'
import { ensureOutboxIsEmpty } from '../../utils'
import { getRowByTitle } from '../print-certificate/birth/helpers'
import { SAFE_OUTBOX_TIMEOUT_MS } from '../../constants'
import { GATEWAY_HOST } from '../../constants'
import fetch from 'node-fetch'

export const REQUIRED_VALIDATION_ERROR = 'Required'
export const NAME_VALIDATION_ERROR =
  "Input contains invalid characters. Please use only letters (a-z, A-Z), numbers (0-9), hyphens (-) and apostrophes(')"

export async function validateAddress(
  page: Page,
  address: Record<string, any>,
  elementTestId: string
) {
  // selection is not rendered as part of the address.
  const addressWithoutGeographicalArea = omit(address, 'urbanOrRural')

  await Promise.all(
    Object.values(addressWithoutGeographicalArea).map(
      (val) =>
        typeof val === 'string' &&
        expect(page.getByTestId(elementTestId).getByText(val)).toBeVisible()
    )
  )
}

export async function fillDate(
  page: Page,
  date: { dd: string; mm: string; yyyy: string }
) {
  await page.getByPlaceholder('dd').fill(date.dd)
  await page.getByPlaceholder('mm').fill(date.mm)
  await page.getByPlaceholder('yyyy').fill(date.yyyy)
}

export async function fillChildDetails(page: Page) {
  const firstName = faker.person.firstName('female')
  const lastName = faker.person.lastName('female')
  await page.locator('#firstname').fill(firstName)
  await page.locator('#surname').fill(lastName)

  return formatName({ firstNames: firstName, familyName: lastName })
}

export async function openBirthDeclaration(page: Page) {
  await page.click('#header-new-event')
  await page.getByLabel('Birth').click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()

  return page
}

export const formatV2ChildName = (obj: {
  'child.name': { firstname: string; surname: string }
  [key: string]: any
}) => {
  return joinValuesWith([
    obj['child.name'].firstname,
    obj['child.name'].surname
  ])
}

export const assertRecordInWorkqueue = async ({
  page,
  name,
  workqueues
}: {
  page: Page
  name: string
  workqueues: { title: string; exists: boolean }[]
}) => {
  await page.getByRole('button', { name: 'Outbox' }).click()
  await ensureOutboxIsEmpty(page)

  const record = page.getByRole('button', { name, exact: true })

  /*
   * Draining the outbox only proves the action reached the backend, not that
   * the search index has caught up. Callers almost always list an absence
   * first (e.g. `Assigned to you`), which would then pass vacuously against a
   * not-yet-indexed record and hide a real regression.
   *
   * Checking a presence first pins the index to a state where the record is
   * visible, so every later absence check is meaningful. It also keeps
   * absences fast: a negative assertion that is already true returns at once,
   * whereas one waiting on index lag burns the whole timeout.
   */
  const ordered = [...workqueues].sort(
    (a, b) => Number(b.exists) - Number(a.exists)
  )

  const openWorkqueue = async (title: string) => {
    await page.getByRole('button', { name: title }).click()
    await expect(page.getByTestId('search-result')).toContainText(title, {
      timeout: SAFE_OUTBOX_TIMEOUT_MS
    })
  }

  let settled = false

  for (const { title, exists } of ordered) {
    if (exists && !settled) {
      /*
       * Re-open the workqueue on each attempt to force a refetch rather than
       * waiting out the client's poll cycle.
       */
      await expect(async () => {
        await openWorkqueue(title)
        await expect(record).toBeVisible({ timeout: 1_500 })
      }).toPass({ timeout: SAFE_OUTBOX_TIMEOUT_MS })

      settled = true
      continue
    }

    await openWorkqueue(title)

    if (exists) {
      await expect(record).toBeVisible()
    } else {
      await expect(record).toBeHidden()
    }
  }

  /*
   * Callers rely on this helper leaving the page on the *last* workqueue they
   * listed -- the next step typically assigns or opens the record from it. The
   * reordering above changes which queue the loop ends on, so restore the
   * original post-condition.
   */
  const lastListed = workqueues[workqueues.length - 1]
  const lastChecked = ordered[ordered.length - 1]

  if (lastListed && lastChecked && lastListed.title !== lastChecked.title) {
    await openWorkqueue(lastListed.title)
  }
}

export const assignFromWorkqueue = async (page: Page, name: string) => {
  await getRowByTitle(page, name)
    .getByRole('button', { name: 'Assign record' })
    .click()
  await page.getByRole('button', { name: 'Assign', exact: true }).click()

  await expect(
    getRowByTitle(page, name)
      .getByRole('button', { name: 'Assign record' })
      .locator('img')
  ).toBeVisible({
    timeout: SAFE_OUTBOX_TIMEOUT_MS
  })
}

export async function getAllLocations(
  type: 'ADMIN_STRUCTURE' | 'HEALTH_FACILITY' | 'CRVS_OFFICE'
) {
  const locations = (await fetch(
    `${GATEWAY_HOST}/location?type=${type}&_count=0`
  ).then((res) => res.json())) as fhir.Bundle

  return locations.entry!.map((entry) => entry.resource as fhir.Location)
}

export function getLocationIdByName(locations: fhir.Location[], name: string) {
  const location = locations.find((location) => location.name === name)
  if (!location) {
    throw new Error(`Location with name ${name} not found`)
  }
  return location.id
}
