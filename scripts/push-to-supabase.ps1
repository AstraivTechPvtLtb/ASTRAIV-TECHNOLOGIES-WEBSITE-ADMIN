# ==============================================================================
# Script: push-to-supabase.ps1
# Description: Dumps the local PostgreSQL database (astraiv_tech) and restores it
#              directly into the remote Supabase PostgreSQL database.
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "   Pushing Local Database -> Supabase Cloud      " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# -----------------------------------------------------------------------------
# Configuration & Credentials
# -----------------------------------------------------------------------------
# Local PostgreSQL Parameters (Defaults match Akash's local configuration)
$LOCAL_HOST = if ($env:LOCAL_HOST) { $env:LOCAL_HOST } else { "localhost" }
$LOCAL_PORT = if ($env:LOCAL_PORT) { $env:LOCAL_PORT } else { "5432" }
$LOCAL_USER = if ($env:LOCAL_USER) { $env:LOCAL_USER } else { "postgres" }
$LOCAL_PASS = if ($env:LOCAL_PASS) { $env:LOCAL_PASS } else { "Akashindia123@" }
$LOCAL_DB   = if ($env:LOCAL_DB)   { $env:LOCAL_DB }   else { "astraiv_tech" }

# Remote Supabase Connection Parameters
$SUPABASE_HOST = if ($env:SUPABASE_HOST) { $env:SUPABASE_HOST } else { "aws-0-ap-southeast-1.pooler.supabase.com" }
$SUPABASE_PORT = if ($env:SUPABASE_PORT) { $env:SUPABASE_PORT } else { "5432" }
$SUPABASE_USER = if ($env:SUPABASE_USER) { $env:SUPABASE_USER } else { "postgres.cvdiedebmguahkmzkwtd" }
$SUPABASE_PASS = if ($env:SUPABASE_PASS) { $env:SUPABASE_PASS } else { "yX0f7d9WWFnWMKe9WWPSL2qmcWAm3gEi9bM6" }
$SUPABASE_DB   = if ($env:SUPABASE_DB)   { $env:SUPABASE_DB }   else { "postgres" }

# -----------------------------------------------------------------------------
# Locate PostgreSQL Utilities (pg_dump and psql)
# -----------------------------------------------------------------------------
$searchPaths = @(
    "C:\Program Files\PostgreSQL\18\bin",
    "C:\Program Files\PostgreSQL\17\bin",
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin"
)

$PG_DIR = $null
foreach ($path in $searchPaths) {
    if (Test-Path "$path\pg_dump.exe") {
        $PG_DIR = $path
        break
    }
}

if (-not $PG_DIR) {
    $pgCmd = Get-Command "pg_dump" -ErrorAction SilentlyContinue
    if ($pgCmd) {
        $PG_DIR = Split-Path $pgCmd.Source
    } else {
        Write-Error "Could not find pg_dump.exe. Please ensure PostgreSQL is installed."
        exit 1
    }
}

Write-Host "Using PostgreSQL tools at: $PG_DIR" -ForegroundColor DarkGray
$DUMP_FILE = "$PSScriptRoot\local_dump_temp.sql"

try {
    # 1. Dump local public schema
    Write-Host "`n[1/3] Dumping public schema & data from local database '$LOCAL_DB'..." -ForegroundColor Yellow
    $env:PGPASSWORD = $LOCAL_PASS
    & "$PG_DIR\pg_dump.exe" `
        -h $LOCAL_HOST `
        -p $LOCAL_PORT `
        -U $LOCAL_USER `
        -d $LOCAL_DB `
        --schema=public `
        --clean `
        --if-exists `
        --no-owner `
        --no-privileges `
        -f $DUMP_FILE

    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }
    Write-Host "✔ Local dump completed successfully." -ForegroundColor Green

    # 2. Restore into Supabase
    Write-Host "`n[2/3] Restoring data into Supabase Cloud ($SUPABASE_HOST)..." -ForegroundColor Yellow
    $env:PGPASSWORD = $SUPABASE_PASS
    & "$PG_DIR\psql.exe" `
        -h $SUPABASE_HOST `
        -p $SUPABASE_PORT `
        -U $SUPABASE_USER `
        -d $SUPABASE_DB `
        -f $DUMP_FILE | Out-Null

    if ($LASTEXITCODE -ne 0) {
        throw "psql restore to Supabase failed with exit code $LASTEXITCODE"
    }
    Write-Host "✔ Data successfully restored into Supabase." -ForegroundColor Green

    # 3. Grant schema permissions to Supabase roles
    Write-Host "`n[3/3] Re-verifying Supabase security permissions..." -ForegroundColor Yellow
    $permSql = "GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role; GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role; GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;"
    & "$PG_DIR\psql.exe" `
        -h $SUPABASE_HOST `
        -p $SUPABASE_PORT `
        -U $SUPABASE_USER `
        -d $SUPABASE_DB `
        -c $permSql | Out-Null

    Write-Host "`n=================================================" -ForegroundColor Green
    Write-Host " Sync Complete! Akash's database is now live on Supabase!" -ForegroundColor Green
    Write-Host "=================================================" -ForegroundColor Green
}
catch {
    Write-Host "`n❌ Error during push: $_" -ForegroundColor Red
    exit 1
}
finally {
    if (Test-Path $DUMP_FILE) {
        Remove-Item $DUMP_FILE -Force -ErrorAction SilentlyContinue
    }
    $env:PGPASSWORD = $null
}
