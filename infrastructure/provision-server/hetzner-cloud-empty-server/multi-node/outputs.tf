output "public_ip" {
  value = hcloud_server.master.ipv4_address
}
output "master_ip" {
  value = hcloud_server.master.ipv4_address
}
output "worker_ip" {
  value = hcloud_server.worker.ipv4_address
}
# output "backup_ip" {
#   value = hcloud_server.backup.ipv4_address
# }