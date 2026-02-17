#!/bin/bash

# Build script for Netlify deployment with Prisma support
set -e

echo "🚀 Starting Netlify build process..."

# Check for required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is required"
  echo "Please set the DATABASE_URL in your Netlify environment variables"
  exit 1
fi

echo "✅ DATABASE_URL is configured"

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Verify Prisma Client was generated
if [ ! -d "node_modules/.prisma" ]; then
  echo "❌ ERROR: Prisma Client generation failed"
  exit 1
fi

echo "✅ Prisma Client generated successfully"

# Run the Next.js build
echo "🏗️  Building Next.js application..."
npx next build

echo "✅ Build completed successfully!"