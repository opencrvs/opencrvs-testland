import { Locator, Page, expect } from '@playwright/test'
import {
  AUTH_URL,
  CLIENT_URL,
  CREDENTIALS,
  GATEWAY_HOST,
  SAFE_INPUT_CHANGE_TIMEOUT_MS,
  SAFE_OUTBOX_TIMEOUT_MS
} from './constants'
import { format, parseISO } from 'date-fns'
import { isArray, random } from 'lodash'
import fetch from 'node-fetch'
import { isMobile } from './mobile-helpers'

async function createPIN(page: Page) {
  await page.click('#pin-input')
  for (let i = 1; i <= 8; i++) {
    await page.type('#pin-input', `${i % 2}`)
  }
}

export async function logout(page: Page) {
  if (isMobile(page)) {
    await page.goto(CLIENT_URL)
    await page.getByRole('button', { name: 'Toggle menu', exact: true }).click()
    await page.getByRole('button', { name: 'Logout', exact: true }).click()
    return
  }

  await page.locator('#ProfileMenu-dropdownMenu').click()
  await page
    .locator('#ProfileMenu-dropdownMenu')
    .getByRole('listitem')
    .filter({
      hasText: new RegExp('Logout')
    })
    .click()
  await page.context().clearCookies()
}

export async function login(
  page: Page,
  credentials = CREDENTIALS.LOCAL_REGISTRAR,
  skipPin?: boolean
) {
  const token = await getToken(credentials.USERNAME, credentials.PASSWORD)
  expect(token).toBeDefined()
  await page.goto(`${CLIENT_URL}?token=${token}`)

  await expect(
    page.locator('#appSpinner').or(page.locator('#pin-input'))
  ).toBeVisible()

  if (!skipPin) {
    await createPIN(page)
  }

  await page.goto(CLIENT_URL)

  return token
}

export async function getToken(username: string, password: string) {
  const authUrl = `${AUTH_URL}/authenticate`
  const verifyUrl = `${AUTH_URL}/verifyCode`

  const authResponse = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: username,
      password: password
    })
  })

  const authBody = await authResponse.json()
  const verifyResponse = await fetch(verifyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nonce: authBody.nonce,
      code: '000000'
    })
  })

  const verifyBody = await verifyResponse.json()

  return verifyBody.token
}

export async function getClientToken(client_id: string, client_secret: string) {
  const authUrl = `${AUTH_URL}/token?client_id=${client_id}&client_secret=${client_secret}&grant_type=client_credentials`

  const authResponse = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  const authBody = await authResponse.json()

  return authBody.access_token
}

type DeclarationSection =
  | 'child'
  | 'informant'
  | 'father'
  | 'mother'
  | 'documents'
  | 'preview'
  | 'groom'
  | 'bride'
  | 'marriageEvent'
  | 'witnessOne'
  | 'witnessTwo'
type CorrectionSection = 'summary'
type V2ReviewSection = 'review'

export const goToSection = async (
  page: Page,
  section: DeclarationSection | CorrectionSection | V2ReviewSection
) => {
  while (!page.url().includes(`/${section}`)) {
    await page.getByRole('button', { name: 'Continue' }).click()
  }
}

/*
  Generates a random past date
  at least 'minAge' years + 'offset' days ago
  and up to an additional 'range' days earlier
*/
export const getRandomDate = (
  minAge: number,
  range: number,
  offset: number = 0
) => {
  const randomDate = new Date()
  randomDate.setDate(
    new Date().getDate() -
      Math.random() * range -
      minAge * 365 -
      (minAge + 3) / 4 -
      offset
  )
  const [yyyy, mm, dd] = randomDate.toISOString().split('T')[0].split('-')
  return { dd, mm, yyyy }
}

export async function ensureLoginPageReady(page: Page) {
  /*
   * Wait until config for loading page has been loaded
   */
  await page.waitForSelector('#Box img', { state: 'attached' })
  await page.waitForFunction(() => {
    const img = document.querySelector<HTMLImageElement>('#Box img')!
    return img && img.src && img.src.trim() !== ''
  })
}

export async function validateSectionButtons(page: Page) {
  await expect(page.getByText('Continue', { exact: true })).toBeVisible()
  await expect(page.getByText('Exit', { exact: true })).toBeVisible()
  await expect(page.getByText('Save & Exit', { exact: true })).toBeVisible()
  await expect(page.locator('#eventToggleMenu-dropdownMenu')).toBeVisible()
}

export const uploadImage = async (
  page: Page,
  locator: Locator,
  image = './e2e/assets/528KB-random.png'
) => {
  const fileChooserPromise = page.waitForEvent('filechooser')
  await locator.click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(image)
  return fileChooser
}

/**
 * @page - page object
 * @sectionLocator - locator for the section e.g. mother / father
 * @sectionTitle - title of the section to  e.g. National ID / Passport
 * @buttonLocator - locator for the button to upload the image
 */
export const uploadImageToSection = async ({
  page,
  sectionLocator,
  sectionTitle,
  buttonLocator
}: {
  page: Page
  sectionLocator: Locator
  buttonLocator: Locator
  sectionTitle: string
}) => {
  await sectionLocator.getByText('Select...').click()
  await sectionLocator.getByText(sectionTitle, { exact: true }).click()

  await uploadImage(page, buttonLocator)
}

export const expectAddress = async (
  locator: Locator,
  address: { [key: string]: any },
  isDeletion?: boolean
) => {
  const addressKeys = [
    'country',

    'state',
    'province',

    'district',

    'village',
    'town',
    'city',

    'residentialArea',
    'addressLine1',

    'street',
    'addressLine2',

    'number',
    'addressLine3',

    'postcodeOrZip',
    'postalCode',
    'zipCode'
  ]

  if (isArray(address.line)) {
    address.addressLine1 = address.line[2]
    address.addressLine2 = address.line[1]
    address.addressLine3 = address.line[0]
  }

  const texts = addressKeys
    .map((key) => address[key])
    .filter((value) => Boolean(value))

  if (isDeletion) {
    const deletionLocators = await locator.getByRole('deletion').all()
    for (let i = 0; i < texts.length; i++) {
      await expect(deletionLocators[getDeletionPosition(i)]).toContainText(
        texts[i]
      )
    }
  } else await expectTexts(locator, texts)
}

/*
  The deletion section is formatted like below:
  	'-'
    'Farajaland'
    'Central'
    'Ibombo'
    'Example Town' / 'Example village'
    'Mitali Residential Area'
    '4/A'
    '1324'

*/
const getDeletionPosition = (i: number) => i + 1 // for the extra '-' at the beginning

export const expectTexts = async (locator: Locator, texts: string[]) => {
  for (const text of texts) {
    await expect(locator).toContainText(text)
  }
}

export const expectTextWithChangeLink = async (
  locator: Locator,
  texts: string[]
) => {
  await expectTexts(locator, texts)
  await expect(locator).toContainText('Change')
}

export const getLocationNameFromFhirId = async (fhirId: string) => {
  const res = await fetch(`${GATEWAY_HOST}/location/${fhirId}`)
  const location = (await res.json()) as fhir.Location
  return location.name
}

export async function continueForm(page: Page, label: string = 'Continue') {
  await page.waitForTimeout(SAFE_INPUT_CHANGE_TIMEOUT_MS)
  return page.getByText(label, { exact: true }).click()
}

export async function goBackToReview(page: Page) {
  await page.waitForTimeout(SAFE_INPUT_CHANGE_TIMEOUT_MS)
  await page.getByRole('button', { name: 'Go to review' }).click()
}

export const formatDateTo_yyyyMMdd = (date: string) =>
  format(parseISO(date), 'yyyy-MM-dd')

export const formatDateTo_ddMMMMyyyy = (date: string) =>
  format(parseISO(date), 'dd MMMM yyyy')

export const formatDateTo_dMMMMyyyy = (date: string) =>
  format(parseISO(date), 'd MMMM yyyy')

/*
  Date() object takes 0-indexed month,
  but month coming to the method is 1-indexed
*/
export const formatDateObjectTo_ddMMMMyyyy = ({
  yyyy,
  mm,
  dd
}: {
  yyyy: string
  mm: string
  dd: string
}) => format(new Date(Number(yyyy), Number(mm) - 1, Number(dd)), 'dd MMMM yyyy')

/*
  Date() object takes 0-indexed month,
  but month coming to the method is 1-indexed
*/
export const formatDateObjectTo_dMMMMyyyy = ({
  yyyy,
  mm,
  dd
}: {
  yyyy: string
  mm: string
  dd: string
}) => format(new Date(Number(yyyy), Number(mm) - 1, Number(dd)), 'd MMMM yyyy')

/*
  Date() object takes 0-indexed month,
  but month coming to the method is 1-indexed
*/
export const formatDateObjectTo_yyyyMMdd = ({
  yyyy,
  mm,
  dd
}: {
  yyyy: string
  mm: string
  dd: string
}) => format(new Date(Number(yyyy), Number(mm) - 1, Number(dd)), 'yyyy-MM-dd')

export const joinValuesWith = (
  values: (string | number | null | undefined)[],
  separator = ' '
) => {
  return values.filter(Boolean).join(separator)
}

type PersonOrName = {
  firstNames?: string
  familyName?: string
  [key: string]: any
}
export const formatName = (name: PersonOrName) => {
  const nameArray = []
  if (name.firstNames) nameArray.push(name.firstNames)
  if (name.familyName) nameArray.push(name.familyName)
  return joinValuesWith(nameArray)
}

export const drawSignature = async (
  page: Page,
  modalLocator:
    | 'review____signature_canvas_element'
    | 'brideSignature_modal'
    | 'groomSignature_modal'
    | 'witnessOneSignature_modal'
    | 'witnessTwoSignature_modal'
    | 'informantSignature_modal' = 'informantSignature_modal',
  includeCanvas: boolean = true
) => {
  const canvasLocator = includeCanvas
    ? `#${modalLocator} canvas`
    : `#${modalLocator}`

  const canvas = page.locator(canvasLocator)
  const rect = await canvas.boundingBox()

  expect(rect).toBeTruthy()
  if (rect) {
    const center = {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2
    }

    const points = Array(10)
      .fill(null)
      .map(() => ({
        x: random(0.05, 0.95),
        y: random(0.05, 0.95)
      }))

    await page.mouse.move(center.x, center.y)
    await page.mouse.down()
    for (const point of points) {
      await page.mouse.move(
        rect.x + point.x * rect.width,
        rect.y + point.y * rect.height
      )
    }
    await page.mouse.up()
  }
}

export const expectOutboxToBeEmpty = async (page: Page) => {
  /*
   * This is to ensure the following condition is asserted
   * after the outbox has the declaration
   */
  await page.waitForTimeout(SAFE_INPUT_CHANGE_TIMEOUT_MS)

  await expect(page.locator('#navigation_outbox')).not.toContainText('1', {
    timeout: SAFE_OUTBOX_TIMEOUT_MS
  })
}

// This suffix increases randomness of a name
export const generateRandomSuffix = () => {
  const vowels = 'aeiou'
  const consonants = 'bcdfghjklmnpqrstvwxyz'

  const randomVowel = vowels.charAt(Math.floor(Math.random() * vowels.length))
  const randomConsonant = consonants.charAt(
    Math.floor(Math.random() * consonants.length)
  )

  return randomConsonant + randomVowel
}

type ActionMenuOptions =
  | 'Assign'
  | 'Correct record'
  | 'Print certified copy'
  | 'Review declaration'
  | 'Update declaration'
  | 'Review correction request'
  | 'View'
  | 'Validate'
  | 'Review'

export const getAction = (page: Page, option: ActionMenuOptions) => {
  return page
    .locator('#action-dropdownMenu')
    .getByRole('listitem')
    .filter({
      hasText: new RegExp(option)
    })
}

export const assignRecord = async (page: Page) => {
  await page.getByLabel('Assign record').click()
  if (
    await page.getByRole('button', { name: 'Assign', exact: true }).isVisible()
  )
    await page.getByRole('button', { name: 'Assign', exact: true }).click()
}

/**
  Opens the record audit view of a record with given trackingId or name
 */
export const auditRecord = async ({
  page,
  trackingId,
  name
}: {
  page: Page
  trackingId?: string
  name: string
}) => {
  if (trackingId) {
    await page
      .getByRole('textbox', { name: 'Search for a tracking ID' })
      .fill(trackingId)

    await page.getByRole('button', { name: 'Search' }).click()
    await page.getByRole('button', { name, exact: true }).click()
  } else {
    await page.locator('#searchType').getByText('Tracking ID').click()
    await page.locator('li:has(svg) >> text=Name').click()
    await page.getByRole('textbox', { name: 'Search for a name' }).fill(name)
    await page.getByRole('button', { name: 'Search' }).click()
    await page.getByRole('button', { name, exact: true }).click()
  }
}

const post = async <T = any>({
  query,
  variables,
  headers
}: {
  query: string
  variables: Record<string, any>
  headers: Record<string, any>
}) => {
  const response = await fetch(`${GATEWAY_HOST}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify({
      variables,
      query
    })
  })

  if (!response.ok) {
    throw new Error(`not ok: ${await response.text()}`)
  }

  return response.json() as Promise<{ data: T }>
}

type GetUser = {
  getUser: {
    primaryOffice: {
      hierarchy: Array<{
        id: string
      }>
    }
  }
}

export const fetchUserLocationHierarchy = async (
  userId: string,
  { headers }: { headers: Record<string, any> }
) => {
  const res = await post<GetUser>({
    query: /* GraphQL */ `
      query fetchUser($userId: String!) {
        getUser(userId: $userId) {
          primaryOffice {
            hierarchy {
              id
            }
          }
        }
      }
    `,
    variables: { userId },
    headers
  })
  return res.data.getUser.primaryOffice.hierarchy.map(({ id }) => id)
}

export async function expectRowValueWithChangeButton(
  page: Page,
  fieldName: string,
  assertionText: string
) {
  await expect(page.getByTestId(`row-value-${fieldName}`)).toContainText(
    assertionText
  )

  await expect(page.getByTestId(`change-button-${fieldName}`)).toBeVisible()
}
