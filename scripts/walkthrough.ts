import {readFileSync} from 'node:fs'
import {createClient} from '@sanity/client'
import {createEngine, ENGINE_API_VERSION, refDataset} from '@sanity/workflow-engine'

for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/)
  if (match && match[2]) process.env[match[1]] ??= match[2].trim()
}

const PROJECT = 'qomqzwv7'
const DATASET = 'production'

const client = createClient({
  projectId: PROJECT,
  dataset: DATASET,
  apiVersion: ENGINE_API_VERSION,
  token: process.env.SANITY_AUTH_TOKEN,
  useCdn: false,
})

const engine = createEngine({
  client,
  workflowResource: {type: 'dataset', id: `${PROJECT}.${DATASET}`},
  tag: 'prod',
})

function stageOf(instance: unknown): string {
  return (instance as {currentStage?: string})?.currentStage ?? 'unknown'
}

const subject = refDataset({
  projectId: PROJECT,
  dataset: DATASET,
  documentId: 'recipe-jollof',
  type: 'recipe',
})

// The definition carries a `singleSubject` start requirement, so re-running
// this against a recipe that already has an open review is refused rather than
// silently forking a second one. Reuse the open instance when there is one.
const existing = await client.fetch<{_id: string} | null>(
  `*[_type == "sanity.workflow.instance" && definition == $definition && currentStage != "published"][0]{_id}`,
  {definition: 'recipe-review'},
)

let id: string
if (existing) {
  console.log(`reusing open instance ${existing._id}`)
  id = existing._id
} else {
  const {instance} = await engine.startInstance({
    definition: 'recipe-review',
    initialFields: [{type: 'subject', name: 'subject', value: subject}],
  })
  id = instance._id
  console.log(`started  -> ${stageOf(instance)}`)

  const claimed = await engine.fireAction({instanceId: id, activity: 'write', action: 'claim'})
  console.log(`claim    -> ${stageOf(claimed.instance)}`)

  const submitted = await engine.fireAction({instanceId: id, activity: 'write', action: 'submit'})
  console.log(`submit   -> ${stageOf(submitted.instance)}`)
}

// The interesting case. The author just claimed and submitted this recipe, so
// the testing claim filter (`$fields.author.id != $actor.id`) should refuse
// them. Everything runs under one token here, so this actor IS the author.
try {
  await engine.fireAction({instanceId: id, activity: 'test', action: 'claim'})
  console.log('claim test -> ALLOWED (unexpected: author tested their own recipe)')
} catch (err) {
  const message = err instanceof Error ? err.message : String(err)
  console.log(`claim test -> REFUSED, as designed: ${message}`)
}

const current = await engine.getInstance({instanceId: id})
console.log(`\nfinal stage: ${stageOf(current)}`)
console.log(`instance id: ${id}`)

// Everything above runs under a single API token, so the engine sees one
// actor throughout. That is enough to prove the constraint that matters (the
// author is locked out of testing), but not enough to walk the instance to
// Published, which by design needs a genuinely different person. Do that part
// in the Studio with two signed-in users.
console.log('\nTo finish the loop, a second user claims `test` in the Studio.')
