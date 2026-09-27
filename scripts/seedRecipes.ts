import {readFileSync} from 'node:fs'
import {createClient} from '@sanity/client'

for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/)
  if (match && match[2]) process.env[match[1]] ??= match[2].trim()
}

const client = createClient({
  projectId: 'qomqzwv7',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_AUTH_TOKEN,
  useCdn: false,
})

const recipes = [
  {
    _id: 'recipe-jollof',
    _type: 'recipe',
    title: 'Party jollof rice',
    slug: {_type: 'slug', current: 'party-jollof-rice'},
    servings: 6,
    prepMinutes: 20,
    cookMinutes: 45,
    ingredients: [
      {_key: 'a1', quantity: '3 cups', item: 'long grain parboiled rice'},
      {_key: 'a2', quantity: '6', item: 'plum tomatoes, blended'},
      {_key: 'a3', quantity: '2', item: 'red bell peppers, blended'},
      {_key: 'a4', quantity: '1', item: 'scotch bonnet, blended'},
      {_key: 'a5', quantity: '1 cup', item: 'groundnut oil'},
      {_key: 'a6', quantity: '2 tbsp', item: 'tomato paste'},
      {_key: 'a7', quantity: '3 cups', item: 'chicken stock'},
    ],
    method: [
      'Blend the tomatoes, peppers and scotch bonnet, then boil the mixture down until most of the water is gone.',
      'Heat the oil, fry the tomato paste for two minutes, then add the reduced blend and fry until it darkens.',
      'Add the stock and seasoning, bring to a boil, then stir in the washed rice.',
      'Cover tightly, drop the heat to its lowest setting and leave it for 30 minutes without lifting the lid.',
      'Stir once from the bottom, then cover and rest for 5 minutes before serving.',
    ],
  },
  {
    _id: 'recipe-banana-bread',
    _type: 'recipe',
    title: 'Overripe banana bread',
    slug: {_type: 'slug', current: 'overripe-banana-bread'},
    servings: 8,
    prepMinutes: 15,
    cookMinutes: 55,
    ingredients: [
      {_key: 'b1', quantity: '3', item: 'very ripe bananas'},
      {_key: 'b2', quantity: '110g', item: 'melted butter'},
      {_key: 'b3', quantity: '150g', item: 'sugar'},
      {_key: 'b4', quantity: '1', item: 'egg'},
      {_key: 'b5', quantity: '190g', item: 'plain flour'},
      {_key: 'b6', quantity: '1 tsp', item: 'bicarbonate of soda'},
    ],
    method: [
      'Mash the bananas in a large bowl, then stir in the melted butter.',
      'Mix in the sugar and egg, then fold in the flour and bicarbonate of soda until just combined.',
      'Pour into a lined loaf tin and bake at 175C for 50 to 60 minutes, until a skewer comes out clean.',
    ],
  },
  {
    _id: 'recipe-suya-spice',
    _type: 'recipe',
    title: 'Suya spice mix (yaji)',
    slug: {_type: 'slug', current: 'suya-spice-mix'},
    servings: 1,
    prepMinutes: 10,
    cookMinutes: 0,
    ingredients: [
      {_key: 'c1', quantity: '1 cup', item: 'roasted groundnuts'},
      {_key: 'c2', quantity: '2 tbsp', item: 'cayenne pepper'},
      {_key: 'c3', quantity: '1 tbsp', item: 'ginger powder'},
      {_key: 'c4', quantity: '1 tbsp', item: 'garlic powder'},
      {_key: 'c5', quantity: '1 tsp', item: 'smoked paprika'},
    ],
    method: [
      'Blitz the groundnuts to a coarse powder, then press them between paper towels to take out the oil.',
      'Mix the de-oiled groundnut powder with every other dry ingredient.',
      'Store in an airtight jar away from light.',
    ],
  },
]

for (const doc of recipes) {
  await client.createOrReplace(doc)
  console.log('seeded', doc._id)
}
