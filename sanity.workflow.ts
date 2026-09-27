import {defineWorkflowConfig} from '@sanity/workflow-engine/define'
import {recipeReview} from './workflows/recipeReview'

export default defineWorkflowConfig({
  deployments: [
    {
      name: 'production',
      tag: 'prod',
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: 'qomqzwv7.production'},
      definitions: [recipeReview],
    },
  ],
})
