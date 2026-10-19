@description('Existing Front Door profile name.')
param profileName string
@description('Existing Front Door endpoint name.')
param endpointName string
@description('Actual returned App Service defaultHostName, not a guessed name.')
param webHostname string

resource profile 'Microsoft.Cdn/profiles@2024-02-01' existing = { name: profileName }
resource endpoint 'Microsoft.Cdn/profiles/afdEndpoints@2024-02-01' existing = {
  parent: profile
  name: endpointName
}
resource group 'Microsoft.Cdn/profiles/originGroups@2024-02-01' = {
  parent: profile
  name: 'web'
  properties: {
    sessionAffinityState: 'Disabled'
    healthProbeSettings: { probePath: '/health/ready', probeProtocol: 'Https', probeRequestType: 'GET', probeIntervalInSeconds: 60 }
    loadBalancingSettings: { sampleSize: 4, successfulSamplesRequired: 3, additionalLatencyInMilliseconds: 50 }
  }
}
resource origin 'Microsoft.Cdn/profiles/originGroups/origins@2024-02-01' = {
  parent: group
  name: 'web'
  properties: {
    hostName: webHostname
    originHostHeader: webHostname
    httpsPort: 443
    httpPort: 80
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
    enforceCertificateNameCheck: true
  }
}
resource route 'Microsoft.Cdn/profiles/afdEndpoints/routes@2024-02-01' = {
  parent: endpoint
  name: 'web'
  properties: {
    originGroup: { id: group.id }
    supportedProtocols: ['Http', 'Https']
    patternsToMatch: ['/*']
    httpsRedirect: 'Enabled'
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    enabledState: 'Enabled'
  }
  dependsOn: [origin]
}
