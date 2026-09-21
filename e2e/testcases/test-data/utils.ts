import { v4 as uuidv4 } from 'uuid'
import { GATEWAY_HOST } from '../../constants'
import fs from 'fs'
import path from 'path'

export function getSignatureFile() {
  const buffer = fs.readFileSync(path.join(__dirname, 'signature.png'))
  return new File([buffer], `signature-${Date.now()}.png`, {
    type: 'image/png'
  })
}

export async function uploadFile(file: File, token: string) {
  const formData = new FormData()
  const transactionId = uuidv4()
  formData.append('file', file)
  formData.append('transactionId', transactionId)

  const url = new URL('/upload', GATEWAY_HOST)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  })

  if (!res.ok) {
    throw new Error(`Failed to upload file: ${res.statusText}`)
  }

  return {
    path: await res.text(),
    originalFilename: file.name,
    type: file.type
  }
}
