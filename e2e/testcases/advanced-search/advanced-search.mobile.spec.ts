import { expect, Page, test } from '@playwright/test'
import { getToken, login } from '../../helpers'
import { createDeclaration } from '../test-data/birth-declaration-with-father-brother'
import { CREDENTIALS } from '../../constants'
import { faker } from '@faker-js/faker'
import { getAllLocations, getLocationIdByName } from '../birth/helpers'
import { expectInUrl } from '../../utils'
import { setMobileViewport } from '../../mobile-helpers'

test.describe.serial('Advanced Search - Mobile', () => {
  let page: Page
  let province = ''
  let district = ''
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
    await setMobileViewport(page)
    const token = await getToken(
      CREDENTIALS.LOCAL_REGISTRAR.USERNAME,
      CREDENTIALS.LOCAL_REGISTRAR.PASSWORD
    )

    const locations = await getAllLocations('ADMIN_STRUCTURE')
    province = getLocationIdByName(locations, 'Central')!
    district = getLocationIdByName(locations, 'Ibombo')!

    if (!province || !district) {
      throw new Error('Province or district not found')
    }

    await createDeclaration(
      token,
      {
        'child.dob': faker.date
          // Randomly chosen DOB between 2010-01-01 and 2020-12-31
          // Ensures the created record appears on the first page of search results
          .between({ from: '2010-01-01', to: '2020-12-31' })
          .toISOString()
          .split('T')[0],
        'child.placeOfBirth': 'PRIVATE_HOME',
        'child.birthLocation.privateHome': {
          country: 'FAR',
          addressType: 'DOMESTIC',
          administrativeArea: district,
          streetLevelDetails: { town: 'Dhaka' }
        },
        'child.reason': 'Other', // needed for late dob value
        'child.gender': 'female'
      },
      'REGISTER',
      'PRIVATE_HOME'
    )
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('Login', async () => {
    await login(page)
  })

  test('Navigate to advanced search', async () => {
    await page
      .getByRole('button', { name: 'Go to search', exact: true })
      .click()
    await expectInUrl(page, '/search')
    await page.click('#searchType')
    await expectInUrl(page, '/advanced-search')
  })

  test('Fill search fields', async () => {
    await page.getByText('Birth').click()
    await page.getByText('Event details').click()

    await page.locator('#child____placeOfBirth').click()
    await page.getByText('Residential address', { exact: true }).click()

    page.locator('#country').getByText('Farajaland')
    page.locator('#province').getByText('Central')
    page.locator('#district').getByText('Ibombo')

    await page.locator('#town').fill('Dhaka')
    await page.locator('#town').blur()
  })

  test('Search', async () => {
    await page.click('#search')
    await expect(page).toHaveURL(/.*\/search-result/)

    const searchParams = new URLSearchParams(page.url())
    const address = searchParams.get('child.birthLocation.privateHome')
    if (address !== null) {
      const addressObject = JSON.parse(address)
      await expect(addressObject.country).toBe('FAR')
      await expect(addressObject.town).toBe('Dhaka')
      await expect(addressObject.addressType).toBe('DOMESTIC')
      await expect(addressObject.province).toBeTruthy()
      await expect(addressObject.district).toBeTruthy()
    }

    await expect(page.getByText('Search results')).toBeVisible()
  })
})
