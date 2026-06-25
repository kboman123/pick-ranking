# Phase 완료: git status → add → commit → push → Vercel 확인
param(
    [Parameter(Mandatory = $true)]
    [string]$CommitMessage,
    [string]$VercelUrl = "https://pick-ranking.vercel.app",
    [int]$MaxWaitSeconds = 180,
    [int]$PollIntervalSeconds = 30
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "`n=== 1. git status ===" -ForegroundColor Cyan
git status
$branch = git branch --show-current
Write-Host "Branch: $branch"

Write-Host "`n=== 2. git add . ===" -ForegroundColor Cyan
git add .

$porcelain = git status --porcelain
if (-not $porcelain) {
    Write-Host "No changes to commit. Skipping commit and push." -ForegroundColor Yellow
    Write-Host "`n=== 5. Vercel check (no new push) ===" -ForegroundColor Cyan
    try {
        $resp = Invoke-WebRequest -Uri $VercelUrl -Method Head -MaximumRedirection 5 -TimeoutSec 15 -UseBasicParsing
        Write-Host "Vercel OK: $($resp.StatusCode) $VercelUrl"
        exit 0
    } catch {
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode
            Write-Host "Vercel response: HTTP $code $VercelUrl"
            exit 0
        }
        Write-Host "Vercel check failed: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n=== 3. git commit ===" -ForegroundColor Cyan
Write-Host "Message: $CommitMessage"
git commit -m $CommitMessage
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$hash = (git rev-parse --short HEAD).Trim()
Write-Host "Commit: $hash"

Write-Host "`n=== 4. git push origin $branch ===" -ForegroundColor Cyan
git push origin $branch
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== 5. Vercel deployment check ===" -ForegroundColor Cyan
Write-Host "Waiting ${PollIntervalSeconds}s for Vercel build..."
Start-Sleep -Seconds $PollIntervalSeconds

$elapsed = $PollIntervalSeconds
while ($true) {
    try {
        $resp = Invoke-WebRequest -Uri $VercelUrl -Method Head -MaximumRedirection 5 -TimeoutSec 15 -UseBasicParsing
        $code = $resp.StatusCode
        if ($code -ge 200 -and $code -lt 400) {
            Write-Host "Vercel OK: HTTP $code $VercelUrl (after ${elapsed}s)"
            Write-Host "`nDone. Commit $hash pushed to origin/$branch"
            exit 0
        }
    } catch {
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode
            if ($code -ge 200 -and $code -lt 400) {
                Write-Host "Vercel OK: HTTP $code $VercelUrl (after ${elapsed}s)"
                Write-Host "`nDone. Commit $hash pushed to origin/$branch"
                exit 0
            }
            Write-Host "HTTP $code — retrying..."
        } else {
            Write-Host "Request failed: $_ — retrying..."
        }
    }

    if ($elapsed -ge $MaxWaitSeconds) {
        Write-Host "Vercel check timed out after ${MaxWaitSeconds}s. Push succeeded; verify dashboard manually." -ForegroundColor Yellow
        Write-Host "Commit $hash pushed to origin/$branch"
        exit 1
    }

    Start-Sleep -Seconds $PollIntervalSeconds
    $elapsed += $PollIntervalSeconds
}
