import { test, expect, type Page } from '@playwright/test'
import {
  continueForm,
  drawSignature,
  formatName,
  goToSection,
  login,
  logout,
  uploadImage,
  uploadImageToSection
} from '../../../helpers'
import { faker } from '@faker-js/faker'
import { CREDENTIALS } from '../../../constants'
import { REQUIRED_VALIDATION_ERROR } from '../helpers'
import { ensureOutboxIsEmpty } from '../../../utils'

test.describe.serial('7. Birth declaration case - 7', () => {
  let page: Page
  const declaration = {
    child: {
      name: {
        firstNames: faker.person.firstName(),
        familyName: faker.person.lastName()
      }
    },
    attendantAtBirth: 'None',
    informantType: 'Legal guardian',
    mother: {
      detailsDontExist: true,
      reason: 'Mother is unknown'
    },
    father: {
      detailsDontExist: true,
      reason: 'Father is unknown'
    }
  }
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test.describe('7.1 Declaration started by FA', async () => {
    test.beforeAll(async () => {
      await login(page, CREDENTIALS.FIELD_AGENT)
      await page.click('#header-new-event')
      await page.getByLabel('Birth').click()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()
    })

    test('7.1.1 Fill child details', async () => {
      await page.locator('#firstname').fill(declaration.child.name.firstNames)
      await page.locator('#surname').fill(declaration.child.name.familyName)

      await page.locator('#child____attendantAtBirth').click()
      await page
        .getByText(declaration.attendantAtBirth, {
          exact: true
        })
        .click()
      await continueForm(page)
    })

    test('7.1.2 Fill informant details', async () => {
      await page.locator('#informant____relation').click()
      await page
        .getByText(declaration.informantType, {
          exact: true
        })
        .click()

      await page.getByRole('button', { name: 'Continue' }).click()
    })

    test("7.1.3 Fill mother's details", async () => {
      await page.getByLabel("Mother's details are not available").check()
      await page.locator('#mother____reason').fill(declaration.mother.reason)
      await continueForm(page)
    })

    test("7.1.4 Fill father's details", async () => {
      await page.getByLabel("Father's details are not available").check()
      await page.locator('#father____reason').fill(declaration.father.reason)
      await continueForm(page)
    })

    test('7.1.5 Add supporting documents', async () => {
      await goToSection(page, 'documents')
      await uploadImage(
        page,
        page.locator('button[name="documents____proofOfBirth"]')
      )

      /*
       * Expected result:
       * As mother and father's details are not given, upload document for mother and father should not be visible
       */
      await expect(page.locator('#documents____proofOfMother')).toBeHidden()

      await uploadImageToSection({
        page,
        sectionLocator: page.locator('#documents____proofOfInformant'),
        sectionTitle: 'Birth Certificate',
        buttonLocator: page.locator(
          'button[name="documents____proofOfInformant"]'
        )
      })

      await uploadImageToSection({
        page,
        sectionLocator: page.locator('#documents____proofOther'),
        sectionTitle: 'Proof of legal guardianship',
        buttonLocator: page.locator('button[name="documents____proofOther"]')
      })
    })

    test('7.1.6 Go to review', async () => {
      await goToSection(page, 'review')
    })

    test('7.1.7 Verify information on review page', async () => {
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
       * Expected result: should require
       * - Child's Gender
       */
      await expect(page.getByTestId('row-value-child.gender')).toContainText(
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should require
       * - Child's date of birth
       */
      await expect(page.getByTestId('row-value-child.dob')).toContainText(
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should require
       * - Child's Place of birth type
       * - Child's Place of birth details
       */
      await expect(
        page.getByTestId('row-value-child.placeOfBirth')
      ).toContainText(REQUIRED_VALIDATION_ERROR)

      /*
       * Expected result: should include
       * - Informant's relation to child
       */
      await expect(
        page.getByTestId('row-value-informant.relation')
      ).toContainText(declaration.informantType)

      /*
       * Expected result: should require
       * - Informant's Email
       */
      await expect(page.getByTestId('row-value-informant.email')).toContainText(
        REQUIRED_VALIDATION_ERROR
      )
      /*
       * Expected result: should require
       * - Informant's First Name
       * - Informant's Family Name
       */
      await expect(page.getByTestId('row-value-informant.name')).toContainText(
        REQUIRED_VALIDATION_ERROR
      )
      /*
       * Expected result: should require
       * - Informant's date of birth
       */
      await expect(page.getByTestId('row-value-informant.dob')).toContainText(
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should require
       * - Informant's Type of Id
       */
      await expect(
        page.getByTestId('row-value-informant.idType')
      ).toContainText(REQUIRED_VALIDATION_ERROR)

      /*
       * Expected result: should require
       * - Reason of why mother's details not available
       */
      await expect(page.getByTestId('row-value-mother.reason')).toContainText(
        declaration.mother.reason
      )

      /*
       * Expected result: should require
       * - Reason of why father's details not available
       */
      await expect(page.getByTestId('row-value-father.reason')).toContainText(
        declaration.father.reason
      )
    })

    test('7.1.8 Fill up informant signature', async () => {
      await page.locator('#review____comment').fill(faker.lorem.sentence())
      await page.getByRole('button', { name: 'Sign', exact: true }).click()
      await drawSignature(page, 'review____signature_canvas_element', false)
      await page
        .locator('#review____signature_modal')
        .getByRole('button', { name: 'Apply' })
        .click()

      await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test('7.1.9 Send for review', async () => {
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

  test.describe('7.2 Declaration Review by RA', async () => {
    test('7.2.1 Navigate to the declaration review page', async () => {
      await logout(page)
      await login(page, CREDENTIALS.REGISTRATION_AGENT)

      await page.getByText('Notifications').click()

      await page
        .getByRole('button', {
          name: formatName(declaration.child.name)
        })
        .click()
      await page.getByRole('button', { name: 'Action', exact: true }).click()
      await page.getByText('View', { exact: true }).click()
    })

    test('7.2.2 Verify information on review page', async () => {
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
       * Expected result: should require
       * - Child's Gender
       */
      await expect(page.getByTestId('row-value-child.gender')).toContainText(
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should require
       * - Child's date of birth
       */
      await expect(page.getByTestId('row-value-child.dob')).toContainText(
        REQUIRED_VALIDATION_ERROR
      )

      /*
       * Expected result: should require
       * - Child's Place of birth type
       * - Child's Place of birth details
       */
      await expect(
        page.getByTestId('row-value-child.placeOfBirth')
      ).toContainText(REQUIRED_VALIDATION_ERROR)

      /*
       * Expected result: should include
       * - Informant's relation to child
       */
      await expect(
        page.getByTestId('row-value-informant.relation')
      ).toContainText(declaration.informantType)

      /*
       * Expected result: should require
       * - Informant's Email
       */
      await expect(page.getByTestId('row-value-informant.email')).toContainText(
        REQUIRED_VALIDATION_ERROR
      )
      /*
       * Expected result: should require
       * - Informant's First Name
       * - Informant's Family Name
       */
      await expect(page.getByTestId('row-value-informant.name')).toContainText(
        REQUIRED_VALIDATION_ERROR
      )
    })
  })
})
