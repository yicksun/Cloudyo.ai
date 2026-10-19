#Requires -Version 7.2
$ErrorActionPreference = 'Stop'
$deploy = Join-Path $PSScriptRoot '..\..\scripts\deploy.ps1'
$build = Join-Path $PSScriptRoot '..\..\scripts\build-deployment.ps1'
$directory = Join-Path ([IO.Path]::GetTempPath()) ("cloudyo-deployment-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $directory | Out-Null
$global:DeploymentTestCalls = [Collections.Generic.List[string]]::new()
$global:DeploymentTestScenario = ''
$global:LASTEXITCODE = 0
$subscription = '00000000-0000-4000-8000-000000000001'
$options = @{
    ArtifactDirectory = $directory
    SubscriptionId = $subscription
    ResourceGroup = 'synthetic-rg'
    WebAppName = 'synthetic-web'
    FunctionAppName = 'synthetic-worker'
    SiteUrl = 'https://synthetic.example'
    HealthTimeoutSeconds = 1
}
function Assert-True([bool]$Value, [string]$Message) {
    if (-not $Value) { throw $Message }
}
function Expect-Failure([scriptblock]$Action, [string]$Pattern) {
    $failed = $false
    try { & $Action } catch {
        $failed = $true
        if ($_.Exception.Message -notmatch $Pattern) { throw "Unexpected failure: $($_.Exception.Message)" }
    }
    Assert-True $failed "Expected failure matching: $Pattern"
}
function global:az {
    $command = $args -join ' '
    $global:DeploymentTestCalls.Add($command)
    $global:LASTEXITCODE = 0
    if ($global:DeploymentTestScenario -eq 'cli-failure') { $global:LASTEXITCODE = 7; return }
    if ($command -match '^account show ') { return '{"id":"00000000-0000-4000-8000-000000000001"}' }
    if ($command -match '^(webapp|functionapp) show ') { return '{"reserved":true,"httpsOnly":true,"serverFarmId":"/synthetic/plan"}' }
    if ($command -match '^appservice plan show ') { return '{"sku":{"tier":"ElasticPremium"}}' }
    if ($command -match '^webapp config show ') { return '{"linuxFxVersion":"NODE|22-lts","appCommandLine":"node apps/web/server.js","healthCheckPath":"/health/ready"}' }
    if ($command -match '^webapp config appsettings list ') {
        $settings = @{
            DATABASE_URL = 'synthetic-reference'; OUTBOX_ENCRYPTION_KEY = 'synthetic-reference'
            ABUSE_HASH_SECRET = 'synthetic-reference'; INTERNAL_EMAIL = 'synthetic@example.test'
            SITE_URL = 'https://synthetic.example'; NEXTAUTH_URL = 'https://synthetic.example'
            APP_ENV = 'staging'; NEXTAUTH_SECRET = 'synthetic-reference'
            ENTRA_TENANT_ID = 'synthetic-reference'; ENTRA_CLIENT_ID = 'synthetic-reference'; ENTRA_CLIENT_SECRET = 'synthetic-reference'
            SCM_DO_BUILD_DURING_DEPLOYMENT = 'false'; ENABLE_ORYX_BUILD = 'false'
            PUBLIC_CONTENT_MODE = 'database'; HOSTNAME = '0.0.0.0'
            FUNCTIONS_WORKER_RUNTIME = 'node'; FUNCTIONS_EXTENSION_VERSION = '~4'
            WEBSITE_RUN_FROM_PACKAGE = '1'; AzureWebJobsStorage__accountName = 'syntheticstorage'
            EMAIL_MODE = 'disabled'
        }
        foreach ($name in @('dispatch', 'sendEmail', 'emailDelivery', 'mediaScan', 'poison', 'maintenance')) {
            $settings["AzureWebJobs.$name.Disabled"] = 'true'
        }
        if ($global:DeploymentTestScenario -eq 'active-worker') { $settings['AzureWebJobs.dispatch.Disabled'] = 'false' }
        if ($global:DeploymentTestScenario -eq 'missing-secret') { $settings.Remove('NEXTAUTH_SECRET') }
        if ($global:DeploymentTestScenario -eq 'production') { $settings['APP_ENV'] = 'production' }
        return ConvertTo-Json -InputObject @($settings.GetEnumerator() | ForEach-Object { @{name=$_.Key;value=$_.Value} })
    }
    if ($command -match '^functionapp deployment source config-zip ') {
        if ($global:DeploymentTestScenario -eq 'worker-upload-failure') { $global:LASTEXITCODE = 7 }
        return
    }
    if ($command -match '^webapp deploy ') { return }
    throw "Unexpected mocked Azure command: $command"
}
function global:Invoke-WebRequest {
    if ($global:DeploymentTestScenario -eq 'wrong-readiness') { return @{ StatusCode = 200; Content = '<html>Not the readiness endpoint</html>' } }
    return @{ StatusCode = 200; Content = '{"status":"ready"}' }
}
try {
    foreach ($name in @('web.zip', 'worker.zip')) { [IO.File]::WriteAllText((Join-Path $directory $name), "synthetic $name fixture") }
    $manifest = @{
        schemaVersion = 1; sourceCommit = ('a' * 40); platform = 'linux'; architecture = 'x64'; nodeMajor = 22
        files = @{
            'web.zip' = (Get-FileHash (Join-Path $directory 'web.zip') -Algorithm SHA256).Hash.ToLowerInvariant()
            'worker.zip' = (Get-FileHash (Join-Path $directory 'worker.zip') -Algorithm SHA256).Hash.ToLowerInvariant()
        }
    }
    [IO.File]::WriteAllText((Join-Path $directory 'manifest.json'), ($manifest | ConvertTo-Json))
    & $deploy @options
    Assert-True ($global:DeploymentTestCalls.Count -eq 0) 'Plan mode must make no Azure calls.'
    & $build -OutputDirectory $directory -ReleaseName 'what-if' -WhatIf
    Assert-True (-not (Test-Path (Join-Path $directory 'what-if'))) 'Build preview must not create output or require Docker.'
    Expect-Failure { & $deploy @options -Execute } 'MigrationsApplied'
    Expect-Failure { & $deploy @options -Execute -MigrationsApplied -WebSlot production -FunctionSlot production } 'ProductionApproved'
    Assert-True ($global:DeploymentTestCalls.Count -eq 0) 'Release acknowledgments must be checked before Azure calls.'
    Expect-Failure { & $deploy @options -WebSlot production } 'same environment'
    [IO.File]::AppendAllText((Join-Path $directory 'web.zip'), 'tampered')
    Expect-Failure { & $deploy @options } 'integrity check failed'
    [IO.File]::WriteAllText((Join-Path $directory 'web.zip'), 'synthetic web.zip fixture')
    $manifest.architecture = 'arm64'
    [IO.File]::WriteAllText((Join-Path $directory 'manifest.json'), ($manifest | ConvertTo-Json))
    Expect-Failure { & $deploy @options } 'Linux x64 Node 22'
    $manifest.architecture = 'x64'
    [IO.File]::WriteAllText((Join-Path $directory 'manifest.json'), ($manifest | ConvertTo-Json))
    foreach ($scenario in @('active-worker', 'missing-secret', 'cli-failure')) {
        $global:DeploymentTestScenario = $scenario
        $global:DeploymentTestCalls.Clear()
        $pattern = switch ($scenario) { 'active-worker' { 'not disabled' }; 'missing-secret' { 'NEXTAUTH_SECRET' }; 'cli-failure' { 'exit 7' } }
        Expect-Failure { & $deploy @options -Execute -MigrationsApplied } $pattern
        Assert-True (-not ($global:DeploymentTestCalls | Where-Object { $_ -match '^webapp deploy |^functionapp deployment ' })) 'Preflight failure must not upload either app.'
    }
    $global:DeploymentTestScenario = ''
    $global:DeploymentTestCalls.Clear()
    & $deploy @options -Execute -MigrationsApplied
    $uploads = @($global:DeploymentTestCalls | Where-Object { $_ -match '^webapp deploy |^functionapp deployment ' })
    Assert-True ($uploads.Count -eq 2) 'Exactly two artifact uploads are required.'
    Assert-True ($uploads[0] -match 'config-zip .*--slot staging.*--build-remote false') 'Worker upload must target the explicit slot without remote rebuilding.'
    Assert-True ($uploads[1] -match '^webapp deploy .*--slot staging') 'Web upload must target the explicit slot.'
    foreach ($command in $global:DeploymentTestCalls) {
        Assert-True ($command -match "--subscription $subscription") 'Every Azure command must explicitly scope the subscription.'
        Assert-True ($command -notmatch 'appsettings set|slot swap|group create|account set') 'Deployment must not change settings, swap slots or provision resources.'
    }
    $global:DeploymentTestScenario = 'production'
    $global:DeploymentTestCalls.Clear()
    & $deploy @options -Execute -MigrationsApplied -ProductionApproved -WebSlot production -FunctionSlot production
    $uploads = @($global:DeploymentTestCalls | Where-Object { $_ -match '^webapp deploy |^functionapp deployment ' })
    Assert-True ($uploads.Count -eq 2 -and -not ($uploads | Where-Object { $_ -match '--slot' })) 'Approved production uploads must omit --slot rather than target a slot named production.'
    $global:DeploymentTestScenario = 'worker-upload-failure'
    $global:DeploymentTestCalls.Clear()
    Expect-Failure { & $deploy @options -Execute -MigrationsApplied } 'exit 7'
    Assert-True (-not ($global:DeploymentTestCalls | Where-Object { $_ -match '^webapp deploy ' })) 'A failed worker upload must stop the web upload.'
    $global:DeploymentTestScenario = 'wrong-readiness'
    Expect-Failure { & $deploy @options -Execute -MigrationsApplied } 'readiness failed'
    $repository = Join-Path $directory 'build-repository'
    $fixtureScripts = Join-Path $repository 'scripts'
    New-Item -ItemType Directory -Path $fixtureScripts -Force | Out-Null
    Copy-Item -LiteralPath $build -Destination $fixtureScripts
    [IO.File]::WriteAllText((Join-Path $repository 'package.json'), '{"name":"synthetic-release"}')
    [IO.File]::WriteAllText((Join-Path $repository '.gitignore'), '.env')
    [IO.File]::WriteAllText((Join-Path $repository '.env'), 'synthetic ignored fixture, never a real credential')
    & git -C $repository init --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Could not initialize the isolated Git fixture.' }
    & git -C $repository add .
    if ($LASTEXITCODE -ne 0) { throw 'Could not stage the Git fixture.' }
    & git -C $repository -c user.name=Synthetic -c user.email=synthetic@example.test -c commit.gpgsign=false -c "core.hooksPath=$fixtureScripts" commit --quiet -m fixture
    if ($LASTEXITCODE -ne 0) { throw 'Could not commit the Git fixture.' }
    $global:BuildTestCommit = & git -C $repository rev-parse HEAD
    $global:BuildTestCalls = 0
    $global:BuildTestContext = ''
    function global:docker {
        $global:BuildTestCalls++
        $global:BuildTestContext = Split-Path (Get-Location).Path -Parent
        Assert-True (-not (Test-Path '.env') -and -not (Test-Path '.git')) 'Docker must see only archived commit contents, never ignored secrets or Git metadata.'
        Assert-True (($args -join ' ') -match "--platform linux/amd64.*SOURCE_COMMIT=$global:BuildTestCommit") 'Docker must receive the Linux target and exact archived source commit.'
        $outputIndex = [array]::IndexOf($args, '--output')
        $output = $args[$outputIndex + 1] -replace '^type=local,dest=', ''
        New-Item -ItemType Directory -Path $output -Force | Out-Null
        foreach ($name in @('web.zip', 'worker.zip', 'manifest.json')) { [IO.File]::WriteAllText((Join-Path $output $name), 'synthetic Docker output') }
        $global:LASTEXITCODE = 0
    }
    $fixtureBuilder = Join-Path $fixtureScripts 'build-deployment.ps1'
    $releases = Join-Path $directory 'built-releases'
    & $fixtureBuilder -OutputDirectory $releases -ReleaseName archived-source
    Assert-True ($global:BuildTestCalls -eq 1) 'The builder must invoke Docker once.'
    Assert-True (-not (Test-Path -LiteralPath $global:BuildTestContext)) 'The exact allocated build context must be cleaned up.'
    Expect-Failure { & $fixtureBuilder -OutputDirectory $releases -ReleaseName archived-source } 'Output already exists'
    [IO.File]::AppendAllText((Join-Path $repository 'package.json'), 'dirty')
    Expect-Failure { & $fixtureBuilder -OutputDirectory $releases -ReleaseName dirty-source } 'Commit the release sources'
    Assert-True ($global:BuildTestCalls -eq 1) 'Dirty sources and existing output must be rejected before Docker.'
    Write-Host 'Deployment safety tests passed (synthetic CLI and HTTP only; no Azure contact).'
} finally {
    Remove-Item -LiteralPath $directory -Recurse -Force
    Remove-Item Function:\az, Function:\Invoke-WebRequest
    Remove-Variable DeploymentTestCalls, DeploymentTestScenario -Scope Global
    Remove-Item Function:\docker -ErrorAction SilentlyContinue
    Remove-Variable BuildTestCommit, BuildTestCalls, BuildTestContext -Scope Global -ErrorAction SilentlyContinue
}
