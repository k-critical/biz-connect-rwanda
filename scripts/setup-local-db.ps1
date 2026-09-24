# Creates the local `bizconnect` database and its own login, then saves DATABASE_URL into .env.
# psql asks for the password of the `postgres` user you chose when installing PostgreSQL.
# The app's own password is generated here and written straight into .env; it is never displayed.
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
if (-not (Test-Path $psql)) { throw "psql was not found at '$psql'. Is PostgreSQL 16 installed?" }

$bytes = New-Object byte[] 24
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$appPassword = [Convert]::ToBase64String($bytes) -replace '[+/=]', ''

$sql = @'
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'bizconnect') THEN
    ALTER ROLE bizconnect WITH LOGIN CREATEDB PASSWORD '__PASSWORD__';
  ELSE
    CREATE ROLE bizconnect WITH LOGIN CREATEDB PASSWORD '__PASSWORD__';
  END IF;
END
$$;
SELECT 'CREATE DATABASE bizconnect OWNER bizconnect'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'bizconnect')\gexec
'@.Replace('__PASSWORD__', $appPassword)

$sqlFile = [System.IO.Path]::GetTempFileName()
try {
  [System.IO.File]::WriteAllText($sqlFile, $sql, (New-Object System.Text.UTF8Encoding $false))
  Write-Host ""
  Write-Host "Type the password of the 'postgres' user (the one you chose when installing PostgreSQL)."
  & $psql -U postgres -h localhost -d postgres -v ON_ERROR_STOP=1 -q -f $sqlFile
  if ($LASTEXITCODE -ne 0) { throw "psql reported an error, so .env was left unchanged." }
}
finally {
  Remove-Item $sqlFile -Force -ErrorAction SilentlyContinue
}

$envPath = Join-Path $root ".env"
$source = if (Test-Path $envPath) { $envPath } else { Join-Path $root ".env.example" }
$url = "postgresql://bizconnect:$appPassword@localhost:5432/bizconnect"

$found = $false
$lines = @(Get-Content $source | ForEach-Object {
  if ($_ -match '^DATABASE_URL=') { $found = $true; "DATABASE_URL=$url" } else { $_ }
})
if (-not $found) { $lines += "DATABASE_URL=$url" }
[System.IO.File]::WriteAllText($envPath, ($lines -join "`n") + "`n", (New-Object System.Text.UTF8Encoding $false))

node (Join-Path $PSScriptRoot "sync-env.mjs")

Write-Host ""
Write-Host "Done. The 'bizconnect' database is ready and DATABASE_URL is saved in .env." -ForegroundColor Green
