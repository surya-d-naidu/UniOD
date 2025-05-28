#!/bin/bash

# Simple deployment script for Vercel
echo "🚀 Deploying University OD Tracker to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Deploy to Vercel
echo "📦 Starting deployment..."
vercel --prod

echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your environment variables in Vercel dashboard"
echo "2. Configure your Neon database"
echo "3. Run 'npm run db:push' to set up database schema"
echo ""
echo "🌐 Your application will be available at the URL provided above"
