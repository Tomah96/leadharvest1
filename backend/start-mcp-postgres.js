#!/usr/bin/env node

/**
 * MCP PostgreSQL Server Starter
 * This script starts the Model Context Protocol server for PostgreSQL
 */

const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:SupaBase6991Rules!!!@db.zobnidmljwwrthebnizf.supabase.co:5432/postgres';

console.log('[MCP] Starting PostgreSQL MCP Server...');
console.log('[MCP] Database:', DATABASE_URL.replace(/:[^:@]*@/, ':****@')); // Hide password in logs

// Start the MCP server
const mcpServer = spawn('node', [
  path.join(__dirname, 'node_modules', 'mcp-postgres-server', 'build', 'index.js')
], {
  env: {
    ...process.env,
    POSTGRES_CONNECTION_STRING: DATABASE_URL
  },
  stdio: 'inherit'
});

mcpServer.on('error', (err) => {
  console.error('[MCP] Failed to start server:', err);
  process.exit(1);
});

mcpServer.on('exit', (code, signal) => {
  console.log(`[MCP] Server exited with code ${code} and signal ${signal}`);
  process.exit(code || 0);
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('[MCP] Shutting down...');
  mcpServer.kill('SIGTERM');
  setTimeout(() => {
    mcpServer.kill('SIGKILL');
    process.exit(0);
  }, 5000);
});

process.on('SIGTERM', () => {
  console.log('[MCP] Shutting down...');
  mcpServer.kill('SIGTERM');
});