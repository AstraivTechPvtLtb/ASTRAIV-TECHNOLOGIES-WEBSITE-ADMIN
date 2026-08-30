# local deployment script for Vercel (PowerShell)
# This script runs local checks (lint, tests), pulls environment variables,
# builds the project locally, and deploys to Vercel (Preview or Production).

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Vercel Local Deployment Assistant" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Set default target environment
$ENV_TARGET = "preview"
$PROD_FLAG = $false

# Check arguments
if ($args.Count -gt 0 -and ($args[0] -eq "--prod" -or $args[0] -eq "-p")) {
    $ENV_TARGET = "production"
    $PROD_FLAG = $true
    Write-Host "🎯 Deployment Target: PRODUCTION" -ForegroundColor Yellow
} else {
    Write-Host "🎯 Deployment Target: PREVIEW" -ForegroundColor Yellow
}

# Ensure Vercel CLI is installed
if (-not (Get-Command "vercel" -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Error: Vercel CLI is not installed."
    Write-Host "👉 Please run: npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

# Check for environment credentials
$USING_ENV_CREDS = $false
if ($env:VERCEL_TOKEN -and $env:VERCEL_ORG_ID -and $env:VERCEL_PROJECT_ID) {
    $USING_ENV_CREDS = $true
    Write-Host "✅ Found Vercel credentials in environment variables." -ForegroundColor Green
} else {
    Write-Host "ℹ️ Environment credentials not fully set. Checking local Vercel session..." -ForegroundColor Gray
    try {
        & vercel whoami | Out-Null
        Write-Host "✅ Authenticated via local Vercel session." -ForegroundColor Green
    } catch {
        Write-Error "❌ Error: You are not logged into Vercel and environment variables are missing."
        Write-Host "👉 Please set VERCEL_TOKEN, VERCEL_ORG_ID, and VERCEL_PROJECT_ID, or run: vercel login" -ForegroundColor Yellow
        exit 1
    }
}

# 1. Run Linting
Write-Host "🔍 Running ESLint checks..." -ForegroundColor Cyan
& npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Error: ESLint check failed. Aborting deployment."
    exit 1
}
Write-Host "✅ ESLint passed." -ForegroundColor Green

# 2. Run Tests
Write-Host "🧪 Running unit tests..." -ForegroundColor Cyan
& npm run test
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Error: Unit tests failed. Aborting deployment."
    exit 1
}
Write-Host "✅ Unit tests passed." -ForegroundColor Green

# 3. Pull Vercel Environment Settings
Write-Host "📥 Pulling environment configuration from Vercel..." -ForegroundColor Cyan
if ($USING_ENV_CREDS) {
    & vercel pull --yes --environment=$ENV_TARGET --token=$env:VERCEL_TOKEN
} else {
    & vercel pull --yes --environment=$ENV_TARGET
}

# 4. Build Project
Write-Host "🏗️ Building project locally..." -ForegroundColor Cyan
if ($USING_ENV_CREDS) {
    if ($PROD_FLAG) {
        & vercel build --prod --token=$env:VERCEL_TOKEN
    } else {
        & vercel build --token=$env:VERCEL_TOKEN
    }
} else {
    if ($PROD_FLAG) {
        & vercel build --prod
    } else {
        & vercel build
    }
}

# 5. Deploy Project
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan
if ($USING_ENV_CREDS) {
    if ($PROD_FLAG) {
        & vercel deploy --prebuilt --prod --token=$env:VERCEL_TOKEN
    } else {
        & vercel deploy --prebuilt --token=$env:VERCEL_TOKEN
    }
} else {
    if ($PROD_FLAG) {
        & vercel deploy --prebuilt --prod
    } else {
        & vercel deploy --prebuilt
    }
}

Write-Host "=========================================" -ForegroundColor Green
Write-Host "🎉 Local Deployment Completed Successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
