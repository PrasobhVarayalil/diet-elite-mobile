# Promote develop -> staging -> main (diet-elite-mobile).
param([switch]$SkipCi)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not $SkipCi) {
    Write-Host 'Running npm run typecheck...'
    npm.cmd run typecheck
}

Write-Host '=== Pull develop ==='
git checkout develop
git pull origin develop

Write-Host '=== Merge develop -> staging ==='
git checkout staging
git pull origin staging
git merge develop -m "Promote develop to staging."
git push origin staging

Write-Host '=== Merge staging -> main ==='
git checkout main
git pull origin main
git merge staging -m "Promote staging to production (main)."
git push origin main

git checkout develop
Write-Host 'Done.'
