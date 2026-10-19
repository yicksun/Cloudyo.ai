@description('Business storage account name.')
param businessName string
@description('Host storage account name.')
param hostName string
@description('Web runtime principal ID.')
param webPrincipalId string
@description('Worker runtime principal ID.')
param workerPrincipalId string

resource business 'Microsoft.Storage/storageAccounts@2023-05-01' existing = { name: businessName }
resource media 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' existing = {
  name: '${business.name}/default/media'
}
resource queues 'Microsoft.Storage/storageAccounts/queueServices/queues@2023-05-01' existing = [for name in ['cloudyo-email', 'cloudyo-email-poison']: {
  name: '${business.name}/default/${name}'
}]
resource host 'Microsoft.Storage/storageAccounts@2023-05-01' existing = { name: hostName }
resource mediaRoles 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for principalId in [webPrincipalId, workerPrincipalId]: {
  name: guid(media.id, principalId, 'blob-contributor')
  scope: media
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}]
resource queueRoles 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for i in range(0, 2): {
  name: guid(queues[i].id, workerPrincipalId, 'queue-contributor')
  scope: queues[i]
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '974c5e8b-45b9-4653-ba55-5f855dd0fb88')
    principalId: workerPrincipalId
    principalType: 'ServicePrincipal'
  }
}]
// Blob owner is required for host coordination; host permissions never extend to business storage.
var hostRoles = [
  'b7e6dc6d-f1e8-4753-8033-0f276bb0955b'
  '974c5e8b-45b9-4653-ba55-5f855dd0fb88'
  '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3'
]
resource hostAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for roleId in hostRoles: {
  name: guid(host.id, workerPrincipalId, roleId)
  scope: host
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleId)
    principalId: workerPrincipalId
    principalType: 'ServicePrincipal'
  }
}]
