# NPM WSL Issue and Workaround Strategy

## Problem Identified
NPM hangs when installing packages in Windows filesystem paths (`/mnt/c/`) but works correctly in Linux filesystem (`~`). This is a known WSL2 issue related to file system performance and permissions.

## Root Cause
- Windows filesystem mounted in WSL2 has significant performance overhead
- File locking and permission issues between Windows and Linux
- npm's package extraction process is extremely slow on `/mnt/c/`

## Immediate Workaround Solution

### Option 1: Move Project to Linux Filesystem (Recommended)
```bash
# Copy project to Linux home directory
cp -r /mnt/c/Users/12158/LeadHarvest ~/LeadHarvest

# Work from Linux filesystem
cd ~/LeadHarvest/backend
npm install

cd ~/LeadHarvest/frontend
npm install

# Sync back to Windows when needed
rsync -av --exclude=node_modules ~/LeadHarvest/ /mnt/c/Users/12158/LeadHarvest/
```

### Option 2: Manual Package Installation (Current Workaround)
Since we can't use npm install directly, we'll continue with manual implementations:

1. **Keep using bcryptjs** instead of bcrypt (pure JS, no native bindings)
2. **Use REST API wrappers** for complex packages
3. **Copy working packages** from test installations

### Option 3: Docker-based Development
Create Docker containers for development to bypass WSL filesystem issues entirely.

## Immediate Action Plan

### Step 1: Install Packages in Linux Filesystem
```bash
# Create temporary installation directory
mkdir ~/temp-install
cd ~/temp-install

# Copy package.json files
cp /mnt/c/Users/12158/LeadHarvest/backend/package.json ./backend-package.json
cp /mnt/c/Users/12158/LeadHarvest/frontend/package.json ./frontend-package.json

# Install backend packages
mv backend-package.json package.json
npm install

# Copy node_modules to Windows filesystem
cp -r node_modules /mnt/c/Users/12158/LeadHarvest/backend/

# Install frontend packages
rm -rf node_modules package-lock.json
mv frontend-package.json package.json
npm install

# Copy node_modules to Windows filesystem
cp -r node_modules /mnt/c/Users/12158/LeadHarvest/frontend/
```

### Step 2: Fix bcrypt Issue
Since bcrypt has native bindings that won't work when copied, use bcryptjs:
```bash
cd /mnt/c/Users/12158/LeadHarvest/backend
npm install bcryptjs --no-save
```

### Step 3: Create Wrapper Scripts
Create npm wrapper scripts that handle the WSL issue:

```bash
#!/bin/bash
# /mnt/c/Users/12158/LeadHarvest/npm-install.sh

# Check if in Windows filesystem
if [[ "$PWD" == /mnt/c/* ]]; then
  echo "Detected Windows filesystem. Using Linux filesystem for installation..."
  
  # Create temp directory
  TEMP_DIR=~/npm-temp-$$
  mkdir -p $TEMP_DIR
  
  # Copy package.json
  cp package.json $TEMP_DIR/
  
  # Install in Linux filesystem
  cd $TEMP_DIR
  npm install
  
  # Copy back node_modules
  cp -r node_modules $OLDPWD/
  
  # Cleanup
  rm -rf $TEMP_DIR
else
  npm install
fi
```

## Long-term Solutions

1. **Move development to WSL2 native filesystem**
   - Better performance
   - No filesystem issues
   - Use VS Code Remote-WSL

2. **Use Docker for development**
   - Consistent environment
   - No WSL filesystem issues
   - Easy deployment

3. **Use Windows-native Node.js**
   - Install Node.js on Windows directly
   - Use PowerShell or Command Prompt
   - No WSL overhead

## Current Status

For now, we'll proceed with manual workarounds:
1. Continue using existing working code
2. Use bcryptjs instead of bcrypt
3. Keep manual API wrappers where needed
4. Document all workarounds for future removal