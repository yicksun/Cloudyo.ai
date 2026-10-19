using './main.bicep'

param location = 'southeastasia'
param resourceGroupName = 'rg-cloudyo-prd-e65d'
param suffix = 'e65d'
param releaseNetworkEnabled = false
param internalEmail = readEnvironmentVariable('CLOUDYO_INTERNAL_EMAIL')
param entraClientId = readEnvironmentVariable('CLOUDYO_ENTRA_CLIENT_ID')
param secrets = json(readEnvironmentVariable('CLOUDYO_SECRETS_JSON'))
param secretExpirationEpoch = int(readEnvironmentVariable('CLOUDYO_SECRET_EXPIRATION_EPOCH'))
