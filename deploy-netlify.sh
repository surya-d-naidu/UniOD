#!/bin/bash

# Simple deployment script for Netlify
echo "🚀 Deploying University OD Tracker to Netlify..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI is not installed. Installing..."
    npm install -g netlify-cli
fi

# Check if user is logged in to Netlify
if ! netlify status &> /dev/null; then
    echo "🔐 Please login to Netlify..."
    netlify login
fi

# Deploy to Netlify
echo "📦 Starting deployment..."
netlify deploy --prod

echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your environment variables in Netlify dashboard"
echo "2. Configure your Neon database"
echo "3. Run 'npm run db:push' to set up database schema"
echo ""
echo "🌐 Your application will be available at the URL provided above"
