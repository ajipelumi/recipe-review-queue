import {readFileSync} from 'node:fs'
import {createClient} from '@sanity/client'
import {createEngine, ENGINE_API_VERSION} from '@sanity/workflow-engine'
import {recipeReview} from '../workflows/recipeReview'

for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/)
  if (match && match[2]) process.env[match[1]] ??= match[2].trim()
}

const token = process.env.SANITY_AUTH_TOKEN
if (!token) {
  throw new Error('SANITY_AUTH_TOKEN missing. It lives in .env, which is gitignored.')
}

const client = createClient({
  projectId: 'qomqzwv7',
  dataset: 'production',
  apiVersion: ENGINE_API_VERSION,
  token,
  useCdn: false,
})

const engine = createEngine({
  client,
  workflowResource: {type: 'dataset', id: 'qomqzwv7.production'},
  tag: 'prod',
})

const result = await engine.deployDefinitions({
  expectedMinReaderModel: 10,
  definitions: [recipeReview],
})

console.log('Deployed:', JSON.stringify(result, null, 2))
