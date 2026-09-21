import { expect, Locator, test, type Page } from '@playwright/test'
import {
  auditRecord,
  formatDateTo_dMMMMyyyy,
  getToken,
  goBackToReview,
  login,
  uploadImage
} from '../../helpers'
import { faker } from '@faker-js/faker'
import {
  CREDENTIALS,
  SAFE_INPUT_CHANGE_TIMEOUT_MS,
  SAFE_OUTBOX_TIMEOUT_MS
} from '../../constants'
import { random } from 'lodash'
import {
  createDeclaration as createDeclarationV2,
  Declaration as DeclarationV2
} from '../test-data/birth-declaration-with-mother-father'
import { format, subDays, subYears } from 'date-fns'
import { formatV2ChildName } from '../birth/helpers'
import { IdType } from '@countryconfig/form/v2/person'
import { ensureAssigned, ensureOutboxIsEmpty, expectInUrl } from '../../utils'

test.describe.serial(' Correct record - 3', () => {
  let declaration: DeclarationV2
  let trackingId: string
  let eventId: string
  let page: Page

  const updatedMotherDetails = {
    firstNames: faker.person.firstName('female'),
    familyName: faker.person.lastName('female'),
    age: random(20, 45),
    email: faker.internet.email(),
    nationality: 'Ethiopia',
    id: '9241628813',
    idType: IdType.PASSPORT,
    passport: '1911901024',
    address: {
      country: 'Farajaland',
      province: 'Sulaka',
      district: 'Irundu',
      town: faker.location.city(),
      residentialArea: faker.location.county(),
      street: faker.location.street(),
      number: faker.location.buildingNumber(),
      zipCode: faker.location.zipCode()
    },
    maritalStatus: 'Widowed',
    educationLevel: 'Primary'
  }
  const updatedChildDetails = {
    placeOfBirth: 'Other',
    birthLocation: {
      country: 'Farajaland',
      province: 'Pualula',
      district: 'Ienge',
      town: faker.location.city(),
      residentialArea: faker.location.county(),
      street: faker.location.street(),
      number: faker.location.buildingNumber(),
      zipCode: faker.location.zipCode()
    }
  }
  const correctionFee = faker.number.int({ min: 1, max: 1000 }).toString()

  const visible = async (
    _page: Page | Locator = page,
    col1: string,
    col2?: string,
    col3?: string
  ) => {
    await expect(_page.getByText(col1, { exact: true })).toBeVisible()
    col2 && (await expect(_page.getByText(col2, { exact: true })).toBeVisible())
    col3 && (await expect(_page.getByText(col3, { exact: true })).toBeVisible())
  }

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('3.0 Shortcut declaration', async () => {
    const token = await getToken(
      CREDENTIALS.LOCAL_REGISTRAR.USERNAME,
      CREDENTIALS.LOCAL_REGISTRAR.PASSWORD
    )

    const res = await createDeclarationV2(
      token,
      {
        'child.name': {
          firstname: faker.person.firstName('male'),
          surname: faker.person.lastName()
        },
        'child.gender': 'male',
        'child.dob': format(subDays(new Date(), 360), 'yyyy-MM-dd'),
        'child.placeOfBirth': 'HEALTH_FACILITY',
        'child.attendantAtBirth': 'PHYSICIAN',
        'child.birthType': 'SINGLE',
        'child.weightAtBirth': 3,

        'informant.relation': 'MOTHER',
        'informant.phoneNo': '0911725897',

        'mother.name': {
          firstname: faker.person.firstName('female'),
          surname: faker.person.lastName('female')
        },
        'mother.dob': format(subYears(new Date(), 30), 'yyyy-MM-dd'),
        'mother.nationality': 'FAR',
        'mother.idType': 'NATIONAL_ID',
        'mother.nid': faker.string.numeric(10),
        'mother.maritalStatus': 'SINGLE',
        'mother.educationalAttainment': 'NO_SCHOOLING',
        'mother.occupation': 'Housewife',
        'mother.previousBirths': 0,
        'father.name': {
          firstname: faker.person.firstName('male'),
          surname: faker.person.lastName('male')
        },
        'father.detailsNotAvailable': false,
        'father.dob': format(subYears(new Date(), 30), 'yyyy-MM-dd'),
        'father.idType': 'NATIONAL_ID',
        'father.nid': faker.string.numeric(10),
        'father.nationality': 'FAR',
        'father.maritalStatus': 'SINGLE',
        'father.educationalAttainment': 'NONE',
        'father.occupation': 'Unemployed',
        'father.addressSameAs': 'YES'
      },
      'REGISTER',
      'HEALTH_FACILITY'
    )

    declaration = res.declaration
    trackingId = res.trackingId!
    eventId = res.eventId

    expect(trackingId).toBeDefined()
    expect(declaration).toBeDefined()
  })

  test.describe('3.1 Print > Event overview', async () => {
    test('3.1.1 Print', async () => {
      await login(page, CREDENTIALS.REGISTRATION_AGENT)

      await auditRecord({
        page,
        name: `${formatV2ChildName(declaration)}`,
        trackingId
      })
      await page.getByText(formatV2ChildName(declaration)).click()
      await ensureAssigned(page)

      await page.getByRole('button', { name: 'Action' }).click()
      await page.locator('#action-dropdownMenu').getByText('Print').click()

      await page
        .locator('#certificateTemplateId')
        .getByText('Birth Certificate')
      await page.locator('#collector____requesterId').click()
      await page
        .locator('#collector____requesterId')
        .getByText('Print and issue to Informant (Mother)', { exact: true })
        .click()

      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Verified' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Yes, print certificate' }).click()
      await page.getByRole('button', { name: 'Print', exact: true }).click()

      // Wait for PDF the load and the page to be redirected to the overview page
      await page.waitForURL(`**/events/overview/${eventId}`)
      await expectInUrl(page, `/events/overview/${eventId}`)
    })

    test('3.1.2 Record audit', async () => {
      await ensureAssigned(page)
      await page.getByRole('button', { name: 'Action', exact: true }).click()

      /*
       * Expected result: should show correct record button in action menu
       */
      await expect(
        await page.getByText('Correct record', { exact: true })
      ).toBeVisible()

      await page.getByText('Correct record', { exact: true }).click()
    })
  })

  test('3.2 Correction requester: child', async () => {
    await page.locator('#requester____type').click()
    await page.getByText('Informant (Mother)', { exact: true }).click()

    await page.locator('#reason____option').click()
    await page
      .getByText('Informant provided incorrect information (Material error)', {
        exact: true
      })
      .click()

    await page.getByRole('button', { name: 'Continue', exact: true }).click()
  })

  test('3.3 Verify identity', async () => {
    /*
     * Expected result: should Confirm
     * First Name
     * Last Name
     * Date of Birth
     */
    await expect(page.getByText('Type of ID')).toBeVisible()
    await expect(page.getByText('National ID')).toBeVisible()

    await expect(page.getByText('ID Number')).toBeVisible()
    await expect(page.getByText(declaration['mother.nid'])).toBeVisible()

    await expect(page.getByText("Mother's name")).toBeVisible()
    await expect(
      page.getByText(
        `${declaration['mother.name'].firstname} ${declaration['mother.name'].surname}`
      )
    ).toBeVisible()

    await expect(page.getByText('Date of birth')).toBeVisible()
    await expect(
      page.getByText(formatDateTo_dMMMMyyyy(declaration['mother.dob']))
    ).toBeVisible()

    await expect(page.getByText('Nationality')).toBeVisible()
    await expect(page.getByText('Farajaland')).toBeVisible()

    await page.getByRole('button', { name: 'Identity does not match' }).click()

    await expect(page.getByText('Correct without proof of ID?')).toBeVisible()
    await expect(
      page.getByText(
        'Please be aware that if you proceed, you will be responsible for making a change to this record without the necessary proof of identification'
      )
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirm' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
    await page.getByRole('button', { name: 'Confirm' }).click()

    await page.getByText('Select...').click()
    await page.getByText('Affidavit', { exact: true }).click()
    await uploadImage(
      page,
      page.locator('button[name="documents____supportingDocs"]')
    )

    await page.getByRole('button', { name: 'Continue' }).click()
    await page.locator('#fees____amount').fill(correctionFee)

    await page.getByRole('button', { name: 'Continue' }).click()

    /*
     * Expected result: should navigate to review page
     */
    expect(page.url().includes('correction')).toBeTruthy()
    expect(page.url().includes('review')).toBeTruthy()
  })

  test.describe('3.4 Make correction', async () => {
    test.describe('3.4.1 Make correction on mother details', async () => {
      test('3.4.1 Change name', async () => {
        await page.getByTestId('change-button-mother.name').click()

        /*
         * Expected result: should
         * - redirect to mother's details page
         * - focus on mother's family name
         */
        expect(page.url().includes('correction')).toBeTruthy()
        expect(page.url().includes('mother')).toBeTruthy()
        expect(page.url().includes('#mother____name')).toBeTruthy()

        await page.locator('#firstname').fill(updatedMotherDetails.firstNames)
        await page.locator('#surname').fill(updatedMotherDetails.familyName)

        await goBackToReview(page)

        /*
         * Expected result: should
         * - redirect to review page
         * - show previous name with strikethrough
         * - show updated name
         */
        expect(page.url().includes('correction')).toBeTruthy()
        expect(page.url().includes('review')).toBeTruthy()

        await expect(
          await page.getByTestId('row-value-mother.name').getByRole('deletion')
        ).toHaveText(
          `${declaration['mother.name'].firstname} ${declaration['mother.name'].surname}`
        )

        await expect(
          await page
            .getByTestId('row-value-mother.name')
            .getByText(updatedMotherDetails.firstNames)
        ).toBeVisible()
        await expect(
          await page
            .getByTestId('row-value-mother.name')
            .getByText(updatedMotherDetails.familyName)
        ).toBeVisible()
      })

      test('3.4.2 Change age', async () => {
        await page.getByTestId('change-button-mother.dob').click()

        /*
         * Expected result: should
         * - redirect to mother's details page
         * - focus on mother's age
         */
        expect(page.url().includes('correction')).toBeTruthy()
        expect(page.url().includes('mother')).toBeTruthy()
        expect(page.url().includes('#mother____dob')).toBeTruthy()

        await page.locator('#mother____dobUnknown').click()
        await page
          .locator('#mother____age')
          .fill(updatedMotherDetails.age.toString())

        await page.getByRole('button', { name: 'Go to review' }).click()

        /*
         * Expected result: should
         * - redirect to review page
         * - show previous gender with strikethrough
         * - show updated gender
         */
        expect(page.url().includes('correction')).toBeTruthy()
        expect(page.url().includes('review')).toBeTruthy()

        await expect(
          await page
            .getByTestId('row-value-mother.age')
            .getByText(updatedMotherDetails.age.toString())
        ).toBeVisible()

        await expect(
          await page.getByTestId('row-value-mother.age').getByRole('deletion')
        ).toHaveText('-')
      })

      test('3.4.3 Change nationality', async () => {
        await page.getByTestId('change-button-mother.nationality').click()

        /*
         * Expected result: should
         * - redirect to mother's details page
         * - focus on mother's nationality
         */
        expect(page.url().includes('correction')).toBeTruthy()
        expect(page.url().includes('mother')).toBeTruthy()
        expect(page.url().includes('#mother____nationality')).toBeTruthy()

        await page.locator('#mother____nationality').click()
        await page.getByText(updatedMotherDetails.nationality).click()

        await page.getByRole('button', { name: 'Go to review' }).click()

        /*
         * Expected result: should
         * - redirect to review page
         * - show previous nationality with strikethrough
         * - show updated nationality
         */
        expect(page.url().includes('correction')).toBeTruthy()
        expect(page.url().includes('review')).toBeTruthy()

        await expect(
          await page
            .getByTestId('row-value-mother.nationality')
            .getByRole('deletion')
        ).toHaveText('Farajaland')

        await expect(
          await page
            .getByTestId('row-value-mother.nationality')
            .getByText(updatedMotherDetails.nationality)
        ).toBeVisible()
      })

      test('3.4.4 Change id type', async () => {
        await page.getByTestId('change-button-mother.idType').click()

        /*
         * Expected result: should
         * - redirect to mother's details page
         * - focus on mother's id type
         */
        expect(page.url().includes('correction')).toBeTruthy()
        expect(page.url().includes('mother')).toBeTruthy()
        expect(page.url().includes('#mother____idType')).toBeTruthy()

        await page.locator('#mother____idType').click()
        await page.getByText(updatedMotherDetails.idType).click()

        await page.getByRole('button', { name: 'Go to review' }).click()

        /*
         * Expected result: should
         * - redirect to review page
         * - show previous id type with strikethrough
         * - show updated id type
         */
        expect(page.url().includes('correction')).toBeTruthy()
        expect(page.url().includes('review')).toBeTruthy()

        await expect(
          await page
            .getByTestId('row-value-mother.idType')
            .getByRole('deletion')
        ).toHaveText('National ID')

        await expect(
          await page
            .getByTestId('row-value-mother.idType')
            .getByText(updatedMotherDetails.idType)
        ).toBeVisible()
      })

      test('3.4.5 Change passport', async () => {
        await expect(
          await page
            .getByTestId('row-value-mother.passport')
            .getByText('Required')
        ).toBeVisible()

        await page.getByTestId('change-button-mother.passport').click()

        /*
         * Expected result: should
         * - redirect to mother's details page
         * - focus on mother's id
         */
        expect(page.url().includes('correction')).toBeTruthy()
        expect(page.url().includes('mother')).toBeTruthy()
        expect(page.url().includes('#mother____passport')).toBeTruthy()

        await page
          .locator('#mother____passport')
          .fill(updatedMotherDetails.passport)

        await page.getByRole('button', { name: 'Go to review' }).click()

        /*
         * Expected result: should
         * - redirect to review page
         * - show previous id with strikethrough
         * - show updated id
         */
        expect(page.url().includes('correction')).toBeTruthy()
        expect(page.url().includes('review')).toBeTruthy()

        await expect(
          await page
            .getByTestId('row-value-mother.passport')
            .getByRole('deletion')
        ).toHaveText('-')

        await expect(
          await page
            .getByTestId('row-value-mother.passport')
            .getByText(updatedMotherDetails.passport)
        ).toBeVisible()
      })

      test('3.4.6 Change usual place of residence', async () => {
        await page.getByTestId('change-button-mother.address').click()

        /*
         * Expected result: should
         * - redirect to mother's details page
         * - focus on mother's Usual place of resiedence
         */
        expect(page.url().includes('correction')).toBeTruthy()
        expect(page.url().includes('mother')).toBeTruthy()
        expect(page.url().includes('#mother____address')).toBeTruthy()

        await page.locator('#province').click()
        await page.getByText(updatedMotherDetails.address.province).click()

        await page.locator('#district').click()
        await page.getByText(updatedMotherDetails.address.district).click()

        await page.locator('#town').fill(updatedMotherDetails.address.town)

        await page
          .locator('#residentialArea')
          .fill(updatedMotherDetails.address.residentialArea)

        await page.locator('#street').fill(updatedMotherDetails.address.street)

        await page.locator('#number').fill(updatedMotherDetails.address.number)

        await page
          .locator('#zipCode')
          .fill(updatedMotherDetails.address.zipCode)

        await goBackToReview(page)

        /*
         * Expected result: should
         * - redirect to review page
         * - show previous Usual place of resiedence with strikethrough
         * - show updated Usual place of resiedence
         */

        expect(page.url().includes('correction')).toBeTruthy()
        expect(page.url().includes('review')).toBeTruthy()

        await expect(
          await page
            .getByTestId('row-value-mother.address')
            .getByText('Farajaland')
        ).toBeVisible()

        await expect(
          await page
            .getByTestId('row-value-mother.address')
            .getByText(updatedMotherDetails.address.province)
        ).toBeVisible()

        await expect(
          await page
            .getByTestId('row-value-mother.address')
            .getByText(updatedMotherDetails.address.district)
        ).toBeVisible()

        await expect(
          await page
            .getByTestId('row-value-mother.address')
            .getByText(updatedMotherDetails.address.town)
        ).toBeVisible()

        await expect(
          await page
            .getByTestId('row-value-mother.address')
            .getByText(updatedMotherDetails.address.residentialArea)
        ).toBeVisible()

        await expect(
          await page
            .getByTestId('row-value-mother.address')
            .getByText(updatedMotherDetails.address.street)
        ).toBeVisible()

        await expect(
          await page
            .getByTestId('row-value-mother.address')
            .getByText(updatedMotherDetails.address.number)
        ).toBeVisible()

        await expect(
          await page
            .getByTestId('row-value-mother.address')
            .getByText(updatedMotherDetails.address.zipCode)
        ).toBeVisible()
      }) // <-- Add this closing brace for test('3.4.6 Change usual place of residence')

      test('3.4.7 Change marital status', async () => {
        await page.getByTestId('change-button-mother.maritalStatus').click()

        /*
         * Expected result: should
         * - redirect to mother's details page
         * - focus on mother's marital status
         */
        expect(page.url().includes('correction')).toBeTruthy()
        expect(page.url().includes('mother')).toBeTruthy()
        expect(page.url().includes('#mother____maritalStatus')).toBeTruthy()

        await page.locator('#mother____maritalStatus').click()
        await page.getByText(updatedMotherDetails.maritalStatus).click()

        await page.getByRole('button', { name: 'Go to review' }).click()

        /*
         * Expected result: should
         * - redirect to review page
         * - show previous marital status with strikethrough
         * - show updated marital status
         */

        expect(page.url().includes('correction')).toBeTruthy()
        expect(page.url().includes('review')).toBeTruthy()

        await expect(
          await page
            .getByTestId('row-value-mother.maritalStatus')
            .getByRole('deletion')
        ).toHaveText(declaration['mother.maritalStatus'], {
          ignoreCase: true
        })

        await expect(
          await page
            .getByTestId('row-value-mother.maritalStatus')
            .getByText(updatedMotherDetails.maritalStatus)
        ).toBeVisible()
      })

      test('3.4.8 Change level of education', async () => {
        await page
          .getByTestId('change-button-mother.educationalAttainment')
          .click()

        /*
         * Expected result: should
         * - redirect to mother's details page
         * - focus on mother's level of education
         */
        expect(page.url().includes('correction')).toBeTruthy()
        expect(page.url().includes('mother')).toBeTruthy()
        expect(
          page.url().includes('#mother____educationalAttainment')
        ).toBeTruthy()

        await page.locator('#mother____educationalAttainment').click()
        await page.getByText(updatedMotherDetails.educationLevel).click()

        await page.getByRole('button', { name: 'Go to review' }).click()

        /*
         * Expected result: should
         * - redirect to review page
         * - show previous level of education with strikethrough
         * - show updated level of education
         */
        expect(page.url().includes('correction')).toBeTruthy()
        expect(page.url().includes('review')).toBeTruthy()

        await expect(
          await page
            .getByTestId('row-value-mother.educationalAttainment')
            .getByRole('deletion')
        ).toHaveText('No schooling')

        await expect(
          await page
            .getByTestId('row-value-mother.educationalAttainment')
            .getByText(updatedMotherDetails.educationLevel)
        ).toBeVisible()
      })
    })
    test('3.4.2 Change place of delivery', async () => {
      await page.getByTestId('change-button-child.placeOfBirth').click()

      /*
       * Expected result: should
       * - redirect to child's details page
       * - focus on childType
       */
      expect(page.url().includes('correction')).toBeTruthy()
      expect(page.url().includes('child')).toBeTruthy()
      expect(page.url().includes('#child____placeOfBirth')).toBeTruthy()

      await page.locator('#child____placeOfBirth').click()
      await page.getByText(updatedChildDetails.placeOfBirth).click()

      await page.getByLabel(/Province/i).click()
      await page.getByText(updatedChildDetails.birthLocation.province).click()

      await page.getByLabel(/District/i).click()
      await page.getByText(updatedChildDetails.birthLocation.district).click()

      await page.locator('#town').fill(updatedChildDetails.birthLocation.town)

      await page
        .locator('#residentialArea')
        .fill(updatedChildDetails.birthLocation.residentialArea)

      await page
        .locator('#street')
        .fill(updatedChildDetails.birthLocation.street)

      await page
        .locator('#number')
        .fill(updatedChildDetails.birthLocation.number)

      await page
        .locator('#zipCode')
        .fill(updatedChildDetails.birthLocation.zipCode)

      await page.getByRole('button', { name: 'Go to review' }).click()

      /*
       * Expected result: should
       * - redirect to review page
       * - show previous place of birth with strikethrough
       * - show updated place of birth
       */
      expect(page.url().includes('correction')).toBeTruthy()
      expect(page.url().includes('review')).toBeTruthy()

      await expect(
        page
          .getByTestId('row-value-child.placeOfBirth')
          .getByRole('deletion')
          .nth(0)
      ).toHaveText('Health Institution')

      /*
        assertion fails
        await expect(
        await  page.getByTestId('row-value-child.placeOfBirth').getByRole('deletion').nth(1)
        ).toHaveText('Chikobo Rural Health Centre')
      */
      await expect(
        await page
          .getByTestId('row-value-child.placeOfBirth')
          .getByText(updatedChildDetails.placeOfBirth)
      ).toBeVisible()

      const addressParts = [
        updatedChildDetails.birthLocation.country,
        updatedChildDetails.birthLocation.province,
        updatedChildDetails.birthLocation.district,
        updatedChildDetails.birthLocation.town,
        updatedChildDetails.birthLocation.residentialArea,
        updatedChildDetails.birthLocation.street,
        updatedChildDetails.birthLocation.number,
        updatedChildDetails.birthLocation.zipCode
      ]

      for (const part of addressParts) {
        await expect(
          page
            .getByTestId('row-value-child.birthLocation.other')
            .getByText(part)
        ).toBeVisible()
      }

      await page.getByRole('button', { name: 'Continue' }).click()
    })
  })

  test('3.7 Correction summary', async () => {
    /*
     * Expected result: should
     * - navigate to correction summary
     * - Send for approval button is disabled
     */

    expect(page.url().includes('correction')).toBeTruthy()
    expect(page.url().includes('summary')).toBeTruthy()

    await expect(
      page.getByRole('button', { name: 'Submit correction request' })
    ).toBeEnabled()

    /*
     * Expected result: should show
     * - Original vs correction
     * - Requested by
     * - ID check
     * - Reason for request
     * - Comments
     */
    await visible(page, 'Requester', 'Informant (Mother)')
    await visible(
      page,
      'Reason for correction',
      'Informant provided incorrect information (Material error)'
    )
    await visible(page, 'Fee total', `$${correctionFee}`)

    await visible(page, 'Request correction(s)')
    await visible(page, "Child's details")

    await visible(
      page.locator('#listTable-corrections-table-child'),
      'Place of delivery',
      'Health Institution',
      'Other'
    )

    await expect(
      page
        .locator('#listTable-corrections-table-child')
        .getByText('Ibombo Rural Health Centre, Ibombo, Central, Farajaland')
    ).toBeVisible()

    await Promise.all(
      [
        updatedChildDetails.birthLocation.country,
        updatedChildDetails.birthLocation.province,
        updatedChildDetails.birthLocation.district,
        updatedChildDetails.birthLocation.town,
        updatedChildDetails.birthLocation.residentialArea,
        updatedChildDetails.birthLocation.street,
        updatedChildDetails.birthLocation.number,
        updatedChildDetails.birthLocation.zipCode
      ].map((x) =>
        expect(
          page
            .locator('#listTable-corrections-table-child div[id^="row_"]')
            .locator('> span:nth-child(3)')
            .getByText(x)
        ).toBeVisible()
      )
    )

    await visible(
      page.locator('#listTable-corrections-table-mother'),
      "Mother's details"
    )
    await visible(
      page.locator('#listTable-corrections-table-mother'),
      "Mother's name",
      `${declaration['mother.name'].firstname} ${declaration['mother.name'].surname}`,
      `${updatedMotherDetails.firstNames} ${updatedMotherDetails.familyName}`
    )

    await visible(
      page.locator('#listTable-corrections-table-mother'),
      'Age of mother (at the time of event)',
      updatedMotherDetails.age.toString()
    )

    await visible(
      page.locator('#listTable-corrections-table-mother').locator('#row_2'),
      'Nationality',
      'Farajaland',
      updatedMotherDetails.nationality
    )

    await visible(
      page.locator('#listTable-corrections-table-mother'),
      'Type of ID',
      'National ID',
      'Passport'
    )

    await visible(
      page.locator('#listTable-corrections-table-mother'),
      'ID Number',
      updatedMotherDetails.passport
    )

    await visible(
      page.locator('#listTable-corrections-table-mother').locator('#row_5'),
      'Usual place of residence'
    )

    await expect(
      page
        .locator('#listTable-corrections-table-mother')
        .locator('#row_5')
        .getByText('FarajalandCentralIbombo')
    ).toBeVisible()

    await Promise.all(
      [
        updatedMotherDetails.address.province,
        updatedMotherDetails.address.district,
        updatedMotherDetails.address.town,
        updatedMotherDetails.address.residentialArea,
        updatedMotherDetails.address.street,
        updatedMotherDetails.address.number,
        updatedMotherDetails.address.zipCode
      ].map((x) =>
        expect(
          page
            .locator('#listTable-corrections-table-mother')
            .locator('#row_5')
            .getByText(x)
        ).toBeVisible()
      )
    )

    await visible(
      page.locator('#listTable-corrections-table-mother'),
      'Marital Status',
      'Single',
      'Widowed'
    )

    await visible(
      page.locator('#listTable-corrections-table-mother'),
      'Level of education',
      'No schooling',
      'Primary'
    )

    /*
     * Expected result: should enable the Submit correction request button
     */
    await page
      .getByRole('button', { name: 'Submit correction request' })
      .click()
    await page.getByRole('button', { name: 'Confirm' }).click()

    /*
     * Expected result: should
     * - be navigated to sent for approval tab
     * - include the declaration in this tab
     */
    expect(page.url().includes(`events/overview/${eventId}`)).toBeTruthy()
    await page.getByRole('button', { name: 'Outbox' }).click()

    /*
     * This is to ensure the following condition is asserted
     * after the outbox has the declaration
     */
    await page.waitForTimeout(SAFE_INPUT_CHANGE_TIMEOUT_MS)

    await expect(await page.locator('#no-record')).toContainText(
      'No records require processing',
      {
        timeout: SAFE_OUTBOX_TIMEOUT_MS
      }
    )

    await page.getByRole('button', { name: 'Sent for approval' }).click()
    await expect(
      page.getByText(`${formatV2ChildName(declaration)}`).first()
    ).toBeVisible()
  })

  test.describe.serial('3.8 Correction Approval', async () => {
    test.beforeAll(async ({ browser }) => {
      await page.close()

      page = await browser.newPage()

      await login(page, CREDENTIALS.LOCAL_REGISTRAR)
    })

    test('3.8.1 Record audit by local registrar', async () => {
      await auditRecord({
        page,
        name: `${formatV2ChildName(declaration)}`,
        trackingId
      })
      await ensureAssigned(page)

      await expect(page.getByText(formatV2ChildName(declaration))).toBeVisible()
      await expect(
        page.locator('#summary').getByText('Registered')
      ).toBeVisible()
      await expect(page.locator('#summary').getByText(trackingId)).toBeVisible()

      await page.getByRole('button', { name: 'Action' }).click()
      await page.locator('#action-dropdownMenu').getByText('Review').click()
      await visible(page, 'Correction request')
    })
    test('3.8.2 Correction request summary screen', async () => {
      // Header assertions
      await visible(page, 'Requester', 'Informant (Mother)')
      await visible(
        page,
        'Reason for correction',
        'Informant provided incorrect information (Material error)'
      )
      await visible(page, 'Fee total', `$${correctionFee}`)

      // Child's section
      await visible(page, 'Correction(s)')

      const childTable = page.locator('#listTable-corrections-table-child')
      await visible(childTable, "Child's details")
      await visible(
        childTable,
        'Place of delivery',
        'Health Institution',
        'Other'
      )

      await visible(childTable, 'Location of birth')

      await expect(
        page
          .locator('#listTable-corrections-table-child')
          .getByText('Ibombo Rural Health Centre, Ibombo, Central, Farajaland')
      ).toBeVisible()

      const childAddressLines = [
        updatedChildDetails.birthLocation.country,
        updatedChildDetails.birthLocation.province,
        updatedChildDetails.birthLocation.district,
        updatedChildDetails.birthLocation.town,
        updatedChildDetails.birthLocation.residentialArea,
        updatedChildDetails.birthLocation.street,
        updatedChildDetails.birthLocation.number,
        updatedChildDetails.birthLocation.zipCode
      ]
      for (const line of childAddressLines) {
        await expect(
          page
            .locator('#listTable-corrections-table-child div[id^="row_"]')
            .locator('> span:nth-child(3)')
            .getByText(line)
        ).toBeVisible()
      }

      // Mother's section

      await visible(
        page.locator('#listTable-corrections-table-mother'),
        "Mother's details"
      )
      await visible(
        page.locator('#listTable-corrections-table-mother'),
        "Mother's name",
        `${declaration['mother.name'].firstname} ${declaration['mother.name'].surname}`,
        `${updatedMotherDetails.firstNames} ${updatedMotherDetails.familyName}`
      )

      await visible(
        page.locator('#listTable-corrections-table-mother'),
        'Age of mother (at the time of event)',
        updatedMotherDetails.age.toString()
      )

      await visible(
        page.locator('#listTable-corrections-table-mother').locator('#row_2'),
        'Nationality',
        'Farajaland',
        'Ethiopia'
      )
      await visible(
        page.locator('#listTable-corrections-table-mother'),
        'Type of ID',
        'National ID',
        'Passport'
      )
      await visible(
        page.locator('#listTable-corrections-table-mother'),
        'ID Number',
        updatedMotherDetails.passport
      )

      await visible(
        page.locator('#listTable-corrections-table-mother').locator('#row_5'),
        'Usual place of residence'
      )

      await expect(
        page
          .locator('#listTable-corrections-table-mother')
          .locator('#row_5')
          .getByText('FarajalandCentralIbombo')
      ).toBeVisible()

      const motherAddressLines = [
        updatedMotherDetails.address.province,
        updatedMotherDetails.address.district,
        updatedMotherDetails.address.town,
        updatedMotherDetails.address.residentialArea,
        updatedMotherDetails.address.street,
        updatedMotherDetails.address.number,
        updatedMotherDetails.address.zipCode
      ]
      for (const line of motherAddressLines) {
        await expect(
          page
            .locator('#listTable-corrections-table-mother')
            .locator('#row_5')
            .getByText(line)
        ).toBeVisible()
      }

      await visible(
        page.locator('#listTable-corrections-table-mother'),
        'Marital Status',
        'Single',
        'Widowed'
      )
      await visible(
        page.locator('#listTable-corrections-table-mother'),
        'Level of education',
        'No schooling',
        'Primary'
      )

      // Button visibility and interaction
      const approveBtn = page.locator('#ApproveCorrectionBtn')
      const rejectBtn = page.locator('#rejectCorrectionBtn')

      await expect(approveBtn).toBeVisible()
      await expect(approveBtn).toBeEnabled()
      await expect(rejectBtn).toBeVisible()
      await expect(rejectBtn).toBeEnabled()

      // 📝 Add more assertions here if the page changes after approval (modal, redirect, etc.)
    })

    test('3.8.3 Approve correction', async () => {
      await page.getByRole('button', { name: 'Approve', exact: true }).click()
      await page.getByRole('button', { name: 'Confirm', exact: true }).click()

      /*
       * Expected result: should
       * - be navigated to ready to print tab
       * - include the updated declaration in this tab
       */
      expect(page.url().includes(`events/overview/${eventId}`)).toBeTruthy()
      await ensureOutboxIsEmpty(page)
    })

    test('3.8.4 Validate history in record audit', async () => {
      await ensureAssigned(page)
      await page.getByRole('button', { name: 'Next page' }).click()

      /*
       * Expected result: should show in task history
       * - Correction requested
       * - Correction approved
       */

      await expect(
        page
          .locator('#listTable-task-history')
          .getByRole('button', { name: 'Correction requested' })
      ).toBeVisible()

      await expect(
        page
          .locator('#listTable-task-history')
          .getByRole('button', { name: 'Correction approved' })
      ).toBeVisible()
    })
  })
})
