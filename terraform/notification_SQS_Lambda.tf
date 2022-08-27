# Create SQS for notification messages
# Note, We do not need DeadLetter Queue at this point, These messages are error logs only.
resource "aws_sqs_queue" "terraform_queue" {
  name                      = "slack-notification-queue"
  delay_seconds             = 90
  max_message_size          = 8192
  message_retention_seconds = 86400
  receive_wait_time_seconds = 10
  //redrive_policy            = "{\"deadLetterTargetArn\":\"${aws_sqs_queue.terraform_queue_deadletter.arn}\",\"maxReceiveCount\":4}"
}


# Create a lambda function that receive message from the queue
resource "aws_lambda_function" "SQSLambda" {
  description      = "Trigger Lambda when new Message received in SQS"
  function_name    = local.notify_lambda_name
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs14.x"
  filename         = "./build/empty_lambda.zip"
  source_code_hash = filebase64sha256("./build/empty_lambda.zip")
  handler          = "api/notifylambda.handler"
  memory_size      = var.function_memory_mb
  timeout          = 30

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
      NODE_ENV                 = "production"
      RUNTIME_ENV              = "hosted"
      TARGET_ENV               = var.target_env
      AWS_S3_REGION            = var.region
      BUILD_ID                 = var.build_id
      BUILD_INFO               = var.build_info
      SLACK_ALERTS_WEBHOOK_URL = data.aws_ssm_parameter.slack_alerts_webhook_url.value
      SQS_QUEUE_URL            = aws_sqs_queue.terraform_queue.url
    }
  }
}

# Trigger Lambda if new messages received in SQS queue.
resource "aws_lambda_event_source_mapping" "event_source_mapping" {
  event_source_arn = aws_sqs_queue.terraform_queue.arn
  enabled          = true
  function_name    = aws_lambda_function.SQSLambda.arn
  batch_size       = 10
}
