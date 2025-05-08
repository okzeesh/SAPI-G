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

# Function to check command status
check_status() {
    if [ $? -eq 0 ]; then
        print_status "$1"
    else
        print_error "$2"
        exit 1
    fi
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    print_warning "For macOS: brew install awscli"
    print_warning "For Ubuntu: sudo apt-get install awscli"
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    print_error "Terraform is not installed. Please install it first."
    print_warning "For macOS: brew install terraform"
    print_warning "For Ubuntu: sudo apt-get install terraform"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

# Find existing key pair file
print_status "Looking for existing key pair..."
KEY_FILE=$(ls *.pem 2>/dev/null | head -n 1)
if [ -z "$KEY_FILE" ]; then
    print_error "No .pem key file found in the current directory"
    exit 1
fi

# Extract key name from the file name (remove .pem extension)
KEY_NAME=$(basename "$KEY_FILE" .pem)
print_status "Using existing key pair: $KEY_NAME"

# Ensure key file has correct permissions
chmod 400 "$KEY_FILE"
check_status "Key file permissions set correctly." "Failed to set key file permissions"

# Update Terraform configuration
print_status "Updating Terraform configuration..."
sed -i '' "s/key_name.*=.*\".*\"/key_name      = \"$KEY_NAME\"/" main.tf
check_status "Terraform configuration updated." "Failed to update Terraform configuration"

# Initialize and apply Terraform
print_status "Initializing Terraform..."
terraform init
check_status "Terraform initialized." "Failed to initialize Terraform"

print_status "Planning Terraform deployment..."
terraform plan -out=tfplan
check_status "Terraform plan created." "Failed to create Terraform plan"

print_status "Applying Terraform configuration..."
terraform apply -auto-approve tfplan
check_status "Terraform configuration applied." "Failed to apply Terraform configuration"

# Get EC2 instance public IP
print_status "Getting EC2 instance public IP..."
EC2_IP=$(terraform output -raw public_ip)
if [ -z "$EC2_IP" ]; then
    print_error "Failed to get EC2 instance public IP"
    exit 1
fi
print_status "EC2 instance created with IP: $EC2_IP"

# Wait for EC2 instance to be ready
print_status "Waiting for EC2 instance to be ready..."
sleep 30

# Create a temporary directory for deployment files
print_status "Preparing deployment files..."
TEMP_DIR=$(mktemp -d)
cp -r backend "$TEMP_DIR/"
cp -r secureapi-dashboard "$TEMP_DIR/"
cp detector.py "$TEMP_DIR/"
cp Dockerfile.detector "$TEMP_DIR/"
cp docker-compose.yml "$TEMP_DIR/"

# Create environment file
print_status "Creating environment configuration..."
cat > "$TEMP_DIR/.env" << EOL
# Application URLs
FRONTEND_URL=http://${EC2_IP}:3000
API_URL=http://${EC2_IP}:5001

# MongoDB Configuration
MONGODB_URI=mongodb://mongodb:27017/sapi

# Security
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Environment
NODE_ENV=production
EOL

# Copy deployment files to EC2
print_status "Copying deployment files to EC2..."
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no -r "$TEMP_DIR"/* ubuntu@$EC2_IP:~/SAPI-g/
check_status "Files copied successfully." "Failed to copy files to EC2"

# Clean up temporary directory
rm -rf "$TEMP_DIR"

# SSH into EC2 and deploy application
print_status "Deploying application on EC2..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ubuntu@$EC2_IP << 'ENDSSH'
    cd ~/SAPI-g
    
    # Install Docker if not installed
    if ! command -v docker &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y docker.io docker-compose
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -aG docker ubuntu
        # Apply group changes without logout
        newgrp docker
    fi
    
    # Create necessary directories
    mkdir -p dataset/models
    mkdir -p backend/models
    
    # Build and start containers with environment file
    sudo docker-compose --env-file .env up -d --build
    
    # Wait for services to start
    sleep 30
    
    # Check if containers are running
    sudo docker ps
ENDSSH
check_status "Application deployed successfully." "Failed to deploy application"

print_status "Deployment completed!"
print_status "Your application is now accessible at:"
echo -e "${GREEN}Frontend:${NC} http://$EC2_IP:3000"
echo -e "${GREEN}Backend API:${NC} http://$EC2_IP:5001"
echo -e "${GREEN}Detector Service:${NC} http://$EC2_IP:5002"

# Save deployment information
echo "EC2_IP=$EC2_IP" > deployment_info.txt
echo "KEY_NAME=$KEY_NAME" >> deployment_info.txt
echo "KEY_FILE=$KEY_FILE" >> deployment_info.txt

print_status "Deployment information saved to deployment_info.txt"
print_warning "Make sure to keep your $KEY_FILE file secure!" 