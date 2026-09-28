import {readFileSync} from 'node:fs'
import {createClient} from '@sanity/client'

for (const l of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && m[2]) process.env[m[1]] ??= m[2].trim()
}

const client = createClient({
  projectId: 'qomqzwv7',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_AUTH_TOKEN,
  useCdn: false,
})

const ids = await client.fetch<string[]>(
  `*[_type == "sanity.workflow.instance"]._id`,
)

if (ids.length === 0) {
  console.log('no instances to clear')
} else {
  for (const id of ids) {
    await client.delete(id)
    console.log('deleted', id)
  }
}
