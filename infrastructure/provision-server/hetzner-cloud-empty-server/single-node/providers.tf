terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      # Here we use version 1.50.0, this may change in the future
      version = "1.50.0"
    }
  }
}