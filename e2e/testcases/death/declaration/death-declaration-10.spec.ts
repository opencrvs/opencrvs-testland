import { test, expect, type Page } from '@playwright/test'
import {
  continueForm,
  drawSignature,
  expectRowValueWithChangeButton,
  goToSection,
  login
} from '../../../helpers'
import { CREDENTIALS } from '../../../constants'
import { ensureOutboxIsEmpty, selectAction } from '../../../utils'
import { REQUIRED_VALIDATION_ERROR } from '../../birth/helpers'

test.describe.serial('10. Death declaration case - 10', () => {
  let page: Page

  const declaration = {
    deceased: {
      nationality: 'Farajaland',
      address: {
        country: 'Farajaland',
        province: 'Central',
        district: 'Ibombo'
      }
    },
    informant: {
      relation: 'Grandson'
    }
  }
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test.describe('10.1 Declaration started by FA', async () => {
    test.beforeAll(async () => {
      await login(page, CREDENTIALS.FIELD_AGENT)

      await page.click('#header-new-event')
      await page.getByLabel('Death').click()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()
    })

    test('10.1.1 Fill deceased details', async () => {
      await continueForm(page)
    })

    test('10.1.2 Fill event details', async () => {
      await page.getByRole('button', { name: 'Continue' }).click()
    })

    test('10.1.3 Fill informant details', async () => {
      await page.locator('#informant____relation').click()
      await page
        .getByText(declaration.informant.relation, {
          exact: true
        })
        .click()

      await page.waitForTimeout(500) // Temporary measurement untill the bug is fixed. BUG: rerenders after selecting relation with deceased
      await page.getByRole('button', { name: 'Continue' }).click()
    })

    test('10.1.4 Go to preview', async () => {
      await goToSection(page, 'review')
    })

    test('10.1.5 Verify information on preview page', async () => {
      /*
       * Expected result: should include
       * - Deceased's First Name
       * - Deceased's Family Name
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.name',
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should require
       * - Deceased's Gender
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.gender',
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should require
       * - Deceased's date of birth
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.dob',
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should include
       * - Deceased's Nationality
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.nationality',
        'Farajaland'
      )
      /*
       * Expected result: should require
       * - Deceased's Type of Id
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.idType',
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should include
       * - Deceased's address
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.address',
        declaration.deceased.address.country +
          declaration.deceased.address.province +
          declaration.deceased.address.district
      )

      /*
       * Expected result: should require
       * - Date of death
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'eventDetails.date',
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should require
       * - Place of death
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'eventDetails.placeOfDeath',
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should include
       * - Informant type
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'informant.relation',
        declaration.informant.relation
      )

      /*
       * Expected result: should require
       * - Informant's Email
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'informant.email',
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should require
       * - Spouse's First Name
       * - Spouse's Family Name
       * - Change button
       */

      await expectRowValueWithChangeButton(
        page,
        'spouse.name',
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should require
       * - Spouse's date of birth
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'spouse.dob',
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should include
       * - Spouse's Nationality
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'spouse.nationality',
        'Farajaland'
      )

      /*
       * Expected result: should require
       * - Spouse's Type of Id
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'spouse.idType',
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should require
       * - Spouse's address
       * - Change button
       */
      await expectRowValueWithChangeButton(page, 'spouse.addressSameAs', 'Yes')
    })

    test('10.1.6 Fill up informant signature', async () => {
      await page.getByRole('button', { name: 'Sign', exact: true }).click()
      await drawSignature(page, 'review____signature_canvas_element', false)
      await page
        .locator('#review____signature_modal')
        .getByRole('button', { name: 'Apply' })
        .click()
    })

    test('10.1.7 Send for review', async () => {
      await page.getByRole('button', { name: 'Send for review' }).click()
      await expect(page.getByText('Send for review?')).toBeVisible()
      await page.getByRole('button', { name: 'Confirm' }).click()
      await ensureOutboxIsEmpty(page)
      await expect(page.getByText('Farajaland CRS')).toBeVisible()

      /*
       * Expected result: should redirect to assigned to you workqueue
       */
      expect(page.url().includes('assigned-to-you')).toBeTruthy()

      await page.getByText('Sent for review').click()

      /*
       * Expected result: The declaration should be in sent for review
       */
      await expect(
        page
          .getByRole('button', {
            name: 'No name provided'
          })
          .first()
      ).toBeVisible()
    })
  })

  test.describe('10.2 Declaration Review by RA', async () => {
    test('10.2.1 Navigate to the declaration review page', async () => {
      await login(page, CREDENTIALS.REGISTRATION_AGENT)

      await ensureOutboxIsEmpty(page)
      await page.getByText('Notifications').click()

      await page
        .getByRole('button', {
          name: 'No name provided'
        })
        .first()
        .click()
    })

    test('10.2.2 Verify information on review page', async () => {
      await selectAction(page, 'Review')
      /*
       * Expected result: should include
       * - Deceased's First Name
       * - Deceased's Family Name
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.name',
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should require
       * - Deceased's Gender
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.gender',
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should require
       * - Deceased's date of birth
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.dob',
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should include
       * - Deceased's Nationality
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.nationality',
        'Farajaland'
      )
      /*
       * Expected result: should require
       * - Deceased's Type of Id
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.idType',
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should include
       * - Deceased's address
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.address',
        declaration.deceased.address.country +
          declaration.deceased.address.province +
          declaration.deceased.address.district
      )

      /*
       * Expected result: should require
       * - Date of death
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'eventDetails.date',
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should require
       * - Place of death
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'eventDetails.placeOfDeath',
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should include
       * - Informant type
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'informant.relation',
        declaration.informant.relation
      )

      /*
       * Expected result: should require
       * - Informant's Email
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'informant.email',
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should require
       * - Spouse's First Name
       * - Spouse's Family Name
       * - Change button
       */

      await expectRowValueWithChangeButton(
        page,
        'spouse.name',
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should require
       * - Spouse's date of birth
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'spouse.dob',
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should include
       * - Spouse's Nationality
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'spouse.nationality',
        'Farajaland'
      )

      /*
       * Expected result: should require
       * - Spouse's Type of Id
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'spouse.idType',
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should require
       * - Spouse's address
       * - Change button
       */
      await expectRowValueWithChangeButton(page, 'spouse.addressSameAs', 'Yes')
    })
  })
})
