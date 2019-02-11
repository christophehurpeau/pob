#!/bin/bash

set -e
# Any subsequent(*) commands which fail will cause the shell script to exit immediately

yarn --prefer-offline
yarn run yarn-deduplicate
yarn --prefer-offline
