@description('Azure region.')
param location string
@description('Endpoint name.')
param name string
@description('Target Azure resource ID.')
param targetId string
@description('Target service group, such as blob or sites.')
param groupId string
@description('Dedicated undelegated endpoint subnet ID.')
param subnetId string
@description('Existing linked service-specific private DNS zone.')
param dnsZoneName string
@description('Nonsecret resource tags.')
param tags object

resource zone 'Microsoft.Network/privateDnsZones@2020-06-01' existing = {
  name: dnsZoneName
}
resource endpoint 'Microsoft.Network/privateEndpoints@2024-05-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    subnet: { id: subnetId }
    privateLinkServiceConnections: [
      {
        name: groupId
        properties: { privateLinkServiceId: targetId, groupIds: [groupId] }
      }
    ]
  }
}
resource zoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2024-05-01' = {
  parent: endpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [{ name: groupId, properties: { privateDnsZoneId: zone.id } }]
  }
}
