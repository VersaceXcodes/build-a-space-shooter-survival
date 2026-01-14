#!/bin/bash
set -e

# Navigate to frontend directory
cd /app/vitereact

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the dev server in the background
# Using host 0.0.0.0 to expose it to the container network
echo "Starting dev server..."
npm run dev -- --host 0.0.0.0 &
