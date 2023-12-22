// Not working at the moment
// module "network" {
//   source      = "git::https://github.com/BCDevOps/terraform-octk-aws-sea-network-info.git//?ref=master"
//   environment = var.target_env
// }

// Have manually copy/pasted the code from the above module
// TODO re-enable the module once fixed and remove the code below
locals {
	env_map = {
		dev = "Dev"
		test = "Test"
		prod = "Prod"
		sandbox = "Sandbox"
		unclass = "UnClass"
	}
	environment = local.env_map[lower(var.target_env)]
	vpc_name = "${local.environment}_vpc"
	availability_zones = ["a", "b"]
	web_subnet_names = [for az in local.availability_zones : "Web_${local.environment}_az${az}_net"]
	app_subnet_names = [for az in local.availability_zones : "App_${local.environment}_az${az}_net"]
	data_subnet_names = [for az in local.availability_zones : "Data_${local.environment}_az${az}_net"]

	security_group_name_suffix = "_sg"

	web_security_group_name = "Web${local.security_group_name_suffix}"
	app_security_group_name = "App${local.security_group_name_suffix}"
}

data "aws_vpc" "main" {
	filter {
		name = "tag:Name"
		values = [
			local.vpc_name]
	}
}

data "aws_subnet_ids" "web" {
	vpc_id = data.aws_vpc.main.id
	filter {
		name = "tag:Name"
		values = local.web_subnet_names
	}
}

data "aws_subnet_ids" "app" {
	vpc_id = data.aws_vpc.main.id
	filter {
		name = "tag:Name"
		values = local.app_subnet_names
	}
}

data "aws_subnet_ids" "data" {
	vpc_id = data.aws_vpc.main.id
	filter {
		name = "tag:Name"
		values = local.data_subnet_names
	}
}

data "aws_subnet" "web" {
	for_each = data.aws_subnet_ids.web.ids
	id = each.value
}

data "aws_subnet" "app" {
	for_each = data.aws_subnet_ids.app.ids
	id = each.value
}

data "aws_subnet" "data" {
	for_each = data.aws_subnet_ids.data.ids
	id = each.value
}

data "aws_security_group" "web" {
	name = local.web_security_group_name
}

data "aws_security_group" "app" {
	name = local.app_security_group_name
}

resource "aws_security_group" "data" {
	name = "Db_sg"
	description = "Custom-created Database Security Group"
	vpc_id 	= data.aws_vpc.main.id
}

resource "aws_security_group_rule" "data_sg_ingress_rule" {
  description = "Postgres DB Traffic Inbound from Lambda"
  type = "ingress"
  security_group_id = aws_security_group.data.id
  source_security_group_id = data.aws_security_group.app.id
  protocol = "tcp"
  to_port = 5432
  from_port = 5432
}