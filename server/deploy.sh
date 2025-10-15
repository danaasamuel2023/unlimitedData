#!/bin/bash

# DataHustle Server Deployment Script
# This script helps deploy the server to production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NODE_VERSION="16"
PM2_APP_NAME="datahustle-server"
LOG_FILE="deploy.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
        exit 1
    fi
}

# Check Node.js version
check_node_version() {
    log "Checking Node.js version..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    
    NODE_CURRENT_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_CURRENT_VERSION" -lt "$NODE_VERSION" ]; then
        error "Node.js version $NODE_VERSION or higher is required. Current version: $NODE_CURRENT_VERSION"
        exit 1
    fi
    
    success "Node.js version check passed: $(node -v)"
}

# Check if PM2 is installed
check_pm2() {
    log "Checking PM2 installation..."
    
    if ! command -v pm2 &> /dev/null; then
        warning "PM2 is not installed. Installing PM2..."
        npm install -g pm2
        success "PM2 installed successfully"
    else
        success "PM2 is already installed: $(pm2 -v)"
    fi
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    if [ ! -f "package.json" ]; then
        error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
    
    npm ci --only=production
    success "Dependencies installed successfully"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p uploads
    mkdir -p backups
    
    success "Directories created successfully"
}

# Check configuration
check_configuration() {
    log "Checking configuration..."
    
    if [ ! -f "config.js" ]; then
        if [ -f "config.example.js" ]; then
            warning "config.js not found. Please copy config.example.js to config.js and configure it"
            cp config.example.js config.js
            warning "Created config.js from example. Please edit it with your actual configuration"
        else
            error "No configuration file found"
            exit 1
        fi
    fi
    
    success "Configuration check completed"
}

# Run tests
run_tests() {
    log "Running server tests..."
    
    if [ -f "test-server.js" ]; then
        node test-server.js
        success "Tests completed successfully"
    else
        warning "No test file found. Skipping tests..."
    fi
}

# Build application (if needed)
build_application() {
    log "Building application..."
    
    if [ -f "package.json" ] && grep -q '"build"' package.json; then
        npm run build
        success "Application built successfully"
    else
        log "No build script found. Skipping build step..."
    fi
}

# Start/restart application with PM2
start_application() {
    log "Starting application with PM2..."
    
    # Stop existing application if running
    if pm2 list | grep -q "$PM2_APP_NAME"; then
        log "Stopping existing application..."
        pm2 stop $PM2_APP_NAME
        pm2 delete $PM2_APP_NAME
    fi
    
    # Start new application
    pm2 start index.js --name $PM2_APP_NAME --instances max --exec-mode cluster
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup
    
    success "Application started successfully with PM2"
}

# Setup log rotation
setup_log_rotation() {
    log "Setting up log rotation..."
    
    # Create logrotate configuration
    sudo tee /etc/logrotate.d/datahustle-server > /dev/null <<EOF
/var/log/datahustle-server/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $(whoami) $(whoami)
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
    
    success "Log rotation configured"
}

# Setup firewall (if ufw is available)
setup_firewall() {
    log "Setting up firewall..."
    
    if command -v ufw &> /dev/null; then
        # Allow SSH
        sudo ufw allow ssh
        
        # Allow HTTP and HTTPS
        sudo ufw allow 80
        sudo ufw allow 443
        
        # Allow application port (if different from 80/443)
        sudo ufw allow 5000
        
        # Enable firewall
        sudo ufw --force enable
        
        success "Firewall configured"
    else
        warning "UFW not available. Please configure firewall manually"
    fi
}

# Setup SSL certificate (if certbot is available)
setup_ssl() {
    log "Checking SSL certificate setup..."
    
    if command -v certbot &> /dev/null; then
        warning "Certbot is available. Please run 'sudo certbot --nginx' to setup SSL certificates"
    else
        warning "Certbot not available. Please install and configure SSL certificates manually"
    fi
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait a moment for the server to start
    sleep 5
    
    # Check if the server is responding
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        success "Health check passed - server is responding"
    else
        error "Health check failed - server is not responding"
        exit 1
    fi
}

# Display deployment information
display_info() {
    log "Deployment completed successfully!"
    echo
    echo "📊 Application Information:"
    echo "   Name: $PM2_APP_NAME"
    echo "   Status: $(pm2 jlist | jq -r '.[] | select(.name=="'$PM2_APP_NAME'") | .pm2_env.status')"
    echo "   PID: $(pm2 jlist | jq -r '.[] | select(.name=="'$PM2_APP_NAME'") | .pid')"
    echo "   Uptime: $(pm2 jlist | jq -r '.[] | select(.name=="'$PM2_APP_NAME'") | .pm2_env.pm_uptime')"
    echo
    echo "🔧 Useful Commands:"
    echo "   pm2 status                    - Check application status"
    echo "   pm2 logs $PM2_APP_NAME        - View application logs"
    echo "   pm2 restart $PM2_APP_NAME     - Restart application"
    echo "   pm2 stop $PM2_APP_NAME        - Stop application"
    echo "   pm2 delete $PM2_APP_NAME      - Delete application"
    echo
    echo "📝 Log Files:"
    echo "   Application logs: ~/.pm2/logs/"
    echo "   Deployment log: $LOG_FILE"
    echo
    echo "🌐 Access your application at:"
    echo "   http://localhost:5000"
    echo "   http://localhost:5000/health (health check)"
}

# Main deployment function
main() {
    log "Starting DataHustle Server deployment..."
    
    # Pre-deployment checks
    check_root
    check_node_version
    check_pm2
    
    # Deployment steps
    install_dependencies
    create_directories
    check_configuration
    run_tests
    build_application
    start_application
    setup_log_rotation
    setup_firewall
    setup_ssl
    health_check
    
    # Post-deployment
    display_info
    
    success "Deployment completed successfully!"
}

# Handle script interruption
trap 'error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
