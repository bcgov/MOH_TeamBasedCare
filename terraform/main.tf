terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.10.0"
    }
  }

  backend "s3" {
    encrypt = true
  }
}

provider "aws" {
  region = var.region
}

# Cloudfront Functions and ACM certificate resources
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}

locals {
  namespace = "${var.project_code}-${var.target_env}"
  app_name  = "${local.namespace}-app"
  api_name  = "${local.namespace}-api"
  notify_lambda_name  = "${local.namespace}-notifylambda"

  db_name = "${local.namespace}-db"

  has_domain = var.domain != ""
  fw_domain  = length(regexall("freshworks", var.domain)) > 0
}
