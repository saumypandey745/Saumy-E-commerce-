terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "ecommerce-terraform-state-prod"
    key    = "global/s3/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
}

# VPC Module
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  name   = "ecommerce-vpc-prod"
  cidr   = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = false
}

# EKS Cluster Module
module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  cluster_name    = "ecommerce-eks-prod"
  cluster_version = "1.29"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    general = {
      desired_size = 5
      min_size     = 3
      max_size     = 20
      instance_types = ["m6i.large"]
    }
  }
}

# ElastiCache Redis Cluster
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "ecommerce-redis-prod"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis_subnet_group.name
}

resource "aws_elasticache_subnet_group" "redis_subnet_group" {
  name       = "ecommerce-redis-subnet-group"
  subnet_ids = module.vpc.private_subnets
}

# DocumentDB (MongoDB compatibility)
resource "aws_docdb_cluster" "mongodb" {
  cluster_identifier      = "ecommerce-mongo-prod"
  engine                  = "docdb"
  master_username         = "admin"
  master_password         = "SecurePassword123!" # Should be in AWS Secrets Manager
  skip_final_snapshot     = true
  db_subnet_group_name    = aws_docdb_subnet_group.mongo_subnet_group.name
  vpc_security_group_ids  = [module.vpc.default_security_group_id]
}

resource "aws_docdb_cluster_instance" "mongo_instances" {
  count              = 2
  identifier         = "ecommerce-mongo-prod-${count.index}"
  cluster_identifier = aws_docdb_cluster.mongodb.id
  instance_class     = "db.r5.large"
}

resource "aws_docdb_subnet_group" "mongo_subnet_group" {
  name       = "ecommerce-mongo-subnet-group"
  subnet_ids = module.vpc.private_subnets
}

# S3 Bucket for Media Assets
resource "aws_s3_bucket" "assets" {
  bucket = "ecommerce-assets-prod-${data.aws_caller_identity.current.account_id}"
}

data "aws_caller_identity" "current" {}

