import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {visionTool} from '@sanity/vision'
import {markdownSchema} from 'sanity-plugin-markdown'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'glassdca',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'anguo7xv',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [
    structureTool({
      // Projects get a drag-and-drop list; the site reads its order.
      structure: (S, context) =>
        S.list()
          .title('Content')
          .items([
            orderableDocumentListDeskItem({type: 'project', title: 'Projects', S, context}),
            ...S.documentTypeListItems().filter((item) => item.getId() !== 'project'),
          ]),
    }),
    visionTool(),
    markdownSchema(),
  ],

  schema: {
    types: schemaTypes,
  },
})
