resource "aws_kms_key" "api_kms_key" {}

resource "aws_s3_bucket" "api" {
  bucket = var.api_sources_bucket
  acl    = "private"
  versioning {
    enabled = true
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.api_kms_key.arn
        sse_algorithm = "aws:kms"
      }
    }
  }
}

resource "aws_s3_bucket_object" "api_lambda" {
  bucket = aws_s3_bucket.api.bucket
  key    = "api-lambda-s3"
  source = "./build/empty_lambda.zip"
}

resource "aws_s3_bucket_policy" "api_s3_policy_deny_http" {
  bucket = aws_s3_bucket.api.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Sid = "IPAllow"
      Effect = "Deny"
      Principal = "*"
      Action = "s3:*"
      Resource = [ "${aws_s3_bucket.api.arn}/*" ]
      Condition = {
        Bool = {
          "aws:SecureTransport" = "false"
        }
      }
    }]
  })
}

resource "aws_lambda_function" "api" {
  description      = "API for ${local.namespace}"
  function_name    = local.api_name
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs16.x"
  handler          = "api/lambda.handler" # TODO update 
  memory_size      = var.function_memory_mb
  timeout          = 900

  source_code_hash = aws_s3_bucket_object.api_lambda.etag
  s3_bucket        = aws_s3_bucket.api.bucket
  s3_key           = aws_s3_bucket_object.api_lambda.key

  vpc_config {
    security_group_ids = [data.aws_security_group.app.id]
    subnet_ids         = data.aws_subnet_ids.app.ids
  }

  lifecycle {
    ignore_changes = [
      # Ignore changes to tags, e.g. because a management agent
      # updates these based on some ruleset managed elsewhere.
      filename,
      source_code_hash,
      source_code_size,
      last_modified,
    ]
  }

  environment {
    variables = {
      NODE_ENV          = "production"
      RUNTIME_ENV       = "hosted"
      TARGET_ENV        = var.target_env
      AWS_S3_REGION     = var.region
      BUILD_ID          = var.build_id
      BUILD_INFO        = var.build_info
      POSTGRES_USERNAME = var.db_username
      POSTGRES_PASSWORD = data.aws_ssm_parameter.postgres_password.value
      POSTGRES_HOST     = aws_rds_cluster.pgsql.endpoint
      POSTGRES_DATABASE = aws_rds_cluster.pgsql.database_name
      KEYCLOAK_AUTH_SERVER_URI  = var.keycloak_auth_server_uri
      KEYCLOAK_RESPONSE_TYPE    = var.keycloak_response_type
      KEYCLOAK_CLIENT_ID        = var.keycloak_client_id
      KEYCLOAK_REALM            = var.keycloak_realm
      KEYCLOAK_CONFIDENTIAL_PORT= var.keycloak_confidential_port
      KEYCLOAK_SSL_REQUIRED     = var.keycloak_ssl_required
      KEYCLOAK_RESOURCE         = var.keycloak_resource
      KEYCLOAK_CLIENT_SECRET    = data.aws_ssm_parameter.keycloak_client_secret.value
      KEYCLOAK_REDIRECT_URI     = var.keycloak_redirect_uri
      KEYCLOAK_USER_INFO_URI    = var.keycloak_user_info_uri
      KEYCLOAK_TOKEN_URI        = var.keycloak_token_uri
      KEYCLOAK_LOGOUT_URI       = var.keycloak_logout_uri
      # MAIL_FROM                = var.mail_from
      # CHES_CLIENT_ID           = var.ches_client_id
      # CHES_CLIENT_SECRET       = data.aws_ssm_parameter.ches_client_secret.value
      # CHES_SERVICE_HOST        = data.aws_ssm_parameter.ches_service_host.value
      # CHES_AUTH_URL            = data.aws_ssm_parameter.ches_auth_url.value
      # SLACK_ALERTS_WEBHOOK_URL = data.aws_ssm_parameter.slack_alerts_webhook_url.value
      # POSTGRES_HOST     = aws_rds_cluster.pgsql_backup.endpoint
    }
  }
}

resource "aws_apigatewayv2_api" "api" {
  name          = local.api_name
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "api" {
  api_id             = aws_apigatewayv2_api.api.id
  integration_type   = "AWS_PROXY"
  connection_type    = "INTERNET"
  description        = local.api_name
  integration_method = "POST"
  integration_uri    = aws_lambda_function.api.invoke_arn
}

resource "aws_apigatewayv2_route" "api" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

locals {
  api_gateway_log_format_with_newlines = <<EOF
{ 
"requestId":"$context.requestId",
"ip":"$context.identity.sourceIp",
"requestTime":"$context.requestTime",
"httpMethod":"$context.httpMethod",
"status":"$context.status",
"path":"$context.path",
"responseLength":"$context.responseLength",
"errorMessage":"$context.error.message"
}
EOF
  api_gateway_log_format               = replace(local.api_gateway_log_format_with_newlines, "\n", "")
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name = "api-gw/${local.api_name}/logs"

  lifecycle {
    ignore_changes = [
      retention_in_days
    ]
  }
}

resource "aws_apigatewayv2_stage" "api" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format          = local.api_gateway_log_format
  }
}

resource "aws_lambda_permission" "api_allow_gateway" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_stage.api.execution_arn}/*"
}
