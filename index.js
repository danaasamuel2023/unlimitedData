// Root entry point for Render deployment
// This file starts the server from the server directory

const path = require('path');
const { spawn } = require('child_process');

// Change to server directory and start the application
process.chdir(path.join(__dirname, 'server'));

// Start the server
const server = spawn('node', ['index.js'], {
  stdio: 'inherit',
  cwd: path.join(__dirname, 'server')
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});
