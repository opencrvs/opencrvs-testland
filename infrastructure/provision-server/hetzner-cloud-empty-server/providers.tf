# Tell Terraform to include the hcloud provider
terraform {
  required_providers {
    hcloud = {
      source = "hetznercloud/hcloud"
      # Here we use version 1.50.0, this may change in the future
      version = "1.50.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5"
    }
  }
}

# Configure the Hetzner Cloud Provider with your token
provider "hcloud" {
  token = var.hcloud_token
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}