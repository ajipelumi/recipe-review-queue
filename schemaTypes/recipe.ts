import {defineField, defineType} from 'sanity'

export const recipe = defineType({
  name: 'recipe',
  title: 'Recipe',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'servings',
      title: 'Servings',
      type: 'number',
      validation: (rule) => rule.min(1).integer(),
    }),
    defineField({
      name: 'prepMinutes',
      title: 'Prep time (minutes)',
      type: 'number',
      validation: (rule) => rule.min(0).integer(),
    }),
    defineField({
      name: 'cookMinutes',
      title: 'Cook time (minutes)',
      type: 'number',
      validation: (rule) => rule.min(0).integer(),
    }),
    defineField({
      name: 'ingredients',
      title: 'Ingredients',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'ingredient',
          fields: [
            {name: 'quantity', title: 'Quantity', type: 'string'},
            {name: 'item', title: 'Item', type: 'string', validation: (rule) => rule.required()},
          ],
          preview: {
            select: {quantity: 'quantity', item: 'item'},
            prepare: ({quantity, item}) => ({title: [quantity, item].filter(Boolean).join(' ')}),
          },
        },
      ],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'method',
      title: 'Method',
      type: 'array',
      of: [{type: 'text', rows: 3}],
      validation: (rule) => rule.min(1),
    }),
    // Filled in during the Testing stage. The workflow gates approval on a
    // cook actually having made the dish, so these are the evidence trail
    // rather than decoration.
    defineField({
      name: 'testNotes',
      title: 'Test notes',
      type: 'text',
      rows: 4,
      description: 'What happened when someone actually cooked this.',
    }),
  ],
  preview: {
    select: {title: 'title', servings: 'servings'},
    prepare: ({title, servings}) => ({
      title: title ?? 'Untitled recipe',
      subtitle: servings ? `Serves ${servings}` : undefined,
    }),
  },
})
