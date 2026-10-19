@description('Existing private Key Vault name.')
param vaultName string
@description('Secret name.')
param name string
@description('Secret value supplied through secure deployment parameters.')
@secure()
param value string
@description('Explicit Unix expiry; operators must rotate credentials before this deadline.')
param expirationEpoch int
@description('Only the identities that need this particular secret.')
param readers array

resource vault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: vaultName
}
resource secret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: vault
  name: name
  properties: {
    value: value
    contentType: 'text/plain'
    attributes: { enabled: true, exp: expirationEpoch }
  }
}
resource access 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for principalId in readers: {
  name: guid(secret.id, principalId, 'Key Vault Secrets User')
  scope: secret
  properties: {
    principalId: principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
  }
}]
