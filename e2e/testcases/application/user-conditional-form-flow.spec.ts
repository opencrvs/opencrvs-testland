import { test, expect, type Page } from '@playwright/test'
import { continueForm, formatName, getRandomDate, login } from '../../helpers'
import { faker } from '@faker-js/faker'
import { CREDENTIALS } from '../../constants'

import { ensureOutboxIsEmpty, selectAction } from '../../utils'

test.describe.serial('1. User conditional form flow', () => {
  let page: Page
  const declaration = {
    applicant: {
      name: {
        firstName: faker.person.firstName('male'),
        middleName: faker.person.firstName('male'),
        familyName: faker.person.lastName('male')
      },
      gender: 'Male',
      birthDate: getRandomDate(61, 200) // min age 61 to ensure senior pass id is shown
    },
    recommender: {
      name: {
        firstName: faker.person.firstName('male'),
        familyName: faker.person.lastName('male')
      },
      id: '123456789'
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
      await page.getByLabel('Tennis club membership application').click()
      await page.getByRole('button', { name: 'Continue' }).click()
    })

    test('1.1.0 Go to review page and ensure default values are resolved properly', async () => {
      await continueForm(page)
      await continueForm(page)

      await expect(page.getByText('Invalid input')).not.toBeVisible()
    })

    test('1.1.1 Fill applicant details', async () => {
      await page.getByTestId('change-button-applicant.name').click()
      await page.getByTestId('confirm_edit').click()

      await page
        .locator('#firstname')
        .fill(declaration.applicant.name.firstName)
      await page.locator('#surname').fill(declaration.applicant.name.familyName)

      await page.getByPlaceholder('dd').fill(declaration.applicant.birthDate.dd)
      await page
        .getByPlaceholder('mm')
        .and(page.locator('[name="applicant____dob"]'))
        .fill(declaration.applicant.birthDate.mm)
      await page
        .getByPlaceholder('yyyy')
        .fill(declaration.applicant.birthDate.yyyy)

      await page
        .getByLabel('Field shown when field agent is submitting application.')
        .click()

      await continueForm(page)
    })

    test('1.1.2 Fill senior pass details', async () => {
      await page.locator('#senior-pass____id').fill('123123')

      await continueForm(page)
    })

    test('1.1.3 Fill recommender details', async () => {
      await page
        .locator('#firstname')
        .fill(declaration.applicant.name.firstName)
      await page.locator('#surname').fill(declaration.applicant.name.familyName)
      await page.locator('#recommender____id').fill(declaration.recommender.id)

      await continueForm(page)
    })

    test('1.1.4 Review details', async () => {
      await page
        .getByText('Field shown when field agent is submitting application.')
        .isVisible()

      await expect(
        page.getByTestId('row-value-applicant.isRecommendedByFieldAgent')
      ).toHaveText('Yes')
    })

    test('1.1.5 Send for review', async () => {
      await page.getByRole('button', { name: 'Send for review' }).click()
      await expect(page.getByText('Send for review?')).toBeVisible()
      await page.getByRole('button', { name: 'Confirm' }).click()

      await ensureOutboxIsEmpty(page)

      await page.getByText('Sent for review').click()
      await expect(
        page.getByRole('button', {
          name: formatName(declaration.applicant.name)
        })
      ).toBeVisible()
    })

    test('1.1.6 Navigate to the declaration "read-only" page', async () => {
      await page
        .getByRole('button', {
          name: formatName(declaration.applicant.name)
        })
        .click()

      await selectAction(page, 'View')

      await expect(
        page.getByText(
          'Field shown when field agent is submitting application.'
        )
      ).toBeVisible()
    })
  })

  test.describe('1.2 Declaration Review by RA', async () => {
    test('1.2.1 Navigate to the declaration "read-only" page', async () => {
      await login(page, CREDENTIALS.REGISTRATION_AGENT)
      await page.getByText('Ready for review').click()
      await page
        .getByRole('button', {
          name: formatName(declaration.applicant.name)
        })
        .click()

      await selectAction(page, 'View')

      await expect(
        page.getByText(
          'Field shown when field agent is submitting application.'
        )
      ).not.toBeVisible()

      await page.getByTestId('exit-button').click()
    })

    test('1.2.2 Navigate to the declaration "Review" page', async () => {
      await page.getByText('Ready for review').click()
      await page
        .getByRole('button', {
          name: formatName(declaration.applicant.name)
        })
        .click()

      await selectAction(page, 'Review')

      await expect(
        page.getByText(
          'Field shown when field agent is submitting application.'
        )
      ).not.toBeVisible()
    })
  })
})
