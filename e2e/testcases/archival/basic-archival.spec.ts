import { test, expect, type Page } from '@playwright/test'
import {
  continueForm,
  drawSignature,
  formatName,
  getRandomDate,
  goToSection,
  login,
  logout
} from '../../helpers'
import { faker } from '@faker-js/faker'
import { CREDENTIALS } from '../../constants'
import { fillDate } from '../birth/helpers'
import { ensureOutboxIsEmpty, selectAction } from '../../utils'

test.describe.serial('Basic Archival flow', () => {
  let page: Page
  const declaration = {
    child: {
      name: {
        firstNames: faker.person.firstName('male'),
        familyName: faker.person.lastName('male')
      },
      gender: 'Male',
      birthDate: getRandomDate(0, 200)
    },
    attendantAtBirth: 'Physician',
    birthType: 'Single',
    weightAtBirth: 2.4,
    placeOfBirth: 'Health Institution',
    birthLocation: {
      facility: 'Golden Valley Rural Health Centre',
      district: 'Ibombo',
      province: 'Central',
      country: 'Farajaland'
    },
    informantType: 'Mother',
    informantEmail: faker.internet.email(),
    mother: {
      name: {
        firstNames: faker.person.firstName('female'),
        familyName: faker.person.lastName('female')
      },
      birthDate: getRandomDate(20, 200),
      nationality: 'Farajaland',
      identifier: {
        id: faker.string.numeric(10),
        type: 'National ID'
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
      maritalStatus: 'Single',
      levelOfEducation: 'No schooling'
    },
    father: {
      name: {
        firstNames: faker.person.firstName('male'),
        familyName: faker.person.lastName('male')
      },
      birthDate: getRandomDate(22, 200),
      nationality: 'Gabon',
      identifier: {
        id: faker.string.numeric(10),
        type: 'National ID'
      },
      maritalStatus: 'Single',
      levelOfEducation: 'No schooling',
      address: {
        sameAsMother: true
      }
    }
  }
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('Login as FA', async () => {
    await login(page, CREDENTIALS.FIELD_AGENT)
  })

  test('Start creating new birth declaration', async () => {
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
    await page
      .locator('#child____birthLocation')
      .fill(declaration.birthLocation.facility.slice(0, 3))
    await page.getByText(declaration.birthLocation.facility).click()

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

    await page
      .locator('#child____weightAtBirth')
      .fill(declaration.weightAtBirth.toString())

    await continueForm(page)
  })

  test('Fill informant details', async () => {
    await page.locator('#informant____relation').click()
    await page
      .getByText(declaration.informantType, {
        exact: true
      })
      .click()

    await page.locator('#informant____email').fill(declaration.informantEmail)

    await continueForm(page)
  })

  test("Fill mother's details", async () => {
    await page.locator('#firstname').fill(declaration.mother.name.firstNames)
    await page.locator('#surname').fill(declaration.mother.name.familyName)

    await page.getByPlaceholder('dd').fill(declaration.mother.birthDate.dd)
    await page.getByPlaceholder('mm').fill(declaration.mother.birthDate.mm)
    await page.getByPlaceholder('yyyy').fill(declaration.mother.birthDate.yyyy)

    await page.locator('#mother____idType').click()
    await page
      .getByText(declaration.mother.identifier.type, { exact: true })
      .click()

    await page.locator('#mother____nid').fill(declaration.mother.identifier.id)

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

  test("Fill father's details", async () => {
    await page.locator('#firstname').fill(declaration.father.name.firstNames)
    await page.locator('#surname').fill(declaration.father.name.familyName)

    await fillDate(page, declaration.father.birthDate)

    await page.locator('#father____idType').click()
    await page
      .getByText(declaration.father.identifier.type, { exact: true })
      .click()

    await page.locator('#father____nid').fill(declaration.father.identifier.id)

    await page.locator('#father____nationality').click()
    await page
      .getByText(declaration.father.nationality, { exact: true })
      .click()

    await page.locator('#father____addressSameAs_YES').click()

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

  test('Go to review', async () => {
    await goToSection(page, 'review')
  })

  test('Fill up informant comment & signature', async () => {
    await page.locator('#review____comment').fill(faker.lorem.sentence())
    await page.getByRole('button', { name: 'Sign', exact: true }).click()
    await drawSignature(page, 'review____signature_canvas_element', false)
    await page
      .locator('#review____signature_modal')
      .getByRole('button', { name: 'Apply' })
      .click()
  })

  test('Send for review', async () => {
    await page.getByRole('button', { name: 'Send for review' }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()

    await ensureOutboxIsEmpty(page)
  })

  test('Archival is not available for FA', async () => {
    await page.getByText('Sent for review').click()
    await page
      .getByRole('button', {
        name: formatName(declaration.child.name)
      })
      .click()

    await page.getByRole('button', { name: 'Action', exact: true }).click()
    await expect(
      page.getByRole('button', { name: 'Assign', exact: true })
    ).not.toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Archive', exact: true })
    ).not.toBeVisible()
  })

  test('Logout', async () => {
    await logout(page)
  })

  test('Login as RA', async () => {
    await login(page, CREDENTIALS.REGISTRATION_AGENT)
  })

  test('Navigate to the event overview page', async () => {
    await page.getByText('Ready for review').click()

    // Expect not to see a quick action for Archival
    await expect(
      page.getByRole('button', { name: 'Archive', exact: true })
    ).not.toBeVisible()

    await page
      .getByRole('button', {
        name: formatName(declaration.child.name)
      })
      .click()
  })

  test('Archive the declaration', async () => {
    await selectAction(page, 'Archive')
    await expect(page.getByText('Archive declaration?')).toBeVisible()
    await expect(
      page.getByText(
        'This will archive the record and remove it from your workspace'
      )
    ).toBeVisible()
    await page.getByRole('button', { name: 'Archive', exact: true }).click()
  })

  test('Archived declaration is not visible in workqueues', async () => {
    await page.getByText('Ready for review').click()
    await expect(
      page.getByRole('button', {
        name: formatName(declaration.child.name)
      })
    ).not.toBeVisible()
  })

  test('Archived declaration can be found via search', async () => {
    await page.locator('#searchText').fill(formatName(declaration.child.name))
    await page.locator('#searchIconButton').click()
    await page
      .getByRole('button', {
        name: formatName(declaration.child.name)
      })
      .click()

    await expect(page.getByTestId('status-value')).toHaveText('Archived')
  })
})
