#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status messages
print_status() {
    echo -e "${GREEN}[+] $1${NC}"
}

print_error() {
    echo -e "${RED}[-] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[!] $1${NC}"
}

# Clean up Terraform resources
print_status "Cleaning up Terraform resources..."
if [ -f "terraform.tfstate" ]; then
    terraform destroy -auto-approve
    print_status "Terraform resources destroyed"
else
    print_warning "No Terraform state found"
fi

# Clean up Docker resources
print_status "Cleaning up Docker resources..."
if command -v docker-compose &> /dev/null; then
    docker-compose down
    print_status "Docker containers stopped and removed"
else
    print_warning "Docker Compose not found"
fi

if command -v docker &> /dev/null; then
    docker system prune -a --volumes -f
    print_status "Docker system cleaned"
else
    print_warning "Docker not found"
fi

# Remove deployment files
print_status "Removing deployment files..."
rm -f deployment_info.txt
rm -f terraform.tfstate*
rm -f tfplan
rm -rf .terraform
print_status "Deployment files removed"

print_status "Cleanup completed!"
print_warning "You can now run ./deploy.sh to start a fresh deployment" 