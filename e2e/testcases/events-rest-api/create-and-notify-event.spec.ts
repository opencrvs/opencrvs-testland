import { expect, Page, test } from '@playwright/test'
import { v4 as uuidv4 } from 'uuid'
import { CLIENT_URL, GATEWAY_HOST } from '../../constants'
import { CREDENTIALS } from '../../constants'
import {
  drawSignature,
  fetchUserLocationHierarchy,
  formatName,
  getClientToken,
  getToken,
  login
} from '../../helpers'
import { addDays, format, subDays } from 'date-fns'
import { faker } from '@faker-js/faker'
import { ensureAssigned, expectInUrl, selectAction } from '../../utils'
import { getAllLocations } from '../birth/helpers'

import decode from 'jwt-decode'
import { formatV2ChildName, REQUIRED_VALIDATION_ERROR } from '../birth/helpers'
import { getDeclaration } from '../test-data/birth-declaration'
import {
  printAndExpectPopup,
  selectRequesterType
} from '../print-certificate/birth/helpers'

async function fetchClientAPI(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  token: string,
  body: object = {}
) {
  const url = new URL(`${CLIENT_URL}${path}`)

  return fetch(url, {
    method,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
}

async function createSystemUser(token: string) {
  const name = `Test-int. ${format(new Date(), 'dd.MM. HH:mm:ss')}`
  const res = await fetch(`${GATEWAY_HOST}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      query: `
      mutation registerSystem($system: SystemInput) {
        registerSystem(system: $system) {
          clientSecret
          system {
            clientId
            shaSecret
          }
        }
      }
    `,
      variables: {
        system: {
          name,
          type: 'HEALTH'
        }
      }
    })
  })

  const body = await res.json()

  return {
    name,
    clientSecret: body.data.registerSystem.clientSecret as string,
    system: body.data.registerSystem.system as {
      clientId: string
      shaSecret: string
    }
  }
}

async function deleteSystemUser(token: string, clientId: string) {
  await fetch(`${GATEWAY_HOST}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      operationName: 'deleteSystem',
      variables: {
        clientId
      },
      query: `mutation deleteSystem($clientId: ID!) {  deleteSystem(clientId: $clientId) {
          _id
          clientId
          name
          shaSecret
          status
          type
          __typename
        }
      }`
    })
  })
}

const EVENT_TYPE = 'birth'

test.describe('Events REST API', () => {
  let clientToken: string
  let clientId: string
  let systemAdminToken: string
  let clientName: string

  test.beforeAll(async () => {
    systemAdminToken = await getToken(
      CREDENTIALS.NATIONAL_SYSTEM_ADMIN.USERNAME,
      CREDENTIALS.NATIONAL_SYSTEM_ADMIN.PASSWORD
    )
    const { system, clientSecret, name } =
      await createSystemUser(systemAdminToken)

    clientName = name
    clientId = system.clientId
    clientToken = await getClientToken(clientId, clientSecret)
  })

  test.afterAll(async () => {
    await deleteSystemUser(systemAdminToken, clientId)
  })

  test.describe('POST /api/events/events', () => {
    test('HTTP 401 when invalid token is used', async () => {
      const response = await fetchClientAPI(
        '/api/events/events',
        'POST',
        'foobar'
      )
      expect(response.status).toBe(401)
    })

    test('HTTP 403 when user is missing scope', async () => {
      const response = await fetchClientAPI(
        '/api/events/events',
        'POST',
        // use system admin token which doesnt have required scope to create event
        systemAdminToken
      )

      expect(response.status).toBe(403)
    })

    test('HTTP 400 with missing payload', async () => {
      const response = await fetchClientAPI(
        '/api/events/events',
        'POST',
        clientToken
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.message).toBe('Input validation failed')
    })

    test('HTTP 400 with invalid payload', async () => {
      const response = await fetchClientAPI(
        '/api/events/events',
        'POST',
        clientToken,
        {
          type: 'foobar'
        }
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.message).toBe('Input validation failed')
    })

    test('HTTP 200 with valid payload', async () => {
      const response = await fetchClientAPI(
        '/api/events/events',
        'POST',
        clientToken,
        {
          type: EVENT_TYPE,
          transactionId: uuidv4()
        }
      )

      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.type).toBe(EVENT_TYPE)
      expect(body.actions.length).toBe(1)
    })

    test('API is idempotent', async () => {
      const transactionId = uuidv4()
      const response1 = await fetchClientAPI(
        '/api/events/events',
        'POST',
        clientToken,
        {
          type: EVENT_TYPE,
          transactionId
        }
      )

      const response2 = await fetchClientAPI(
        '/api/events/events',
        'POST',
        clientToken,
        {
          type: EVENT_TYPE,
          transactionId
        }
      )

      const body1 = await response1.json()
      const body2 = await response2.json()

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      expect(body1).toEqual(body2)
    })
  })

  test.describe('POST /api/events/events/notifications', () => {
    let healthFacilityId: string

    test.beforeAll(async () => {
      const healthFacilities = await getAllLocations('HEALTH_FACILITY')

      if (!healthFacilities[0].id) {
        throw new Error('No health facility found')
      }

      healthFacilityId = healthFacilities[0].id
    })

    test('HTTP 401 when invalid token is used', async () => {
      const response = await fetchClientAPI(
        '/api/events/events/notifications',
        'POST',
        'foobar'
      )
      expect(response.status).toBe(401)
    })

    test('HTTP 403 when user is missing scope', async () => {
      const response = await fetchClientAPI(
        '/api/events/events/notifications',
        'POST',
        // use system admin token which doesnt have required scope to create event
        systemAdminToken
      )
      expect(response.status).toBe(403)
    })

    test('HTTP 400 with missing payload', async () => {
      const response = await fetchClientAPI(
        '/api/events/events/notifications',
        'POST',
        clientToken
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.message).toBe('Input validation failed')
    })

    test('HTTP 400 with invalid payload', async () => {
      const response = await fetchClientAPI(
        '/api/events/events/notifications',
        'POST',
        clientToken,
        {
          type: 'foobar'
        }
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.message).toBe('Input validation failed')
    })

    test('HTTP 400 with payload containing declaration with unexpected fields', async () => {
      const createEventResponse = await fetchClientAPI(
        '/api/events/events',
        'POST',
        clientToken,
        {
          type: EVENT_TYPE,
          transactionId: uuidv4()
        }
      )

      const createEventResponseBody = await createEventResponse.json()
      const eventId = createEventResponseBody.id

      const fakeSurname = faker.person.lastName()
      const response = await fetchClientAPI(
        '/api/events/events/notifications',
        'POST',
        clientToken,
        {
          eventId,
          transactionId: uuidv4(),
          type: 'NOTIFY',
          declaration: {
            'foo.bar': 'this should cause an error',
            'child.name': { surname: fakeSurname },
            'child.dob': format(subDays(new Date(), 1), 'yyyy-MM-dd')
          },
          annotation: {}
        }
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.message).toBe(
        `[{"message":"Unexpected field","id":"foo.bar","value":"this should cause an error"}]`
      )
    })

    test('HTTP 200 with payload containing declaration with half filled names', async ({
      page
    }) => {
      const createEventResponse = await fetchClientAPI(
        '/api/events/events',
        'POST',
        clientToken,
        {
          type: EVENT_TYPE,
          transactionId: uuidv4()
        }
      )

      const token = await login(page)
      const { sub } = decode<{ sub: string }>(token)
      const createEventResponseBody = await createEventResponse.json()
      const eventId = createEventResponseBody.id
      const location = await fetchUserLocationHierarchy(sub, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const fakeSurname = faker.person.lastName()

      const response = await fetchClientAPI(
        '/api/events/events/notifications',
        'POST',
        clientToken,
        {
          eventId,
          transactionId: uuidv4(),
          type: 'NOTIFY',
          createdAtLocation: location[location.length - 1],
          declaration: {
            'child.name': { surname: fakeSurname },
            // this should cause an error because the date is in the future
            'child.dob': format(addDays(new Date(), 10), 'yyyy-MM-dd')
          },
          annotation: {}
        }
      )

      expect(response.status).toBe(200)
    })

    test('HTTP 400 with payload containing declaration with values of wrong type', async () => {
      const createEventResponse = await fetchClientAPI(
        '/api/events/events',
        'POST',
        clientToken,
        {
          type: EVENT_TYPE,
          transactionId: uuidv4()
        }
      )

      const createEventResponseBody = await createEventResponse.json()
      const eventId = createEventResponseBody.id

      const response = await fetchClientAPI(
        '/api/events/events/notifications',
        'POST',
        clientToken,
        {
          eventId,
          transactionId: uuidv4(),
          type: 'NOTIFY',
          declaration: {
            'child.name': { surname: 12345 }
          },
          annotation: {}
        }
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.message).toBe(
        '[{"message":"Invalid input","id":"child.name","value":{"surname":12345}}]'
      )
    })

    test('HTTP 404 when trying to notify a non-existing event', async () => {
      const response = await fetchClientAPI(
        '/api/events/events/notifications',
        'POST',
        clientToken,
        {
          eventId: uuidv4(),
          transactionId: uuidv4(),
          type: 'NOTIFY',
          declaration: {
            'child.name': {
              firstname: faker.person.firstName(),
              surname: faker.person.lastName()
            },
            'child.dob': format(subDays(new Date(), 1), 'yyyy-MM-dd')
          },
          annotation: {}
        }
      )

      expect(response.status).toBe(404)
    })

    test('HTTP 400 when trying to notify an event without createdAtLocation', async () => {
      const createEventResponse = await fetchClientAPI(
        '/api/events/events',
        'POST',
        clientToken,
        {
          type: EVENT_TYPE,
          transactionId: uuidv4()
        }
      )

      const createEventResponseBody = await createEventResponse.json()
      const eventId = createEventResponseBody.id

      const childName = {
        firstNames: faker.person.firstName(),
        familyName: faker.person.lastName()
      }

      const response = await fetchClientAPI(
        '/api/events/events/notifications',
        'POST',
        clientToken,
        {
          eventId,
          transactionId: uuidv4(),
          type: 'NOTIFY',
          declaration: {
            'child.name': {
              firstname: childName.firstNames,
              surname: childName.familyName
            },
            'child.dob': format(subDays(new Date(), 1), 'yyyy-MM-dd')
          },
          annotation: {}
        }
      )

      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.message).toBe(
        'createdAtLocation is required and must be a valid office id'
      )
    })

    test('HTTP 400 when trying to notify an event with an invalid createdAtLocation', async () => {
      const createEventResponse = await fetchClientAPI(
        '/api/events/events',
        'POST',
        clientToken,
        {
          type: EVENT_TYPE,
          transactionId: uuidv4()
        }
      )

      const createEventResponseBody = await createEventResponse.json()
      const eventId = createEventResponseBody.id

      const childName = {
        firstNames: faker.person.firstName(),
        familyName: faker.person.lastName()
      }

      const response = await fetchClientAPI(
        '/api/events/events/notifications',
        'POST',
        clientToken,
        {
          eventId,
          transactionId: uuidv4(),
          type: 'NOTIFY',
          declaration: {
            'child.name': {
              firstname: childName.firstNames,
              surname: childName.familyName
            },
            'child.dob': format(subDays(new Date(), 1), 'yyyy-MM-dd')
          },
          annotation: {},
          createdAtLocation: 'invalid-location-id'
        }
      )

      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.message).toBe('Input validation failed')
    })

    test('HTTP 400 when trying to notify an event with a non-office createdAtLocation', async () => {
      const createEventResponse = await fetchClientAPI(
        '/api/events/events',
        'POST',
        clientToken,
        {
          type: EVENT_TYPE,
          transactionId: uuidv4()
        }
      )

      const createEventResponseBody = await createEventResponse.json()
      const eventId = createEventResponseBody.id

      const childName = {
        firstNames: faker.person.firstName(),
        familyName: faker.person.lastName()
      }

      const locations = await getAllLocations('ADMIN_STRUCTURE')
      const centralLocation = locations.find(
        (location) => location.name === 'Central'
      )

      if (!centralLocation) {
        throw new Error('No central location found')
      }

      const response = await fetchClientAPI(
        '/api/events/events/notifications',
        'POST',
        clientToken,
        {
          eventId,
          transactionId: uuidv4(),
          type: 'NOTIFY',
          declaration: {
            'child.name': {
              firstname: childName.firstNames,
              surname: childName.familyName
            },
            'child.dob': format(subDays(new Date(), 1), 'yyyy-MM-dd')
          },
          annotation: {},
          createdAtLocation: centralLocation.id
        }
      )

      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.message).toBe('createdAtLocation must be an office location')
    })

    test('HTTP 200 with valid payload', async ({ page }) => {
      const createEventResponse = await fetchClientAPI(
        '/api/events/events',
        'POST',
        clientToken,
        {
          type: EVENT_TYPE,
          transactionId: uuidv4()
        }
      )

      expect(createEventResponse.status).toBe(200)

      const createEventResponseBody = await createEventResponse.json()
      const eventId = createEventResponseBody.id

      const childName = {
        firstNames: faker.person.firstName(),
        familyName: faker.person.lastName()
      }

      const token = await login(page)
      const { sub } = decode<{ sub: string }>(token)

      const location = await fetchUserLocationHierarchy(sub, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const response = await fetchClientAPI(
        '/api/events/events/notifications',
        'POST',
        clientToken,
        {
          eventId,
          transactionId: uuidv4(),
          type: 'NOTIFY',
          declaration: {
            'child.name': {
              firstname: childName.firstNames,
              surname: childName.familyName
            },
            'child.dob': format(subDays(new Date(), 1), 'yyyy-MM-dd')
          },
          annotation: {},
          createdAtLocation: location[location.length - 1]
        }
      )

      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.type).toBe(EVENT_TYPE)
      expect(body.actions.length).toBe(3)
      expect(body.actions[0].type).toBe('CREATE')
      expect(body.actions[1].type).toBe('NOTIFY')
      expect(body.actions[1].status).toBe('Requested')
      expect(body.actions[2].type).toBe('NOTIFY')
      expect(body.actions[2].status).toBe('Accepted')

      // check that event is created in UI

      await page.getByRole('button', { name: 'Notifications' }).click()

      await page.getByText(await formatName(childName)).click()

      await ensureAssigned(page)

      await expect(page.locator('#row_0')).toContainText('Sent incomplete')
      await expect(page.locator('#row_0')).toContainText(clientName)
      await expect(page.locator('#row_0')).toContainText('Test-int.')

      // Open modal by clicking 'Sent incomplete' action row
      await page.getByText('Sent incomplete').click()
      const modal = await page.getByTestId('event-history-modal')
      expect(modal).toContainText('Sent incomplete')
      expect(modal).toContainText(clientName)

      // Close the modal
      await page.locator('#close-btn').click()

      // View the event details
      await selectAction(page, 'View')
      await expect(page.getByTestId('row-value-child.name')).toHaveText(
        formatName(childName)
      )
    })

    test('API is idempotent', async () => {
      const createEventResponse = await fetchClientAPI(
        '/api/events/events',
        'POST',
        clientToken,
        {
          type: EVENT_TYPE,
          transactionId: uuidv4()
        }
      )

      const createEventResponseBody = await createEventResponse.json()
      const eventId = createEventResponseBody.id

      const childName = {
        firstNames: faker.person.firstName(),
        familyName: faker.person.lastName()
      }

      const requestBody = {
        eventId,
        transactionId: uuidv4(),
        type: 'NOTIFY',
        declaration: {
          'child.name': {
            firstname: childName.firstNames,
            surname: childName.familyName
          },
          'child.dob': format(subDays(new Date(), 1), 'yyyy-MM-dd')
        },
        annotation: {},
        createdAtLocation: healthFacilityId
      }

      const response1 = await fetchClientAPI(
        '/api/events/events/notifications',
        'POST',
        clientToken,
        requestBody
      )

      const response2 = await fetchClientAPI(
        '/api/events/events/notifications',
        'POST',
        clientToken,
        requestBody
      )

      const body1 = await response1.json()
      const body2 = await response2.json()

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      expect(body1).toEqual(body2)
    })
  })

  test.describe
    .serial('Local Registrar can register and print an event notified via integration', async () => {
    const childName = {
      firstname: faker.person.firstName(),
      surname: faker.person.lastName()
    }

    let token: string
    let page: Page
    let eventId: string

    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage()
    })

    test.afterAll(async () => {
      await page.close()
    })

    test('Login', async () => {
      token = await login(page)
    })

    test('Notify an event via integration', async () => {
      const createEventResponse = await fetchClientAPI(
        '/api/events/events',
        'POST',
        clientToken,
        {
          type: EVENT_TYPE,
          transactionId: uuidv4()
        }
      )

      const createEventResponseBody = await createEventResponse.json()
      eventId = createEventResponseBody.id
      const { sub } = decode<{ sub: string }>(token)

      const location = await fetchUserLocationHierarchy(sub, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const declaration = {
        ...(await getDeclaration({})),
        'child.name': childName,
        'child.dob': undefined
      }

      const response = await fetchClientAPI(
        '/api/events/events/notifications',
        'POST',
        clientToken,
        {
          eventId,
          transactionId: uuidv4(),
          type: 'NOTIFY',
          declaration,
          annotation: {},
          createdAtLocation: location[location.length - 1]
        }
      )
      expect(response.status).toBe(200)
    })

    test("Navigate to event via 'Notifications' -workqueue", async () => {
      await page.getByRole('button', { name: 'Notifications' }).click()
      await page
        .getByText(await formatV2ChildName({ 'child.name': childName }))
        .click()
    })

    test('Review event', async () => {
      await selectAction(page, 'Review')

      await expect(page.getByTestId('row-value-child.name')).toHaveText(
        formatV2ChildName({ 'child.name': childName })
      )

      await expect(page.getByTestId('row-value-child.dob')).toHaveText(
        REQUIRED_VALIDATION_ERROR
      )

      await expect(
        page.getByRole('button', { name: 'Register' })
      ).toBeDisabled()
    })

    test('Fill missing child dob field', async () => {
      await page.getByTestId('change-button-child.dob').click()
      await page.getByRole('button', { name: 'Continue' }).click()

      const yesterday = new Date()
      yesterday.setDate(new Date().getDate() - 1)
      const [yyyy, mm, dd] = yesterday.toISOString().split('T')[0].split('-')

      await page.getByPlaceholder('dd').fill(dd)
      await page.getByPlaceholder('mm').fill(mm)
      await page.getByPlaceholder('yyyy').fill(yyyy)
    })

    const newChildName = {
      firstname: childName.firstname,
      surname: `Laurila-${childName.surname}`
    }

    test('Change child surname', async () => {
      await page.getByTestId('text__surname').fill(newChildName.surname)
      await page.getByRole('button', { name: 'Go to review' }).click()

      await expect(page.getByTestId('row-value-child.dob')).not.toHaveText(
        REQUIRED_VALIDATION_ERROR
      )
    })

    test('Fill comment & signature', async () => {
      await page.locator('#review____comment').fill(faker.lorem.sentence())
      await page.getByRole('button', { name: 'Sign', exact: true }).click()
      await drawSignature(page, 'review____signature_canvas_element', false)
      await page
        .locator('#review____signature_modal')
        .getByRole('button', { name: 'Apply' })
        .click()
    })

    test('Register event', async () => {
      await page.getByRole('button', { name: 'Register', exact: true }).click()
      await page.locator('#confirm_Declare').click()
    })

    test("Navigate to event via 'Ready to print' -workqueue", async () => {
      await page.getByRole('button', { name: 'Ready to print' }).click()
      await page
        .getByText(await formatV2ChildName({ 'child.name': newChildName }))
        .click()
    })

    test('Print certificate', async () => {
      await selectAction(page, 'Print')
      await selectRequesterType(page, 'Print and issue to Informant (Mother)')
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Verified' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page.locator('#print')).toContainText(
        formatV2ChildName({ 'child.name': newChildName })
      )

      await expect(page.locator('#print')).toContainText(
        'Ibombo District Office'
      )

      await expect(page.locator('#print')).toContainText(
        'Ibombo, Central, Farajaland'
      )

      await printAndExpectPopup(page)

      await expectInUrl(page, `/workqueue/ready-to-print`)
    })
  })
})
