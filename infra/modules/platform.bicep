@description('Azure region.')
param location string
@description('Resource name prefix.')
param prefix string
@description('Globally distinguishing suffix.')
param suffix string
@description('Nonsecret tags.')
param tags object
@description('Owner-approved production enquiry recipient.')
param internalEmail string
@description('Real single-tenant Entra application client ID.')
param entraClientId string
@description('Secure application and database credentials.')
@secure()
param secrets object
@description('Unix expiry for the supplied credentials; rotation must precede expiry.')
param secretExpirationEpoch int
@description('Whether the temporary release egress window is enabled.')
param releaseNetworkEnabled bool

module network './network.bicep' = {
  name: 'network'
  params: { location: location, prefix: prefix, tags: tags, releaseNetworkEnabled: releaseNetworkEnabled }
}
module storage './storage.bicep' = {
  name: 'storage'
  params: { location: location, suffix: suffix, tags: tags }
}
module edge './edge.bicep' = {
  name: 'edge'
  params: { prefix: prefix, tags: tags }
}
resource identities 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = [for name in ['web', 'worker', 'release']: {
  name: 'id-${prefix}-${name}'
  location: location
  tags: tags
}]
resource vault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'kv-${prefix}'
  location: location
  tags: tags
  properties: {
    tenantId: tenant().tenantId
    sku: { name: 'standard', family: 'A' }
    enableRbacAuthorization: true
    enableSoftDelete: true
    enablePurgeProtection: true
    softDeleteRetentionInDays: 7
    publicNetworkAccess: 'Disabled'
    networkAcls: { defaultAction: 'Deny', bypass: 'None' }
    accessPolicies: []
  }
}
resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2025-08-01' = {
  name: 'psql-${prefix}'
  location: location
  tags: tags
  sku: { name: 'Standard_B1ms', tier: 'Burstable' }
  properties: {
    version: '18'
    administratorLogin: 'cloudyo_admin'
    // The containing object is a secure parameter; this property never appears in outputs.
    #disable-next-line use-secure-value-for-secure-inputs
    administratorLoginPassword: secrets.databaseAdminPassword
    authConfig: { activeDirectoryAuth: 'Disabled', passwordAuth: 'Enabled' }
    storage: { storageSizeGB: 32, autoGrow: 'Enabled' }
    backup: { backupRetentionDays: 7, geoRedundantBackup: 'Disabled' }
    highAvailability: { mode: 'Disabled' }
    network: {
      delegatedSubnetResourceId: network.outputs.postgresSubnetId
      privateDnsZoneArmResourceId: network.outputs.postgresDnsId
    }
  }
}
resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2025-08-01' = {
  parent: postgres
  name: 'cloudyo_production'
  properties: { charset: 'UTF8', collation: 'en_US.utf8' }
}
resource requireTls 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2025-08-01' = {
  parent: postgres
  name: 'require_secure_transport'
  properties: { value: 'on', source: 'user-override' }
}
resource minimumTls 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2025-08-01' = {
  parent: postgres
  name: 'ssl_min_protocol_version'
  properties: { value: 'TLSv1.2', source: 'user-override' }
}
resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'log-${prefix}'
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
    workspaceCapping: { dailyQuotaGb: json('0.1') }
    features: { disableLocalAuth: true }
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}
resource insights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-${prefix}'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logs.id
    DisableLocalAuth: true
  }
}
resource metrics 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for i in range(0, 2): {
  name: guid(insights.id, identities[i].id, 'Monitoring Metrics Publisher')
  scope: insights
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '3913510d-42f4-4e42-8a64-420c390055eb')
    principalId: identities[i].properties.principalId
    principalType: 'ServicePrincipal'
  }
}]
resource host 'Microsoft.Storage/storageAccounts@2023-05-01' existing = { name: 'stcloudyoprd${suffix}host' }
var dbTail = '@${postgres.properties.fullyQualifiedDomainName}:5432/${database.name}?sslmode=require&sslaccept=strict&connection_limit=5'
var secretDefinitions = [
  { name: 'database-admin-url', value: 'postgresql://cloudyo_admin:${uriComponent(secrets.databaseAdminPassword)}${dbTail}', readers: [identities[2].properties.principalId] }
  { name: 'database-migration-url', value: 'postgresql://cloudyo_migrator:${uriComponent(secrets.migrationDatabasePassword)}${dbTail}', readers: [identities[2].properties.principalId] }
  { name: 'database-web-url', value: 'postgresql://cloudyo_web:${uriComponent(secrets.webDatabasePassword)}${dbTail}', readers: [identities[0].properties.principalId, identities[2].properties.principalId] }
  { name: 'database-worker-url', value: 'postgresql://cloudyo_worker:${uriComponent(secrets.workerDatabasePassword)}${dbTail}', readers: [identities[1].properties.principalId, identities[2].properties.principalId] }
  { name: 'outbox-encryption-key', value: secrets.outboxEncryptionKey, readers: [identities[0].properties.principalId, identities[1].properties.principalId] }
  { name: 'abuse-hash-secret', value: secrets.abuseHashSecret, readers: [identities[0].properties.principalId, identities[1].properties.principalId] }
  { name: 'nextauth-secret', value: secrets.nextauthSecret, readers: [identities[0].properties.principalId] }
  { name: 'entra-client-secret', value: secrets.entraClientSecret, readers: [identities[0].properties.principalId] }
  { name: 'worker-content-connection', value: 'DefaultEndpointsProtocol=https;AccountName=${host.name};AccountKey=${host.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}', readers: [identities[1].properties.principalId] }
]
module secretValues './secret.bicep' = [for i in range(0, 9): {
  name: 'secret-${i}'
  params: {
    vaultName: vault.name
    name: secretDefinitions[i].name
    value: secretDefinitions[i].value
    expirationEpoch: secretExpirationEpoch
    readers: secretDefinitions[i].readers
  }
  dependsOn: [storage]
}]
module apps './compute.bicep' = {
  name: 'compute'
  params: {
    location: location
    prefix: prefix
    tags: tags
    webIdentityId: identities[0].id
    webClientId: identities[0].properties.clientId
    workerIdentityId: identities[1].id
    workerClientId: identities[1].properties.clientId
    releasePrincipalId: identities[2].properties.principalId
    webSubnetId: network.outputs.webSubnetId
    workerSubnetId: network.outputs.workerSubnetId
    vaultUri: vault.properties.vaultUri
    hostStorageName: storage.outputs.hostName
    businessBlobUrl: storage.outputs.blobEndpoint
    businessQueueUrl: storage.outputs.queueEndpoint
    insightsConnectionString: insights.properties.ConnectionString
    siteUrl: edge.outputs.siteUrl
    frontDoorId: edge.outputs.frontDoorId
    internalEmail: internalEmail
    entraClientId: entraClientId
  }
  dependsOn: [secretValues]
}
module storageRoles './storage-roles.bicep' = {
  name: 'storage-roles'
  params: {
    businessName: storage.outputs.businessName
    hostName: storage.outputs.hostName
    webPrincipalId: identities[0].properties.principalId
    workerPrincipalId: identities[1].properties.principalId
  }
}
var endpointDefinitions = [
  { name: 'appblob', target: storage.outputs.businessId, group: 'blob', zone: 'privatelink.blob.${environment().suffixes.storage}' }
  { name: 'appqueue', target: storage.outputs.businessId, group: 'queue', zone: 'privatelink.queue.${environment().suffixes.storage}' }
  { name: 'hostblob', target: storage.outputs.hostId, group: 'blob', zone: 'privatelink.blob.${environment().suffixes.storage}' }
  { name: 'hostqueue', target: storage.outputs.hostId, group: 'queue', zone: 'privatelink.queue.${environment().suffixes.storage}' }
  { name: 'hosttable', target: storage.outputs.hostId, group: 'table', zone: 'privatelink.table.${environment().suffixes.storage}' }
  { name: 'hostfile', target: storage.outputs.hostId, group: 'file', zone: 'privatelink.file.${environment().suffixes.storage}' }
  { name: 'vault', target: vault.id, group: 'vault', zone: 'privatelink.vaultcore.azure.net' }
  { name: 'web', target: apps.outputs.webId, group: 'sites', zone: 'privatelink.azurewebsites.net' }
  { name: 'worker', target: apps.outputs.workerId, group: 'sites', zone: 'privatelink.azurewebsites.net' }
]
module endpoints './private-endpoint.bicep' = [for i in range(0, 9): {
  name: 'endpoint-${i}'
  params: {
    location: location
    name: 'pep-${prefix}-${endpointDefinitions[i].name}'
    targetId: endpointDefinitions[i].target
    groupId: endpointDefinitions[i].group
    dnsZoneName: endpointDefinitions[i].zone
    subnetId: network.outputs.endpointSubnetId
    tags: tags
  }
}]
module edgeRoute './edge-route.bicep' = {
  name: 'edge-route'
  params: {
    profileName: edge.outputs.profileName
    endpointName: edge.outputs.endpointName
    webHostname: apps.outputs.webHostname
  }
}

output endpoints object = {
  siteUrl: edge.outputs.siteUrl
  webHostname: apps.outputs.webHostname
  workerHostname: apps.outputs.workerHostname
}
output releaseTargets object = {
  webAppName: apps.outputs.webName
  functionAppName: apps.outputs.workerName
  webId: apps.outputs.webId
  workerId: apps.outputs.workerId
  releaseIdentityId: identities[2].id
  releaseClientId: identities[2].properties.clientId
  releaseSubnetId: network.outputs.releaseSubnetId
  vaultUri: vault.properties.vaultUri
  applicationCommit: '56ee2b6e3c54483ec5f8d89d86c381ef473c1bfb'
}
