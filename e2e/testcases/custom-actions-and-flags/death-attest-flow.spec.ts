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
import { expect, test } from '@playwright/test'
import { faker } from '@faker-js/faker'
import {
  continueForm,
  goToSection,
  login,
  triggerDeclarationAction,
  validateActionMenuButton
} from '../../helpers'
import { CREDENTIALS } from '../../constants'
import {
  ensureAssignedToUser,
  navigateToWorkqueue,
  selectAction
} from '../../utils'
import { openRecordByTitle } from '../print-certificate/birth/helpers'

test('Death notified at a health facility is held for attestation, then reaches the registrar once attested', async ({
  browser
}) => {
  const deceasedName = {
    firstname: faker.person.firstName('male'),
    surname: faker.person.lastName('male')
  }
  const title = `${deceasedName.firstname} ${deceasedName.surname}`

  const page = await browser.newPage()

  await test.step('Hospital Official notifies a death at a health facility', async () => {
    await login(page, CREDENTIALS.HOSPITAL_OFFICIAL)

    await page.click('#header-new-event')
    await page.getByLabel('Death').click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await page.locator('#firstname').fill(deceasedName.firstname)
    await page.locator('#surname').fill(deceasedName.surname)
    await continueForm(page)

    await page.getByTestId('select__eventDetails____placeOfDeath').click()
    await page.getByText('Health Institution', { exact: true }).click()
    await page.locator('#eventDetails____deathLocation').fill('Klow Village')
    await page.getByText('Klow Village Hospital').click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await page.getByRole('button', { name: 'Continue' }).click()

    await goToSection(page, 'review')
    await triggerDeclarationAction(page, 'Notify')
    await expect(page.getByText('Farajaland CRS')).toBeVisible()
  })

  await test.step('Record is held in the Hospital Official Pending attestation workqueue', async () => {
    await navigateToWorkqueue(page, 'Pending attestation')
    await expect(page.getByRole('button', { name: title })).toBeVisible()
  })

  // @TODO: Waiting for new hospital official edit scope with notifiedBy (instead of declaredBy)
  await test.step.skip(
    'While awaiting attestation the record can still be edited and re-notified, but not declared',
    async () => {
      await openRecordByTitle(page, title)
      await ensureAssignedToUser(page, CREDENTIALS.HOSPITAL_OFFICIAL)

      await selectAction(page, 'Edit')

      await page.getByTestId('change-button-deceased.gender').click()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.locator('#deceased____gender').click()
      await page.getByText('Male', { exact: true }).click()
      await page.getByRole('button', { name: 'Go to review' }).click()

      await validateActionMenuButton(page, 'Declare with edits', false)

      await triggerDeclarationAction(page, 'Notify with edits')
      await expect(page.getByText('Farajaland CRS')).toBeVisible()
    }
  )

  await test.step('Health Administrator sees the record in Pending attestation and attests it', async () => {
    await login(page, CREDENTIALS.HEALTH_ADMINISTRATOR)

    await navigateToWorkqueue(page, 'Pending attestation')
    await expect(page.getByRole('button', { name: title })).toBeVisible()

    await openRecordByTitle(page, title)
    await ensureAssignedToUser(page, CREDENTIALS.HEALTH_ADMINISTRATOR)

    // The record shows the attestation-required flag before it is attested.
    await expect(page.getByTestId('flags-value')).toContainText(
      'Attestation required'
    )

    await selectAction(page, 'Attest')
    await page.locator('#comments').fill('Death confirmed at this facility.')

    const attestResponse = page.waitForResponse(
      (response) =>
        response.url().includes('event.actions.custom') &&
        response.status() === 200
    )
    await page.getByRole('button', { name: 'Confirm' }).click()
    await attestResponse
  })

  await test.step('attestation-required flag is cleared and the record leaves Pending attestation', async () => {
    // The record is no longer awaiting attestation, so it drops out of the Pending attestation workqueue.
    await navigateToWorkqueue(page, 'Pending attestation')
    await expect(page.getByRole('button', { name: title })).toBeHidden()
  })

  await test.step('Record reaches the Registration Official Notifications workqueue', async () => {
    await login(page, CREDENTIALS.REGISTRAR)

    await navigateToWorkqueue(page, 'Notifications')
    await expect(page.getByRole('button', { name: title })).toBeVisible()
  })
})
