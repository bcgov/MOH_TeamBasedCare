terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "3.49.0"
    }
  }

  backend "remote" {
    required_version = "0.14.7"
  }
}

provider "aws" {
  region = var.region
  assume_role {
    role_arn = "arn:aws:iam::${var.target_aws_account_id}:role/BCGOV_${var.target_env}_Automation_Admin_Role"
  }
}

# Cloudfront Functions and ACM certificate resources
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"

  assume_role {
    role_arn = "arn:aws:iam::${var.target_aws_account_id}:role/BCGOV_${var.target_env}_Automation_Admin_Role"
  }
}

locals {
  namespace = "${var.project_code}-${var.target_env}"
  app_name  = "${local.namespace}-app"
  api_name  = "${local.namespace}-api"
  syncdata_lambda_name  = "${local.namespace}-syncdata"
  sync_master_data_scheduler  = "${local.namespace}-hmbc-to-ien-masters"
  sync_applicant_data_scheduler  = "${local.namespace}-hmbc-to-ien-applicants"
  notify_lambda_name  = "${local.namespace}-notifylambda"

  db_name = "${local.namespace}-db"

  has_domain = var.domain != ""
  fw_domain  = length(regexall("freshworks", var.domain)) > 0
}
