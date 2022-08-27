# CloudFront distribution that routes and caches the app and the api

output "public_url" {
  value = aws_cloudfront_distribution.app.domain_name
}

locals {
  s3_origin_id  = "app"
  api_origin_id = "api"
}

data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "disabled" {
  name = "Managed-CachingDisabled"
}
resource "aws_cloudfront_origin_access_identity" "app" {
  comment = local.app_name
}

data "aws_acm_certificate" "domain" {
  count    = local.has_domain ? 1 : 0
  provider = aws.us-east-1
  domain   = var.domain
  statuses = ["ISSUED"]
}



resource "aws_cloudfront_function" "response" {
  provider = aws.us-east-1
  name     = "${local.namespace}-cf-response"
  runtime  = "cloudfront-js-1.0"
  comment  = "Add security headers"
  code     = file("${path.module}/cloudfront/response.js")
}

resource "aws_cloudfront_function" "request" {
  provider = aws.us-east-1
  name     = "${local.namespace}-cf-request"
  runtime  = "cloudfront-js-1.0"
  comment  = "Next request handler"
  code     = file("${path.module}/cloudfront/request.js")
}


resource "aws_cloudfront_distribution" "app" {
  comment = local.app_name
  
  aliases = local.fw_domain ? [var.domain] : ["ien.gov.bc.ca", "www.ien.gov.bc.ca"]

  origin {
    domain_name = aws_s3_bucket.app.bucket_regional_domain_name
    origin_id   = local.s3_origin_id

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.app.cloudfront_access_identity_path
    }
  }

  origin {
    domain_name = trimsuffix(trimprefix(aws_apigatewayv2_stage.api.invoke_url, "https://"), "/")
    origin_id   = local.api_origin_id

    custom_origin_config {
      http_port  = 80
      https_port = 443

      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # We only need the US/Canada
  price_class = "PriceClass_100"

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  // Serve the root directory uncached (it has the nextjs .html files in)
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = local.s3_origin_id
    cache_policy_id        = data.aws_cloudfront_cache_policy.disabled.id
    viewer_protocol_policy = "redirect-to-https"

    function_association {
      event_type   = "viewer-response"
      function_arn = aws_cloudfront_function.response.arn
    }

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.request.arn
    }
  }

  // Proxy the API directly through, with no caching
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = local.api_origin_id
    viewer_protocol_policy = "redirect-to-https"

    function_association {
      event_type   = "viewer-response"
      function_arn = aws_cloudfront_function.response.arn
    }


    forwarded_values {
      query_string = true
      headers      = ["authorization", "user-agent", "x-forwarded-for"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
    compress    = true
  }


  // Cache img directory
  ordered_cache_behavior {
    path_pattern           = "/img/*"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = local.s3_origin_id
    cache_policy_id        = data.aws_cloudfront_cache_policy.optimized.id
    viewer_protocol_policy = "redirect-to-https"

    function_association {
      event_type   = "viewer-response"
      function_arn = aws_cloudfront_function.response.arn
    }
  }

  // Cache _next directory
  ordered_cache_behavior {
    path_pattern           = "/_next/*"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = local.s3_origin_id
    cache_policy_id        = data.aws_cloudfront_cache_policy.optimized.id
    viewer_protocol_policy = "redirect-to-https"

    function_association {
      event_type   = "viewer-response"
      function_arn = aws_cloudfront_function.response.arn
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = local.has_domain ? false : true

    acm_certificate_arn      = local.has_domain ? data.aws_acm_certificate.domain[0].arn : null
    minimum_protocol_version = local.has_domain ? "TLSv1.2_2019" : null
    ssl_support_method       = local.has_domain ? "sni-only" : null
  }



  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/404.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
