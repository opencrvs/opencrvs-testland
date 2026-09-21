import { test, expect, type Page } from '@playwright/test'
import {
  continueForm,
  drawSignature,
  formatName,
  getRandomDate,
  goToSection,
  login,
  logout
} from '../../../helpers'
import { faker } from '@faker-js/faker'
import { CREDENTIALS } from '../../../constants'
import { ensureOutboxIsEmpty, selectAction } from '../../../utils'
import { REQUIRED_VALIDATION_ERROR } from '../helpers'

test.describe.serial('Change informant on review', () => {
  let page: Page
  const declaration = {
    child: {
      name: {
        firstNames: faker.person.firstName() + '-Peter',
        familyName: faker.person.lastName()
      },
      gender: 'Unknown',
      birthDate: getRandomDate(0, 200)
    },
    attendantAtBirth: 'Other paramedical personnel',
    birthType: 'Quadruplet',
    placeOfBirth: 'Other',
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
    informantEmail: faker.internet.email(),
    mother: {
      name: {
        firstNames: faker.person.firstName('female'),
        familyName: faker.person.lastName('female')
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
      maritalStatus: 'Divorced',
      levelOfEducation: 'Tertiary'
    },
    father: {
      name: {
        firstNames: faker.person.firstName('male'),
        familyName: faker.person.lastName('male')
      },
      birthDate: getRandomDate(22, 200),
      nationality: 'Farajaland',
      identifier: {
        type: 'None'
      },
      maritalStatus: 'Divorced',
      levelOfEducation: 'Tertiary',
      address: {
        sameAsMother: false,
        country: 'Grenada',
        state: faker.location.state(),
        district: faker.location.county(),
        town: faker.location.city(),
        addressLine1: faker.location.county(),
        addressLine2: faker.location.street(),
        addressLine3: faker.location.buildingNumber(),
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

  test.describe('Declaration started by RA', async () => {
    test.beforeAll(async () => {
      await login(page, CREDENTIALS.REGISTRATION_AGENT)
      await page.click('#header-new-event')
      await page.getByLabel('Birth').click()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()
    })

    test('Fill child details', async () => {
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

      await page.locator('#province').click()
      await page
        .getByText(declaration.birthLocation.province, {
          exact: true
        })
        .click()

      await page.locator('#district').click()
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

    test('Select mother as informant', async () => {
      await page.locator('#informant____relation').click()
      await page.getByText('Mother', { exact: true }).click()
      await page.locator('#informant____email').fill(declaration.informantEmail)

      await continueForm(page)
    })

    test("Fill mother's details", async () => {
      await page.locator('#firstname').fill(declaration.mother.name.firstNames)
      await page.locator('#surname').fill(declaration.mother.name.familyName)

      await page.getByLabel('Exact date of birth unknown').check()

      await page
        .locator('#mother____age')
        .fill(declaration.mother.age.toString())

      await page.locator('#mother____idType').click()
      await page
        .getByText(declaration.mother.identifier.type, { exact: true })
        .click()

      await page.locator('#country').click()
      await page
        .locator('#country input')
        .fill(declaration.mother.address.country.slice(0, 3))
      await page
        .locator('#country')
        .getByText(declaration.mother.address.country, { exact: true })
        .click()

      await page.locator('#state').fill(declaration.mother.address.state)
      await page.locator('#district2').fill(declaration.mother.address.district)
      await page.locator('#cityOrTown').fill(declaration.mother.address.town)
      await page
        .locator('#addressLine1')
        .fill(declaration.mother.address.addressLine1)
      await page
        .locator('#addressLine2')
        .fill(declaration.mother.address.addressLine2)
      await page
        .locator('#addressLine3')
        .fill(declaration.mother.address.addressLine3)
      await page
        .locator('#postcodeOrZip')
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

    test('No fathers details available', async () => {
      await page.getByLabel("Father's details are not available").check()
      await page.locator('#father____reason').fill(faker.lorem.sentence())
    })

    test('Go to review', async () => {
      await goToSection(page, 'review')
    })

    test('Fill up signature and comment', async () => {
      await page.locator('#review____comment').fill(faker.lorem.sentence())
      await page.getByRole('button', { name: 'Sign', exact: true }).click()
      await drawSignature(page, 'review____signature_canvas_element', false)
      await page
        .locator('#review____signature_modal')
        .getByRole('button', { name: 'Apply' })
        .click()

      await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test('Send for approval', async () => {
      await page.getByRole('button', { name: 'Send for approval' }).click()
      await page.getByRole('button', { name: 'Confirm' }).click()

      await ensureOutboxIsEmpty(page)

      await page.getByText('Sent for approval').click()

      await expect(
        page.getByRole('button', {
          name: formatName(declaration.child.name)
        })
      ).toBeVisible()
    })
  })

  test.describe('Declaration Review by Local Registrar', async () => {
    test('Navigate to the declaration review page', async () => {
      await logout(page)
      await login(page, CREDENTIALS.LOCAL_REGISTRAR)

      await page.getByText('Ready for review').click()

      await page
        .getByRole('button', {
          name: formatName(declaration.child.name)
        })
        .click()

      await selectAction(page, 'Review')
    })

    test('Change informant to father', async () => {
      await page.getByTestId('change-button-informant.relation').click()
      await page.getByRole('button', { name: 'Continue' }).click()

      await page.locator('#informant____relation').click()
      await page.getByText('Father', { exact: true }).click()
      await page.locator('#informant____email').fill(faker.internet.email())
    })

    test('Go back to review, expect to see validation errors for father information', async () => {
      await page.getByRole('button', { name: 'Go to review' }).click()

      await expect(page.getByTestId('row-value-father.name')).toContainText(
        REQUIRED_VALIDATION_ERROR
      )
      await expect(page.getByTestId('row-value-father.dob')).toContainText(
        REQUIRED_VALIDATION_ERROR
      )
      await expect(page.getByTestId('row-value-father.idType')).toContainText(
        REQUIRED_VALIDATION_ERROR
      )

      await expect(
        page.getByRole('button', { name: 'Register' })
      ).toBeDisabled()
    })

    test('Fill in father details', async () => {
      await page.getByTestId('change-button-father.name').click()
      await page.getByRole('button', { name: 'Continue' }).click()

      await page.locator('#firstname').fill(declaration.father.name.firstNames)
      await page.locator('#surname').fill(declaration.father.name.familyName)

      await page.getByPlaceholder('dd').fill(declaration.father.birthDate.dd)
      await page.getByPlaceholder('mm').fill(declaration.father.birthDate.mm)
      await page
        .getByPlaceholder('yyyy')
        .fill(declaration.father.birthDate.yyyy)

      await page.getByTestId('select__father____idType').click()
      await page
        .getByText(declaration.father.identifier.type, { exact: true })
        .click()
    })

    test('Go back to review, expect to not see any validation errors', async () => {
      await page.getByRole('button', { name: 'Go to review' }).click()
      await expect(page.getByText(REQUIRED_VALIDATION_ERROR)).not.toBeVisible()
      await expect(page.getByRole('button', { name: 'Register' })).toBeEnabled()
    })
  })
})
