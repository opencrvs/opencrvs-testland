resource "hcloud_server" "node" {
  name        = var.name
  image       = var.os_image
  server_type = var.server_type
  location    = var.location
  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }
  # network {
  #   network_id = var.private_network_id
  #   # IP Used by the master node, needs to be static
  #   # Here the worker nodes will use 10.0.1.1 to communicate with the master node
  #   ip         = var.ip
  # }
  user_data = var.user_data
}