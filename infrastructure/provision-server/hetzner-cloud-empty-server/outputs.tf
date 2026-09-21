
output "public_ip" {
  value = (
    var.env_type == "single-node" && length(module.opencrvs_single_node) > 0
    ? module.opencrvs_single_node[0].public_ip
    : module.opencrvs_multi_node[0].public_ip
  )
}

output "master_ip" {
  value = (
    var.env_type != "single-node" && length(module.opencrvs_multi_node) > 0
    ? module.opencrvs_multi_node[0].master_ip
    : module.opencrvs_single_node[0].public_ip
  )
}

output "worker_ip" {
  value = (
    var.env_type != "single-node" && length(module.opencrvs_multi_node) > 0
    ? module.opencrvs_multi_node[0].worker_ip
    : null
  )
}

# output "backup_ip" {
#   value = (
#     var.env_type != "single-node" && length(module.opencrvs_multi_node) > 0
#     ? module.opencrvs_multi_node[0].backup_ip
#     : null
#   )
# }