resource "aws_s3_bucket" "docs" {
  bucket = var.docs_bucket
}

resource "aws_s3_bucket_versioning" "docs_versioning" {
  bucket = aws_s3_bucket.docs.id
  versioning_configuration {
    status = "Enabled"
  }
}
