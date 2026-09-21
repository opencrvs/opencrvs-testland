import fetch from 'node-fetch'
import { User } from './users'
import { log } from './util'

import { GATEWAY_HOST } from './constants'
import { MARK_AS_REJECTED_QUERY } from './queries'

export async function markEventAsRejected(
  user: User,
  id: string,
  reason: string,
  comment: string
) {
  const { token, username } = user

  const requestStart = Date.now()
  const rejectDeclarationRes = await fetch(`${GATEWAY_HOST}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-correlation-id': `rejection-${id}`
    },
    body: JSON.stringify({
      query: MARK_AS_REJECTED_QUERY,
      variables: {
        id,
        reason,
        comment
      }
    })
  })
  const requestEnd = Date.now()
  const result = await rejectDeclarationRes.json()

  if (result.errors) {
    console.error(JSON.stringify(result.errors, null, 2))
    console.error(JSON.stringify(reason))
    console.error(JSON.stringify(comment))
    throw new Error('Error Occurred while rejecting event')
  }
  const data = result.data

  log(
    'Declaration',
    id,
    'has been rejected by',
    username,
    `(took ${requestEnd - requestStart}ms)`
  )

  return data
}
