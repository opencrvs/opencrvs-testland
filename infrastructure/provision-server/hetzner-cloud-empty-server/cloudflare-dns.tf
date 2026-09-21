resource "cloudflare_dns_record" "a_record" {
  zone_id = var.cloudflare_zone_id
  name    = "${var.env_name}.opencrvs.dev"
  content = var.env_type == "single-node" ? module.opencrvs_single_node[0].public_ip : module.opencrvs_multi_node[0].public_ip
  proxied = false
  ttl     = 3600
  type    = "A"
}

resource "cloudflare_dns_record" "wildcard_record" {
  zone_id = var.cloudflare_zone_id
  name    = "*.${var.env_name}.opencrvs.dev"
  content = var.env_type == "single-node" ? module.opencrvs_single_node[0].public_ip : module.opencrvs_multi_node[0].public_ip
  proxied = false
  ttl     = 3600
  type    = "A"
}
