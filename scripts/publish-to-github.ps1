# Publish all branches to GitHub (develop, main, staging).
# Prerequisite: create an empty repo at https://github.com/PrasobhVarayalil/diet-elite-mobile
# Then run: .\scripts\publish-to-github.ps1

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

$remote = git remote get-url origin
Write-Host "Remote: $remote"

foreach ($branch in @('develop', 'main', 'staging')) {
    if (-not (git show-ref --verify --quiet "refs/heads/$branch")) {
        Write-Warning "Branch $branch missing locally; skipping."
        continue
    }
    Write-Host "Pushing $branch..."
    git push -u origin $branch
}

Write-Host 'Done. Set default branch to develop in GitHub repo Settings if desired.'
