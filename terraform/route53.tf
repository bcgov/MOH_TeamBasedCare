resource "aws_route53_zone" "ien" {
  count = var.target_env == "prod" ? 1 : 0
  name  = "ien.gov.bc.ca"
}
