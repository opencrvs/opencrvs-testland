import { Locator, Page, expect } from '@playwright/test'
import {
  CLIENT_URL,
  SAFE_IN_EXTERNAL_VALIDATION_MS,
  SAFE_INPUT_CHANGE_TIMEOUT_MS,
  SAFE_OUTBOX_TIMEOUT_MS
} from './constants'
import { isMobile } from './mobile-helpers'

type Workqueue =
  | 'Ready to print'
  | 'Ready for review'
  | 'Notifications'
  | 'Requires updates'
  | 'In external validation'
  | 'Assigned to you'
  | 'Recent'
  | 'Sent for review'
  | 'Outbox'

export async function navigateToWorkqueue(page: Page, workqueue: Workqueue) {
  if (isMobile(page)) {
    await page.goto(CLIENT_URL)
    await page.getByRole('button', { name: 'Toggle menu', exact: true }).click()
  }

  await page.getByRole('button', { name: workqueue }).click()
}

export async function selectAction(
  page: Page,
  action:
    | 'Print'
    | 'Declare'
    | 'Validate'
    | 'Review'
    | 'Register'
    | 'Assign'
    | 'Unassign'
    | 'Delete'
    | 'Correct record'
    | 'View'
    | 'Archive'
) {
  if (action !== 'View') {
    const statusValue = page.getByTestId('status-value')

    /*
     * The status chip renders before the event data resolves, so reading it
     * immediately can return an empty string and misroute the branch below
     * (treating a draft as non-draft, or vice versa).
     */
    await statusValue.waitFor({ state: 'visible' })
    await expect(statusValue).not.toBeEmpty()

    if ((await statusValue.innerText()) !== 'Draft') {
      await ensureAssigned(page)
    }
  }

  await page.getByRole('button', { name: 'Action', exact: true }).click()

  if (isMobile(page)) {
    await page.locator('#page-title').getByText(action, { exact: true }).click()
    return
  }

  await page
    .locator('#action-Dropdown-Content')
    .getByText(action, { exact: true })
    .click()
}

export async function ensureAssigned(page: Page) {
  const actionButton = page.getByRole('button', { name: 'Action', exact: true })
  const assignedTo = page.getByTestId('assignedTo-value')

  /*
   * `assignedTo-value` is asserted negatively below. A negative assertion on a
   * locator that has not rendered yet passes instantly, so wait for the value
   * to exist before acting on it.
   */
  await assignedTo.waitFor({ state: 'visible' })

  await expect(actionButton).toBeEnabled()
  await actionButton.click()

  const actionMenuItem = (label: string) =>
    page
      .locator('#action-Dropdown-Content li')
      .filter({ hasText: new RegExp(`^${label}$`, 'i') })
      .first()

  const unAssignAction = actionMenuItem('Unassign')
  const assignAction = actionMenuItem('Assign')

  /*
   * Wait until either "Unassign" or "Assign" is visible. `Promise.race` would
   * leave the losing `waitFor` to reject later as an unhandled rejection, so
   * wait on a single locator that matches either item instead.
   */
  await unAssignAction.or(assignAction).first().waitFor({ state: 'visible' })

  if (await unAssignAction.isVisible()) {
    await unAssignAction.click()
    // Wait for the unassign modal to appear
    await page.getByRole('button', { name: 'Unassign', exact: true }).click()
    await expect(assignedTo).toHaveText('Not assigned', {
      timeout: SAFE_OUTBOX_TIMEOUT_MS
    })
    await actionButton.click()
  }

  await assignAction.waitFor({ state: 'visible' })
  await assignAction.click()
  // Wait for the assign modal to appear
  await page.getByRole('button', { name: 'Assign', exact: true }).click()

  await expect(assignedTo).not.toHaveText('Not assigned', {
    timeout: SAFE_OUTBOX_TIMEOUT_MS
  })
}

export async function expectInUrl(page: Page, assertionString: string) {
  await expect(page.url().includes(assertionString)).toBeTruthy()
}

export async function ensureOutboxIsEmpty(page: Page) {
  await page.waitForTimeout(SAFE_INPUT_CHANGE_TIMEOUT_MS)

  await expect(page.locator('#navigation_workqueue_outbox')).toHaveText(
    'Outbox',
    {
      timeout: SAFE_OUTBOX_TIMEOUT_MS
    }
  )
}

export async function ensureInExternalValidationIsEmpty(page: Page) {
  await page.waitForTimeout(SAFE_INPUT_CHANGE_TIMEOUT_MS)

  await expect(
    page.locator('#navigation_workqueue_in-external-validation')
  ).toHaveText('In external validation', {
    timeout: SAFE_IN_EXTERNAL_VALIDATION_MS
  })
}

export async function selectLocationOption(page: Page, locationName: string) {
  await page.locator('[id^="locationOption"]').getByText(locationName).click()
}

export async function type(page: Page, locator: string, text: string) {
  await page.locator(locator).fill(text)
  await page.locator(locator).blur()
}

export const assertTexts = async ({
  root,
  texts,
  locator,
  testId
}: {
  root: Page | Locator
  texts: string[]
  locator?: string
  testId?: string
}) => {
  for (const text of texts) {
    if (locator) {
      await expect(root.locator(locator).getByText(text)).toBeVisible()
    } else if (testId) {
      await expect(root.getByTestId(testId).getByText(text)).toBeVisible()
    } else {
      await expect(root.getByText(text)).toBeVisible()
    }
  }
}
