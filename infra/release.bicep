@description('Region of the approved production VNet.')
param location string = 'southeastasia'
@description('Unique bounded release container name.')
param name string
@description('Verified Linux Node 22 image pinned by sha256 digest; must contain python3 and tar.')
param image string
@description('Existing dedicated ACI subnet with an explicitly enabled temporary NAT gateway.')
param subnetId string
@description('Existing narrowly scoped release managed identity.')
param identityId string
@description('Managed identity client ID.')
param clientId string
@description('Nonsecret approved release settings serialized as JSON.')
param releaseConfiguration string
@description('Reviewed runner source encoded in base64, not downloaded from an untrusted mutable URL.')
param runnerSourceBase64 string
@description('Short-lived authenticated source tarball URL. Never pass a reusable GitHub credential.')
@secure()
param sourceUrl string
@description('Short-lived authenticated release artifact ZIP URL. Redacted from all logs.')
@secure()
param artifactUrl string

resource runner 'Microsoft.ContainerInstance/containerGroups@2023-05-01' = {
  name: name
  location: location
  tags: { application: 'cloudyo', environment: 'production', lifecycle: 'temporary-release' }
  identity: { type: 'UserAssigned', userAssignedIdentities: { '${identityId}': {} } }
  properties: {
    osType: 'Linux'
    restartPolicy: 'Never'
    subnetIds: [{ id: subnetId }]
    containers: [
      {
        name: 'release'
        properties: {
          image: image
          resources: { requests: { cpu: 2, memoryInGB: 4 } }
          securityContext: {
            runAsUser: 1000
            runAsGroup: 1000
            allowPrivilegeEscalation: false
            privileged: false
            capabilities: { drop: ['ALL'] }
          }
          command: [
            'node'
            '--input-type=module'
            '-e'
            'import {writeFileSync} from "node:fs";writeFileSync("/tmp/cloudyo-release.mjs",Buffer.from(process.env.RUNNER_SOURCE,"base64"));const runner=await import("file:///tmp/cloudyo-release.mjs");const deadline=setTimeout(()=>{console.error(JSON.stringify({event:"release.timeout",phase:runner.currentPhase()}));process.exit(1)},1800000);try{await runner.main()}catch(e){runner.reportFailure(e);process.exitCode=1}finally{clearTimeout(deadline)}'
          ]
          environmentVariables: [
            { name: 'RUNNER_SOURCE', value: runnerSourceBase64 }
            { name: 'RELEASE_CONFIGURATION', value: releaseConfiguration }
            { name: 'AZURE_CLIENT_ID', value: clientId }
            { name: 'SOURCE_URL', secureValue: sourceUrl }
            { name: 'ARTIFACT_URL', secureValue: artifactUrl }
          ]
        }
      }
    ]
  }
}
output runnerId string = runner.id
