set -e

# Sometimes scenarios can be passed in scenario-name/test format but we only need scenario here
ARCHIVE_PATH=$1
OPENCRVS_CORE_PATH=$2
# COUNTRY_CONFIG_PATH=$3
DIR=$(pwd)
# # this function takes in a directory name and traverses from current
# # directory all to way to file system root while always checking if the directory exists
# # if it does, it returns the absolute path to the directory
# # if it doesn't, it returns an empty string

find_directory () {
  local directory=$1
  local current_directory=$(pwd)
  local absolute_path=""

  while [ "$current_directory" != "/" ]; do
    if [ -d "$current_directory/$directory" ]; then
      absolute_path="$current_directory/$directory"
      break
    fi

    current_directory=$(dirname "$current_directory")
  done

  echo "$absolute_path"
}

print_usage_and_exit () {
  echo "Usage: $0 <path to backup>"
  exit 1
}

if [ -z "$ARCHIVE_PATH" ]; then
  print_usage_and_exit
fi

if [ -z "$OPENCRVS_CORE_PATH" ]; then
  EXISTING_OPENCRVS_CORE_PATH=$(find_directory opencrvs-core)
  if [ -d "$EXISTING_OPENCRVS_CORE_PATH" ]; then
    OPENCRVS_CORE_PATH=$EXISTING_OPENCRVS_CORE_PATH
    echo "Automatically detected opencrvs-core at $EXISTING_OPENCRVS_CORE_PATH"
  else
    print_usage_and_exit
  fi
fi

echo "Restoring backup '$ARCHIVE_PATH'"


for BACKUP_DIR in $OPENCRVS_CORE_PATH/data/backups/*; do
  if [ -d "$BACKUP_DIR" ]; then
    rm -rf $BACKUP_DIR/*
  fi
done

cat $ARCHIVE_PATH | tar -xzf - -C $OPENCRVS_CORE_PATH/data/backups

# Automatically detect the label
LABEL=$(ls -t $OPENCRVS_CORE_PATH/data/backups/minio | grep -E '^ocrvs-.*\.tar\.gz$' | head -n 1 | sed -E 's/^ocrvs-(.*)\.tar\.gz$/\1/')

yes | bash $DIR/infrastructure/backups/restore.sh --label=$LABEL --replicas=1
