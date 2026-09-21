import { test, expect, type Page } from '@playwright/test'
import {
  continueForm,
  drawSignature,
  expectRowValueWithChangeButton,
  formatDateObjectTo_dMMMMyyyy,
  getRandomDate,
  goToSection,
  login
} from '../../../helpers'
import { faker } from '@faker-js/faker'
import { CREDENTIALS } from '../../../constants'
import { ensureOutboxIsEmpty, selectAction } from '../../../utils'

test.describe.serial('1. Death declaration case - 1', () => {
  let page: Page
  const declaration = {
    deceased: {
      name: {
        firstname: faker.person.firstName('male'),
        surname: faker.person.lastName('male')
      },
      gender: 'Male',
      dob: getRandomDate(75, 200),
      nationality: 'Farajaland',
      idType: 'National ID',
      nid: faker.string.numeric(10),
      maritalStatus: 'Single',
      numberOfDependants: 3,
      address: {
        country: 'Farajaland',
        province: 'Sulaka',
        district: 'Zobwe',
        town: faker.location.city(),
        residentialArea: faker.location.county(),
        street: faker.location.street(),
        number: faker.location.buildingNumber(),
        postcodeOrZip: faker.location.zipCode()
      }
    },
    eventDetails: {
      mannerOfDeath: 'Natural causes',
      date: getRandomDate(0, 20),
      causeOfDeathEstablished: true,
      sourceCauseDeath: 'Physician',
      placeOfDeath: "Deceased's usual place of residence"
    },
    informant: {
      relation: 'Spouse',
      email: faker.internet.email()
    },
    spouse: {
      name: {
        firstname: faker.person.firstName('female'),
        surname: faker.person.lastName('female')
      },
      dob: getRandomDate(50, 200),
      nationality: 'Farajaland',
      idType: 'National ID',
      nid: faker.string.numeric(10),
      addressSameAs: true
    }
  }
  const annotation = {
    review: {
      comment: "He was a great person, we'll miss him"
    }
  }
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test.describe('1.1 Declaration started by FA', async () => {
    test.beforeAll(async () => {
      await login(page, CREDENTIALS.FIELD_AGENT)

      await page.click('#header-new-event')
      await page.getByLabel('Death').click()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()
    })
    test('1.1.1 Fill deceased details', async () => {
      await page.locator('#firstname').fill(declaration.deceased.name.firstname)
      await page.locator('#surname').fill(declaration.deceased.name.surname)
      await page.locator('#deceased____gender').click()
      await page.getByText(declaration.deceased.gender, { exact: true }).click()

      await page.getByPlaceholder('dd').fill(declaration.deceased.dob.dd)
      await page.getByPlaceholder('mm').fill(declaration.deceased.dob.mm)
      await page.getByPlaceholder('yyyy').fill(declaration.deceased.dob.yyyy)

      await page.locator('#deceased____idType').click()
      await page.getByText(declaration.deceased.idType, { exact: true }).click()

      await page.locator('#deceased____nid').fill(declaration.deceased.nid)

      await page.locator('#deceased____maritalStatus').click()
      await page
        .getByText(declaration.deceased.maritalStatus, { exact: true })
        .click()

      await page
        .locator('#deceased____numberOfDependants')
        .fill(declaration.deceased.numberOfDependants.toString())

      await page.locator('#province').click()
      await page
        .getByText(declaration.deceased.address.province, { exact: true })
        .click()
      await page.locator('#district').click()
      await page
        .getByText(declaration.deceased.address.district, { exact: true })
        .click()
      await page.locator('#town').fill(declaration.deceased.address.town)
      await page
        .locator('#residentialArea')
        .fill(declaration.deceased.address.residentialArea)
      await page.locator('#street').fill(declaration.deceased.address.street)
      await page.locator('#number').fill(declaration.deceased.address.number)
      await page
        .locator('#zipCode')
        .fill(declaration.deceased.address.postcodeOrZip)

      await continueForm(page)
    })

    test('1.1.2 Fill event details', async () => {
      await page.getByPlaceholder('dd').fill(declaration.eventDetails.date.dd)
      await page.getByPlaceholder('mm').fill(declaration.eventDetails.date.mm)
      await page
        .getByPlaceholder('yyyy')
        .fill(declaration.eventDetails.date.yyyy)

      await page.getByLabel('Cause of death has been established').check()

      await page.locator('#eventDetails____sourceCauseDeath').click()
      await page
        .getByText(declaration.eventDetails.sourceCauseDeath, { exact: true })
        .click()

      await page.locator('#eventDetails____mannerOfDeath').click()
      await page
        .getByText(declaration.eventDetails.mannerOfDeath, { exact: true })
        .click()

      await page.locator('#eventDetails____placeOfDeath').click()
      await page
        .getByText(declaration.eventDetails.placeOfDeath, { exact: true })
        .click()

      await continueForm(page)
    })

    test('1.1.3 Fill informant details', async () => {
      await page.locator('#informant____relation').click()
      await page
        .getByText(declaration.informant.relation, {
          exact: true
        })
        .click()

      await page.waitForTimeout(500) // Temporary measurement untill the bug is fixed. BUG: rerenders after selecting relation with deceased

      await page
        .locator('#informant____email')
        .fill(declaration.informant.email)

      await continueForm(page)
    })

    test('1.1.4 Fill spouse details', async () => {
      await page.locator('#firstname').fill(declaration.spouse.name.firstname)
      await page.locator('#surname').fill(declaration.spouse.name.surname)

      await page.getByPlaceholder('dd').fill(declaration.spouse.dob.dd)
      await page.getByPlaceholder('mm').fill(declaration.spouse.dob.mm)
      await page.getByPlaceholder('yyyy').fill(declaration.spouse.dob.yyyy)

      await page.locator('#spouse____idType').click()
      await page.getByText(declaration.spouse.idType, { exact: true }).click()

      await page.locator('#spouse____nid').fill(declaration.spouse.nid)

      await continueForm(page)
    })

    test('1.1.5 Go to review', async () => {
      await goToSection(page, 'review')
    })

    test('1.1.6 Verify information on preview page', async () => {
      /*
       * Expected result: should include
       * - Deceased's First Name
       * - Deceased's Family Name
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.name',
        declaration.deceased.name.firstname +
          ' ' +
          declaration.deceased.name.surname
      )

      /*
       * Expected result: should include
       * - Deceased's Gender
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.gender',
        declaration.deceased.gender
      )

      /*
       * Expected result: should include
       * - Deceased's date of death
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.dob',
        formatDateObjectTo_dMMMMyyyy(declaration.deceased.dob)
      )

      /*
       * Expected result: should include
       * - Deceased's Nationality
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.nationality',
        declaration.deceased.nationality
      )
      /*
       * Expected result: should include
       * - Deceased's Type of Id
       * - Deceased's Id Number
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.idType',
        declaration.deceased.idType
      )
      await expectRowValueWithChangeButton(
        page,
        'deceased.nid',
        declaration.deceased.nid
      )

      /*
       * Expected result: should include
       * - Deceased's marital status
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.maritalStatus',
        declaration.deceased.maritalStatus
      )

      /*
       * Expected result: should include
       * - Number of Deceased's Dependants
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.numberOfDependants',
        declaration.deceased.numberOfDependants.toString()
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
          declaration.deceased.address.district +
          declaration.deceased.address.town +
          declaration.deceased.address.residentialArea +
          declaration.deceased.address.street +
          declaration.deceased.address.number +
          declaration.deceased.address.postcodeOrZip
      )

      /*
       * Expected result: should include
       * - Date of death
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'eventDetails.date',
        formatDateObjectTo_dMMMMyyyy(declaration.eventDetails.date)
      )

      /*
       * Expected result: should include
       * - Manner of death has been established
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'eventDetails.mannerOfDeath',
        declaration.eventDetails.mannerOfDeath
      )

      /*
       * Expected result: should include
       * - Cause of death has been established
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'eventDetails.causeOfDeathEstablished',
        'Yes'
      )

      /*
       * Expected result: should include
       * - Source cause of death
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'eventDetails.sourceCauseDeath',
        declaration.eventDetails.sourceCauseDeath
      )

      /*
       * Expected result: should include
       * - Place of death
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'eventDetails.placeOfDeath',
        declaration.eventDetails.placeOfDeath
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
       * Expected result: should include
       * - Informant's Email
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'informant.email',
        declaration.informant.email
      )

      /*
       * Expected result: should include
       * - Spouse's First Name
       * - Spouse's Family Name
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'spouse.name',
        declaration.spouse.name.firstname +
          ' ' +
          declaration.spouse.name.surname
      )

      /*
       * Expected result: should include
       * - Spouse's date of birth
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'spouse.dob',
        formatDateObjectTo_dMMMMyyyy(declaration.spouse.dob)
      )

      /*
       * Expected result: should include
       * - Spouse's Nationality
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'spouse.nationality',
        declaration.spouse.nationality
      )
      /*
       * Expected result: should include
       * - Spouse's Type of Id
       * - Spouse's Id Number
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'spouse.idType',
        declaration.spouse.idType
      )
      await expectRowValueWithChangeButton(
        page,
        'spouse.nid',
        declaration.spouse.nid
      )

      /*
       * Expected result: should include
       * - Spouse's address
       * - Change button
       */
      await expectRowValueWithChangeButton(page, 'spouse.addressSameAs', 'Yes')
    })

    test('1.1.7 Fill up informant signature', async () => {
      await page.locator('#review____comment').fill(annotation.review.comment)
      await page.getByRole('button', { name: 'Sign', exact: true }).click()
      await drawSignature(page, 'review____signature_canvas_element', false)
      await page
        .locator('#review____signature_modal')
        .getByRole('button', { name: 'Apply' })
        .click()
    })

    test('1.1.8 Send for review', async () => {
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
        page.getByRole('button', {
          name:
            declaration.deceased.name.firstname +
            ' ' +
            declaration.deceased.name.surname
        })
      ).toBeVisible()
    })
  })
  test.describe('1.2 Declaration Review by RA', async () => {
    test('1.2.1 Navigate to the declaration review page', async () => {
      await login(page, CREDENTIALS.REGISTRATION_AGENT)

      await ensureOutboxIsEmpty(page)
      await page.getByText('Ready for review').click()

      await page
        .getByRole('button', {
          name:
            declaration.deceased.name.firstname +
            ' ' +
            declaration.deceased.name.surname
        })
        .click()
    })

    test('1.2.2 Verify information on review page', async () => {
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
        declaration.deceased.name.firstname +
          ' ' +
          declaration.deceased.name.surname
      )

      /*
       * Expected result: should include
       * - Deceased's Gender
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.gender',
        declaration.deceased.gender
      )

      /*
       * Expected result: should include
       * - Deceased's date of death
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.dob',
        formatDateObjectTo_dMMMMyyyy(declaration.deceased.dob)
      )

      /*
       * Expected result: should include
       * - Deceased's Nationality
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.nationality',
        declaration.deceased.nationality
      )
      /*
       * Expected result: should include
       * - Deceased's Type of Id
       * - Deceased's Id Number
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.idType',
        declaration.deceased.idType
      )
      await expectRowValueWithChangeButton(
        page,
        'deceased.nid',
        declaration.deceased.nid
      )

      /*
       * Expected result: should include
       * - Deceased's marital status
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.maritalStatus',
        declaration.deceased.maritalStatus
      )

      /*
       * Expected result: should include
       * - Number of Deceased's Dependants
       */
      await expectRowValueWithChangeButton(
        page,
        'deceased.numberOfDependants',
        declaration.deceased.numberOfDependants.toString()
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
          declaration.deceased.address.district +
          declaration.deceased.address.town +
          declaration.deceased.address.residentialArea +
          declaration.deceased.address.street +
          declaration.deceased.address.number +
          declaration.deceased.address.postcodeOrZip
      )

      /*
       * Expected result: should include
       * - Date of death
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'eventDetails.date',
        formatDateObjectTo_dMMMMyyyy(declaration.eventDetails.date)
      )

      /*
       * Expected result: should include
       * - Manner of death has been established
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'eventDetails.mannerOfDeath',
        declaration.eventDetails.mannerOfDeath
      )

      /*
       * Expected result: should include
       * - Cause of death has been established
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'eventDetails.causeOfDeathEstablished',
        'Yes'
      )

      /*
       * Expected result: should include
       * - Source cause of death
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'eventDetails.sourceCauseDeath',
        declaration.eventDetails.sourceCauseDeath
      )

      /*
       * Expected result: should include
       * - Place of death
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'eventDetails.placeOfDeath',
        declaration.eventDetails.placeOfDeath
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
       * Expected result: should include
       * - Informant's Email
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'informant.email',
        declaration.informant.email
      )

      /*
       * Expected result: should include
       * - Spouse's First Name
       * - Spouse's Family Name
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'spouse.name',
        declaration.spouse.name.firstname +
          ' ' +
          declaration.spouse.name.surname
      )

      /*
       * Expected result: should include
       * - Spouse's date of birth
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'spouse.dob',
        formatDateObjectTo_dMMMMyyyy(declaration.spouse.dob)
      )

      /*
       * Expected result: should include
       * - Spouse's Nationality
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'spouse.nationality',
        declaration.spouse.nationality
      )
      /*
       * Expected result: should include
       * - Spouse's Type of Id
       * - Spouse's Id Number
       * - Change button
       */
      await expectRowValueWithChangeButton(
        page,
        'spouse.idType',
        declaration.spouse.idType
      )
      await expectRowValueWithChangeButton(
        page,
        'spouse.nid',
        declaration.spouse.nid
      )

      /*
       * Expected result: should include
       * - Spouse's address
       * - Change button
       */
      await expectRowValueWithChangeButton(page, 'spouse.addressSameAs', 'Yes')
    })
  })
})
