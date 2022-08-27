
# resource "aws_rds_cluster_instance" "pgsql_backup" {
#   count              = var.target_env == "prod" ? 2 : 1
#   identifier         = "${local.db_name}-backup-${count.index}"
#   cluster_identifier = aws_rds_cluster.pgsql_backup.id
#   instance_class     = "db.r5.large"
#   engine             = aws_rds_cluster.pgsql_backup.engine
#   engine_version     = aws_rds_cluster.pgsql_backup.engine_version
# }

# resource "aws_rds_cluster" "pgsql_backup" {
#   cluster_identifier  = "${local.db_name}-backup"
#   snapshot_identifier = local.snapshot_name
#   engine              = "aurora-postgresql"
#   engine_version      = "13.6"
#   availability_zones  = ["ca-central-1a", "ca-central-1b"]
#   database_name       = replace(var.project_code, "-", "_")
#   master_username     = var.db_username
#   master_password     = data.aws_ssm_parameter.postgres_password.value
#   storage_encrypted   = true
#   deletion_protection = true

#   db_subnet_group_name   = aws_db_subnet_group.pgsql.name
#   vpc_security_group_ids = [data.aws_security_group.data.id]

#   preferred_backup_window = "09:00-11:00"
#   backup_retention_period = var.target_env == "prod" ? 14 : 3

#   lifecycle {
#     ignore_changes = [
#       availability_zones
#     ]
#   }
#   local {
#     snapshot_name = "ADD_SNAPSHOT_NAME_HERE"
#   }
# }
