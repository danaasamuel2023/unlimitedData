@echo off
REM DataHustle Server Deployment Script for Windows
REM This script helps deploy the server to production on Windows

setlocal enabledelayedexpansion

REM Configuration
set NODE_VERSION=16
set PM2_APP_NAME=unlimiteddatagh-server
set LOG_FILE=deploy.log

REM Colors (Windows doesn't support ANSI colors in batch, so we'll use simple text)
set SUCCESS=[SUCCESS]
set WARNING=[WARNING]
set ERROR=[ERROR]
set INFO=[INFO]

REM Functions
:log
echo [%date% %time%] %~1 >> %LOG_FILE%
echo [%date% %time%] %~1
goto :eof

:success
echo %SUCCESS% %~1 >> %LOG_FILE%
echo %SUCCESS% %~1
goto :eof

:warning
echo %WARNING% %~1 >> %LOG_FILE%
echo %WARNING% %~1
goto :eof

:error
echo %ERROR% %~1 >> %LOG_FILE%
echo %ERROR% %~1
goto :eof

REM Check if Node.js is installed
:check_node
call :log "Checking Node.js installation..."
node --version >nul 2>&1
if errorlevel 1 (
    call :error "Node.js is not installed. Please install Node.js first."
    exit /b 1
)

for /f "tokens=1 delims=." %%i in ('node --version') do set NODE_MAJOR_VERSION=%%i
set NODE_MAJOR_VERSION=%NODE_MAJOR_VERSION:v=%

if %NODE_MAJOR_VERSION% LSS %NODE_VERSION% (
    call :error "Node.js version %NODE_VERSION% or higher is required. Current version: %NODE_MAJOR_VERSION%"
    exit /b 1
)

call :success "Node.js version check passed: "
node --version
goto :eof

REM Check if PM2 is installed
:check_pm2
call :log "Checking PM2 installation..."
pm2 --version >nul 2>&1
if errorlevel 1 (
    call :warning "PM2 is not installed. Installing PM2..."
    npm install -g pm2
    if errorlevel 1 (
        call :error "Failed to install PM2"
        exit /b 1
    )
    call :success "PM2 installed successfully"
) else (
    call :success "PM2 is already installed: "
    pm2 --version
)
goto :eof

REM Install dependencies
:install_dependencies
call :log "Installing dependencies..."

if not exist "package.json" (
    call :error "package.json not found. Are you in the correct directory?"
    exit /b 1
)

npm ci --only=production
if errorlevel 1 (
    call :error "Failed to install dependencies"
    exit /b 1
)

call :success "Dependencies installed successfully"
goto :eof

REM Create necessary directories
:create_directories
call :log "Creating necessary directories..."

if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "backups" mkdir backups

call :success "Directories created successfully"
goto :eof

REM Check configuration
:check_configuration
call :log "Checking configuration..."

if not exist "config.js" (
    if exist "config.example.js" (
        call :warning "config.js not found. Creating from example..."
        copy config.example.js config.js >nul
        call :warning "Created config.js from example. Please edit it with your actual configuration"
    ) else (
        call :error "No configuration file found"
        exit /b 1
    )
)

call :success "Configuration check completed"
goto :eof

REM Run tests
:run_tests
call :log "Running server tests..."

if exist "test-server.js" (
    node test-server.js
    if errorlevel 1 (
        call :warning "Some tests failed, but continuing deployment..."
    ) else (
        call :success "Tests completed successfully"
    )
) else (
    call :warning "No test file found. Skipping tests..."
)
goto :eof

REM Build application
:build_application
call :log "Building application..."

findstr /c:"\"build\"" package.json >nul 2>&1
if not errorlevel 1 (
    npm run build
    if errorlevel 1 (
        call :warning "Build failed, but continuing deployment..."
    ) else (
        call :success "Application built successfully"
    )
) else (
    call :log "No build script found. Skipping build step..."
)
goto :eof

REM Start application with PM2
:start_application
call :log "Starting application with PM2..."

REM Check if application is already running
pm2 list | findstr "%PM2_APP_NAME%" >nul 2>&1
if not errorlevel 1 (
    call :log "Stopping existing application..."
    pm2 stop %PM2_APP_NAME%
    pm2 delete %PM2_APP_NAME%
)

REM Start new application
pm2 start index.js --name %PM2_APP_NAME% --instances max --exec-mode cluster
if errorlevel 1 (
    call :error "Failed to start application with PM2"
    exit /b 1
)

REM Save PM2 configuration
pm2 save

call :success "Application started successfully with PM2"
goto :eof

REM Health check
:health_check
call :log "Performing health check..."

REM Wait for server to start
timeout /t 5 /nobreak >nul

REM Check if server is responding
curl -f http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    call :error "Health check failed - server is not responding"
    exit /b 1
)

call :success "Health check passed - server is responding"
goto :eof

REM Display deployment information
:display_info
call :log "Deployment completed successfully!"
echo.
echo 📊 Application Information:
echo    Name: %PM2_APP_NAME%
echo    Status: Running
echo.
echo 🔧 Useful Commands:
echo    pm2 status                    - Check application status
echo    pm2 logs %PM2_APP_NAME%        - View application logs
echo    pm2 restart %PM2_APP_NAME%     - Restart application
echo    pm2 stop %PM2_APP_NAME%        - Stop application
echo    pm2 delete %PM2_APP_NAME%      - Delete application
echo.
echo 📝 Log Files:
echo    Application logs: %%USERPROFILE%%\.pm2\logs\
echo    Deployment log: %LOG_FILE%
echo.
echo 🌐 Access your application at:
echo    http://localhost:5000
echo    http://localhost:5000/health (health check)
goto :eof

REM Main deployment function
:main
call :log "Starting DataHustle Server deployment..."

REM Pre-deployment checks
call :check_node
call :check_pm2

REM Deployment steps
call :install_dependencies
call :create_directories
call :check_configuration
call :run_tests
call :build_application
call :start_application
call :health_check

REM Post-deployment
call :display_info

call :success "Deployment completed successfully!"
goto :eof

REM Run main function
call :main

REM End of script
endlocal
