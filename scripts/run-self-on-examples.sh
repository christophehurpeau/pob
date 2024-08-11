#!/usr/bin/env sh

# exit on error
set -e

# get list of changed files in git
changed_files=$(git diff --name-only HEAD)

yarn build

for example in pob-examples/*; do
  echo "Running pob on $example"
  cd $example
  ../../packages/pob/lib/pob.js update --force || exit 1
  cd ../..
done

# get new changed files, if there are new, exit with error
new_changed_files=$(git diff --name-only HEAD)
if [ "$changed_files" != "$new_changed_files" ]; then
  echo "There are new changes in the examples, please check and commit them if needed"
  exit 1
fi

