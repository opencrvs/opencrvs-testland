# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.
#
# OpenCRVS is also distributed under the terms of the Civil Registration
# & Healthcare Disclaimer located at http://opencrvs.org/license.
#
# Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.

#------------------------------------------------------------------------------------------------------------------
# By default OpenCRVS saves a backup of all data on a cron job every day in case of an emergency data loss incident
# This script clears all data and restores a specific day's data.  It is irreversable, so use with caution.
#------------------------------------------------------------------------------------------------------------------

set -e

if docker service ls > /dev/null 2>&1; then
  IS_LOCAL=false
else
  IS_LOCAL=true
fi

# Reading Named parameters
for i in "$@"; do
  case $i in
  --label=*)
    LABEL="${i#*=}"
    shift
    ;;
  *) ;;
  esac
done

print_usage_and_exit() {
  echo 'Usage: ./restore.sh'
  echo "This script CLEARS ALL DATA and RESTORES A SPECIFIC DAY'S or label's data. This process is irreversible, so USE WITH CAUTION."
  echo "Script must receive a label parameter to restore data from that specific day in format +%Y-%m-%d i.e. 2019-01-01 or that label"
  exit 1
}

if [ -z "$LABEL" ]; then
  LABEL=$(date +%Y-%m-%d)
fi

if [ "$IS_LOCAL" = false ]; then
  ROOT_PATH=${ROOT_PATH:-/data}

  if [ -z "$REPLICAS" ]; then
    echo "Error: Argument for the --replicas is required."
    print_usage_and_exit
  fi
  # We recommend that the secrets are served via a secure API from a Hardware Security Module
  source /data/secrets/opencrvs.secrets
else
  ROOT_PATH=${ROOT_PATH:-../opencrvs-core/data}

  if [ ! -d "$ROOT_PATH" ]; then
    echo "Error: ROOT_PATH ($ROOT_PATH) doesn't exist"
    print_usage_and_exit
  fi

  ROOT_PATH=$(cd "$ROOT_PATH" && pwd)
fi

# Select docker network in production
#----------------------------------------------------
if [ "$IS_LOCAL" = true ]; then
  NETWORK=opencrvs_default
  echo "Working in local environment"
else
  NETWORK=opencrvs_overlay_net
fi


#####
#
#
#
# CLEAR ALL DATA
#
#
#
#####


##
# ------ MINIO -------
##


rm -rf $ROOT_PATH/minio/ocrvs
mkdir -p $ROOT_PATH/minio/ocrvs

##
# ------ VSEXPORTS -------
##

rm -rf $ROOT_PATH/vsexport
mkdir -p $ROOT_PATH/vsexport

##
# ------ POSTGRESQL -------
##

# Check if PostgreSQL backup exists before dropping database
if [ -f "$ROOT_PATH/backups/postgres/events-${LABEL}.dump" ]; then
  echo "PostgreSQL backup found. Dropping existing events database..."
  docker run --rm \
    -e PGPASSWORD=$POSTGRES_PASSWORD \
    --network=$NETWORK \
    postgres:17.6 \
    bash -c "psql -h postgres -U $POSTGRES_USER -c 'DROP DATABASE IF EXISTS events WITH (FORCE);'"
else
  echo "PostgreSQL backup not found for label ${LABEL}. Skipping PostgreSQL database drop..."
fi

#####
#
#
#
# RESTORE FROM BACKUP
#
#
#
#####

##
# ------ POSTGRESQL -------
##

# Check if PostgreSQL backup exists before restoring
if [ -f "$ROOT_PATH/backups/postgres/events-${LABEL}.dump" ]; then
  echo "PostgreSQL backup found. Restoring PostgreSQL 'events' database..."
  docker run --rm \
    -e PGPASSWORD=$POSTGRES_PASSWORD \
    -v $ROOT_PATH/backups/postgres:/backups \
    --network=$NETWORK \
    postgres:17.6 \
    bash -c "createdb -h postgres -U $POSTGRES_USER events && \
             psql -h postgres -U $POSTGRES_USER -d events -c 'CREATE SCHEMA app AUTHORIZATION events_migrator; GRANT USAGE ON SCHEMA app TO events_app;' && \
             pg_restore -h postgres -U $POSTGRES_USER -d events --schema=app /backups/events-${LABEL}.dump"
  echo "Update credentials in Postgres on restore"
  docker service update --force opencrvs_postgres-on-update
else
  echo "PostgreSQL backup not found for label ${LABEL}. Skipping PostgreSQL database restore..."
fi

##
# ------ MINIO -----
##
tar -xzvf $ROOT_PATH/backups/minio/ocrvs-$LABEL.tar.gz -C $ROOT_PATH/minio

# Restart minio again so it picks up the updated files
docker service update --force opencrvs_minio

##
# ------ VSEXPORT -----
##
tar -xzvf $ROOT_PATH/backups/vsexport/ocrvs-$LABEL.tar.gz -C $ROOT_PATH/vsexport

# Run migrations by restarting migration service
if [ "$IS_LOCAL" = false ]; then
  docker service update --force --update-parallelism 1 opencrvs_migration
fi

##
# ------ REINDEX -----
##
docker run --rm \
  -v /opt/opencrvs/infrastructure/deployment:/workspace \
  -w /workspace \
  --network $NETWORK \
  -e 'AUTH_URL=http://auth:4040/' \
  -e 'EVENTS_URL=http://events:5555/' \
  alpine \
  sh -c 'apk add --no-cache curl jq && sh reindex.sh'
