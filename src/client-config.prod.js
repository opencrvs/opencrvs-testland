/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
 */

/**
 * When running application in slow network condition (reproducible using 3G), the client-config.js might be loaded twice.
 * This results to issues like `Uncaught SyntaxError: "identifier scheme has already been declared at (client-config.js:1:1")`.
 *
 * On high level, refreshing the browser window requests new document page. The document page includes script tag to load client-config.js.
 * If the network is slow, the browser might start loading and executing client-config.js again before the previous one is torn down, causing the error.
 *
 */
;(function initClientConfig() {
  const scheme = window.location.protocol // "http:" or "https:"
  const hostname = '{{hostname}}' // Replace dynamically if needed
  const minioBucket = '{{minio_bucket}}'
  const minioBaseUrl = '{{minio_base_url}}'

  window.config = {
    API_GATEWAY_URL: `${scheme}//gateway.${hostname}/`,
    CONFIG_API_URL: `${scheme}//config.${hostname}`,
    LOGIN_URL: `${scheme}//login.${hostname}`,
    AUTH_URL: `${scheme}//gateway.${hostname}/auth/`,
    MINIO_URL: `${scheme}//minio.${hostname}/ocrvs/`,
    /** E2E uses single minio for all the different services. @see start-prod.sh.  */
    MINIO_BASE_URL: minioBaseUrl.startsWith('http')
      ? minioBaseUrl
      : // Resolve the protocol on the same level as the other URLs.
        `${scheme}${minioBaseUrl}`, // URL without path/bucket information, used for file uploads, v2
    /** Bucket name is hardcoded as 'ocrvs'. In live system, it cannot be changed without data migration.
     * In E2E environment, buckets are separated from different PR environments to avoid conflicts. @see start-prod.sh
     */
    MINIO_BUCKET: minioBucket,
    COUNTRY_CONFIG_URL: `${scheme}//countryconfig.${hostname}`,
    // Country code in uppercase ALPHA-3 format
    COUNTRY: 'FAR',
    LANGUAGES: 'en,fr',
    DASHBOARDS: [
      {
        id: 'registrations',
        title: {
          id: 'dashboard.registrationsTitle',
          defaultMessage: 'Registrations Dashboard',
          description: 'Menu item for registrations dashboard'
        },
        url: `${scheme}//metabase.${hostname}/public/dashboard/03be04d6-bde0-4fa7-9141-21cea2a7518b#bordered=false&titled=false&refresh=300` // Filled in below
      },
      {
        id: 'completeness',
        title: {
          id: 'dashboard.completenessTitle',
          defaultMessage: 'Completeness Dashboard',
          description: 'Menu item for completeness dashboard'
        },
        url: `${scheme}//metabase.${hostname}/public/dashboard/41940907-8542-4e18-a05d-2408e7e9838a#bordered=false&titled=false&refresh=300`
      },
      {
        id: 'registry',
        title: {
          id: 'dashboard.registryTitle',
          defaultMessage: 'Registry',
          description: 'Menu item for registry dashboard'
        },
        url: `${scheme}//metabase.${hostname}/public/dashboard/dc66b77a-79df-4f68-8fc8-5e5d5a2d7a35#bordered=false&titled=false&refresh=300`
      }
    ],
    FEATURES: {}
  }
})()
