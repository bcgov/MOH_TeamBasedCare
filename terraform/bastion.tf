data "aws_ami" "amzn_linux2" {
  most_recent = true

  filter {
    name   = "owner-alias"
    values = ["amazon"]
  }

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm*"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  owners = ["amazon"]
}

# -----------------------------------------------------------------------------------
# Key Pairs
# -----------------------------------------------------------------------------------

resource "tls_private_key" "private_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "key_pair" {
  key_name   = "${local.namespace}-key"
  public_key = tls_private_key.private_key.public_key_openssh
}

# -----------------------------------------------------------------------------------
# Store keys in SSM Parameter Store
# -----------------------------------------------------------------------------------
resource "aws_ssm_parameter" "private_key_ssm_param" {
  name        = "/${local.namespace}/private-key"
  description = "Private Key"
  type        = "SecureString"
  value       = tls_private_key.private_key.private_key_pem
}
resource "aws_ssm_parameter" "public_key_ssm_param" {
  name        = "/${local.namespace}/public-key"
  description = "Public Key"
  type        = "SecureString"
  value       = tls_private_key.private_key.public_key_pem
}
resource "aws_ssm_parameter" "public_key_openssh_ssm_param" {
  name        = "/${local.namespace}/public-key-openssh"
  description = "Public Key in openssh format"
  type        = "SecureString"
  value       = tls_private_key.private_key.public_key_openssh
}

# -----------------------------------------------------------------------------------
# IAM Resources
# -----------------------------------------------------------------------------------

resource "aws_iam_instance_profile" "ec2_instance_profile" {
  name = "${local.namespace}-ec2-role"
  path = "/"
  role = "EC2-Default-SSM-AD-Role"
}


# -----------------------------------------------------------------------------------
# EC2 Instances
# -----------------------------------------------------------------------------------

resource "aws_instance" "bastion_instance" {

  ami                         = data.aws_ami.amzn_linux2.id
  key_name                    = aws_key_pair.key_pair.key_name
  instance_type               = var.instance_type
  vpc_security_group_ids      = [data.aws_security_group.app.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2_instance_profile.name
  associate_public_ip_address = "false"
  subnet_id                   = tolist(data.aws_subnets.app.ids)[0]
  user_data                   = file("scripts/user-data.sh")

  root_block_device {
    delete_on_termination = true
    encrypted             = true
    volume_size           = var.root_block_device.size
    volume_type           = var.root_block_device.type
  }


  tags = {
    Name = "${local.namespace}-bastion"
  }
}
