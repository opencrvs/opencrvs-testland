import { expect, test, type Page } from '@playwright/test'
import {
  auditRecord,
  getToken,
  login,
  logout,
  uploadImageToSection
} from '../../helpers'
import { faker } from '@faker-js/faker'
import {
  createDeclaration,
  Declaration,
  getPlaceOfBirth
} from '../test-data/birth-declaration'
import { CREDENTIALS } from '../../constants'
import { formatV2ChildName } from '../birth/helpers'
import { ensureAssigned, selectAction } from '../../utils'
import { getAllLocations, getLocationIdByName } from '../birth/helpers'
import { AddressType } from '@opencrvs/toolkit/events'

test.describe.serial('Correct record - Change ages', () => {
  let declaration: Declaration
  let trackingId = ''
  let page: Page

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  const motherAgeBefore = '28'
  const motherAgeAfter = '29'
  const informantAgeBefore = '16'
  const informantAgeAfter = '22'

  test('Shortcut declaration', async () => {
    let token = await getToken(
      CREDENTIALS.NATIONAL_REGISTRAR.USERNAME,
      CREDENTIALS.NATIONAL_REGISTRAR.PASSWORD
    )

    const locations = await getAllLocations('ADMIN_STRUCTURE')
    const province = getLocationIdByName(locations, 'Central')
    const district = getLocationIdByName(locations, 'Ibombo')

    if (!province || !district) {
      throw new Error('Province or district not found')
    }

    const childDob = new Date(Date.now() - 60 * 60 * 24 * 1000)
      .toISOString()
      .split('T')[0]

    const payload = {
      'informant.relation': 'BROTHER',
      'informant.email': 'brothers@email.com',
      'informant.name': {
        firstname: faker.person.firstName(),
        surname: faker.person.lastName()
      },
      'informant.dobUnknown': true,
      'informant.age': {
        age: Number.parseInt(informantAgeBefore),
        asOfDateRef: 'child.dob'
      },
      'informant.nationality': 'FAR',
      'informant.idType': 'NATIONAL_ID',
      'informant.nid': faker.string.numeric(10),
      'informant.address': {
        country: 'FAR',
        administrativeArea: district,
        addressType: AddressType.DOMESTIC
      },
      'father.detailsNotAvailable': true,
      'father.reason': 'Father is missing.',
      'mother.dobUnknown': true,
      'mother.age': {
        age: Number.parseInt(motherAgeBefore),
        asOfDateRef: 'child.dob'
      },
      ...(await getPlaceOfBirth('PRIVATE_HOME')),
      'mother.name': {
        firstname: faker.person.firstName(),
        surname: faker.person.lastName()
      },
      'mother.nationality': 'FAR',
      'mother.idType': 'NATIONAL_ID',
      'mother.nid': faker.string.numeric(10),
      'mother.address': {
        country: 'FAR',
        addressType: AddressType.DOMESTIC,
        administrativeArea: district
      },
      'child.name': {
        firstname: faker.person.firstName(),
        surname: faker.person.lastName()
      },
      'child.gender': 'female',
      'child.dob': childDob
    }

    const res = await createDeclaration(token, payload)

    expect(res).toEqual(
      expect.objectContaining({
        trackingId: expect.any(String)
      })
    )
    trackingId = res.trackingId!
    token = await getToken('k.mweene', 'test')
    declaration = res.declaration
  })

  test('Login as Registration Agent', async () => {
    await login(page, CREDENTIALS.REGISTRATION_AGENT)
  })

  test('Ready to correct record > record audit', async () => {
    await auditRecord({
      page,
      name: formatV2ChildName(declaration),
      trackingId
    })
    await ensureAssigned(page)

    await page.getByRole('button', { name: 'Action', exact: true }).click()

    await expect(
      page.getByText('Correct record', { exact: true })
    ).toBeVisible()

    await page.getByText('Correct record', { exact: true }).click()
  })

  test('Correction requester: legal guardian', async () => {
    await page.locator('#requester____type').click()
    await page.getByText('Legal Guardian', { exact: true }).click()
    await page.locator('#reason____option').click()
    await page
      .getByText('Informant provided incorrect information (Material error)', {
        exact: true
      })
      .click()
    await page.getByRole('button', { name: 'Continue' }).click()
  })

  test('Verify identity', async () => {
    await page.getByRole('button', { name: 'Verified' }).click()
  })

  test('Upload supporting documents', async () => {
    expect(page.url().includes('correction')).toBeTruthy()

    expect(page.url().includes('onboarding/documents')).toBeTruthy()

    await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled()

    const imageUploadSectionTitles = ['Affidavit', 'Court Document', 'Other']

    for (const sectionTitle of imageUploadSectionTitles) {
      await uploadImageToSection({
        page,
        sectionLocator: page.locator('#corrector_form'),
        sectionTitle,
        buttonLocator: page.getByRole('button', { name: 'Upload' })
      })
    }

    await page.getByRole('button', { name: 'Continue' }).click()
  })

  test('Correction fee', async () => {
    await page
      .locator('#fees____amount')
      .fill(faker.number.int({ min: 1, max: 1000 }).toString())

    await page.getByRole('button', { name: 'Continue' }).click()

    expect(page.url().includes('correction')).toBeTruthy()
    expect(page.url().includes('review')).toBeTruthy()
  })

  test('Change informant age', async () => {
    await page.getByTestId('change-button-informant.age').click()

    await page.getByTestId('age__informant____age').fill(informantAgeAfter)

    await page
      .getByRole('button', { name: 'Go to review', exact: true })
      .click()

    await expect(
      page.getByTestId('row-value-informant.age').getByRole('deletion')
    ).toHaveText(informantAgeBefore)

    await expect(
      page.getByTestId('row-value-informant.age').getByText(informantAgeAfter)
    ).toBeVisible()
  })

  test('Change mother address to international', async () => {
    await page.getByTestId('change-button-mother.address').click()
    await page.getByTestId('location__country').click()
    await page.getByText('Ethiopia').click()
    await page
      .getByRole('button', { name: 'Go to review', exact: true })
      .click()
    await expect(page.getByTestId('row-value-mother.address')).toHaveText(
      'State is required'
    )

    await page.getByTestId('change-button-mother.address').click()

    await page.getByTestId('text__state').fill('Oromia')
    await page
      .getByRole('button', { name: 'Go to review', exact: true })
      .click()
    await expect(page.getByTestId('row-value-mother.address')).toHaveText(
      'District is required'
    )

    await page.getByTestId('change-button-mother.address').click()
    await page.getByTestId('text__district2').fill('Woreda')
    await page
      .getByRole('button', { name: 'Go to review', exact: true })
      .click()

    await expect(page.getByTestId('row-value-mother.address')).toHaveText(
      'FarajalandCentralIbomboEthiopiaOromiaWoreda'
    )
  })

  test('Change mother age', async () => {
    await page.getByTestId('change-button-mother.age').click()

    await page.getByTestId('age__mother____age').fill(motherAgeAfter)

    await page
      .getByRole('button', { name: 'Go to review', exact: true })
      .click()

    await expect(
      page.getByTestId('row-value-mother.age').getByRole('deletion')
    ).toHaveText(motherAgeBefore)

    await expect(
      page.getByTestId('row-value-mother.age').getByText(motherAgeAfter)
    ).toBeVisible()
  })

  test('Correction summary', async () => {
    await page.getByRole('button', { name: 'Continue', exact: true }).click()

    expect(page.url().includes('correction')).toBeTruthy()
    expect(page.url().includes('summary')).toBeTruthy()

    await expect(page.getByText("Father's details")).not.toBeVisible()
    await expect(page.getByText("Child's details")).not.toBeVisible()
    await expect(page.getByText("Mother's details")).toBeVisible()

    await page.pause()

    await expect(
      page.getByText(
        'Age of mother (at the time of event)' +
          motherAgeBefore +
          motherAgeAfter
      )
    ).toBeVisible()

    await expect(
      page.getByText(
        'Usual place of residenceFarajalandCentralIbomboEthiopiaOromiaWoreda'
      )
    ).toBeVisible()

    await expect(page.getByText("Informant's details")).toBeVisible()
    await expect(
      page.getByText(
        'Age of informant (at the time of event)' +
          informantAgeBefore +
          informantAgeAfter
      )
    ).toBeVisible()
  })

  test('Submit correction request', async () => {
    await page
      .getByRole('button', { name: 'Submit correction request' })
      .click()

    await page.getByRole('button', { name: 'Confirm' }).click()
  })

  test('Logout', async () => {
    await logout(page)
  })

  test('Login as Local Registrar', async () => {
    await login(page, CREDENTIALS.LOCAL_REGISTRAR)
  })

  test('Find the event in the "Ready for review" workflow', async () => {
    await page.getByRole('button', { name: 'Ready for review' }).click()

    await page
      .getByRole('button', { name: formatV2ChildName(declaration) })
      .click()
  })

  test('Approve correction request', async () => {
    await selectAction(page, 'Review')
    await page.getByRole('button', { name: 'Approve', exact: true }).click()
    await page.getByRole('button', { name: 'Confirm', exact: true }).click()
  })

  test('View record', async () => {
    await auditRecord({
      page,
      name: formatV2ChildName(declaration),
      trackingId
    })

    await ensureAssigned(page)

    await selectAction(page, 'View')

    await expect(
      page.getByTestId('row-value-informant.age').getByText(informantAgeAfter)
    ).toBeVisible()

    await expect(
      page.getByTestId('row-value-mother.age').getByText(motherAgeAfter)
    ).toBeVisible()
  })
})
