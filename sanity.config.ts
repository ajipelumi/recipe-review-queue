import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {workflowStudioPlugin, workflowDefaultDocumentNode} from '@sanity/workflow-studio-plugin'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Recipe Review Queue',

  projectId: 'qomqzwv7',
  dataset: 'production',

  plugins: [
    structureTool({
      // Puts the Workflow tab on the recipe document itself, so the review
      // happens next to the thing being reviewed.
      defaultDocumentNode: workflowDefaultDocumentNode(),
    }),
    // `tag` must match the deployment tag in sanity.workflow.ts.
    workflowStudioPlugin({tag: 'prod'}),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
