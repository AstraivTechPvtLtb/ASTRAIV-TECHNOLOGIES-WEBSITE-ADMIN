# ==============================================================================
# Script: pull-from-supabase.ps1
# Description: Dumps the live Supabase public schema and data, and restores it
#              into your local PostgreSQL database (astraiv_tech).
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "   Syncing Database from Supabase to Local DB   " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Supabase Connection Parameters (Connection Pooler Session Mode IPv4)
$SUPABASE_HOST = "aws-0-ap-southeast-1.pooler.supabase.com"
$SUPABASE_PORT = "5432"
$SUPABASE_USER = "postgres.cvdiedebmguahkmzkwtd"
$SUPABASE_PASS = "kzT6tRI0Uw8XjGXw"
$SUPABASE_DB   = "postgres"

# Local PostgreSQL Parameters
$LOCAL_HOST = "localhost"
$LOCAL_PORT = "5432"
$LOCAL_USER = "postgres"
$LOCAL_PASS = "Akashindia123@"
$LOCAL_DB   = "astraiv_tech"

# Locate pg_dump and psql
$PG_DIR = "C:\Program Files\PostgreSQL\18\bin"
if (-not (Test-Path "$PG_DIR\pg_dump.exe")) {
    # Fallback search if installed elsewhere
    $pgCmd = Get-Command "pg_dump" -ErrorAction SilentlyContinue
    if ($pgCmd) {
        $PG_DIR = Split-Path $pgCmd.Source
    } else {
        Write-Error "Could not find pg_dump.exe. Please ensure PostgreSQL is installed."
        exit 1
    }
}

$DUMP_FILE = "$PSScriptRoot\supabase_dump_temp.sql"

try {
    Write-Host "`n[1/4] Dumping data from Supabase..." -ForegroundColor Yellow
    $env:PGPASSWORD = $SUPABASE_PASS
    & "$PG_DIR\pg_dump.exe" `
        -h $SUPABASE_HOST `
        -p $SUPABASE_PORT `
        -U $SUPABASE_USER `
        -d $SUPABASE_DB `
        --schema=public `
        --no-owner `
        --no-privileges `
        -f $DUMP_FILE

    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }
    Write-Host " Supabase dump completed successfully." -ForegroundColor Green

    Write-Host "`n[2/4] Ensuring local database '$LOCAL_DB' exists..." -ForegroundColor Yellow
    $env:PGPASSWORD = $LOCAL_PASS
    $checkDb = & "$PG_DIR\psql.exe" -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$LOCAL_DB';"
    if ($checkDb.Trim() -ne "1") {
        Write-Host "Creating database '$LOCAL_DB'..." -ForegroundColor Cyan
        & "$PG_DIR\psql.exe" -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d postgres -c "CREATE DATABASE $LOCAL_DB;"
    } else {
        Write-Host "Database '$LOCAL_DB' already exists." -ForegroundColor Green
    }

    Write-Host "`n[3/5] Restoring schema and data into local '$LOCAL_DB'..." -ForegroundColor Yellow
    # Clean existing public schema to prevent duplicate collisions
    & "$PG_DIR\psql.exe" -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -c "DROP SCHEMA IF EXISTS public CASCADE;" | Out-Null
    # Ensure auth schema and auth.role() exist so Supabase RLS policies restore cleanly
    & "$PG_DIR\psql.exe" -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -c "CREATE SCHEMA IF NOT EXISTS auth; CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql AS 'SELECT ''authenticated''::text;';" | Out-Null
    # Restore dump
    & "$PG_DIR\psql.exe" -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -f $DUMP_FILE | Out-Null

    if ($LASTEXITCODE -ne 0) {
        throw "psql restore failed with exit code $LASTEXITCODE"
    }
    Write-Host " Restoration completed successfully." -ForegroundColor Green

    Write-Host "`n[4/5] Verifying local database tables..." -ForegroundColor Yellow
    & "$PG_DIR\psql.exe" -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -c "\dt public.*"

    Write-Host "`n[5/5] Regenerating Prisma client..." -ForegroundColor Yellow
    $workspaceRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
    if (Test-Path "$workspaceRoot\admin") {
        Push-Location "$workspaceRoot\admin"
        npx prisma generate
        Pop-Location
    }
    if (Test-Path "$workspaceRoot\client") {
        Push-Location "$workspaceRoot\client"
        npx prisma generate
        Pop-Location
    }

    Write-Host "`n=================================================" -ForegroundColor Green
    Write-Host " Database sync finished! Local DB is ready to use." -ForegroundColor Green
    Write-Host "=================================================" -ForegroundColor Green
}
finally {
    # Cleanup temporary dump file
    if (Test-Path $DUMP_FILE) {
        Remove-Item $DUMP_FILE -Force -ErrorAction SilentlyContinue
    }
    $env:PGPASSWORD = $null
}
