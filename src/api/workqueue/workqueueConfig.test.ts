import { describe, expect, it } from 'vitest'
import { Workqueues } from './workqueueConfig'

describe('Workqueue config', () => {
  it('should match the snapshot (Workqueue integrity)', () => {
    expect(Workqueues).toMatchSnapshot()
  })

  it('should only include NOTIFIED and DECLARED records in sent-for-review workqueue', () => {
    const sentForReviewWorkqueue = Workqueues.find(
      (workqueue) => workqueue.slug === 'sent-for-review'
    )

    if (!sentForReviewWorkqueue) {
      throw new Error('sent-for-review workqueue not found')
    }

    // @ts-expect-error - query is a union type, and we are not narrowing it here.
    expect(sentForReviewWorkqueue.query.clauses[0].status.terms).toEqual([
      'DECLARED',
      'NOTIFIED'
    ])
    expect(sentForReviewWorkqueue.actions.length).toEqual(0)
  })
})
