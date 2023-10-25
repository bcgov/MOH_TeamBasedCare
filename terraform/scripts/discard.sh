#!/bin/bash

set -e

TOKEN=${1?"Enter TFC Token !"}
RUN=${2?"Enter Run ID !"}

curl -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/vnd.api+json" \
    -X POST \
    https://app.terraform.io/api/v2/runs/$RUN/actions/discard
