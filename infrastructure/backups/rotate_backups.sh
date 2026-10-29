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

print_usage_and_exit() {
  echo 'Usage: ./rotate_backups.sh --backup_dir=/home/backup/backups --amount_to_keep=7'
  exit 1
}

for i in "$@"; do
  case $i in
  --backup_dir=*)
    BACKUP_DIR="${i#*=}"
    shift
    ;;
  --amount_to_keep=*)
    AMOUNT_TO_KEEP="${i#*=}"
    shift
    ;;
  *) ;;
  esac
done


if ! [[ "$AMOUNT_TO_KEEP" =~ ^[0-9]+$ ]]; then
  echo "Script must be passed a positive integer number of backups to keep, got $AMOUNT_TO_KEEP"
  print_usage_and_exit
fi

BACKUP_DIR=${BACKUP_DIR:-/home/backup/backups}

if [ ! -d "$BACKUP_DIR" ]; then
    echo "Error: BACKUP_DIR ($BACKUP_DIR) doesn't exist"
    print_usage_and_exit
fi

# Delete subdirectories but keep latest according to AMOUNT_TO_KEEP
# The "minio" directory is excluded: it holds the differential (rsync) Minio backup, which is a
# continuously updated mirror rather than a dated snapshot, so it must never be rotated/deleted here.
find "$BACKUP_DIR" -mindepth 1 \( -path "$BACKUP_DIR/minio" -prune \) -o -type d -print | sort -r | tail -n +$(("$AMOUNT_TO_KEEP" + 1)) | xargs rm -rf --