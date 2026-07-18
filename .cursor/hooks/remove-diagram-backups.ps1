# Removes draw.io / editor backup files left next to diagrams.
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Get-ChildItem -Path $root -Recurse -Force -File -ErrorAction SilentlyContinue |
  Where-Object {
    $_.Name -match '\.bkp$' -or
    $_.Name -match '\.bak$' -or
    $_.Name -match '^\.~.+\.drawio'
  } |
  ForEach-Object {
    Remove-Item -LiteralPath $_.FullName -Force -ErrorAction SilentlyContinue
  }

# Hooks expect JSON on stdout when applicable; empty object is fine.
Write-Output '{}'
