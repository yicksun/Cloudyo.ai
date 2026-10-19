@description('Resource name prefix.')
param prefix string
@description('Nonsecret resource tags.')
param tags object

resource profile 'Microsoft.Cdn/profiles@2024-02-01' = {
  name: 'afd-${prefix}'
  location: 'global'
  tags: tags
  sku: { name: 'Standard_AzureFrontDoor' }
  properties: { originResponseTimeoutSeconds: 60 }
}
resource endpoint 'Microsoft.Cdn/profiles/afdEndpoints@2024-02-01' = {
  parent: profile
  name: prefix
  location: 'global'
  properties: { enabledState: 'Enabled' }
}
output profileId string = profile.id
output profileName string = profile.name
output frontDoorId string = profile.properties.frontDoorId
output endpointName string = endpoint.name
output siteUrl string = 'https://${endpoint.properties.hostName}'
