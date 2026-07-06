
#!/bin/bash
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
    echo 'Usage: ./clear-all-data.sh REPLICAS'
    echo ""
    echo "If your MongoDB is password protected, an admin user's credentials can be given as environment variables:"
    echo "MONGODB_ADMIN_USER=your_user MONGODB_ADMIN_PASSWORD=your_pass"
    echo ""
    echo "If your Elasticsearch is password protected, an admin user's credentials can be given as environment variables:"
    echo "ELASTICSEARCH_ADMIN_USER=your_user ELASTICSEARCH_ADMIN_PASSWORD=your_pass"
    echo ""
    echo "Postgres admin user credentials must be given as environment variables:"
    echo "POSTGRES_USER=your_user POSTGRES_PASSWORD=your_pass"
    exit 1
}

if [ -z "${POSTGRES_USER:-}" ]; then
    echo 'Error: POSTGRES_USER environment variable must be set.'
    print_usage_and_exit
fi

if [ -z "${POSTGRES_PASSWORD:-}" ]; then
    echo 'Error: POSTGRES_PASSWORD environment variable must be set.'
    print_usage_and_exit
fi

if [ -z "$1" ] ; then
    echo 'Error: Argument REPLICAS is required in position 1.'
    print_usage_and_exit
fi


REPLICAS=$1
if ! [[ "$REPLICAS" =~ ^[0-9]+$ ]]; then
  echo "Script must be passed a positive integer number of replicas. Got '$REPLICAS'"
  print_usage_and_exit
fi

if [ "$REPLICAS" = "0" ]; then
  HOST=mongo1
  NETWORK=opencrvs_default
  echo "Working with no replicas"
else
  NETWORK=opencrvs_overlay_net
  # Construct the HOST string rs0/mongo1,mongo2... based on the number of replicas
  HOST="rs0/"
  for (( i=1; i<=REPLICAS; i++ )); do
    if [ $i -gt 1 ]; then
      HOST="${HOST},"
    fi
    HOST="${HOST}mongo${i}"
  done
fi

mongo_credentials() {
  if [ ! -z ${MONGODB_ADMIN_USER+x} ] || [ ! -z ${MONGODB_ADMIN_PASSWORD+x} ]; then
    echo "--username $MONGODB_ADMIN_USER --password $MONGODB_ADMIN_PASSWORD --authenticationDatabase admin";
  else
    echo "";
  fi
}

elasticsearch_host() {
  if [ ! -z ${ELASTICSEARCH_ADMIN_USER+x} ] || [ ! -z ${ELASTICSEARCH_ADMIN_PASSWORD+x} ]; then
    echo "$ELASTICSEARCH_ADMIN_USER:$ELASTICSEARCH_ADMIN_PASSWORD@elasticsearch:9200";
  else
    echo "elasticsearch:9200";
  fi
}

drop_database () {
  local database=${1}
  docker run --rm --network=$NETWORK mongo:4.4 mongo $database $(mongo_credentials) --host $HOST --eval "db.dropDatabase()"
}

# Delete all data from mongo
#---------------------------
drop_database hearth-dev;

drop_database events;

drop_database openhim-dev;

drop_database user-mgnt;

drop_database application-config;

drop_database metrics;

drop_database performance;

# Delete all data from elasticsearch
#-----------------------------------
indices=$(docker run --rm --network=$NETWORK appropriate/curl curl -sS -XGET "http://$(elasticsearch_host)/_cat/indices?h=index")
echo "--------------------------"
echo "🧹 cleanup for indices from $(elasticsearch_host): $indices"
echo "--------------------------"
for index in ${indices[@]}; do
  echo "Removing index $index"
  docker run --rm --network=$NETWORK appropriate/curl curl -sS -XDELETE "http://$(elasticsearch_host)/$index"
done

# Delete all data from minio
#-----------------------------
docker run --rm --network=$NETWORK --entrypoint=/bin/sh minio/mc:RELEASE.2025-05-21T01-59-54Z -c "\
  mc alias set myminio http://minio:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD && \
  mc rm --recursive --force myminio/ocrvs && \
  mc rb myminio/ocrvs && \
  mc mb myminio/ocrvs"

# Delete all data from PostgreSQL
#-------------------------------

POSTGRES_DB="events"
ANALYTICS_POSTGRES_DB="analytics"
EVENTS_MIGRATOR_ROLE="events_migrator"
EVENTS_APP_ROLE="events_app"
ANALYTICS_POSTGRES_ROLE=${ANALYTICS_POSTGRES_USER:-"events_analytics"}

echo "🔁 Dropping database '${POSTGRES_DB}' and roles..."

docker run --rm --network=$NETWORK  \
  -e PGPASSWORD="${POSTGRES_PASSWORD}" \
  -e POSTGRES_USER="${POSTGRES_USER}" \
  -e POSTGRES_DB="${POSTGRES_DB}" \
  -e EVENTS_MIGRATOR_ROLE="${EVENTS_MIGRATOR_ROLE}" \
  -e EVENTS_APP_ROLE="${EVENTS_APP_ROLE}" \
  -e ANALYTICS_POSTGRES_ROLE="${ANALYTICS_POSTGRES_ROLE}" \
  -e ANALYTICS_POSTGRES_DB="${ANALYTICS_POSTGRES_DB}" \
  postgres:17.6 bash -c '
psql -h postgres -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 <<EOF
DROP DATABASE IF EXISTS "$POSTGRES_DB" WITH (FORCE);
DROP DATABASE IF EXISTS "$ANALYTICS_POSTGRES_DB" WITH (FORCE);

DROP ROLE IF EXISTS "$EVENTS_MIGRATOR_ROLE";
DROP ROLE IF EXISTS "$EVENTS_APP_ROLE";
DROP ROLE IF EXISTS "$ANALYTICS_POSTGRES_ROLE";
EOF
'
echo "✅ Database and roles dropped."
echo "🚀 Reinitializing Postgres with on-deploy.sh..."

docker service update --force opencrvs_postgres-on-update

echo "✅ All data cleared."
