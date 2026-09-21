# Declare the hcloud_token variable from .tfvars
variable "hcloud_token" {
  sensitive = true
}

variable "cloudflare_api_token" {
  sensitive = true
}

variable "cloudflare_zone_id" {
  description = "The Cloudflare zone ID for the domain."
  type        = string
}
variable "country_name" {
  description = "The country name for the Hetzner Cloud data center."
  default     = "farajaland"
  type        = string
}

variable "users" {
  type = map(list(string))
  default = {
  }
}

variable "env_type" {
  description = "The environment type for the Hetzner Cloud server."
  default     = "single-node"
  type        = string
}

variable "env_name" {
  description = "The environment name for the Hetzner Cloud server."
  type        = string
}