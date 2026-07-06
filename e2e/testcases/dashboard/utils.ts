import { expect, type FrameLocator } from '@playwright/test'

/*
 * A broken Metabase card renders a warning icon and an error message
 * ("Something's gone wrong" / "There was a problem displaying this chart")
 * instead of the `visualization-root` content.
 */

const ERROR_TEXT = /something's gone wrong|there was a problem/i
const LOADING_SELECTOR =
  '[data-testid="loading-indicator"], [data-testid="loading-spinner"], .LoadingSpinner'

// Scalar cards title with `scalar-title`, chart and table cards with
// `legend-caption-title`. Markdown text cards have neither.
const CARD_TITLE_SELECTOR =
  '[data-testid="legend-caption-title"], [data-testid="scalar-title"]'

export async function expectNoBrokenCards(
  frame: FrameLocator,
  expectedCardTitles: string[],
  /** Cards without a title element, e.g. markdown intro cards */
  untitledCards = 0
) {
  // Wait for the dashboard grid to mount and all card queries to finish
  await expect(frame.locator('[data-testid="dashcard"]').first()).toBeVisible({
    timeout: 60_000
  })
  await expect(frame.locator(LOADING_SELECTOR)).toHaveCount(0, {
    timeout: 60_000
  })

  // Every expected card is present — none missing, none extra
  await expect(frame.locator(CARD_TITLE_SELECTOR)).toHaveText(
    expectedCardTitles
  )

  const cardCount = expectedCardTitles.length + untitledCards
  const dashcards = frame.locator('[data-testid="dashcard"]')
  await expect(dashcards).toHaveCount(cardCount)

  // Every card rendered its visualization container ("No results" included)
  await expect(
    frame.locator('[data-testid="dashcard"] [data-testid="visualization-root"]')
  ).toHaveCount(cardCount)

  // No card is in an error state
  await expect(dashcards.filter({ hasText: ERROR_TEXT })).toHaveCount(0)
  await expect(
    frame.locator('[data-testid="dashcard"] .Icon-warning')
  ).toHaveCount(0)
}

export async function expectBirthsTabSelected(frame: FrameLocator) {
  await expect(frame.getByRole('tab', { name: 'Births' })).toHaveAttribute(
    'aria-selected',
    'true',
    { timeout: 60_000 }
  )
}
