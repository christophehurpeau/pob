#!/bin/bash

[[ -z $(git status --porcelain) ]] || (echo "Git working directory not clean."; exit 1)
