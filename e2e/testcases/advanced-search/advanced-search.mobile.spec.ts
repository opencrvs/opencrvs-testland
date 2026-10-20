import { expect, Page, test } from '@playwright/test'
import { getToken, login } from '../../helpers'
import { createDeclaration } from '../test-data/birth-declaration-with-father-brother'
import { CREDENTIALS } from '../../constants'
import { faker } from '@faker-js/faker'
import { getIdByName, getAdministrativeAreas } from '../birth/helpers'
import { expectInUrl } from '../../utils'
import { setMobileViewport } from '../../mobile-helpers'
import { format, subDays } from 'date-fns'
import { BIRTH_LATE_REGISTRATION_TARGET_DAYS } from '@countryconfig/events/utils'

test.describe.serial('Advanced Search - Mobile', () => {
  let page: Page
  let province = ''
  let district = ''
  let village = ''
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
    await setMobileViewport(page)
    const token = await getToken(CREDENTIALS.REGISTRAR_VILLAGE)

    const administrativeAreas = await getAdministrativeAreas(token)
    province = getIdByName(administrativeAreas, 'Central')!
    district = getIdByName(administrativeAreas, 'Ibombo')!
    village = getIdByName(administrativeAreas, 'Klow')!

    if (!province || !district || !village) {
      throw new Error('Province, district or village not found')
    }

    const toDate = format(new Date(), 'yyyy-MM-dd')
    // Previously tested failed and had to retry consistently since with late registration "child.reason" becomes required.
    const fromDate = format(
      subDays(new Date(), BIRTH_LATE_REGISTRATION_TARGET_DAYS - 10),
      'yyyy-MM-dd'
    )

    await createDeclaration(
      token,
      {
        'child.dob': faker.date
          .between({ from: fromDate, to: toDate })
          .toISOString()
          .split('T')[0],
        'child.placeOfBirth': 'PRIVATE_HOME',
        'child.birthLocation.privateHome': {
          country: 'FAR',
          addressType: 'DOMESTIC',
          administrativeArea: village,
          streetLevelDetails: { town: 'Dhaka' }
        },
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
    await login(page, CREDENTIALS.REGISTRAR_VILLAGE)
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
    page.locator('#village').getByText('Klow')

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
      await expect(addressObject.village).toBeTruthy()
    }

    await expect(page.getByText('Search results')).toBeVisible()
  })
})
