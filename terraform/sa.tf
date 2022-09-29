
# This is the IAM policy that the service account used in CI is going to carry. 

data "aws_iam_policy_document" "service_account" {
  statement {
    sid    = "AllowS3FullAccess"
    effect = "Allow"
    actions = [
      "s3:DeleteObject",
      "s3:GetBucketLocation",
      "s3:GetObject",
      "s3:ListBucket",
      "s3:PutObject",
      "s3:PutObjectAcl"
    ]
    resources = [
      "arn:aws:s3:::ien-*",
    ]
  }
  statement {
    sid    = "AllowCFInvalidationAccess"
    effect = "Allow"
    actions = [
      "cloudfront:ListInvalidations",
      "cloudfront:ListDistributions",
      "cloudfront:GetInvalidation",
      "cloudfront:GetDistributionConfig",
      "cloudfront:GetDistribution",
      "cloudfront:CreateInvalidation",
      "cloudfront:CreateCloudFrontOriginAccessIdentity",
      "cloudfront:CreateCachePolicy",
      "cloudfront:CreateDistributionWithTags",
      "cloudfront:UpdateDistribution",
      "cloudfront:UpdateCloudFrontOriginAccessIdentity",
      "cloudfront:TagResource"
    ]
    resources = [
      "arn:aws:cloudfront::${var.target_aws_account_id}:distribution/*",
    ]
  }
  statement {
    sid    = "AllowLambdaInvokeDeploy"
    effect = "Allow"
    actions = [
      "lambda:InvokeFunction",
      "lambda:UpdateFunctionCode",
    ]
    resources = [
      "arn:aws:lambda:${var.region}:${var.target_aws_account_id}:function:ien*",
    ]
  }

  statement {
    sid    = "AllowDBClusterSnapshot"
    effect = "Allow"
    actions = [
      "rds:AddTagsToResource",
      "rds:CreateDBClusterSnapshot",
    ]
    resources = [
      "arn:aws:lambda:${var.region}:${var.target_aws_account_id}:cluster:ien*",
    ]
  }

  statement {
    sid    = "AllowSQS"
    effect = "Allow"
    actions = [
      "SQS:SendMessage",
      "SQS:DeleteMessage",
      "SQS:ReceiveMessage",
      "SQS:GetQueueAttributes"
    ]
    resources = [
      "arn:aws:sqs:${var.region}:${var.target_aws_account_id}:*",
    ]
  }
}

# Uncomment when output iam is required - Less noisy this way

output "service_account_iam" {
  value = data.aws_iam_policy_document.service_account.json
}


