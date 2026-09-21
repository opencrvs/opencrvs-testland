resource "hcloud_server" "master" {
  name        = "${var.country_name}-${var.env_name}-master"
  image       = var.os_image
  server_type = var.server_type
  location    = var.location
  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }
  user_data = var.user_data
}

resource "hcloud_server" "worker" {
  name        = "${var.country_name}-${var.env_name}-worker"
  image       = var.os_image
  server_type = var.server_type
  location    = var.location
  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }
  user_data = var.user_data
}

# resource "hcloud_server" "backup" {
#   name        = "${var.country_name}-${var.env_name}-backup"
#   image       = var.os_image
#   server_type = var.server_type
#   location    = var.location
#   public_net {
#     ipv4_enabled = true
#     ipv6_enabled = true
#   }
#   user_data = var.user_data
# }