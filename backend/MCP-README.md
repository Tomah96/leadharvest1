# MCP PostgreSQL Server Setup

## Overview
The Model Context Protocol (MCP) server for PostgreSQL has been installed and configured for the LeadHarvest project. This allows Claude to directly interact with your Supabase PostgreSQL database.

## Installation Complete ✅
- Installed `mcp-postgres-server` package
- Created configuration file: `mcp-config.json`
- Created startup script: `start-mcp-postgres.js`
- Added npm script for easy execution

## Usage

### Start the MCP Server
```bash
cd /mnt/c/Users/12158/LeadHarvest/backend
npm run mcp
```

### Alternative: Direct Execution
```bash
node start-mcp-postgres.js
```

## Configuration
The MCP server uses the database connection from your `.env` file:
- Database: Supabase PostgreSQL
- Connection string is automatically loaded from `DATABASE_URL`

## Files Created
1. **mcp-config.json** - MCP configuration file
2. **start-mcp-postgres.js** - Node.js script to start the MCP server
3. **MCP-README.md** - This documentation file

## Features
When running, the MCP server allows:
- Direct database queries
- Schema introspection
- Table operations
- Data manipulation
- Transaction support

## Security Notes
- Database password is hidden in logs
- Connection string is stored in `.env` file
- MCP server runs with same permissions as your Node.js process

## Troubleshooting
If the server doesn't start:
1. Check that the database URL in `.env` is correct
2. Ensure PostgreSQL/Supabase is accessible
3. Verify network connectivity to Supabase

## Integration with Claude
Once the MCP server is running, Claude can:
- Query your leads table directly
- Perform database operations
- Analyze data patterns
- Generate reports