import { Locator, Page, expect } from '@playwright/test'
import { CLIENT_URL } from './constants'
import { isMobile } from './mobile-helpers'

type Workqueue =
  | 'Outbox'
  | 'Drafts'
  | 'Assigned to you'
  | 'Recent'
  | 'Notifications'
  | 'Potential duplicate'
  | 'Pending updates'
  | 'Pending approval'
  | 'Escalated'
  | 'Pending registration'
  | 'Pending external validation'
  | 'Pending certification'
  | 'Pending issuance'
  | 'Pending corrections'
  | 'Team'
  | 'Organisation'

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
    | 'Correct'
    | 'Archive'
    | 'Reject'
    | 'Review correction request'
    | 'Approve'
    | 'Edit'
    | 'Escalate'
    | 'Registrar general feedback'
    | 'Provincial registrar feedback'
    | 'Revoke registration'
    | 'Reinstate registration'
    | 'Update'
    | 'Issue certified copy'
    | 'Review potential duplicates'
) {
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

const usernameToFullNameMap = {
  'k.cwalya': 'Kalusha Cwalya',
  'g.phiri': 'Gift Phiri',
  'f.katongo': 'Felix Katongo',
  'm.simbaya': 'Mapalo Simbaya',
  'v.katongo': 'Velix Katongo',
  'k.mweene': 'Kennedy Mweene',
  'v.mweene': 'Venedy Mweene',
  'm.owen': 'Mitchel Owen',
  'c.lungu': 'Chipo Lungu',
  'n.siame': 'Njavwa Siame',
  'j.campbell': 'Jonathan Campbell',
  'e.mayuka': 'Emmanuel Mayuka',
  'm.musonda': 'Mutale Musonda',
  't.mwila': 'Toukira Mwila'
} as const
/**
 *
 * Ensures that the record is assigned to the user and it is reflected in the event summary.
 *
 * @param username name of the user record is assigned. Used for assertion after assignment. Checking absence of something will burn the whole timeout in CI.
 */
export async function ensureAssignedToUser(
  page: Page,
  username: keyof typeof usernameToFullNameMap
) {
  const userFullName = usernameToFullNameMap[username]

  await page.getByRole('button', { name: 'Action', exact: true }).click()

  const actionItem = page.locator('#action-Dropdown-Content li')
  const assignAction = actionItem
    .filter({ hasText: new RegExp(`^Assign$`, 'i') })
    .first()
  const unassignAction = actionItem
    .filter({ hasText: new RegExp(`^Unassign$`, 'i') })
    .first()

  /*
   * Decide from the action menu, which is derived from the event document the
   * page has already loaded, so exactly one of these two items appears and it
   * appears promptly.
   *
   * The summary's "Assigned to" cell cannot answer this. It renders the
   * assignee's *name*, which EventOverview resolves with a second query
   * (getUsers.useQueryById) after the event itself has loaded, so the cell is
   * empty both while that query is in flight and when the record is genuinely
   * unassigned. Sampling it with a one-shot isVisible() therefore read an
   * assigned record as unassigned, committed to the Assign branch, and burned
   * the entire test timeout waiting for an Assign item that an already-assigned
   * record never offers.
   */
  await expect(assignAction.or(unassignAction)).toBeVisible()

  if (await unassignAction.isVisible()) {
    // Already assigned. Dismiss the menu without acting on it — the content is a
    // native popover, so Escape closes it — and then assert the holder is who
    // the caller expects. A record held by someone else fails here naming them,
    // rather than timing out on a menu item that was never going to appear.
    await page.keyboard.press('Escape')
    await expect(
      page.getByTestId('assignedTo-value').locator('span')
    ).toContainText(userFullName)

    return
  }

  await assignAction.click()

  // Setup the listener before clicking.
  const assignResponse = page.waitForResponse(
    (res) =>
      res.url().includes('event.actions.assignment.assign') &&
      res.status() === 200
  )
  // Wait for the assign modal to appear
  await page.getByRole('button', { name: 'Assign', exact: true }).click()

  // Wait for the assignment API call to complete and the UI to update.
  await assignResponse

  await expect(
    page.getByTestId('assignedTo-value').locator('span')
  ).toContainText(userFullName)
}

export async function expectInUrl(page: Page, assertionString: string) {
  await expect(page).toHaveURL((url) =>
    decodeURIComponent(url.toString()).includes(assertionString)
  )
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
