#!/bin/bash

# Build script for Vercel deployment
echo "Starting Vercel build process..."

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build the client application
echo "Building client application..."
npm run vercel-build

echo "Build completed successfully!"
