#!/bin/sh

[[ -z $(git status --porcelain) ]] || (echo "Git working directory not clean."; exit 1)
