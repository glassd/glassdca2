import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'anguo7xv',
    dataset: 'production',
  },
  deployment: {
    appId: 'dr5e60zejwrkr99gn2h2ici4',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/cli#auto-updates
     */
    autoUpdates: true,
  },
})
