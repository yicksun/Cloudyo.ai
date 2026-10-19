#Requires -Version 7.2
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$ParameterFile,
    [ValidateSet('Validate', 'WhatIf', 'Deploy')][string]$Mode = 'Validate',
    [guid]$SubscriptionId = 'db78cda5-d94e-4802-9b5c-e930f496cd18',
    [switch]$RiskAcknowledged,
    [switch]$RegisterProviders
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$root = Split-Path $PSScriptRoot -Parent
$expectedSubscription = 'db78cda5-d94e-4802-9b5c-e930f496cd18'
if ("$SubscriptionId" -ne $expectedSubscription) { throw 'Subscription is outside the approved production scope.' }
$plan = Get-Content -LiteralPath (Join-Path $root '.azure\infrastructure-plan.json') -Raw | ConvertFrom-Json
if ($plan.meta.status -notin @('approved', 'deployed') -or -not $plan.plan.approval.productionApproved) {
    throw 'Explicit production architecture approval is required.'
}
if ($Mode -eq 'Deploy' -and (-not $RiskAcknowledged -or -not $plan.plan.approval.spendingApproved)) {
    throw 'Deployment creates billable resources and persistent identities. Review what-if, then supply -RiskAcknowledged.'
}
if ($RegisterProviders -and $Mode -ne 'Deploy') { throw 'Provider registration is a write operation; it is not part of Validate or WhatIf.' }
$parametersPath = (Resolve-Path -LiteralPath $ParameterFile).Path
$document = Get-Content -LiteralPath $parametersPath -Raw | ConvertFrom-Json -AsHashtable
if (-not $document.ContainsKey('parameters')) { throw 'Expected an ARM deployment parameters document.' }
$parameters = $document.parameters
foreach ($setting in @{ resourceGroupName = 'rg-cloudyo-prd-e65d'; location = 'southeastasia'; suffix = 'e65d' }.GetEnumerator()) {
    if ($parameters.ContainsKey($setting.Key) -and $parameters[$setting.Key].value -ne $setting.Value) {
        throw "Parameter $($setting.Key) differs from the approved target."
    }
}
foreach ($name in @('internalEmail', 'entraClientId', 'secrets')) {
    if (-not $parameters.ContainsKey($name) -or -not $parameters[$name].ContainsKey('value')) { throw "Missing required parameter: $name" }
}
if ($parameters.internalEmail.value -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$' -or $parameters.internalEmail.value -match '(?i)example\.(com|org|net)|\.invalid$') {
    throw 'Provide a real enquiry recipient, not a placeholder.'
}
if ($parameters.entraClientId.value -notmatch '^[a-fA-F0-9-]{36}$' -or $parameters.entraClientId.value -eq ([guid]::Empty).ToString()) {
    throw 'Provide a real Entra application client ID.'
}
$secrets = $parameters.secrets.value
foreach ($name in @('databaseAdminPassword', 'webDatabasePassword', 'workerDatabasePassword', 'migrationDatabasePassword', 'outboxEncryptionKey', 'abuseHashSecret', 'nextauthSecret', 'entraClientSecret')) {
    if (-not $secrets.ContainsKey($name) -or $secrets[$name] -isnot [string] -or $secrets[$name].Length -lt 32) {
        throw "Missing or insufficient secret: $name. Values are suppressed."
    }
}
if ($secrets.outboxEncryptionKey -notmatch '^[a-fA-F0-9]{64}$') { throw 'Outbox encryption key must be exactly 64 hexadecimal characters.' }
$passwords = @($secrets.databaseAdminPassword, $secrets.webDatabasePassword, $secrets.workerDatabasePassword, $secrets.migrationDatabasePassword)
if (@($passwords | Select-Object -Unique).Count -ne 4) { throw 'Database roles require independent credentials.' }
Get-Command az -ErrorAction Stop | Out-Null
$account = & az account show --subscription "$SubscriptionId" --query '{id:id,state:state}' --output json --only-show-errors
if ($LASTEXITCODE -ne 0) { throw 'Cannot authenticate to the approved subscription.' }
$accountObject = $account -join "`n" | ConvertFrom-Json
if ($accountObject.id -ne "$SubscriptionId" -or $accountObject.state -ne 'Enabled') { throw 'Unexpected subscription state.' }
$compiled = Join-Path $root '.local\infra\main.json'
New-Item -ItemType Directory -Path (Split-Path $compiled -Parent) -Force | Out-Null
& az bicep build --file (Join-Path $root 'infra\main.bicep') --outfile $compiled
if ($LASTEXITCODE -ne 0) { throw 'Bicep compilation failed.' }
if ($RegisterProviders) {
    foreach ($namespace in @('Microsoft.Network', 'Microsoft.Web', 'Microsoft.DBforPostgreSQL', 'Microsoft.Storage', 'Microsoft.KeyVault', 'Microsoft.ManagedIdentity', 'Microsoft.Cdn', 'Microsoft.Insights', 'Microsoft.OperationalInsights', 'Microsoft.ContainerInstance')) {
        & az provider register --subscription "$SubscriptionId" --namespace $namespace --wait --only-show-errors --output none
        if ($LASTEXITCODE -ne 0) { throw "Provider registration failed: $namespace" }
    }
}
$verb = switch ($Mode) { 'Validate' { 'validate' }; 'WhatIf' { 'what-if' }; 'Deploy' { 'create' } }
$arguments = @('deployment', 'sub', $verb, '--subscription', "$SubscriptionId", '--location', 'southeastasia',
    '--name', 'cloudyo-prd-e65d', '--template-file', $compiled, '--parameters', "@$parametersPath", '--only-show-errors')
if ($Mode -eq 'WhatIf') {
    $arguments += @('--result-format', 'ResourceIdOnly', '--output', 'json')
} else {
    $arguments += @('--output', 'none')
}
Write-Host "$Mode | subscription $SubscriptionId | new resource group rg-cloudyo-prd-e65d | southeastasia"
& az @arguments
if ($LASTEXITCODE -ne 0) { throw "Azure $Mode failed. Stop; do not upload code or assume partial resources were rolled back." }
Write-Host "$Mode succeeded. Infrastructure success is not application deployment or production acceptance."
