# Internationally Educated Nurses 
# Default Environments
-include ./.env

export $(shell sed 's/=.*//' ./.env)

# Project
export PROJECT := tbcm

# Runtime and application Environments specific variable
export ENV_NAME ?= dev
export POSTGRES_USERNAME ?= localdev
# export ENV_NAME ?= test
# export POSTGRES_USERNAME ?= testuser
export POSTGRES_PASSWORD ?= password
export POSTGRES_DATABASE ?= tbcm

# Git
export COMMIT_SHA:=$(shell git rev-parse --short=7 HEAD)
export LAST_COMMIT_MESSAGE:=$(shell git log -1 --oneline --decorate=full --no-color --format="%h, %cn, %f, %D" | sed 's/->/:/')
export GIT_LOCAL_BRANCH:=$(shell git rev-parse --abbrev-ref HEAD)

# TF Token
export TFCTK:=$(shell cat ~/.terraform.d/credentials.tfrc.json | jq -r '.credentials."app.terraform.io".token')

# FE Env Vars
export NEXT_PUBLIC_API_URL ?= /api/v1

# Docker container names
LOCAL_API_CONTAINER_NAME = $(PROJECT)_api

# AWS Environments variables
export AWS_REGION ?= ca-central-1
NAMESPACE = $(PROJECT)-$(ENV_NAME)
APP_SRC_BUCKET = $(NAMESPACE)-app

# Terraform variables
TERRAFORM_DIR = terraform
export BOOTSTRAP_ENV=terraform/bootstrap

ifeq ($(ENV_NAME), prod)
DOMAIN=tbcm.gov.bc.ca
BASTION_INSTANCE_ID = $(BASTION_INSTANCE_ID_PROD)
DB_HOST = $(DB_HOST_PROD)
endif

ifeq ($(ENV_NAME), dev)
NEXT_PUBLIC_API_URL=https://d3qshnmydybt5m.cloudfront.net/api/v1
BASTION_INSTANCE_ID = $(BASTION_INSTANCE_ID_DEV)
DB_HOST = $(DB_HOST_DEV)
endif

ifeq ($(ENV_NAME), test)
NEXT_PUBLIC_API_URL=https://d1xxd26qe80lqw.cloudfront.net/api/v1
BASTION_INSTANCE_ID = $(BASTION_INSTANCE_ID_TEST)
DB_HOST = $(DB_HOST_PROD_TEST)
endif

define TFVARS_DATA
target_env = "$(ENV_NAME)"
project_code = "$(PROJECT)"
api_artifact = "build/api.zip"
app_sources = "build/app"
app_sources_bucket = "$(APP_SRC_BUCKET)"
domain = "$(DOMAIN)"
db_username = "$(POSTGRES_USERNAME)"
build_id = "$(COMMIT_SHA)"
build_info = "$(LAST_COMMIT_MESSAGE)"
region = "$(AWS_REGION)"
endef
export TFVARS_DATA

# Terraform cloud backend config variables
# LZ2 
LZ2_PROJECT = hzy4co

# Terraform Cloud backend config variables
define TF_BACKEND_CFG
workspaces { name = "$(LZ2_PROJECT)-$(ENV_NAME)" }
hostname     = "app.terraform.io"
organization = "bcgov"
endef
export TF_BACKEND_CFG


.PHONY: start-local print-env start-local-db bootstrap bootstrap-terraform

# ===================================
# Aliases 
# ===================================

bootstrap-terraform: print-env bootstrap
build-terraform-artifact: clean-yarn print-env pre-build build-api

# ===================================
# Local Development
# ===================================

build-artifact-local: build-terraform-artifact
	@yarn
clean-yarn: 
	@rm -rf node_modules
	@yarn
print-env:
	@echo "\n**** ENVIRONMENTS ****\n"
	@echo "\nProject: $(PROJECT)"
	@echo "\nNODE_ENV: $(NODE_ENV)"
	@echo "\nNAMESPACE=$(NAMESPACE)"
	@echo
	@echo ./$(TERRAFORM_DIR)/.auto.tfvars:
	@echo "$$TFVARS_DATA"
	@echo
	@echo ./$(TERRAFORM_DIR)/backend.hcl:
	@echo "$$TF_BACKEND_CFG"
	@echo "\n*********************\n"

watch: print-env start-local-db
	@echo "++\n***** Running api + web in local Node server\n++"
	@yarn
	@yarn watch

start-local: print-env start-local-db
	@echo "++\n***** Running api + web in local Node server\n++"
	@yarn 
	@yarn start:local

run-local-db:
	@echo "++\n***** Starting local database\n++"
	@docker-compose up -d db 
	@echo "++\n*****"

stop-local-db:
	@echo "++\n***** Stopping local database\n++"
	@docker stop "$(PROJECT)_db"
	@echo "++\n*****"

docker-build:
	@echo "++\n***** Running docker-compose\n++"
	@docker-compose build
	@echo "++\n*****"

run-local:
	@echo "++\n***** Running docker-compose\n++"
	@yarn
	@docker-compose up --build -d
	@echo "++\n*****"

run-local-server:
	@echo "++\n***** Starting local server\n++"
	@docker-compose up -d api 
	@echo "++\n*****"

run-local-client:
	@echo "++\n***** Starting local client\n++"
	@docker-compose up -d web 
	@echo "++\n*****"

local-client-logs:
	@docker logs $(PROJECT)_web --tail 25 --follow

local-server-logs:
	@docker logs $(PROJECT)_api --tail 25 --follow

local-common-logs:
	@docker logs $(PROJECT)_common --tail 25 --follow

local-db-logs:
	@docker logs $(PROJECT)_db --tail 25 --follow

local-client-workspace:
	@docker exec -it $(PROJECT)_web sh

local-server-workspace:
	@docker exec -it $(PROJECT)_api sh

test-pa11y:
	@make start-test-db
	@yarn build
	@echo "++\n***** Running front end accessibility tests\n++"
	@NODE_ENV=test yarn test:pa11y
	@make stop-test-db
	@echo "++\n*****"

debug-pa11y:
	@echo "++\n***** Running front end accessibility tests\n++"
	@yarn workspace @tbcm/accessibility debug
	@echo "++\n*****"

generate-accessibility-results:
	@echo "++\n***** Generating Github Comment from Test Results\n++"
	@yarn workspace @tbcm/accessibility generate-accessibility-results
	@echo "++\n*****"

# ===================================
# Build application stack
# ===================================

pre-build:
	@echo "++\n***** Pre-build Clean Build Artifact\n++"
	@rm -rf ./terraform/build || true
	@mkdir -p ./terraform/build
	@echo "++\n*****"

build-api:
	@echo "++\n***** Building API for AWS\n++"
	@rm -rf ./apps/api/dist || true
	@echo 'Building api package... \n' 
	@yarn workspace @tbcm/api build
	@echo 'Updating prod dependencies...\n'
	@yarn workspaces focus @tbcm/api --production
	@echo 'Deleting existing build dir...\n'
	@rm -rf ./.build || true
	@echo 'Creating build dir...\n'
	@mkdir -p .build/api
	@echo 'Copy Node modules....\n' && cp -r node_modules .build/api
	@echo 'Unlink local packages...\n' && rm -rf .build/api/node_modules/@tbcm/*
	@echo 'Hardlink local packages...\n' 
	@cp -r ./packages/* .build/api/node_modules/@tbcm/
	@echo 'Copy api ...\n' && cp -r apps/api/dist/* .build/api
	@echo 'Copy api/ormconfig ...\n' && cp -r apps/api/dist/ormconfig.js .build/api
	@echo 'Creating Zip ...\n' && cd .build && zip -r api.zip ./api && cd ..
	@echo 'Copying to terraform build location...\n'
	@cp ./.build/api.zip ./terraform/build/api.zip
	@echo 'Done!\n'
	@echo "++\n****"

build-web:
	@echo "++\n***** Building Web for AWS\n++"
	@yarn workspace @tbcm/web export
	@mv ./apps/web/out ./terraform/build/app
	@echo "++\n*****"

	
# ===================================
# Terraform commands
# ===================================

write-config-tf:
	@echo "$$TFVARS_DATA" > $(TERRAFORM_DIR)/.auto.tfvars
	@echo "$$TF_BACKEND_CFG" > $(TERRAFORM_DIR)/backend.hcl

init: write-config-tf
	# Initializing the terraform environment
	@terraform -chdir=$(TERRAFORM_DIR) init -input=false \
		-reconfigure \
		-backend-config=backend.hcl -upgrade

plan: init
	# Creating all AWS infrastructure.
	@terraform -chdir=$(TERRAFORM_DIR) plan -no-color

apply: init 
	# Creating all AWS infrastructure.
	@terraform -chdir=$(TERRAFORM_DIR) apply -auto-approve -input=false

destroy: init
	@terraform -chdir=$(TERRAFORM_DIR) destroy

runs: 
	./terraform/scripts/runs.sh $(TFCTK) $(ENV_NAME)

# ===================================
# AWS Deployments
# ===================================

sync-app:
	aws s3 sync ./terraform/build/app s3://$(APP_SRC_BUCKET) --delete

deploy-app:
	aws --region $(AWS_REGION) cloudfront create-invalidation --distribution-id $(CLOUDFRONT_ID) --paths "/*"

# Full redirection to /dev/null is required to not leak env variables
deploy-api:
	aws lambda update-function-code --function-name tbcm-$(ENV_NAME)-api --zip-file fileb://./terraform/build/api.zip --region $(AWS_REGION) > /dev/null

deploy-all: sync-app deploy-api
	@echo "Deploying Webapp and API"

backup-db:
	@echo "Creating a database snapshot"
	aws rds create-db-cluster-snapshot --db-cluster-identifier tbcm-$(ENV_NAME)-db --db-cluster-snapshot-identifier  tbcm-$(ENV_NAME)-db-snapshot-$(COMMIT_SHA)

# ===================================
# Tag Based Deployments
# ===================================

pre-tag:
	@./scripts/check_rebase.sh
	
tag-dev:
	@git tag -fa dev -m "Deploy dev: $(git rev-parse --abbrev-ref HEAD)"
	@git push --force origin refs/tags/dev:refs/tags/dev

tag-test:
	@git tag -fa test -m "Deploy test: $(git rev-parse --abbrev-ref HEAD)"
	@git push --force origin refs/tags/test:refs/tags/test

tag-prod:
ifndef version
	@echo "++\n***** ERROR: version not set.\n++"
	@exit 1
else
	@git tag -fa $(version) -m "tbcm release version: $(version)"
	@git push --force origin refs/tags/$(version):refs/tags/$(version)
	@git tag -fa prod -m "Deploy prod: $(version)"
	@git push --force origin refs/tags/prod:refs/tags/prod
endif

tag-sec:
	@git tag -fa security -m "security scans: $(git rev-parse --abbrev-ref HEAD)"
	@git push --force origin refs/tags/security:refs/tags/security

# Typeorm Migrations

migration-generate:
	@docker exec $(LOCAL_API_CONTAINER_NAME) yarn workspace @tbcm/api typeorm migration:generate -n $(name)

migration-revert:
	@docker exec $(LOCAL_API_CONTAINER_NAME) yarn workspace @tbcm/api typeorm migration:revert


# ===================================
# DB Tunneling
# ===================================

open-db-tunnel:
	# Needs exported credentials for a matching LZ2 space
	@echo "Running for ENV_NAME=$(ENV_NAME)\n"
	@echo "Host Instance Id: $(BASTION_INSTANCE_ID) | $(BASTION_INSTANCE_ID_DEV) | $(DOMAIN)\n"
	@echo "DB HOST URL: $(DB_HOST)\n"
	# Checking you have the SSM plugin for the AWS cli installed
	session-manager-plugin
	rm ssh-keypair ssh-keypair.pub || true
	ssh-keygen -t rsa -f ssh-keypair -N ''
	aws ec2-instance-connect send-ssh-public-key --instance-id $(BASTION_INSTANCE_ID) --availability-zone ca-central-1b --instance-os-user ssm-user --ssh-public-key file://ssh-keypair.pub
	ssh -i ssh-keypair ssm-user@$(BASTION_INSTANCE_ID) -L 5454:$(DB_HOST):5432 -o ProxyCommand="aws ssm start-session --target %h --document-name AWS-StartSSHSession --parameters 'portNumber=%p'"
