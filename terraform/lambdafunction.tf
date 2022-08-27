resource "aws_lambda_function" "SyncApplicants" {
  description      = "Trigger Sync applicant and master data service"
  function_name    = local.syncdata_lambda_name
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs14.x"
  filename         = "./build/empty_lambda.zip"
  source_code_hash = filebase64sha256("./build/empty_lambda.zip")
  handler          = "api/syncdata.handler"
  memory_size      = var.function_memory_mb
  timeout          = 300

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
      AUTH_URL          = data.aws_ssm_parameter.keycloak_url.value
      AUTH_REALM        = data.aws_ssm_parameter.keycloak_realm.value
      TARGET_ENV        = var.target_env
      AWS_S3_REGION     = var.region
      BUILD_ID          = var.build_id
      BUILD_INFO        = var.build_info
      POSTGRES_USERNAME = var.db_username
      POSTGRES_PASSWORD = data.aws_ssm_parameter.postgres_password.value
      POSTGRES_HOST     = aws_rds_cluster.pgsql.endpoint
      POSTGRES_DATABASE = aws_rds_cluster.pgsql.database_name
      HMBC_ATS_BASE_URL = data.aws_ssm_parameter.hmbc_ats_base_url.value
      HMBC_ATS_AUTH_KEY = data.aws_ssm_parameter.hmbc_ats_auth_key.value
      JWT_SECRET        = data.aws_ssm_parameter.sync_jwt_secret.value
    }
  }
}


# Scheduler to sync master tables
resource "aws_cloudwatch_event_rule" "hmbc_to_ien_masters" {
  name                = local.sync_master_data_scheduler
  description         = "7:00AM UTC - 12:00AM PST"
  schedule_expression = "cron(0 7 * * ? *)"
}
resource "aws_cloudwatch_event_target" "hmbc_to_ien_masters" {
  rule  = aws_cloudwatch_event_rule.hmbc_to_ien_masters.name
  arn   = aws_lambda_function.SyncApplicants.arn
  input = "{\"path\": \"master-data\"}"
}

resource "aws_lambda_permission" "hmbc_to_ien_masters" {
  statement_id  = "AllowExecutionFromCloudWatch_Morning"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.SyncApplicants.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.hmbc_to_ien_masters.arn
}


# Scheduler to sync applicant and applicant-milestones
resource "aws_cloudwatch_event_rule" "hmbc_to_ien_applicants" {
  name                = local.sync_applicant_data_scheduler
  description         = "8:00AM UTC - 1:00AM PST"
  schedule_expression = "cron(0 8 * * ? *)"
}
resource "aws_cloudwatch_event_target" "hmbc_to_ien_applicants" {
  rule  = aws_cloudwatch_event_rule.hmbc_to_ien_applicants.name
  arn   = aws_lambda_function.SyncApplicants.arn
  input = "{\"path\": \"applicant-data\"}"
}

resource "aws_lambda_permission" "hmbc_to_ien_applicants" {
  statement_id  = "AllowExecutionFromCloudWatch_EarlyMorning"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.SyncApplicants.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.hmbc_to_ien_applicants.arn
}
