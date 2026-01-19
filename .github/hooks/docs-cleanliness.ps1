#!/usr/bin/env pwsh
# docs-cleanliness guardrail check
# Pre-commit hook to prevent regression of expirable workflow content in docs

$ErrorActionPreference = "Stop"

Write-Output "Running docs-cleanliness guardrail check..."

# Check 1: docs/sprints/ should not exist
if (Test-Path "docs/sprints") {
    Write-Error "FAIL: docs/sprints/ directory exists. Sprint planning docs should not be in docs/"
    exit 1
}
Write-Output "PASS: docs/sprints/ does not exist"

# Check 2: docs/index.md should not contain prohibited workflow keywords
$indexContent = Get-Content "docs/index.md" -Raw
$prohibitedKeywords = @("status", "progress", "ETA", "DoD", "sprint")
$foundKeywords = @()

foreach ($keyword in $prohibitedKeywords) {
    if ($indexContent -match $keyword) {
        $foundKeywords += $keyword
    }
}

if ($foundKeywords.Count -gt 0) {
    Write-Error "FAIL: docs/index.md contains prohibited workflow keywords: $($foundKeywords -join ', ')"
    exit 1
}
Write-Output "PASS: docs/index.md does not contain prohibited workflow keywords"

# Check 3: root AGENTS.md should not reference .rules as authoritative
$agentsContent = Get-Content "AGENTS.md" -Raw
if ($agentsContent -match "\.rules.*authoritative" -or $agentsContent -match "authoritative.*\.rules") {
    Write-Error "FAIL: AGENTS.md references .rules as authoritative"
    exit 1
}
Write-Output "PASS: AGENTS.md does not reference .rules as authoritative"

Write-Output "All docs-cleanliness guardrail checks passed!"
