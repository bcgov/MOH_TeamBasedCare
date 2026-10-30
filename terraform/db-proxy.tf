resource "aws_secretsmanager_secret" "postgres_proxy" {
  name        = "${local.namespace}/rds-proxy/postgres"
  description = "Database credentials for the ${local.namespace} RDS Proxy"
}

resource "aws_secretsmanager_secret_version" "postgres_proxy" {
  secret_id = aws_secretsmanager_secret.postgres_proxy.id
  secret_string = jsonencode({
    username = var.db_username
    password = data.aws_ssm_parameter.postgres_password.value
  })
}

resource "aws_iam_role" "rds_proxy" {
  name = "${local.namespace}-rds-proxy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "sts:AssumeRole"
      Principal = {
        Service = "rds.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "rds_proxy_secrets" {
  name = "${local.namespace}-rds-proxy-secrets"
  role = aws_iam_role.rds_proxy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = aws_secretsmanager_secret.postgres_proxy.arn
    }]
  })
}

resource "aws_db_proxy" "pgsql" {
  name                   = "${local.db_name}-proxy"
  engine_family          = "POSTGRESQL"
  role_arn               = aws_iam_role.rds_proxy.arn
  vpc_subnet_ids         = data.aws_subnets.data.ids
  vpc_security_group_ids = [aws_security_group.rds_proxy.id]
  require_tls            = true

  auth {
    auth_scheme = "SECRETS"
    description = "Aurora PostgreSQL credentials"
    iam_auth    = "DISABLED"
    secret_arn  = aws_secretsmanager_secret.postgres_proxy.arn
  }

  depends_on = [
    aws_iam_role_policy.rds_proxy_secrets,
    aws_secretsmanager_secret_version.postgres_proxy,
    aws_vpc_security_group_ingress_rule.rds_proxy_from_app,
    aws_vpc_security_group_egress_rule.rds_proxy_to_data,
  ]
}

resource "aws_db_proxy_default_target_group" "pgsql" {
  db_proxy_name = aws_db_proxy.pgsql.name
}

resource "aws_db_proxy_target" "pgsql" {
  db_proxy_name         = aws_db_proxy.pgsql.name
  target_group_name     = aws_db_proxy_default_target_group.pgsql.name
  db_cluster_identifier = aws_rds_cluster.pgsql.cluster_identifier

  depends_on = [
    aws_security_group_rule.data_from_rds_proxy,
    aws_vpc_security_group_egress_rule.rds_proxy_to_data,
  ]
}
