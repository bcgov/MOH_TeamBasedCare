variable "project_code" {}

variable "target_aws_account_id" {}

variable "api_artifact" {}
variable "app_sources" {}
variable "target_env" {}
variable "domain" {}
variable "app_sources_bucket" {}
variable "api_sources_bucket" {}

variable "function_memory_mb" {
  default = "2048"
}

variable "db_username" {}

variable "azs" {
  default = ["ca-central-1a", "ca-central-1b"]
}

variable "region" {
  default = "ca-central-1"
}

variable "build_id" {}

variable "build_info" {}

variable "managed_policies" {
  default = [
    "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
  ]
}
variable "instance_type" {
  default = "t2.small"
}

variable "root_block_device" {
  default = {
    type = "gp2",
    size = "10"
  }
}

# Keycloak Variables
variable "keycloak_auth_server_uri" {}
variable "keycloak_response_type" {}
variable "keycloak_client_id" {}
variable "keycloak_realm" {}
variable "keycloak_confidential_port" {}
variable "keycloak_ssl_required" {}
variable "keycloak_resource" {}
variable "keycloak_redirect_uri" {}
variable "keycloak_user_info_uri" {}
variable "keycloak_token_uri" {}
variable "keycloak_logout_uri" {}
