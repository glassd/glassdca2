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
  // Schema extraction (run by `sanity deploy`) pushes every dependency
  // through Vite untransformed, which breaks CommonJS packages. lexorank,
  // pulled in by the orderable list plugin, is one, so let Node load it.
  vite: {
    ssr: {external: ['lexorank']},
  },
})
