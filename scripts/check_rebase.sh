#!/bin/bash

git fetch --all

DIFF=$(git log --oneline --cherry build...origin/main | wc -l)

if [[ $DIFF = 0 ]]; then
    echo "All Good!"
else
    echo "Rebase before tagging!"
    echo "git pull origin main --rebase"
fi
