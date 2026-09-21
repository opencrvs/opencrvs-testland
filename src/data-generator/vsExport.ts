import fetch from 'node-fetch'
import { URL } from 'url'
import { METRICS_API_HOST } from './constants'
import { format, isSameDay, startOfMonth } from 'date-fns'
import { log } from './util'

export async function callVSExportAPIToGenerateDeclarationData(
  submissionDate: Date
) {
  const formattedDate = format(submissionDate, 'yyyy-MM-dd')
  const vsExportURL = new URL('vsExport', METRICS_API_HOST)
  vsExportURL.searchParams.set('startDate', formattedDate)
  vsExportURL.searchParams.set('endDate', formattedDate)
  vsExportURL.searchParams.append('isScheduler', 'true')
  if (isSameDay(submissionDate, startOfMonth(submissionDate))) {
    vsExportURL.searchParams.append('isScheduler', 'false')
  }
  log('Calling vsExport URL :: ', vsExportURL.href)
  try {
    const vsExportRes = await fetch(vsExportURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const res = await vsExportRes.json()
    log(res.message)
    return res
  } catch (error) {
    log(`Error occurred while generating VSExport`, error)
    throw error
  }
}
