# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.
#
# OpenCRVS is also distributed under the terms of the Civil Registration
# & Healthcare Disclaimer located at http://opencrvs.org/license.
#
# Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
set -e

print_usage_and_exit () {
    echo 'Usage: ./run-migrations.sh'
    echo ""
    echo "If your Elasticsearch is password protected, an admin user's credentials can be given as environment variables:"
    echo "ELASTICSEARCH_ADMIN_USER=your_user ELASTICSEARCH_ADMIN_PASSWORD=your_pass"
    exit 1
    exit 1
}

elasticsearch_host() {
  if [ ! -z ${ELASTICSEARCH_ADMIN_USER+x} ] || [ ! -z ${ELASTICSEARCH_ADMIN_PASSWORD+x} ]; then
    echo "$ELASTICSEARCH_ADMIN_USER:$ELASTICSEARCH_ADMIN_PASSWORD@elasticsearch:9200";
  else
    echo "elasticsearch:9200";
  fi
}

# run migration by restarting migration service
docker service update --force --update-parallelism 1 --update-delay 30s opencrvs_migration

# wait for migration service to finish before continuing
while true; do
  # Get current state of the task(s)
  state=$(docker service ps --format "{{.CurrentState}}" opencrvs_migration | head -n1)

  echo "Current state: $state"

  if [[ "$state" == *"Complete"* ]]; then
    echo "Migration finished successfully ✅"
    break
  elif [[ "$state" == *"Failed"* ]] || [[ "$state" == *"Rejected"* ]]; then
    echo "Migration failed ❌"
    exit 1
  fi

  sleep 5
done
