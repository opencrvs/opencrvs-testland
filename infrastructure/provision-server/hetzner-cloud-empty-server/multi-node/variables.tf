variable "country_name" {
  default = "Farajaland"
  type    = string
}

variable "env_name" {
  type = string
}

variable "server_type" {
  description = "Type of the server"
  type        = string
  default     = "cpx41"

}

variable "location" {
  description = "Location of the server"
  type        = string
  default     = "fsn1"

}

variable "os_image" {
  description = "Operating system image"
  type        = string
  default     = "ubuntu-24.04"

}
# TODO: Multinode setup will need this attribute to interact within the network
# variable "private_network_id" {
#   description = "Private network ID"
#   type        = string

# }

variable "ip" {
  type    = string
  default = null
}

variable "user_data" {
  description = "Cloud-init user data script"
  type        = string
}