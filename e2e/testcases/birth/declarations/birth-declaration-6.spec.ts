import { test, expect, type Page } from '@playwright/test'
import {
  continueForm,
  drawSignature,
  formatDateObjectTo_dMMMMyyyy,
  formatName,
  getRandomDate,
  goToSection,
  login
} from '../../../helpers'
import { faker } from '@faker-js/faker'
import { CREDENTIALS } from '../../../constants'
import { validateAddress } from '../helpers'
import { ensureOutboxIsEmpty } from '../../../utils'

test.describe.serial('6. Birth declaration case - 6', () => {
  let page: Page
  const declaration = {
    child: {
      name: {
        firstNames: faker.person.firstName() + " O'Neil",
        familyName: faker.person.lastName()
      },
      gender: 'Unknown',
      birthDate: getRandomDate(0, 200)
    },
    attendantAtBirth: 'Traditional birth attendant',
    birthType: 'Higher multiple delivery',
    placeOfBirth: 'Other',
    birthLocation: {
      country: 'Greenland',
      state: faker.location.state(),
      district: faker.location.county(),
      town: faker.location.city(),
      addressLine1: faker.location.county(),
      addressLine2: faker.location.street(),
      addressLine3: faker.location.buildingNumber(),
      postcodeOrZip: faker.location.zipCode()
    },
    informantType: 'Sister',
    informantEmail: faker.internet.email(),
    informant: {
      name: {
        firstNames: faker.person.firstName('female'),
        familyName: faker.person.lastName('female')
      },
      age: 17,
      nationality: 'Guernsey',
      identifier: {
        type: 'None'
      },
      address: {
        country: 'Haiti',
        state: faker.location.state(),
        district: faker.location.county(),
        town: faker.location.city(),
        addressLine1: faker.location.county(),
        addressLine2: faker.location.street(),
        addressLine3: faker.location.buildingNumber(),
        postcodeOrZip: faker.location.zipCode()
      }
    },
    father: {
      name: {
        firstNames: faker.person.firstName('male'),
        familyName: faker.person.lastName('male')
      },
      age: 25,
      nationality: 'Farajaland',
      identifier: {
        type: 'None'
      },
      address: {
        country: 'Guam',
        state: faker.location.state(),
        district: faker.location.county(),
        town: faker.location.city(),
        addressLine1: faker.location.county(),
        addressLine2: faker.location.street(),
        addressLine3: faker.location.buildingNumber(),
        postcodeOrZip: faker.location.zipCode()
      },
      maritalStatus: 'Separated',
      levelOfEducation: 'Tertiary'
    },
    mother: {
      detailsDontExist: true,
      reason: 'Mother is a ghost'
    }
  }
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test.describe('6.1 Declaration started by National Registrar', async () => {
    test.beforeAll(async () => {
      await login(page, CREDENTIALS.NATIONAL_REGISTRAR)
      await page.click('#header-new-event')
      await page.getByLabel('Birth').click()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()
    })

    test('6.1.1 Fill child details', async () => {
      await page.locator('#firstname').fill(declaration.child.name.firstNames)
      await page.locator('#firstname').blur()
      await page.locator('#surname').fill(declaration.child.name.familyName)
      await page.locator('#surname').blur()
      await page.locator('#child____gender').click()
      await page.getByText(declaration.child.gender, { exact: true }).click()

      await page.getByPlaceholder('dd').fill(declaration.child.birthDate.dd)
      await page.getByPlaceholder('mm').fill(declaration.child.birthDate.mm)
      await page.getByPlaceholder('yyyy').fill(declaration.child.birthDate.yyyy)

      await page.locator('#child____placeOfBirth').click()
      await page
        .getByText(declaration.placeOfBirth, {
          exact: true
        })
        .click()

      await page.locator('#country').click()
      await page
        .locator('#country input')
        .fill(declaration.birthLocation.country.slice(0, 3))
      await page
        .locator('#country')
        .getByText(declaration.birthLocation.country, { exact: true })
        .click()

      await page.locator('#state').fill(declaration.birthLocation.state)
      await page.locator('#district2').fill(declaration.birthLocation.district)
      await page.locator('#cityOrTown').fill(declaration.birthLocation.town)
      await page
        .locator('#addressLine1')
        .fill(declaration.birthLocation.addressLine1)
      await page
        .locator('#addressLine2')
        .fill(declaration.birthLocation.addressLine2)
      await page
        .locator('#addressLine3')
        .fill(declaration.birthLocation.addressLine3)
      await page
        .locator('#postcodeOrZip')
        .fill(declaration.birthLocation.postcodeOrZip)

      await page.locator('#child____attendantAtBirth').click()
      await page
        .getByText(declaration.attendantAtBirth, {
          exact: true
        })
        .click()

      await page.locator('#child____birthType').click()
      await page
        .getByText(declaration.birthType, {
          exact: true
        })
        .click()

      await continueForm(page)
    })

    test('6.1.2 Fill informant details', async () => {
      await page.locator('#informant____relation').click()
      await page
        .getByText(declaration.informantType, {
          exact: true
        })
        .click()

      await page.locator('#informant____email').fill(declaration.informantEmail)

      /*
       * Expected result: should show additional fields:
       * - Full Name
       * - Date of birth
       * - Nationality
       * - Id
       * - Usual place of residence
       */
      await page
        .locator('#firstname')
        .fill(declaration.informant.name.firstNames)
      await page.locator('#firstname').blur()
      await page.locator('#surname').fill(declaration.informant.name.familyName)
      await page.locator('#surname').blur()

      await page.getByLabel('Exact date of birth unknown').check()

      await page
        .locator('#informant____age')
        .fill(declaration.informant.age.toString())

      await page.locator('#informant____nationality').click()
      await page
        .getByText(declaration.informant.nationality, { exact: true })
        .click()

      await page.locator('#informant____idType').click()
      await page
        .getByText(declaration.informant.identifier.type, { exact: true })
        .click()

      await page.locator('#country').click()
      await page
        .locator('#country input')
        .fill(declaration.informant.address.country.slice(0, 3))
      await page
        .locator('#country')
        .getByText(declaration.informant.address.country, { exact: true })
        .click()

      await page.locator('#state').fill(declaration.informant.address.state)
      await page
        .locator('#district2')
        .fill(declaration.informant.address.district)
      await page.locator('#cityOrTown').fill(declaration.informant.address.town)
      await page
        .locator('#addressLine1')
        .fill(declaration.informant.address.addressLine1)
      await page
        .locator('#addressLine2')
        .fill(declaration.informant.address.addressLine2)
      await page
        .locator('#addressLine3')
        .fill(declaration.informant.address.addressLine3)
      await page
        .locator('#postcodeOrZip')
        .fill(declaration.informant.address.postcodeOrZip)

      await continueForm(page)
    })

    test("6.1.3 Fill mother's details", async () => {
      await page.getByLabel("Mother's details are not available").check()
      await page.locator('#mother____reason').fill(declaration.mother.reason)

      await continueForm(page)
    })

    test("6.1.4 Fill father's details", async () => {
      await page.locator('#firstname').fill(declaration.father.name.firstNames)
      await page.locator('#firstname').blur()
      await page.locator('#surname').fill(declaration.father.name.familyName)
      await page.locator('#surname').blur()

      await page.getByLabel('Exact date of birth unknown').check()

      await page
        .locator('#father____age')
        .fill(declaration.father.age.toString())

      await page.locator('#father____idType').click()
      await page
        .getByText(declaration.father.identifier.type, { exact: true })
        .click()

      await page.locator('#country').click()
      await page
        .locator('#country input')
        .fill(declaration.father.address.country.slice(0, 3))
      await page
        .locator('#country')
        .getByText(declaration.father.address.country, { exact: true })
        .click()

      await page.locator('#state').fill(declaration.father.address.state)
      await page.locator('#district2').fill(declaration.father.address.district)
      await page.locator('#cityOrTown').fill(declaration.father.address.town)
      await page
        .locator('#addressLine1')
        .fill(declaration.father.address.addressLine1)
      await page
        .locator('#addressLine2')
        .fill(declaration.father.address.addressLine2)
      await page
        .locator('#addressLine3')
        .fill(declaration.father.address.addressLine3)
      await page
        .locator('#postcodeOrZip')
        .fill(declaration.father.address.postcodeOrZip)

      await page.locator('#father____maritalStatus').click()
      await page
        .getByText(declaration.father.maritalStatus, { exact: true })
        .click()

      await page.locator('#father____educationalAttainment').click()
      await page
        .getByText(declaration.father.levelOfEducation, { exact: true })
        .click()

      await page.getByRole('button', { name: 'Continue' }).click()
    })

    test('6.1.5 Go to review', async () => {
      await goToSection(page, 'review')
    })

    test('6.1.6 Verify information on review page', async () => {
      /*
       * Expected result: should include
       * - Child's First Name
       * - Child's Family Name
       */
      await expect(page.getByTestId('row-value-child.name')).toHaveText(
        declaration.child.name.firstNames +
          ' ' +
          declaration.child.name.familyName
      )

      /*
       * Expected result: should include
       * - Child's Gender
       */
      await expect(page.getByTestId('row-value-child.gender')).toHaveText(
        declaration.child.gender
      )

      /*
       * Expected result: should include
       * - Child's date of birth
       */
      await expect(page.getByTestId('row-value-child.dob')).toContainText(
        formatDateObjectTo_dMMMMyyyy(declaration.child.birthDate)
      )

      /*
       * Expected result: should include
       * - Child's Place of birth type
       * - Child's Place of birth details
       */
      await validateAddress(
        page,
        declaration.birthLocation,
        'row-value-child.birthLocation.other'
      )

      /*
       * Expected result: should include
       * - Child's Attendant at birth
       */
      await expect(
        page.getByTestId('row-value-child.attendantAtBirth')
      ).toHaveText(declaration.attendantAtBirth)

      /*
       * Expected result: should include
       * - Child's Birth type
       */
      await expect(page.getByTestId('row-value-child.birthType')).toHaveText(
        declaration.birthType
      )

      /*
       * Expected result: should include
       * - Informant's relation to child
       */
      await expect(page.getByTestId('row-value-informant.relation')).toHaveText(
        declaration.informantType
      )

      /*
       * Expected result: should include
       * - Informant's Email
       */
      await expect(page.getByTestId('row-value-informant.email')).toHaveText(
        declaration.informantEmail
      )
      /*
       * Expected result: should include
       * - Informant's First Name
       * - Informant's Family Name
       */
      await expect(page.getByTestId('row-value-informant.name')).toHaveText(
        declaration.informant.name.firstNames +
          ' ' +
          declaration.informant.name.familyName
      )

      /*
       * Expected result: should include
       * - Informant's date of birth
       */
      await expect(page.getByTestId('row-value-informant.age')).toHaveText(
        declaration.informant.age.toString()
      )

      /*
       * Expected result: should include
       * - Informant's Nationality
       */
      await expect(
        page.getByTestId('row-value-informant.nationality')
      ).toHaveText(declaration.informant.nationality)

      /*
       * Expected result: should include
       * - Informant's address
       */
      await validateAddress(
        page,
        declaration.informant.address,
        'row-value-informant.address'
      )

      /*
       * Expected result: should include
       * - Informant's Type of Id
       * - Informant's Id
       */
      await expect(page.getByTestId('row-value-informant.idType')).toHaveText(
        declaration.informant.identifier.type
      )

      /*
       * Expected result: should include
       * - Mother's Details not available: true
       * - Reason of why mother's details not available
       */
      await expect(
        page.getByTestId('row-value-mother.detailsNotAvailable')
      ).toHaveText('Yes')
      await expect(page.getByTestId('row-value-mother.reason')).toHaveText(
        declaration.mother.reason
      )

      /*
       * Expected result: should include
       * - Father's First Name
       * - Father's Family Name
       */
      await expect(page.getByTestId('row-value-father.name')).toHaveText(
        declaration.father.name.firstNames +
          ' ' +
          declaration.father.name.familyName
      )

      /*
       * Expected result: should include
       * - Father's date of birth
       */
      await expect(page.getByTestId('row-value-father.age')).toHaveText(
        declaration.father.age.toString()
      )

      /*
       * Expected result: should include
       * - Father's Nationality
       */
      await expect(page.getByTestId('row-value-father.nationality')).toHaveText(
        declaration.father.nationality
      )

      /*
       * Expected result: should include
       * - Father's Type of Id
       * - Father's Id
       */
      await expect(page.getByTestId('row-value-father.idType')).toHaveText(
        declaration.father.identifier.type
      )

      /*
       * Expected result: should include
       * - Father's address
       */
      await validateAddress(
        page,
        declaration.father.address,
        'row-value-father.address'
      )

      /*
       * Expected result: should include
       * - Father's Marital status
       */
      await expect(
        page.getByTestId('row-value-father.maritalStatus')
      ).toHaveText(declaration.father.maritalStatus)

      /*
       * Expected result: should include
       * - Father's level of education
       */
      await expect(
        page.getByTestId('row-value-father.educationalAttainment')
      ).toHaveText(declaration.father.levelOfEducation)
    })

    test('6.1.7 Fill up informant signature', async () => {
      await page.locator('#review____comment').fill(faker.lorem.sentence())
      await page.getByRole('button', { name: 'Sign', exact: true }).click()
      await drawSignature(page, 'review____signature_canvas_element', false)
      await page
        .locator('#review____signature_modal')
        .getByRole('button', { name: 'Apply' })
        .click()

      await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test.skip('6.1.8 Register', async () => {
      await page.getByRole('button', { name: 'Register' }).click()
      await page.locator('#confirm_Declare').click()

      await ensureOutboxIsEmpty(page)

      await page.getByText('Ready to print').click()

      await expect(
        page.getByRole('button', {
          name: formatName(declaration.child.name)
        })
      ).toBeVisible()
    })
  })
})
