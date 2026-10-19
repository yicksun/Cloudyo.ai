#Requires -Version 7.2
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$ArtifactDirectory,
    [Parameter(Mandatory)][guid]$SubscriptionId,
    [Parameter(Mandatory)][ValidatePattern('^[a-zA-Z0-9_.()-]+$')][string]$ResourceGroup,
    [Parameter(Mandatory)][ValidatePattern('^[a-zA-Z0-9-]+$')][string]$WebAppName,
    [Parameter(Mandatory)][ValidatePattern('^[a-zA-Z0-9-]+$')][string]$FunctionAppName,
    [Parameter(Mandatory)][uri]$SiteUrl,
    [ValidatePattern('^[a-zA-Z0-9-]+$')][string]$WebSlot = 'staging',
    [ValidatePattern('^[a-zA-Z0-9-]+$')][string]$FunctionSlot = 'staging',
    [ValidateRange(1, 1800)][int]$HealthTimeoutSeconds = 180,
    [switch]$Execute,
    [switch]$MigrationsApplied,
    [switch]$ProductionApproved,
    [switch]$BackgroundProcessingApproved
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Invoke-Azure {
    param([string[]]$Arguments, [switch]$Json)
    $format = if ($Json) { 'json' } else { 'none' }
    $result = & az @Arguments --only-show-errors --output $format
    if ($LASTEXITCODE -ne 0) { throw "Azure CLI failed (exit $LASTEXITCODE) during '$($Arguments[0..1] -join ' ')'. Deployment stopped; inspect Azure deployment logs." }
    if ($Json) {
        try { return ($result -join "`n" | ConvertFrom-Json -AsHashtable) }
        catch [System.ArgumentException] { throw 'Azure CLI returned invalid JSON. Response suppressed to protect configuration values.' }
    }
}

function Get-TargetArguments {
    param([string]$Name, [string]$Slot)
    $result = @('--subscription', "$SubscriptionId", '--resource-group', $ResourceGroup, '--name', $Name)
    if ($Slot -ne 'production') { $result += @('--slot', $Slot) }
    return $result
}

function Get-Settings {
    param([string[]]$Target)
    $result = @{}
    foreach ($item in (Invoke-Azure -Arguments (@('webapp', 'config', 'appsettings', 'list') + $Target) -Json)) {
        $result[$item.name] = $item.value
    }
    return $result
}

function Assert-Settings {
    param([hashtable]$Settings, [string[]]$Required, [string]$Environment)
    foreach ($name in $Required) {
        if (-not $Settings.ContainsKey($name) -or [string]::IsNullOrWhiteSpace($Settings[$name])) { throw "Missing required app setting: $name. Configure it before deploying; values are never printed." }
    }
    foreach ($name in @('SCM_DO_BUILD_DURING_DEPLOYMENT', 'ENABLE_ORYX_BUILD')) {
        if ($Settings[$name] -notin @('false', '0')) { throw "$name must be explicitly false for prebuilt artifacts." }
    }
    if ($Settings['APP_ENV'] -ne $Environment) { throw "APP_ENV must match the target environment ($Environment)." }
    if ($Settings['SITE_URL'].TrimEnd('/') -ne $origin) { throw 'SITE_URL must match -SiteUrl on both target slots.' }
}

if ($SubscriptionId -eq [guid]::Empty) { throw 'Supply a real subscription ID.' }
if ($SiteUrl.Scheme -ne 'https' -or $SiteUrl.UserInfo -or $SiteUrl.Query -or $SiteUrl.Fragment -or $SiteUrl.AbsolutePath -ne '/') {
    throw 'SiteUrl must be an HTTPS origin, without credentials, path, query or fragment.'
}
$origin = $SiteUrl.GetLeftPart([UriPartial]::Authority).TrimEnd('/')
$production = $WebSlot -eq 'production'
if ($production -ne ($FunctionSlot -eq 'production')) { throw 'Web and worker must target the same environment; do not mix production and staging.' }
$environment = if ($production) { 'production' } else { 'staging' }
$directory = (Resolve-Path -LiteralPath $ArtifactDirectory).Path
$manifest = Get-Content -Raw -LiteralPath (Join-Path $directory 'manifest.json') | ConvertFrom-Json -AsHashtable
if ($manifest.schemaVersion -ne 1 -or $manifest.platform -ne 'linux' -or $manifest.architecture -ne 'x64' -or $manifest.nodeMajor -ne 22 -or $manifest.sourceCommit -notmatch '^[a-f0-9]{40}$') {
    throw 'Expected a versioned Linux x64 Node 22 release manifest.'
}
foreach ($name in @('web.zip', 'worker.zip')) {
    if ($manifest.files[$name] -notmatch '^[a-f0-9]{64}$' -or (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $directory $name)).Hash -ne $manifest.files[$name]) {
        throw "Artifact integrity check failed: $name"
    }
}
Write-Host "Commit: $($manifest.sourceCommit)"
Write-Host "Subscription: $SubscriptionId | Resource group: $ResourceGroup"
Write-Host "Web: $WebAppName/$WebSlot | Worker: $FunctionAppName/$FunctionSlot"
Write-Host "Site: $origin | Environment: $environment"
if (-not $Execute) {
    Write-Host 'PLAN ONLY: no Azure calls, database migrations, settings changes, deployment, slot swap or DNS changes.'
    return
}
if (-not $MigrationsApplied) { throw 'Apply reviewed, backward-compatible migrations first; acknowledge with -MigrationsApplied.' }
if ($production -and -not $ProductionApproved) { throw 'Production deployment requires -ProductionApproved after release approval.' }
Get-Command az -ErrorAction Stop | Out-Null
$account = Invoke-Azure -Arguments @('account', 'show', '--subscription', "$SubscriptionId") -Json
if ($account.id -ne "$SubscriptionId") { throw 'Azure account does not match the requested subscription.' }
$webTarget = @(Get-TargetArguments $WebAppName $WebSlot)
$workerTarget = @(Get-TargetArguments $FunctionAppName $FunctionSlot)
$web = Invoke-Azure -Arguments (@('webapp', 'show') + $webTarget) -Json
$worker = Invoke-Azure -Arguments (@('functionapp', 'show') + $workerTarget) -Json
foreach ($app in @($web, $worker)) {
    if (-not $app.reserved -or -not $app.httpsOnly) { throw 'Both existing apps must use Linux and HTTPS-only hosting.' }
}
$plan = Invoke-Azure -Arguments @('appservice', 'plan', 'show', '--ids', $worker.serverFarmId, '--subscription', "$SubscriptionId") -Json
if ($plan.sku.tier -ne 'ElasticPremium') { throw 'This script targets Linux Elastic Premium Functions. Consumption/Flex/custom-container plans need a different approved deployment strategy.' }
foreach ($target in @(@{ Args = $webTarget; Web = $true }, @{ Args = $workerTarget; Web = $false })) {
    $config = Invoke-Azure -Arguments (@('webapp', 'config', 'show') + $target.Args) -Json
    if ($config.linuxFxVersion -notmatch '^NODE\|22(-lts)?$') { throw 'Both targets must already run the built-in Linux Node 22 stack.' }
    if ($target.Web -and ($config.appCommandLine -ne 'node apps/web/server.js' -or $config.healthCheckPath -ne '/health/ready')) {
        throw 'Configure web startup as node apps/web/server.js and health check as /health/ready.'
    }
}
$webSettings = Get-Settings $webTarget
$workerSettings = Get-Settings $workerTarget
$common = @('DATABASE_URL', 'OUTBOX_ENCRYPTION_KEY', 'ABUSE_HASH_SECRET', 'INTERNAL_EMAIL', 'SITE_URL', 'APP_ENV')
Assert-Settings $webSettings ($common + @('NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'ENTRA_TENANT_ID', 'ENTRA_CLIENT_ID', 'ENTRA_CLIENT_SECRET')) $environment
Assert-Settings $workerSettings ($common + @('FUNCTIONS_WORKER_RUNTIME', 'FUNCTIONS_EXTENSION_VERSION', 'EMAIL_MODE')) $environment
if ($webSettings['NEXTAUTH_URL'].TrimEnd('/') -ne $origin -or $webSettings['PUBLIC_CONTENT_MODE'] -ne 'database' -or $webSettings['HOSTNAME'] -ne '0.0.0.0') {
    throw 'Web NEXTAUTH_URL, PUBLIC_CONTENT_MODE=database and HOSTNAME=0.0.0.0 must be configured.'
}
if ($workerSettings['FUNCTIONS_WORKER_RUNTIME'] -ne 'node' -or $workerSettings['FUNCTIONS_EXTENSION_VERSION'] -ne '~4' -or $workerSettings['WEBSITE_RUN_FROM_PACKAGE'] -ne '1') {
    throw 'Worker requires Node, Functions ~4 and WEBSITE_RUN_FROM_PACKAGE=1.'
}
if (-not $workerSettings['AzureWebJobsStorage'] -and -not $workerSettings['AzureWebJobsStorage__accountName'] -and -not $workerSettings['AzureWebJobsStorage__blobServiceUri']) {
    throw 'Configure Functions host storage independently from business queues.'
}
$functions = @('dispatch', 'sendEmail', 'emailDelivery', 'mediaScan', 'poison', 'maintenance')
if (-not $BackgroundProcessingApproved) {
    foreach ($name in $functions) {
        if ($workerSettings["AzureWebJobs.$name.Disabled"] -notin @('true', '1')) {
            throw "Worker function $name is not disabled. Pause all six functions or explicitly acknowledge processing with -BackgroundProcessingApproved."
        }
    }
    if ($workerSettings['EMAIL_MODE'] -ne 'disabled') { throw 'EMAIL_MODE must be disabled unless background processing is explicitly approved.' }
}
Write-Host 'Preflight passed. Replacing worker code, then web code; this is not an atomic two-app deployment.'
Invoke-Azure -Arguments (@('functionapp', 'deployment', 'source', 'config-zip') + $workerTarget + @('--src', (Join-Path $directory 'worker.zip'), '--build-remote', 'false', '--timeout', '600'))
Invoke-Azure -Arguments (@('webapp', 'deploy') + $webTarget + @('--src-path', (Join-Path $directory 'web.zip'), '--type', 'zip', '--clean', 'true', '--restart', 'true', '--async', 'false'))
$deadline = [DateTime]::UtcNow.AddSeconds($HealthTimeoutSeconds)
$ready = $false
do {
    try {
        $response = Invoke-WebRequest -Uri "$origin/health/ready" -MaximumRedirection 0 -TimeoutSec 15 -SkipHttpErrorCheck
        $ready = $response.StatusCode -eq 200 -and $response.Content -match '^\s*\{\s*"status"\s*:\s*"ready"\s*\}\s*$'
    } catch [System.Net.Http.HttpRequestException] {
        Write-Warning 'Readiness connection failed; retrying within the configured deadline.'
    } catch [System.Threading.Tasks.TaskCanceledException] {
        Write-Warning 'Readiness request timed out; retrying within the configured deadline.'
    }
    if (-not $ready -and [DateTime]::UtcNow -lt $deadline) { Start-Sleep -Seconds 5 }
} while (-not $ready -and [DateTime]::UtcNow -lt $deadline)
if (-not $ready) { throw 'Code was uploaded but web readiness failed. Both apps may have changed. Follow DEPLOYMENT.md; no automatic rollback or schema reversal was attempted.' }
Write-Host 'Code uploaded and web readiness passed. Verify the Functions host, triggers, identity, email and storage before promotion.'
