$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

$env:NODE_ENV = "development"
$env:PORT = "5000"
$env:JWT_SECRET = if ($env:JWT_SECRET) { $env:JWT_SECRET } else { "dev_local_jwt_secret_key_1234567890" }
$env:DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$env:DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$env:DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "ehsdb" }
$env:DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "ehsuser" }
$env:DB_PASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "ehspassword123" }

$nodeProcess = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue
if ($nodeProcess) {
    foreach ($proc in $nodeProcess) {
        if ($proc.CommandLine -match "server.js") {
            Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "Starting EHS backend on port 5000..."
node server.js
