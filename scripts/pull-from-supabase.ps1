# ==============================================================================
# Script: pull-from-supabase.ps1
# Description: Dumps the live Supabase public schema and data, and restores it
#              into your local PostgreSQL database (astraiv_tech).
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "   Syncing Database from Supabase to Local DB   " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Supabase Connection Parameters
$SUPABASE_HOST = if ($env:SUPABASE_HOST) { $env:SUPABASE_HOST } else { "aws-0-ap-southeast-1.pooler.supabase.com" }
$SUPABASE_PORT = if ($env:SUPABASE_PORT) { $env:SUPABASE_PORT } else { "5432" }
$SUPABASE_USER = if ($env:SUPABASE_USER) { $env:SUPABASE_USER } else { "postgres.cvdiedebmguahkmzkwtd" }
$SUPABASE_PASS = if ($env:SUPABASE_PASS) { $env:SUPABASE_PASS } else { "yX0f7d9WWFnWMKe9WWPSL2qmcWAm3gEi9bM6" }
$SUPABASE_DB   = if ($env:SUPABASE_DB)   { $env:SUPABASE_DB }   else { "postgres" }

# Local PostgreSQL Parameters
$LOCAL_HOST = if ($env:LOCAL_HOST) { $env:LOCAL_HOST } else { "localhost" }
$LOCAL_PORT = if ($env:LOCAL_PORT) { $env:LOCAL_PORT } else { "5432" }
$LOCAL_USER = if ($env:LOCAL_USER) { $env:LOCAL_USER } else { "postgres" }
$LOCAL_PASS = if ($env:LOCAL_PASS) { $env:LOCAL_PASS } else { "" }
$LOCAL_DB   = if ($env:LOCAL_DB)   { $env:LOCAL_DB }   else { "astraiv_tech" }

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
    $checkDb = & "$PG_DIR\psql.exe" -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$LOCAL_DB';" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Could not connect to local PostgreSQL on $LOCAL_HOST:$LOCAL_PORT. Please ensure your local PostgreSQL service is started (e.g. run 'Start-Service postgresql-x64-18' in PowerShell as Administrator)."
    }
    if (-not $checkDb -or $checkDb.ToString().Trim() -ne "1") {
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
