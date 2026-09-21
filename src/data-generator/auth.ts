import fetch from 'node-fetch'
import { AUTH_HOST } from './constants'
import { VERIFICATION_CODE } from './index'
import { User } from './users'

export async function getToken(
  username: string,
  password: string
): Promise<string> {
  const authenticateResponse = await fetch(`${AUTH_HOST}/authenticate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-correlation-id': username + '-' + Date.now()
    },
    body: JSON.stringify({
      username,
      password
    })
  })
  const { nonce, token } = await authenticateResponse.json()

  if (token) {
    return token
  }

  const verifyResponse = await fetch(`${AUTH_HOST}/verifyCode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-correlation-id': username + '-' + Date.now()
    },
    body: JSON.stringify({
      nonce,
      code: VERIFICATION_CODE
    })
  })
  const data = await verifyResponse.json()

  if (!data.token) {
    throw new Error(
      `Failed to get token for user ${username}, password ${password}`
    )
  }

  return data.token
}

export async function getTokenForSystemClient(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const authenticateResponse = await fetch(
    `${AUTH_HOST}/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': clientId + '-' + Date.now()
      }
    }
  )
  const res = await authenticateResponse.json()
  return res.access_token
}

export function readToken(token: string) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
}

export async function updateToken(user: User): Promise<void> {
  if (!user.stillInUse) {
    return
  }
  let token
  try {
    token = user.isSystemUser
      ? await getTokenForSystemClient(user.username, user.password)
      : await getToken(user.username, user.password)
  } catch (error) {
    console.log('Failed to fetch token for user', user.username)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    return updateToken(user)
  }

  user.token = token

  const data = readToken(token)

  setTimeout(() => updateToken(user), data.exp * 1000 - Date.now() - 60000)
}
