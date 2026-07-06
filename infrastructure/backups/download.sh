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
# This script downloads all the data based on --label (defaults to current day)
#------------------------------------------------------------------------------------------------------------------

set -e

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
  --label=*)
    LABEL="${i#*=}"
    shift
    ;;
  --passphrase=*)
    PASSPHRASE="${i#*=}"
    shift
    ;;
  --remote_dir=*)
    REMOTE_DIR="${i#*=}"
    shift
    ;;
  *) ;;
  esac
done

print_usage_and_exit() {
  echo 'Usage: ./download.sh --passphrase=XXX --ssh_user=XXX --ssh_host=XXX --ssh_port=XXX --remote_dir=XXX'
  exit 1
}

if [ -z "$LABEL" ]; then
  LABEL=$(date +%Y-%m-%d)
fi

if [ -z "$SSH_USER" ] ; then
  echo 'Error: Missing environment variable SSH_USER.'
  exit 1
fi

if [ -z "$SSH_HOST" ] ; then
    echo 'Error: Missing environment variable SSH_HOST.'
    exit 1
fi

if [ -z "$SSH_PORT" ] ; then
    echo 'Error: Missing environment variable SSH_PORT.'
    exit 1
fi

if [ -z "$REMOTE_DIR" ]; then
  echo "Error: Argument for the --remote_dir is required."
  print_usage_and_exit
fi

# Copy & decrypt backup files
#-------------------------------------------

# Create a temporary directory to store the backup files before decrypting
BACKUP_RAW_FILES_DIR=/tmp/backup-$LABEL
REMOTE_DIR_WITH_DATE="$REMOTE_DIR/${LABEL:-$BACKUP_DATE}"

mkdir -p $BACKUP_RAW_FILES_DIR

# Copy backup from backup server
rsync -a -r --delete --progress --rsh="ssh -o StrictHostKeyChecking=no -p $SSH_PORT" \
  $SSH_USER@$SSH_HOST:$REMOTE_DIR_WITH_DATE/${LABEL}.tar.gz.enc\
  $BACKUP_RAW_FILES_DIR/${LABEL}.tar.gz.enc

echo "Copied backup files from server to $BACKUP_RAW_FILES_DIR/${LABEL}.tar.gz.enc."

# Decrypt
openssl enc -d -aes-256-cbc -salt -pbkdf2 -in $BACKUP_RAW_FILES_DIR/${LABEL}.tar.gz.enc --out $BACKUP_RAW_FILES_DIR/${LABEL}.tar.gz -pass pass:$PASSPHRASE

# Extract
mkdir -p $BACKUP_RAW_FILES_DIR/extract
tar -xvf $BACKUP_RAW_FILES_DIR/${LABEL}.tar.gz -C $BACKUP_RAW_FILES_DIR/extract

# Delete previous days restore(s) and move the newly downloaded one in place
for BACKUP_DIR in /data/backups/*; do
  if [ -d "$BACKUP_DIR" ]; then
    rm -rf $BACKUP_DIR/*
  fi
done


mv $BACKUP_RAW_FILES_DIR/extract/elasticsearch/* /data/backups/elasticsearch/

mv $BACKUP_RAW_FILES_DIR/extract/minio/ocrvs-${LABEL}.tar.gz /data/backups/minio/
mv $BACKUP_RAW_FILES_DIR/extract/vsexport/ocrvs-${LABEL}.tar.gz /data/backups/vsexport/
mv $BACKUP_RAW_FILES_DIR/extract/mongo/* /data/backups/mongo/
mv $BACKUP_RAW_FILES_DIR/extract/postgres/* /data/backups/postgres/

# Clean up
rm $BACKUP_RAW_FILES_DIR/${LABEL}.tar.gz.enc
rm $BACKUP_RAW_FILES_DIR/${LABEL}.tar.gz
rm -r $BACKUP_RAW_FILES_DIR
echo "Done"