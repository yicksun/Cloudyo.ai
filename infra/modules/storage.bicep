@description('Azure region.')
param location string
@description('Resource suffix.')
param suffix string
@description('Nonsecret resource tags.')
param tags object

resource business 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  // checkov:skip=CKV_AZURE_36:Private endpoints with public access disabled do not need a trusted-services firewall bypass.
  // checkov:skip=CKV_AZURE_43:Main constrains suffix to e65d; the resulting lowercase 18-character name is tested.
  // checkov:skip=CKV_AZURE_206:Approved single-region LRS baseline; regional disaster recovery is not claimed.
  name: 'stcloudyoprd${suffix}app'
  location: location
  tags: tags
  kind: 'StorageV2'
  sku: { name: 'Standard_LRS' }
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    publicNetworkAccess: 'Disabled'
    networkAcls: { bypass: 'None', defaultAction: 'Deny' }
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    defaultToOAuthAuthentication: true
    encryption: { keySource: 'Microsoft.Storage', services: { blob: { enabled: true }, file: { enabled: true } } }
  }
}
resource blob 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: business
  name: 'default'
  properties: {
    deleteRetentionPolicy: { enabled: true, days: 7 }
    containerDeleteRetentionPolicy: { enabled: true, days: 7 }
    isVersioningEnabled: true
  }
}
resource media 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blob
  name: 'media'
  properties: { publicAccess: 'None' }
}
resource queueService 'Microsoft.Storage/storageAccounts/queueServices@2023-05-01' = {
  parent: business
  name: 'default'
  properties: {}
}
resource queues 'Microsoft.Storage/storageAccounts/queueServices/queues@2023-05-01' = [for name in ['cloudyo-email', 'cloudyo-email-poison']: {
  parent: queueService
  name: name
  properties: {}
}]
resource host 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  // checkov:skip=CKV_AZURE_36:Private endpoints with public access disabled do not need a trusted-services firewall bypass.
  // checkov:skip=CKV_AZURE_43:Main constrains suffix to e65d; the resulting lowercase 19-character name is tested.
  // checkov:skip=CKV_AZURE_206:Approved single-region LRS baseline; regional disaster recovery is not claimed.
  name: 'stcloudyoprd${suffix}host'
  location: location
  tags: tags
  kind: 'StorageV2'
  sku: { name: 'Standard_LRS' }
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    publicNetworkAccess: 'Disabled'
    networkAcls: { bypass: 'None', defaultAction: 'Deny' }
    allowBlobPublicAccess: false
    // EP1 Azure Files content mount requires a key; host SDK connections still use managed identity.
    allowSharedKeyAccess: true
    defaultToOAuthAuthentication: true
    encryption: { keySource: 'Microsoft.Storage', services: { blob: { enabled: true }, file: { enabled: true } } }
  }
}
resource hostBlob 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: host
  name: 'default'
  properties: {
    deleteRetentionPolicy: { enabled: true, days: 7 }
    containerDeleteRetentionPolicy: { enabled: true, days: 7 }
    isVersioningEnabled: true
  }
}
resource files 'Microsoft.Storage/storageAccounts/fileServices@2023-05-01' = {
  parent: host
  name: 'default'
  properties: { shareDeleteRetentionPolicy: { enabled: true, days: 7 } }
}
resource share 'Microsoft.Storage/storageAccounts/fileServices/shares@2023-05-01' = {
  parent: files
  name: 'worker-production'
  properties: { enabledProtocols: 'SMB', shareQuota: 5 }
}
output businessId string = business.id
output businessName string = business.name
output blobEndpoint string = business.properties.primaryEndpoints.blob
output queueEndpoint string = business.properties.primaryEndpoints.queue
output hostId string = host.id
output hostName string = host.name
output mediaId string = media.id
