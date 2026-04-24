# Kill any process using port 5000
$port = 5000
$connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($connection) {
    Write-Host "Killing process(es) on port $port..." -ForegroundColor Yellow
    $connection | ForEach-Object { 
        try {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction Stop
            Write-Host "Successfully terminated PID $($_.OwningProcess)" -ForegroundColor Green
        } catch {
            Write-Host "Failed to terminate PID $($_.OwningProcess)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "No process found on port $port." -ForegroundColor Cyan
}
