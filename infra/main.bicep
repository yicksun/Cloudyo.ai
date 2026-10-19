targetScope = 'subscription'

@description('Approved deployment region. A region change requires a new capacity/cost review.')
param location string = 'southeastasia'

@description('Production resource group. Existing unrelated groups are never referenced or modified.')
param resourceGroupName string = 'rg-cloudyo-prd-e65d'

@description('Globally distinguishing workload suffix.')
@minLength(3)
@maxLength(9)
@allowed(['e65d'])
param suffix string = 'e65d'

@description('The real production enquiry recipient, provided by the owner. Never use a placeholder.')
@minLength(5)
param internalEmail string

@description('Approved single-tenant Entra application client ID.')
param entraClientId string

@description('Application secrets supplied securely at execution: databaseAdminPassword, webDatabasePassword, workerDatabasePassword, migrationDatabasePassword, outboxEncryptionKey, abuseHashSecret, nextauthSecret, entraClientSecret.')
@secure()
param secrets object

@description('Secret expiry, preserved by the deployment operator on redeploy. Rotate before this deadline.')
param secretExpirationEpoch int = dateTimeToEpoch(dateTimeAdd(utcNow(), 'P180D'))

@description('Create temporary release egress only for a separately authorized release window.')
param releaseNetworkEnabled bool = false

var prefix = 'cloudyo-prd-${suffix}'
var tags = {
  application: 'cloudyo'
  environment: 'production'
  managedBy: 'bicep'
}

resource group 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

module platform './modules/platform.bicep' = {
  scope: group
  name: 'cloudyo-platform'
  params: {
    location: location
    prefix: prefix
    suffix: suffix
    tags: tags
    internalEmail: internalEmail
    entraClientId: entraClientId
    secrets: secrets
    secretExpirationEpoch: secretExpirationEpoch
    releaseNetworkEnabled: releaseNetworkEnabled
  }
}

output resourceGroupId string = group.id
output endpoints object = platform.outputs.endpoints
output releaseTargets object = platform.outputs.releaseTargets
