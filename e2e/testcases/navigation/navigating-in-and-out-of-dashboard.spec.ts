import { expect, test, type Page } from '@playwright/test'

import { login, getToken } from '../../helpers'
import { CREDENTIALS } from '../../constants'
import { createDeclaration, Declaration } from '../test-data/birth-declaration'
import { expectInUrl, type } from '../../utils'
import { ActionType } from '@opencrvs/toolkit/events'
import { formatV2ChildName } from '../birth/helpers'

test.describe.serial('Navigating in and out of dashboard', () => {
  let page: Page
  let declaration: Declaration
  let eventId: string
  test.beforeAll(async ({ browser }) => {
    const token = await getToken(
      CREDENTIALS.LOCAL_REGISTRAR.USERNAME,
      CREDENTIALS.LOCAL_REGISTRAR.PASSWORD
    )
    const res = await createDeclaration(token, undefined, ActionType.VALIDATE)
    declaration = res.declaration
    eventId = res.eventId
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('Login', async () => {
    await login(page)
  })

  test('Navigate to the "Ready for review" -workqueue', async () => {
    await page.getByRole('button', { name: 'Ready for review' }).click()
  })

  test("Enter the 'Registration Dashboard' - from workqueue", async () => {
    await page.getByText('Registrations Dashboard').click()
    await page.waitForURL(`**/performance/dashboard/registrations`)
    await expectInUrl(page, `/performance/dashboard/registrations`)

    await page.locator('#page-title button').click()

    await page.waitForURL(`**/workqueue/in-review-all`)
    await expectInUrl(page, '/workqueue/in-review-all')
  })

  test("Enter the 'Registration Dashboard' - from workqueue > event overview", async () => {
    await page.getByText(formatV2ChildName(declaration)).click()

    await page.waitForURL(
      `**/events/overview/${eventId}?workqueue=in-review-all`
    )
    await expectInUrl(
      page,
      `/events/overview/${eventId}?workqueue=in-review-all`
    )

    await page.getByText('Registrations Dashboard').click()
    await page.waitForURL(`**/performance/dashboard/registrations`)
    await expectInUrl(page, `/performance/dashboard/registrations`)

    await page.locator('#page-title button').click()

    await page.waitForURL(
      `**/events/overview/${eventId}?workqueue=in-review-all`
    )
    await expectInUrl(
      page,
      `/events/overview/${eventId}?workqueue=in-review-all`
    )
  })

  test("Enter the 'Registration Dashboard' - from event overview", async () => {
    await type(page, '#searchText', formatV2ChildName(declaration))
    await page.locator('#searchIconButton').click()
    await page
      .getByRole('button', { name: formatV2ChildName(declaration) })
      .click()

    await page.getByText('Registrations Dashboard').click()
    await page.waitForURL(`**/performance/dashboard/registrations`)
    await expectInUrl(page, `/performance/dashboard/registrations`)

    await page.locator('#page-title button').click()

    await page.waitForURL(`**/events/overview/${eventId}`)
    await expectInUrl(page, `/events/overview/${eventId}`)
  })

  test.describe
    .serial("Enter the 'Registration Dashboard' - from search result", async () => {
    test('2.5.1 - Fill in advanced search form with child details', async () => {
      await page.click('#searchType')
      await expect(page).toHaveURL(/.*\/advanced-search/)
      await page.getByText('Birth').click()

      await page.getByText('Child details').click()

      await type(page, '#firstname', declaration['child.name'].firstname)
      await type(page, '#surname', declaration['child.name'].surname)

      const [yyyy, mm, dd] = declaration['child.dob'].split('-')
      await type(page, '[data-testid="child____dob-dd"]', dd)
      await type(page, '[data-testid="child____dob-mm"]', mm)
      await type(page, '[data-testid="child____dob-yyyy"]', yyyy)

      await page.click('#search')
    })

    test('2.5.2 - Navigate to Registration Dashboard from search result', async () => {
      await page.getByText('Registrations Dashboard').click()
      await page.waitForURL(`**/performance/dashboard/registrations`)
      await expectInUrl(page, `/performance/dashboard/registrations`)

      await page.locator('#page-title button').click()

      await page.waitForURL(
        `**/search-result/birth?child.dob=${declaration['child.dob']}&child.name=${encodeURIComponent(JSON.stringify({ firstname: declaration['child.name'].firstname, surname: declaration['child.name'].surname }))}`
      )
      await expectInUrl(
        page,
        `/search-result/birth?child.dob=${declaration['child.dob']}&child.name=${encodeURIComponent(JSON.stringify({ firstname: declaration['child.name'].firstname, surname: declaration['child.name'].surname }))}`
      )
    })
  })
})
