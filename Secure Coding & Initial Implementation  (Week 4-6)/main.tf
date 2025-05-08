terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"  # Change this to your preferred region
}

data "aws_security_group" "existing" {
  name = "sapi-security-group"
}

resource "aws_instance" "sapi_app" {
  ami           = "ami-0c7217cdde317cfec"  # Ubuntu 22.04 LTS
  instance_type = "t2.medium"
  key_name      = "SAPI-G-Key"

  vpc_security_group_ids = [data.aws_security_group.existing.id]

  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y docker.io
              systemctl start docker
              systemctl enable docker
              curl -L "https://github.com/docker/compose/releases/download/v2.5.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
              chmod +x /usr/local/bin/docker-compose
              usermod -aG docker ubuntu
              EOF

  tags = {
    Name = "SAPI-G-Instance"
  }
}

output "public_ip" {
  value = aws_instance.sapi_app.public_ip
  description = "The public IP address of the EC2 instance"
} 