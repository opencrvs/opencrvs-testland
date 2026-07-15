#!/bin/bash

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
# This cron job is already configured in the Ansible playbook.yml in the infrastructure > server-setup directory.
# Change SSH connection settings and IPs to suit your deployment, and re-run the Ansible script to update.
# A label string i.e. 'v1.0.1' can also be provided to the script to be appended to the filenames
#------------------------------------------------------------------------------------------------------------------
set -e

WORKING_DIR=$(pwd)

if docker service ls > /dev/null 2>&1; then
  IS_LOCAL=false
else
  IS_LOCAL=true
fi

# Reading Named parameters
for i in "$@"; do
  case $i in
  --ssh_user=*)
    SSH_USER="${i#*=}"
    shift
    ;;
  --ssh_host=*)
    SSH_HOST="${i#*=}"
    shift
    ;;
  --ssh_port=*)
    SSH_PORT="${i#*=}"
    shift
    ;;
  --remote_dir=*)
    REMOTE_DIR="${i#*=}"
    shift
    ;;
  --label=*)
    LABEL="${i#*=}"
    shift
    ;;
  --passphrase=*)
    PASSPHRASE="${i#*=}"
    shift
    ;;
  *) ;;
  esac
done

print_usage_and_exit() {
  echo 'Usage: ./backup.sh --passphrase=XXX --ssh_user=XXX --ssh_host=XXX --ssh_port=XXX --remote_dir=XXX --label=XXX'
  echo "Script must receive SSH details and a target directory of a remote server to copy backup files to."
  echo "Optionally a LABEL i.e. 'v1.0.1' can be provided to be appended to the backup file labels"
  echo "7 days of backup data will be retained in the manager node"
  echo ""
  echo "If your Elasticsearch is password protected, an admin user's credentials can be given as environment variables:"
  echo "ELASTICSEARCH_ADMIN_USER=your_user ELASTICSEARCH_ADMIN_PASSWORD=your_pass"
  exit 1
}

if [ "$IS_LOCAL" = false ]; then
  ROOT_PATH=${ROOT_PATH:-/data}
  if [ -z "$SSH_USER" ]; then
    echo "Error: Argument for the --ssh_user is required."
    print_usage_and_exit
  fi
  if [ -z "$SSH_HOST" ]; then
    echo "Error: Argument for the --ssh_host is required."
    print_usage_and_exit
  fi
  if [ -z "$SSH_PORT" ]; then
    echo "Error: Argument for the --ssh_port is required."
    print_usage_and_exit
  fi
  if [ -z "$REMOTE_DIR" ]; then
    echo "Error: Argument for the --remote_dir is required."
    print_usage_and_exit
  fi
  if [ -z "$PASSPHRASE" ]; then
    echo "Error: Argument for the --passphrase is required."
    print_usage_and_exit
  fi
  # In this example, we load the ELASTICSEARCH_ADMIN_USER & ELASTICSEARCH_ADMIN_PASSWORD database access secrets from a file.
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

# Find and remove all empty subdirectories under the top-level directories
for BACKUP_DIR in $ROOT_PATH/backups/*; do
  if [ -d "$BACKUP_DIR" ]; then
    rm -rf $BACKUP_DIR/*
  fi
done

mkdir -p $ROOT_PATH/backups/minio
mkdir -p $ROOT_PATH/backups/vsexport
mkdir -p $ROOT_PATH/backups/sqlite
mkdir -p $ROOT_PATH/backups/postgres

# This enables root-created directory to be writable by the docker user
chown -R 1000:1000 $ROOT_PATH/backups

# Select docker network in production
#----------------------------------------------------
if [ "$IS_LOCAL" = true ]; then
  NETWORK=opencrvs_default
  echo "Working in a local environment"
else
  NETWORK=opencrvs_overlay_net
fi

# Today's date is used for filenames if LABEL is not provided
#-----------------------------------
BACKUP_DATE=$(date +%Y-%m-%d)
REMOTE_DIR="$REMOTE_DIR/${LABEL:-$BACKUP_DATE}"

# Backup PostgreSQL
# -----------------

echo "Backing up PostgreSQL 'events' database"
docker run --rm \
  -e PGPASSWORD=$POSTGRES_PASSWORD \
  -v $ROOT_PATH/backups/postgres:/backups \
  --network=$NETWORK \
  postgres:17 \
  bash -c "pg_dump -h postgres -U $POSTGRES_USER -d events -F c -f /backups/events-${LABEL:-$BACKUP_DATE}.dump"

# Backup SQLite
# ---------------------------------------------------------------------------------------------
echo "Creating a backup for SQLite"

docker run --rm \
  -v $ROOT_PATH/sqlite:/data/sqlite \
  -v $ROOT_PATH/backups/sqlite:/data/backup \
  alpine sh -c "apk add --no-cache sqlite && \
  sqlite3 /data/sqlite/mosip-api.db \".backup '/data/backup/mosip-api-${LABEL:-$BACKUP_DATE}.sqlite'\""


#-------------------------------------------------------------------------------------

echo ""
echo "Delete all currently existing snapshots"
echo ""
# Get list of snapshots as a simple array
snapshots=$(docker run --rm --network="$NETWORK" appropriate/curl \
  -s "http://$(elasticsearch_host)/_snapshot/ocrvs/_all" | jq -r '.snapshots[].snapshot' || true)
echo "Found snapshots:"
echo "$snapshots" | sed 's/^/ - /'

for snap in $snapshots; do
  echo "Deleting snapshot: $snap"
  docker run --rm --network="$NETWORK" appropriate/curl \
    -s -X DELETE -H "Content-Type: application/json;charset=UTF-8" \
    "http://$(elasticsearch_host)/_snapshot/ocrvs/${snap}?wait_for_completion=true&pretty"
done
docker run --rm --network=$NETWORK appropriate/curl curl -sS -X DELETE -H "Content-Type: application/json;charset=UTF-8" "http://$(elasticsearch_host)/_snapshot/ocrvs"
echo "Waiting for snapshots to be removed"
sleep 30
#-------------------------------------------------------------------------------------
echo ""
echo "Register backup folder as an Elasticsearch repository for backing up the search data"
echo ""

create_elasticsearch_snapshot_repository() {
  OUTPUT=$(docker run --rm --network=$NETWORK appropriate/curl curl -sS -X PUT -H "Content-Type: application/json;charset=UTF-8" "http://$(elasticsearch_host)/_snapshot/ocrvs" -d '{ "type": "fs", "settings": { "location": "/data/backups/elasticsearch", "compress": true }}' 2>/dev/null)
  while [ "$OUTPUT" != '{"acknowledged":true}' ]; do
    echo "Failed to register backup folder as an Elasticsearch repository. Trying again in..."
    sleep 1
    create_elasticsearch_snapshot_repository
  done
}

create_elasticsearch_snapshot_repository

#---------------------------------------------------------------------------------

echo ""
echo "Backup Elasticsearch as a set of snapshot files into an elasticsearch sub folder"
echo ""

create_elasticsearch_backup() {
  indices=$(get_target_indices)
  echo "List indices for backup: $indices"
  OUTPUT=""
  json_payload="{\"indices\": \"${indices}\"}"
  OUTPUT=$(docker run --rm --network=$NETWORK appropriate/curl curl -sS -X PUT -H "Content-Type: application/json;charset=UTF-8" "http://$(elasticsearch_host)/_snapshot/ocrvs/snapshot_${LABEL:-$BACKUP_DATE}?wait_for_completion=true&pretty" -d "$json_payload" 2>/dev/null) || true

  if echo $OUTPUT | jq -e '.snapshot.state == "SUCCESS"' > /dev/null; then
    echo "Snapshot state is SUCCESS"
  else
    echo $OUTPUT
    echo "Failed to backup Elasticsearch. Trying again in..."
    create_elasticsearch_backup
  fi
}

create_elasticsearch_backup

echo "Creating a backup for Minio"

LOCAL_MINIO_BACKUP=$ROOT_PATH/backups/minio/ocrvs-${LABEL:-$BACKUP_DATE}.tar.gz
cd $ROOT_PATH/minio && tar -zcvf $LOCAL_MINIO_BACKUP . && cd /

echo "Creating a backup for VSExport"

LOCAL_VSEXPORT_BACKUP=$ROOT_PATH/backups/vsexport/ocrvs-${LABEL:-$BACKUP_DATE}.tar.gz
cd $ROOT_PATH/vsexport && tar -zcvf $LOCAL_VSEXPORT_BACKUP . && cd /

if [[ "$IS_LOCAL" = true ]]; then
  echo $WORKING_DIR
  cd $ROOT_PATH/backups && tar -zcvf $WORKING_DIR/ocrvs-${LABEL:-$BACKUP_DATE}.tar.gz .
  exit 0
fi

# Copy the backups to an offsite server in production
#----------------------------------------------------

# Create a temporary directory to store the backup files before packaging
BACKUP_RAW_FILES_DIR=/tmp/backup-${LABEL:-$BACKUP_DATE}/
mkdir -p $BACKUP_RAW_FILES_DIR

# Copy full directories to the temporary directory
mkdir -p $BACKUP_RAW_FILES_DIR/minio/ && cp $ROOT_PATH/backups/minio/ocrvs-${LABEL:-$BACKUP_DATE}.tar.gz $BACKUP_RAW_FILES_DIR/minio/
mkdir -p $BACKUP_RAW_FILES_DIR/vsexport/ && cp $ROOT_PATH/backups/vsexport/ocrvs-${LABEL:-$BACKUP_DATE}.tar.gz $BACKUP_RAW_FILES_DIR/vsexport/
mkdir -p $BACKUP_RAW_FILES_DIR/postgres/ && cp $ROOT_PATH/backups/postgres/events-${LABEL:-$BACKUP_DATE}.dump $BACKUP_RAW_FILES_DIR/postgres/

tar -czf /tmp/${LABEL:-$BACKUP_DATE}.tar.gz -C "$BACKUP_RAW_FILES_DIR" .

openssl enc -aes-256-cbc -salt -pbkdf2 -in /tmp/${LABEL:-$BACKUP_DATE}.tar.gz -out /tmp/${LABEL:-$BACKUP_DATE}.tar.gz.enc -pass pass:$PASSPHRASE

if [ "$IS_LOCAL" = false ]; then
  set +e
  rsync -a -r --rsync-path="mkdir -p $REMOTE_DIR/ && rsync" --progress --rsh="ssh -o StrictHostKeyChecking=no -p $SSH_PORT" /tmp/${LABEL:-$BACKUP_DATE}.tar.gz.enc $SSH_USER@$SSH_HOST:$REMOTE_DIR/
  if [ $? -eq 0 ]; then
    echo "Copied backup files to remote server."
  fi
  set -e
fi

rm /tmp/${LABEL:-$BACKUP_DATE}.tar.gz.enc
rm /tmp/${LABEL:-$BACKUP_DATE}.tar.gz
rm -r $BACKUP_RAW_FILES_DIR
