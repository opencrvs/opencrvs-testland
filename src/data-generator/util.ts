import { get, set } from 'lodash'

export function log(...params: Parameters<typeof console.log>) {
  console.log(new Date().toISOString(), ...params)
}
export function getRandomInt(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function getRandomFromBrackets(
  completionBrackets: { range: number[]; weight: number }[]
) {
  const completion = Math.random()
  const index = completionBrackets.find((_val, index) => {
    const total = completionBrackets
      .slice(0, index + 1)
      .reduce((m, n) => m + n.weight, 0)
    return total > completion
  })!

  const completionDays = getRandomInt(index.range[0], index.range[1])
  return completionDays
}

// Utility function for adding concurrency for async for loops
export function createConcurrentBuffer(concurrency: number) {
  const currentPromises: Array<Promise<void>> = []

  return <T>(
    handler: (...props: T[]) => Promise<void>,
    ...variablesToBind: T[]
  ) => {
    const prom = handler(...variablesToBind).catch((err) => log(err))
    currentPromises.push(prom)

    prom.finally(() => currentPromises.splice(currentPromises.indexOf(prom), 1))

    if (currentPromises.length < concurrency) {
      return Promise.resolve()
    }

    return Promise.race(currentPromises)
  }
}

export function nullsToEmptyString(object: any) {
  for (const key of Object.keys(object)) {
    const value = object[key]
    if (value === null) {
      object[key] = ''
      continue
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      nullsToEmptyString(value)
      continue
    }
    if (Array.isArray(value)) {
      value.forEach(nullsToEmptyString)
    }
  }
}

export type RecursiveRequired<T> = Required<{
  [P in keyof T]: IfAny<T[P], T[P], Exclude<RecursiveRequired<T[P]>, null>>
}>

type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N

type ReplaceIdWithFHIRId<T> = T extends { id: string }
  ? Omit<T, 'id'> & { _fhirID: string }
  : T

type ReplaceIdKeysWithFHIRId<
  T extends Record<string, any>,
  T2 = { [P in keyof T]: ReplaceIdKeysWithFHIRId<ReplaceIdWithFHIRId<T[P]>> }
> = IfAny<T, T, T2>

export function idsToFHIRIds<T extends Record<string, any>>(
  target: T,
  keys: ReadonlyArray<string>
): ReplaceIdKeysWithFHIRId<T> {
  return keys.reduce((memo, key) => {
    const value = get(memo, key)

    if (value === undefined) {
      return memo
    }

    const fhirKey = key.split('.').slice(0, -1).concat('_fhirID').join('.')
    return set(set(memo, fhirKey, value), key, undefined)
  }, target) as ReplaceIdKeysWithFHIRId<T>
}

function isObject(value: any) {
  return typeof value === 'object' && !Array.isArray(value) && value !== null
}

export function removeEmptyFields<T extends Record<string, any>>(object: T): T {
  return Object.fromEntries(
    Object.entries(object)
      .filter(([, value]) => value !== null)
      .map(([key, value]) => [
        key,
        isObject(value) ? removeEmptyFields(value) : value
      ])
  ) as T
}
