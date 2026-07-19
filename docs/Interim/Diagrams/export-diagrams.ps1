# Export all Interim .drawio diagrams to PNG under Exports/<topic>/
# Usage (from anywhere):
#   powershell -ExecutionPolicy Bypass -File "docs/Interim/Diagrams/export-diagrams.ps1"
#
# Requires portable draw.io under Diagrams/.tools/drawio/draw.io.exe
# (first run of setup will be documented in Exports/README.md)

$ErrorActionPreference = "Stop"

$DiagramsRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ExportsRoot = Join-Path $DiagramsRoot "Exports"
$DrawioExe = Join-Path $DiagramsRoot ".tools\drawio\draw.io.exe"

if (-not (Test-Path $DrawioExe)) {
    Write-Error "draw.io CLI not found at: $DrawioExe`nSee Exports/README.md for setup."
}

# topic folder => list of source .drawio basenames (without path)
$Manifest = [ordered]@{
    "01-Requirements"        = @("01-use-case.drawio")
    "02-Process-Design"      = @(
        "02-activity-hiring.drawio",
        "03-activity-workspace.drawio",
        "04-activity-discover-brief.drawio",
        "05-dfd-context.drawio",
        "06-dfd-level1.drawio",
        "07-sequence-payment.drawio",
        "08-sequence-accept-proposal.drawio",
        "09-sequence-stage-approval.drawio"
    )
    "03-Object-Design"       = @("10-class.drawio")
    "04-Database-Design"     = @("11-er.drawio")
    "05-Architecture"        = @("12-3-layer-architecture.drawio")
    "06-Project-Management"  = @("13-gantt.drawio")
}

function Wait-ForFile {
    param(
        [string]$Path,
        [int]$TimeoutSec = 120,
        [long]$MinBytes = 1500
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    $lastSize = -1
    $stable = 0
    while ((Get-Date) -lt $deadline) {
        if (Test-Path $Path) {
            $size = (Get-Item $Path).Length
            if ($size -ge $MinBytes) {
                if ($size -eq $lastSize) {
                    $stable++
                    if ($stable -ge 2) { return $true }
                } else {
                    $stable = 0
                    $lastSize = $size
                }
            }
        }
        Start-Sleep -Seconds 1
    }
    return $false
}

function Export-One {
    param(
        [string]$Source,
        [string]$DestPng
    )
    $destDir = Split-Path -Parent $DestPng
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    if (Test-Path $DestPng) { Remove-Item $DestPng -Force }

    $argLine = "--export --format png --scale 2 --border 10 --output `"$DestPng`" `"$Source`""
    $log = Join-Path $env:TEMP ("drawio-export-" + [guid]::NewGuid().ToString("N") + ".log")
    cmd /c "`"$DrawioExe`" $argLine > `"$log`" 2>&1"

    if (-not (Wait-ForFile -Path $DestPng)) {
        $tail = if (Test-Path $log) { Get-Content $log -Raw } else { "(no log)" }
        Remove-Item $log -Force -ErrorAction SilentlyContinue
        throw "Export failed or timed out for $Source`n$tail"
    }
    Remove-Item $log -Force -ErrorAction SilentlyContinue
    $kb = [math]::Round((Get-Item $DestPng).Length / 1KB)
    Write-Host "OK  $([IO.Path]::GetFileName($Source)) -> $($DestPng.Substring($ExportsRoot.Length + 1)) ($kb KB)"
}

Write-Host "Exporting diagrams from: $DiagramsRoot"
Write-Host "Output root:             $ExportsRoot"
Write-Host ""

foreach ($topic in $Manifest.Keys) {
    $topicDir = Join-Path $ExportsRoot $topic
    New-Item -ItemType Directory -Force -Path $topicDir | Out-Null
    foreach ($file in $Manifest[$topic]) {
        $src = Join-Path $DiagramsRoot $file
        if (-not (Test-Path $src)) {
            Write-Warning "Missing source: $file"
            continue
        }
        $pngName = [IO.Path]::ChangeExtension($file, ".png")
        $dest = Join-Path $topicDir $pngName
        Export-One -Source $src -DestPng $dest
    }
}

# clean accidental test folder
$testDir = Join-Path $ExportsRoot "_test"
if (Test-Path $testDir) { Remove-Item $testDir -Recurse -Force }

Write-Host ""
Write-Host "Done. PNGs are under Exports/<topic>/ alongside README descriptions."
