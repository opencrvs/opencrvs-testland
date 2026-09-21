import { test, expect, type Page } from '@playwright/test'
import {
  continueForm,
  drawSignature,
  formatDateObjectTo_dMMMMyyyy,
  formatName,
  getRandomDate,
  goToSection,
  login,
  expectRowValueWithChangeButton
} from '../../../helpers'
import { faker } from '@faker-js/faker'
import { CREDENTIALS } from '../../../constants'
import { validateAddress } from '../helpers'
import { ensureOutboxIsEmpty, selectAction } from '../../../utils'

test.describe.serial('2. Birth declaration case - 2', () => {
  let page: Page
  const declaration = {
    child: {
      name: {
        firstNames: faker.person.firstName('female'),
        familyName: faker.person.lastName('female')
      },
      gender: 'Female',
      birthDate: getRandomDate(0, 200)
    },
    attendantAtBirth: 'Nurse',
    birthType: 'Twin',
    placeOfBirth: 'Residential address',
    birthLocation: {
      country: 'Farajaland',
      province: 'Pualula',
      district: 'Funabuli',
      town: faker.location.city(),
      residentialArea: faker.location.county(),
      street: faker.location.street(),
      number: faker.location.buildingNumber(),
      postcodeOrZip: faker.location.zipCode()
    },
    informantType: 'Father',
    informantEmail: faker.internet.email(),
    mother: {
      name: {
        firstNames: faker.person.firstName('female'),
        familyName: faker.person.lastName('female')
      },
      age: 21,
      nationality: 'Fiji',
      identifier: {
        id: faker.string.numeric(12),
        type: 'Passport'
      },
      address: {
        country: 'Farajaland',
        province: 'Sulaka',
        district: 'Irundu',
        town: faker.location.city(),
        residentialArea: faker.location.county(),
        street: faker.location.street(),
        number: faker.location.buildingNumber(),
        postcodeOrZip: faker.location.zipCode()
      },
      maritalStatus: 'Married',
      levelOfEducation: 'Primary'
    },
    father: {
      name: {
        firstNames: faker.person.firstName('male'),
        familyName: faker.person.lastName('male')
      },
      age: 25,
      nationality: 'Farajaland',
      identifier: {
        id: faker.string.numeric(8),
        type: 'Passport'
      },
      maritalStatus: 'Married',
      levelOfEducation: 'Primary',
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
    }
  }
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test.describe('2.1 Declaration started by FA', async () => {
    test.beforeAll(async () => {
      await login(page, CREDENTIALS.FIELD_AGENT)
      await page.click('#header-new-event')
      await page.getByLabel('Birth').click()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()
    })

    test('2.1.1 Fill child details', async () => {
      await page.locator('#firstname').fill(declaration.child.name.firstNames)
      await page.locator('#surname').fill(declaration.child.name.familyName)
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

      await page
        .locator(
          '#child____birthLocation____privateHome-form-input #country-form-input input'
        )
        .fill(declaration.birthLocation.country.slice(0, 3))
      await page
        .locator(
          '#child____birthLocation____privateHome-form-input #country-form-input'
        )
        .getByText(declaration.birthLocation.country, { exact: true })
        .click()

      await page
        .locator('#child____birthLocation____privateHome-form-input #province')
        .click()
      await page
        .getByText(declaration.birthLocation.province, {
          exact: true
        })
        .click()

      await page
        .locator('#child____birthLocation____privateHome-form-input #district')
        .click()
      await page
        .getByText(declaration.birthLocation.district, {
          exact: true
        })
        .click()

      await page.locator('#town').fill(declaration.birthLocation.town)
      await page
        .locator('#residentialArea')
        .fill(declaration.birthLocation.residentialArea)
      await page.locator('#street').fill(declaration.birthLocation.street)
      await page.locator('#number').fill(declaration.birthLocation.number)
      await page
        .locator('#zipCode')
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

    test('2.1.2 Fill informant details', async () => {
      await page.locator('#informant____relation').click()
      await page
        .getByText(declaration.informantType, {
          exact: true
        })
        .click()

      await page.locator('#informant____email').fill(declaration.informantEmail)

      await continueForm(page)
    })

    test("2.1.3 Fill mother's details", async () => {
      await page.locator('#firstname').fill(declaration.mother.name.firstNames)
      await page.locator('#surname').fill(declaration.mother.name.familyName)

      await page.getByLabel('Exact date of birth unknown').check()
      await page
        .locator('#mother____age')
        .fill(declaration.mother.age.toString())

      await page.locator('#mother____nationality').click()
      await page
        .getByText(declaration.mother.nationality, { exact: true })
        .click()

      await page.locator('#mother____idType').click()
      await page
        .getByText(declaration.mother.identifier.type, { exact: true })
        .click()

      await page
        .locator('#mother____passport')
        .fill(declaration.mother.identifier.id)

      await page.locator('#country').click()
      await page
        .locator('#country input')
        .fill(declaration.mother.address.country.slice(0, 3))
      await page
        .locator('#country')
        .getByText(declaration.mother.address.country, { exact: true })
        .click()

      await page.locator('#province').click()
      await page
        .getByText(declaration.mother.address.province, { exact: true })
        .click()
      await page.locator('#district').click()
      await page
        .getByText(declaration.mother.address.district, { exact: true })
        .click()

      await page.locator('#town').fill(declaration.mother.address.town)
      await page
        .locator('#residentialArea')
        .fill(declaration.mother.address.residentialArea)
      await page.locator('#street').fill(declaration.mother.address.street)
      await page.locator('#number').fill(declaration.mother.address.number)
      await page
        .locator('#zipCode')
        .fill(declaration.mother.address.postcodeOrZip)

      await page.locator('#mother____maritalStatus').click()
      await page
        .getByText(declaration.mother.maritalStatus, { exact: true })
        .click()

      await page.locator('#mother____educationalAttainment').click()
      await page
        .getByText(declaration.mother.levelOfEducation, { exact: true })
        .click()

      await continueForm(page)
    })

    test("2.1.4 Fill father's details", async () => {
      await page.locator('#firstname').fill(declaration.father.name.firstNames)
      await page.locator('#surname').fill(declaration.father.name.familyName)

      await page.getByLabel('Exact date of birth unknown').check()
      await page
        .locator('#father____age')
        .fill(declaration.father.age.toString())

      await page.locator('#father____idType').click()
      await page
        .getByText(declaration.father.identifier.type, { exact: true })
        .click()

      await page
        .locator('#father____passport')
        .fill(declaration.father.identifier.id)

      await page.getByLabel('No', { exact: true }).check()

      await page.locator('#country').click()
      await page
        .locator('#country input')
        .fill(declaration.father.address.country.slice(0, 3))
      await page
        .locator('#country')
        .getByText(declaration.father.address.country, { exact: true })
        .click()

      await page.locator('#province').click()
      await page
        .getByText(declaration.father.address.province, { exact: true })
        .click()
      await page.locator('#district').click()
      await page
        .getByText(declaration.father.address.district, { exact: true })
        .click()
      await page.locator('#town').fill(declaration.father.address.town)
      await page
        .locator('#residentialArea')
        .fill(declaration.father.address.residentialArea)
      await page.locator('#street').fill(declaration.father.address.street)
      await page.locator('#number').fill(declaration.father.address.number)
      await page
        .locator('#zipCode')
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

    test('2.1.5 Go To Review', async () => {
      await goToSection(page, 'review')
    })

    test('2.1.6 Verify information on review page', async () => {
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
      await expect(page.getByTestId('row-value-child.dob')).toHaveText(
        formatDateObjectTo_dMMMMyyyy(declaration.child.birthDate)
      )

      /*
       * Expected result: should include
       * - Child's Place of birth type
       * - Child's Place of birth details
       */
      await expect(page.getByTestId('row-value-child.placeOfBirth')).toHaveText(
        declaration.placeOfBirth
      )

      await validateAddress(
        page,
        declaration.birthLocation,
        'row-value-child.birthLocation.privateHome'
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
       * - Mother's First Name
       * - Mother's Family Name
       */
      await expect(page.getByTestId('row-value-mother.name')).toHaveText(
        declaration.mother.name.firstNames +
          ' ' +
          declaration.mother.name.familyName
      )

      /*
       * Expected result: should include
       * - Mother's age
       */
      // @TODO: this should pass, but 'years' postfix is not yet implemented on V2
      // await expect(
      //   page.getByTestId(
      //   'row-value-mother.age')).toHaveText(
      //   joinValuesWith([declaration.mother.age, 'years'])
      // )

      /*
       * Expected result: should include
       * - Mother's Nationality
       */
      await expect(page.getByTestId('row-value-mother.nationality')).toHaveText(
        declaration.mother.nationality
      )

      /*
       * Expected result: should include
       * - Mother's Marital status
       */
      await expect(
        page.getByTestId('row-value-mother.maritalStatus')
      ).toHaveText(declaration.mother.maritalStatus)

      /*
       * Expected result: should include
       * - Mother's level of education
       */
      await expect(
        page.getByTestId('row-value-mother.educationalAttainment')
      ).toHaveText(declaration.mother.levelOfEducation)

      /*
       * Expected result: should include
       * - Mother's Type of Id
       * - Mother's Id Number
       */
      await expect(page.getByTestId('row-value-mother.idType')).toHaveText(
        declaration.mother.identifier.type
      )

      await expect(page.getByTestId('row-value-mother.passport')).toHaveText(
        declaration.mother.identifier.id
      )

      /*
       * Expected result: should include
       * - Mother's address
       */
      await validateAddress(
        page,
        declaration.mother.address,
        'row-value-mother.address'
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
      // @TODO: this should pass, but 'years' postfix is not yet implemented on V2
      // await expect(
      //   page.getByTestId(
      //   'row-value-father.age')).toHaveText(
      //   joinValuesWith([declaration.father.age, 'years'])
      // )

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
       * - Father's Id Number
       */
      await expect(page.getByTestId('row-value-father.idType')).toHaveText(
        declaration.father.identifier.type
      )

      await expect(page.getByTestId('row-value-father.passport')).toHaveText(
        declaration.father.identifier.id
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

      /*
       * Expected result: should include
       * - Father's address
       */
      await validateAddress(
        page,
        declaration.father.address,
        'row-value-father.address'
      )
    })

    test('2.1.7 Fill up informant comment & signature', async () => {
      await page.locator('#review____comment').fill(faker.lorem.sentence())
      await page.getByRole('button', { name: 'Sign', exact: true }).click()
      await drawSignature(page, 'review____signature_canvas_element', false)
      await page
        .locator('#review____signature_modal')
        .getByRole('button', { name: 'Apply' })
        .click()

      await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test('2.1.8 Send for review', async () => {
      await page.getByRole('button', { name: 'Send for review' }).click()
      await expect(page.getByText('Send for review?')).toBeVisible()
      await page.getByRole('button', { name: 'Confirm' }).click()

      await ensureOutboxIsEmpty(page)

      await page.getByText('Sent for review').click()

      await expect(
        page.getByRole('button', {
          name: formatName(declaration.child.name)
        })
      ).toBeVisible()
    })
  })

  test.describe('2.2 Declaration Review by RA', async () => {
    test('2.2.1 Navigate to the declaration review page', async () => {
      await login(page, CREDENTIALS.REGISTRATION_AGENT)
      await page.getByRole('button', { name: 'Ready for review' }).click()
      await page
        .getByRole('button', {
          name: formatName(declaration.child.name)
        })
        .click()

      await selectAction(page, 'Review')
    })
    test('2.2.2 Verify information on review page', async () => {
      /*
       * Expected result: should include
       * - Child's First Name
       * - Child's Family Name
       */
      await expectRowValueWithChangeButton(
        page,
        'child.name',
        declaration.child.name.firstNames +
          ' ' +
          declaration.child.name.familyName
      )

      /*
       * Expected result: should include
       * - Child's Gender
       */
      await expectRowValueWithChangeButton(
        page,
        'child.gender',
        declaration.child.gender
      )

      /*
       * Expected result: should include
       * - Child's date of birth
       */
      await expectRowValueWithChangeButton(
        page,
        'child.dob',
        formatDateObjectTo_dMMMMyyyy(declaration.child.birthDate)
      )

      /*
       * Expected result: should include
       * - Child's Place of birth type
       */
      await expectRowValueWithChangeButton(
        page,
        'child.placeOfBirth',
        declaration.placeOfBirth
      )
      /*
       * Expected result: should include
       * - Child's Place of birth details
       */
      await expectRowValueWithChangeButton(
        page,
        'child.birthLocation.privateHome',
        Object.values(declaration.birthLocation)
          .filter((t) => t !== 'Urban')
          .join('')
      )

      /*
       * Expected result: should include
       * - Child's Attendant at birth
       */
      await expectRowValueWithChangeButton(
        page,
        'child.attendantAtBirth',
        declaration.attendantAtBirth
      )

      /*
       * Expected result: should include
       * - Child's Birth type
       */
      await expectRowValueWithChangeButton(
        page,
        'child.birthType',
        declaration.birthType
      )

      /*
       * Expected result: should include
       * - Informant's relation to child
       */
      await expectRowValueWithChangeButton(
        page,
        'informant.relation',
        declaration.informantType
      )

      /*
       * Expected result: should include
       * - Informant's Email
       */
      await expectRowValueWithChangeButton(
        page,
        'informant.email',
        declaration.informantEmail
      )

      /*
       * Expected result: should include
       * - Mother's First Name
       * - Mother's Family Name
       */
      await expectRowValueWithChangeButton(
        page,
        'mother.name',
        declaration.mother.name.firstNames
      )

      // @TODO: this should pass, but 'years' postfix is not yet implemented on V2
      /*
       * Expected result: should include
       * - Mother's age
       */
      // await expectRowValueWithChangeButton(
      //   page,
      //   'mother.age',
      //   joinValuesWith([declaration.mother.age, 'years'])
      // )

      /*
       * Expected result: should include
       * - Mother's Nationality
       */
      await expectRowValueWithChangeButton(
        page,
        'mother.nationality',
        declaration.mother.nationality
      )

      /*
       * Expected result: should include
       * - Mother's Marital status
       */
      await expectRowValueWithChangeButton(
        page,
        'mother.maritalStatus',
        declaration.mother.maritalStatus
      )

      /*
       * Expected result: should include
       * - Mother's level of education
       */
      await expectRowValueWithChangeButton(
        page,
        'mother.educationalAttainment',
        declaration.mother.levelOfEducation
      )

      /*
       * Expected result: should include
       * - Mother's Type of Id
       */
      await expectRowValueWithChangeButton(
        page,
        'mother.idType',
        declaration.mother.identifier.type
      )

      /*
       * Expected result: should include
       * - Mother's Id Number
       */
      await expectRowValueWithChangeButton(
        page,
        'mother.passport',
        declaration.mother.identifier.id
      )

      /*
       * Expected result: should include
       * - Mother's address
       */
      await expectRowValueWithChangeButton(
        page,
        'mother.address',
        declaration.mother.address.country
      )
      await expectRowValueWithChangeButton(
        page,
        'mother.address',
        declaration.mother.address.district
      )
      await expectRowValueWithChangeButton(
        page,
        'mother.address',
        declaration.mother.address.province
      )
      /*
       * Expected result: should include
       * - Father's First Name
       * - Father's Family Name
       */
      await expectRowValueWithChangeButton(
        page,
        'father.name',
        declaration.father.name.firstNames +
          ' ' +
          declaration.father.name.familyName
      )

      // @TODO: this should pass, but 'years' postfix is not yet implemented on V2
      /*
       * Expected result: should include
       * - Father's date of birth
       */
      // await expectRowValueWithChangeButton(
      //   page,
      //   'father.age',
      //   joinValuesWith([declaration.father.age, 'years'])
      // )

      /*
       * Expected result: should include
       * - Father's Nationality
       */
      await expectRowValueWithChangeButton(
        page,
        'father.nationality',
        declaration.father.nationality
      )

      /*
       * Expected result: should include
       * - Father's Type of Id
       */
      await expectRowValueWithChangeButton(
        page,
        'father.idType',
        declaration.father.identifier.type
      )

      /*
       * Expected result: should include
       * - Father's Id Number
       */
      await expectRowValueWithChangeButton(
        page,
        'father.passport',
        declaration.father.identifier.id
      )

      /*
       * Expected result: should include
       * - Father's Marital status
       */
      await expectRowValueWithChangeButton(
        page,
        'father.maritalStatus',
        declaration.father.maritalStatus
      )

      /*
       * Expected result: should include
       * - Father's level of education
       */
      await expectRowValueWithChangeButton(
        page,
        'father.educationalAttainment',
        declaration.father.levelOfEducation
      )

      /*
       * Expected result: should include
       * - Father's address
       */
      await expectRowValueWithChangeButton(
        page,
        'father.address',
        declaration.father.address.country
      )
      await expectRowValueWithChangeButton(
        page,
        'father.address',
        declaration.father.address.district
      )
      await expectRowValueWithChangeButton(
        page,
        'father.address',
        declaration.father.address.province
      )
    })
  })
})
