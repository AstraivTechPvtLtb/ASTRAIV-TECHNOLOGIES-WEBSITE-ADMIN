#!/usr/bin/env bash

# local deployment script for Vercel
# This script runs local checks (lint, tests), pulls environment variables,
# builds the project locally, and deploys to Vercel (Preview or Production).

set -euo pipefail

# Print instructions
echo "========================================="
echo "   Vercel Local Deployment Assistant"
echo "========================================="

# Set variables
ENV="preview"
PROD_FLAG=""

# Check arguments
if [ $# -gt 0 ]; then
  if [ "$1" == "--prod" ] || [ "$1" == "-p" ]; then
    ENV="production"
    PROD_FLAG="--prod"
    echo "🎯 Deployment Target: PRODUCTION"
  else
    echo "🎯 Deployment Target: PREVIEW (Default)"
  fi
else
  echo "🎯 Deployment Target: PREVIEW"
fi

# Ensure Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "❌ Error: Vercel CLI is not installed."
  echo "👉 Please run: npm install -g vercel"
  exit 1
fi

# Check for environment credentials
# If VERCEL_TOKEN, VERCEL_ORG_ID, and VERCEL_PROJECT_ID are set, Vercel CLI will use them.
# Otherwise, we assume the developer is authenticated via 'vercel login'.
USING_ENV_CREDS=false
if [ -n "${VERCEL_TOKEN:-}" ] && [ -n "${VERCEL_ORG_ID:-}" ] && [ -n "${VERCEL_PROJECT_ID:-}" ]; then
  USING_ENV_CREDS=true
  echo "✅ Found Vercel credentials in environment variables."
else
  echo "ℹ️ Environment credentials not fully set. Checking local Vercel session..."
  if ! vercel whoami &> /dev/null; then
    echo "❌ Error: You are not logged into Vercel and environment variables are missing."
    echo "👉 Please set VERCEL_TOKEN, VERCEL_ORG_ID, and VERCEL_PROJECT_ID, or run: vercel login"
    exit 1
  fi
  echo "✅ Authenticated via local Vercel session."
fi

# 1. Run Linting
echo "🔍 Running ESLint checks..."
if ! npm run lint; then
  echo "❌ Error: ESLint check failed. Aborting deployment."
  exit 1
fi
echo "✅ ESLint passed."

# 2. Run Tests
echo "🧪 Running unit tests..."
if ! npm run test; then
  echo "❌ Error: Unit tests failed. Aborting deployment."
  exit 1
fi
echo "✅ Unit tests passed."

# 3. Pull Vercel Environment Settings
echo "📥 Pulling environment configuration from Vercel..."
if [ "$USING_ENV_CREDS" = true ]; then
  vercel pull --yes --environment="$ENV" --token="$VERCEL_TOKEN"
else
  vercel pull --yes --environment="$ENV"
fi

# 4. Build Project
echo "🏗️ Building project locally..."
if [ "$USING_ENV_CREDS" = true ]; then
  if [ "$ENV" == "production" ]; then
    vercel build --prod --token="$VERCEL_TOKEN"
  else
    vercel build --token="$VERCEL_TOKEN"
  fi
else
  if [ "$ENV" == "production" ]; then
    vercel build --prod
  else
    vercel build
  fi
fi

# 5. Deploy Project
echo "🚀 Deploying to Vercel..."
if [ "$USING_ENV_CREDS" = true ]; then
  if [ "$ENV" == "production" ]; then
    vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN"
  else
    vercel deploy --prebuilt --token="$VERCEL_TOKEN"
  fi
else
  if [ "$ENV" == "production" ]; then
    vercel deploy --prebuilt --prod
  else
    vercel deploy --prebuilt
  fi
fi

echo "========================================="
echo "🎉 Local Deployment Completed Successfully!"
echo "========================================="
