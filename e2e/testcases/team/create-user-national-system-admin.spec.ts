import { test, expect, type Page } from '@playwright/test'
import path from 'path'
import { continueForm, login, loginWithNewUser } from '../../helpers'
import { faker } from '@faker-js/faker'
import { CREDENTIALS } from '../../constants'
import { getExpectedUsername } from '../../utils'

test.describe.serial('1. Create user -1', () => {
  let page: Page
  const userinfo = {
    firstName: faker.person.firstName('male'),
    surname: faker.person.lastName('male'),
    email: faker.internet.email(),
    role: 'Registrar'
  }
  const signaturePath = path.resolve(__dirname, '../../assets/sign1.png')
  const username = getExpectedUsername({
    firstname: userinfo.firstName,
    surname: userinfo.surname
  })
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test.describe('1.1 User creation started by national system admin', async () => {
    test.beforeAll(async () => {
      await login(page, CREDENTIALS.NATIONAL_SYSTEM_ADMIN)
      await page.getByRole('button', { name: 'Team' }).click()
      await expect(
        page.locator('#location-range-picker-action').getByText('HQ Office')
      ).toBeVisible()

      await page.getByRole('button', { name: /HQ Office/ }).click()
      await page.getByTestId('locationSearchInput').fill('Klow')

      await page.getByText(/Klow Village Hospital/).click()

      await page.click('#add-user')
      await expect(page.getByText('User details')).toBeVisible()
    })

    test('1.1.1 Fill user details', async () => {
      await page.locator('#surname').fill(userinfo.surname)
      await page.locator('#firstname').fill(userinfo.firstName)
      await page.locator('#email').fill(userinfo.email)
      await page.locator('#role').click()
      await page.getByText(userinfo.role, { exact: true }).click()
      await continueForm(page)
    })

    // @TODO: requires file upload support in events service.
    test('1.1.2 Upload Signature', async () => {
      await page.setInputFiles('input[type="file"]', signaturePath)
      await continueForm(page)
    })

    test('1.1.2 Create user', async () => {
      await page.getByRole('button', { name: 'Create user' }).click()

      await expect(page.locator('#header')).toContainText(
        'Klow Village Hospital'
      )

      await expect(
        page.getByText('Klow, Ibombo, Central', {
          exact: true
        })
      ).toBeVisible()
    })
  })

  test.describe('2.1 Login with newly created user credentials', () => {
    test('2.1.1 Enter your username and password', async ({ page }) => {
      await loginWithNewUser(page, username)
    })
  })
})
