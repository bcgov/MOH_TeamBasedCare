# These should be manually populated in the console for each environment
data "aws_ssm_parameter" "postgres_password" {
  name = "/${var.project_code}/${var.target_env}/postgres/password"
}