import { test, expect, type Page } from '@playwright/test'
import path from 'path'
import { ensureLoginPageReady, continueForm, login } from '../../helpers'
import { faker } from '@faker-js/faker'
import { CREDENTIALS, LOGIN_URL } from '../../constants'

test.describe.serial('1. Create user -1', () => {
  let page: Page
  const userinfo = {
    firstName: faker.person.firstName('male'),
    surname: faker.person.lastName('male'),
    email: faker.internet.email(),
    role: 'Local Registrar'
  }
  const signaturePath = path.resolve(__dirname, '../../assets/sign1.png')
  const username = `${userinfo.firstName[0]}.${userinfo.surname}`.toLowerCase()
  const question00 = 'What city were you born in?'
  const question01 = 'What is your favorite movie?'
  const question02 = 'What is your favorite food?'

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
      await expect(page.locator('#header')).toContainText('HQ Office')
      await page.click('#add-user')
      await expect(page.getByText('User details')).toBeVisible()
    })

    test('1.1.1 Fill user details', async () => {
      await page.locator('#familyName').fill(userinfo.surname)
      await page.locator('#firstName').fill(userinfo.firstName)
      await page.locator('#email').fill(userinfo.email)
      await page.locator('#role').click()
      await page.getByText(userinfo.role, { exact: true }).click()
      await continueForm(page)
    })

    test('1.1.2 Upload Signture', async () => {
      await page.setInputFiles('input[type="file"]', signaturePath)
      await continueForm(page)
    })

    test('1.1.2 Create user', async () => {
      await page.getByRole('button', { name: 'Create user' }).click()

      await expect(page.getByText('Embe, Pualula')).toBeVisible()
    })
  })

  test.describe('2.1 Login with newly created user credentials', () => {
    test('2.1.1 Enter your username and password', async ({ page }) => {
      await page.goto(LOGIN_URL)
      await ensureLoginPageReady(page)
      await page.fill('#username', username)
      await page.fill('#password', 'test')
      await page.click('#login-mobile-submit')

      await expect(page.getByText('Welcome to Farajaland CRS')).toBeVisible({
        timeout: 30000
      })

      await page.getByRole('button', { name: 'Start' }).click()

      //set up password
      await page.fill('#NewPassword', 'Bangladesh23')
      await page.fill('#ConfirmPassword', 'Bangladesh23')
      await expect(page.getByText('Passwords match')).toBeVisible()
      await page.getByRole('button', { name: 'Continue' }).click()

      //set up security question
      await page.locator('#question-0').click()
      await page.getByText(question00, { exact: true }).click()
      await page.fill('#answer-0', 'Chittagong')
      await page.locator('#question-1').click()
      await page.getByText(question01, { exact: true }).click()
      await page.fill('#answer-1', 'Into the wild')
      await page.locator('#question-2').click()
      await page.getByText(question02, { exact: true }).click()
      await page.fill('#answer-2', 'Burger')
      await page.getByRole('button', { name: 'Continue' }).click()

      await page.getByRole('button', { name: 'Confirm' }).click()
      await expect(page.getByText('Account setup complete')).toBeVisible()
    })
  })
})
