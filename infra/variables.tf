variable "aws_region" {
  description = "AWS region for the bucket"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Prefix used in resource names (lowercase letters, numbers, hyphens)"
  type        = string
  default     = "iac-analyzer"
}

variable "environment" {
  description = "Environment tag"
  type        = string
  default     = "dev"
}

variable "force_destroy" {
  description = "Allow terraform destroy to delete the bucket even if it has files"
  type        = bool
  default     = true
}
