@description('Azure region.')
param location string
@description('Resource name prefix.')
param prefix string
@description('Common nonsecret resource tags.')
param tags object
@description('Whether a temporary release NAT/IP is authorized for this execution window.')
param releaseNetworkEnabled bool

resource nsg 'Microsoft.Network/networkSecurityGroups@2024-05-01' = {
  name: 'nsg-${prefix}'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'deny-internet-inbound'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourceAddressPrefix: 'Internet'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
    ]
  }
}

resource releaseIp 'Microsoft.Network/publicIPAddresses@2024-05-01' = if (releaseNetworkEnabled) {
  name: 'pip-${prefix}-release'
  location: location
  tags: union(tags, { lifecycle: 'temporary-release' })
  sku: { name: 'Standard', tier: 'Regional' }
  properties: { publicIPAllocationMethod: 'Static', publicIPAddressVersion: 'IPv4' }
}

resource releaseNat 'Microsoft.Network/natGateways@2024-05-01' = if (releaseNetworkEnabled) {
  name: 'ng-${prefix}-release'
  location: location
  tags: union(tags, { lifecycle: 'temporary-release' })
  sku: { name: 'Standard' }
  properties: {
    publicIpAddresses: [{ id: releaseIp!.id }]
    idleTimeoutInMinutes: 4
  }
}

var subnetDefinitions = [
  { name: 'snet-web', cidr: '10.87.0.0/26', delegation: 'Microsoft.Web/serverFarms' }
  { name: 'snet-worker', cidr: '10.87.0.64/26', delegation: 'Microsoft.Web/serverFarms' }
  { name: 'snet-postgres', cidr: '10.87.1.0/27', delegation: 'Microsoft.DBforPostgreSQL/flexibleServers' }
  { name: 'snet-private-endpoints', cidr: '10.87.2.0/26', delegation: '' }
  { name: 'snet-release', cidr: '10.87.3.0/27', delegation: 'Microsoft.ContainerInstance/containerGroups' }
]
resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: 'vnet-${prefix}'
  location: location
  tags: tags
  properties: {
    addressSpace: { addressPrefixes: ['10.87.0.0/16'] }
    subnets: [for subnet in subnetDefinitions: {
      name: subnet.name
      properties: union({
        addressPrefix: subnet.cidr
        networkSecurityGroup: { id: nsg.id }
        privateEndpointNetworkPolicies: 'Enabled'
        delegations: empty(subnet.delegation) ? [] : [
          { name: 'service-delegation', properties: { serviceName: subnet.delegation } }
        ]
      }, subnet.name == 'snet-release' && releaseNetworkEnabled ? {
        natGateway: { id: releaseNat!.id }
      } : {})
    }]
  }
}

var zoneNames = [
  'cloudyo-prd.postgres.database.azure.com'
  'privatelink.blob.${environment().suffixes.storage}'
  'privatelink.queue.${environment().suffixes.storage}'
  'privatelink.table.${environment().suffixes.storage}'
  'privatelink.file.${environment().suffixes.storage}'
  'privatelink.vaultcore.azure.net'
  'privatelink.azurewebsites.net'
]
resource zones 'Microsoft.Network/privateDnsZones@2020-06-01' = [for name in zoneNames: {
  name: name
  location: 'global'
  tags: tags
}]
resource links 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = [for (name, i) in zoneNames: {
  parent: zones[i]
  name: 'cloudyo'
  location: 'global'
  properties: { registrationEnabled: false, virtualNetwork: { id: vnet.id } }
}]

output vnetId string = vnet.id
output webSubnetId string = '${vnet.id}/subnets/snet-web'
output workerSubnetId string = '${vnet.id}/subnets/snet-worker'
output postgresSubnetId string = '${vnet.id}/subnets/snet-postgres'
output endpointSubnetId string = '${vnet.id}/subnets/snet-private-endpoints'
output releaseSubnetId string = '${vnet.id}/subnets/snet-release'
output postgresDnsId string = zones[0].id
