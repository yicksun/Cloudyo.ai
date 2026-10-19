#Requires -Version 7.2
[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\.local\deployments'),
    [ValidatePattern('^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$')]
    [string]$ReleaseName = (Get-Date -Format 'yyyyMMdd-HHmmss')
)

$ErrorActionPreference = 'Stop'
$repository = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$destination = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath((Join-Path $OutputDirectory $ReleaseName))
if (Test-Path -LiteralPath $destination) { throw "Output already exists: $destination. Use a new release name." }
if (-not $PSCmdlet.ShouldProcess($destination, 'Build Linux x64 release using Docker; no Azure operations')) { return }

Get-Command docker -ErrorAction Stop | Out-Null
Get-Command tar -ErrorAction Stop | Out-Null
$context = Join-Path ([IO.Path]::GetTempPath()) ("cloudyo-build-" + [guid]::NewGuid())
$source = Join-Path $context 'source'
Push-Location $repository
try {
    $dirty = & git status --porcelain
    if ($LASTEXITCODE -ne 0) { throw 'Could not inspect the Git working tree.' }
    if ($dirty) { throw 'Commit the release sources before packaging. Ignored local configuration is not included.' }
    $commit = & git rev-parse HEAD
    if ($LASTEXITCODE -ne 0 -or $commit -notmatch '^[a-f0-9]{40}$') { throw 'Could not determine the release commit.' }
    New-Item -ItemType Directory -Path $source -Force | Out-Null
    $archive = Join-Path $context 'source.tar'
    & git archive --format=tar --output $archive $commit
    if ($LASTEXITCODE -ne 0) { throw 'Could not export the exact committed release sources.' }
    & tar -xf $archive -C $source
    if ($LASTEXITCODE -ne 0) { throw 'Could not extract the committed release sources.' }
    Push-Location $source
    try {
        & docker build --platform linux/amd64 --target artifacts --file scripts/deployment.Dockerfile `
            --build-arg "SOURCE_COMMIT=$commit" --output "type=local,dest=$destination" .
        if ($LASTEXITCODE -ne 0) { throw "Linux packaging failed. Inspect the build output. Do not deploy partial output at $destination." }
    } finally {
        Pop-Location
    }
    foreach ($name in @('web.zip', 'worker.zip', 'manifest.json')) {
        if (-not (Test-Path -LiteralPath (Join-Path $destination $name) -PathType Leaf)) { throw "Missing release file: $name" }
    }
    Write-Host "Release packages: $destination"
    Write-Host 'No Azure resources or settings were changed.'
} finally {
    Pop-Location
    if (Test-Path -LiteralPath $context) { Remove-Item -LiteralPath $context -Recurse -Force }
}
