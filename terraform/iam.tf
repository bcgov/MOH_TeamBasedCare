resource "aws_iam_role" "lambda" {
  name        = "${local.namespace}-lambda"
  description = "Lambda execution role for ${local.namespace}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "sts:AssumeRole"
        Principal = {
          Service = [
            "lambda.amazonaws.com"
          ]
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_cloudwatch" {
  role    = aws_iam_role.lambda.name
  # Derived policy from CloudWatchFullAccess. However, updated to a sepcific resource [lambda]
  policy  = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : [
          "autoscaling:Describe*",
          "cloudwatch:*",
          "logs:*",
          "iam:GetPolicy",
          "iam:GetPolicyVersion",
          "iam:GetRole",
          "oam:ListSinks"
        ],
        "Resource" : "arn:aws:logs:${var.region}:${var.target_aws_account_id}:log-group:/aws/lambda/${local.namespace}-api:*"
      },
      {
        "Effect" : "Allow",
        "Action" : "iam:CreateServiceLinkedRole",
        "Resource" : "arn:aws:iam::*:role/aws-service-role/events.amazonaws.com/AWSServiceRoleForCloudWatchEvents*",
        "Condition" : {
          "StringLike" : {
            "iam:AWSServiceName" : "events.amazonaws.com"
          }
        }
      },
      {
        "Effect" : "Allow",
        "Action" : [
          "oam:ListAttachedLinks"
        ],
        "Resource" : "arn:aws:oam:*:*:sink/*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_execute" {
  role    = aws_iam_role.lambda.name
  # Derived policy from AWSLambdaRole. However, updated to a sepcific resource [lambda]
  policy  = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : [
          "lambda:InvokeFunction"
        ],
        "Resource" : [
          "arn:aws:logs:${var.region}:${var.target_aws_account_id}:log-group:/aws/lambda/${local.namespace}-api:*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_s3" {
  role    = aws_iam_role.lambda.name
  # Derived policy from AmazonS3FullAccess. However, updated to a sepcific resource [lambda]
  policy  = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : [
          "s3:*",
          "s3-object-lambda:*"
        ],
        "Resource" : "arn:aws:logs:${var.region}:${var.target_aws_account_id}:log-group:/aws/lambda/${local.namespace}-api:*"
      },
      {
        "Effect" : "Allow",
        "Action" : [
          "s3:ListBucket",
          "s3:GetObject",
        ],
        "Resource" : ["arn:aws:s3:::${var.docs_bucket}/*", "arn:aws:s3:::${var.docs_bucket}"]
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  # Derived policy from AWSLambdaVPCAccessExecutionRole. However, updated to a sepcific resource [lambda]
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ],
        "Resource" : "arn:aws:logs:${var.region}:${var.target_aws_account_id}:log-group:/aws/lambda/${local.namespace}-api:*"
      }
    ]
  })
}
