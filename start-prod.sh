#!/bin/sh
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.
#
# OpenCRVS is also distributed under the terms of the Civil Registration
# & Healthcare Disclaimer located at http://opencrvs.org/license.
#
# Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.

set -e

sed -i "s/{{hostname}}/$DOMAIN/g" src/client-config.prod.js
sed -i "s/{{hostname}}/$DOMAIN/g" src/login-config.prod.js

DEFAULT_MINIO_BUCKET="ocrvs"
MINIO_BUCKET="${E2E_MINIO_BUCKET:-$DEFAULT_MINIO_BUCKET}"

# '//' is used to indicate a protocol-relative URL. Protocol is resolved at runtime.
DEFAULT_MINIO_BASE_URL="//minio.$DOMAIN"
# E2E environment needs to override the MinIO base URL.
# To keep the configuration experience consistent, all the URL envs are given *with protocol*. This exception is handled in client-config.prod.js.
MINIO_BASE_URL="${E2E_MINIO_BASE_URL:-$DEFAULT_MINIO_BASE_URL}"
# Replace the MinIO bucket placeholder. Only e2e should override this without migration.
sed -i "s/{{minio_bucket}}/$MINIO_BUCKET/g" src/client-config.prod.js
sed -i "s|{{minio_base_url}}|$MINIO_BASE_URL|g" src/client-config.prod.js

yarn start:prod
