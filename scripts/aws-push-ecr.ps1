#!/usr/bin/env pwsh
# Requires: aws CLI logged in, docker running, region us-east-1
$ErrorActionPreference = "Stop"
$Region = "us-east-1"
$Repo = "inside-api"

Write-Host "Checking AWS identity..."
$ident = aws sts get-caller-identity --output json | ConvertFrom-Json
$Account = $ident.Account
Write-Host "Account=$Account User=$($ident.Arn)"

aws configure set region $Region

Write-Host "Ensuring ECR repository $Repo..."
aws ecr describe-repositories --repository-names $Repo --region $Region 2>$null
if ($LASTEXITCODE -ne 0) {
  aws ecr create-repository --repository-name $Repo --region $Region | Out-Null
}

$Uri = "$Account.dkr.ecr.$Region.amazonaws.com/$Repo"
Write-Host "Logging into ECR $Uri..."
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $Uri

Write-Host "Building image (this may take several minutes)..."
docker build -t $Repo .

docker tag "${Repo}:latest" "${Uri}:latest"
Write-Host "Pushing ${Uri}:latest ..."
docker push "${Uri}:latest"

Write-Host ""
Write-Host "Done. Image: ${Uri}:latest"
Write-Host "Next: create RDS + App Runner (see docs/deploy/aws-app-runner.md)"
