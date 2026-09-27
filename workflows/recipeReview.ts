import {
  defineAction,
  defineActivity,
  defineField,
  defineStage,
  defineTransition,
  defineWorkflow,
} from '@sanity/workflow-engine/define'

/**
 * A recipe cannot be published on someone's word that it works. Somebody has
 * to cook it first.
 *
 * Draft -> Testing -> Approval -> Published, with a rejection at either the
 * test or the approval step looping back to drafting. The distinguishing
 * constraint is that the tester may not be the author: a recipe is only
 * verified once a second person has actually made it.
 */
export const recipeReview = defineWorkflow({
  name: 'recipe-review',
  title: 'Recipe review',
  initialStage: 'drafting',
  fields: [
    defineField({type: 'subject', name: 'subject', initialValue: {type: 'input'}, required: true}),
    defineField({type: 'actor', name: 'author'}),
    defineField({type: 'actor', name: 'tester'}),
    defineField({type: 'actor', name: 'approver'}),
    defineField({type: 'string', name: 'testOutcome'}),
    defineField({type: 'string', name: 'rejectionReason'}),
  ],
  stages: [
    defineStage({
      name: 'drafting',
      title: 'Drafting',
      activities: [
        defineActivity({
          name: 'write',
          title: 'Write the recipe',
          actions: [
            // Clears a previous rejection on re-entry, so a resubmitted recipe
            // does not immediately bounce back out of the next stage.
            defineAction({
              name: 'clear-rejection',
              title: 'Clear the previous rejection',
              when: 'true',
              ops: [{type: 'field.unset', target: {field: 'rejectionReason'}}],
            }),
            defineAction({
              name: 'claim',
              title: 'I am writing this',
              filter: '!defined($fields.author)',
              ops: [{type: 'field.set', target: {field: 'author'}, value: {type: 'actor'}}],
            }),
            defineAction({
              name: 'submit',
              title: 'Submit for testing',
              filter: '$fields.author.id == $actor.id',
              status: 'done',
            }),
          ],
        }),
      ],
      transitions: [defineTransition({name: 'to-testing', to: 'testing', when: '$allActivitiesDone'})],
    }),

    defineStage({
      name: 'testing',
      title: 'Testing',
      activities: [
        defineActivity({
          name: 'test',
          title: 'Cook it and report back',
          actions: [
            // The filter is the whole point of this workflow: the author is
            // excluded from testing their own recipe, so "it works" is always
            // a second person's claim.
            defineAction({
              name: 'claim',
              title: 'I will test this',
              filter: '!defined($fields.tester) && $fields.author.id != $actor.id',
              ops: [{type: 'field.set', target: {field: 'tester'}, value: {type: 'actor'}}],
            }),
            defineAction({
              name: 'passed',
              title: 'Cooked it, it works',
              filter: '$fields.tester.id == $actor.id',
              status: 'done',
              params: [
                {type: 'string', name: 'notes', title: 'What happened when you cooked it', required: true},
              ],
              ops: [{type: 'field.set', target: {field: 'testOutcome'}, value: {type: 'param', param: 'notes'}}],
            }),
            defineAction({
              name: 'failed',
              title: 'Cooked it, it does not work',
              filter: '$fields.tester.id == $actor.id',
              status: 'done',
              params: [{type: 'string', name: 'reason', title: 'What went wrong', required: true}],
              ops: [
                {type: 'field.set', target: {field: 'rejectionReason'}, value: {type: 'param', param: 'reason'}},
                // Release the tester so the next attempt can be picked up by
                // anyone, including a different cook.
                {type: 'field.unset', target: {field: 'tester'}},
              ],
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({name: 'to-approval', to: 'approval', when: 'defined($fields.testOutcome)'}),
        defineTransition({
          name: 'back-to-drafting',
          to: 'drafting',
          when: 'defined($fields.rejectionReason)',
        }),
      ],
    }),

    defineStage({
      name: 'approval',
      title: 'Approval',
      activities: [
        defineActivity({
          name: 'approve',
          title: 'Final sign-off',
          actions: [
            defineAction({
              name: 'claim',
              title: 'I will sign this off',
              filter: '!defined($fields.approver)',
              ops: [{type: 'field.set', target: {field: 'approver'}, value: {type: 'actor'}}],
            }),
            defineAction({
              name: 'publish',
              title: 'Approve and publish',
              filter: '$fields.approver.id == $actor.id',
              status: 'done',
            }),
            defineAction({
              name: 'send-back',
              title: 'Send back to drafting',
              filter: '$fields.approver.id == $actor.id',
              status: 'done',
              params: [{type: 'string', name: 'reason', title: 'Reason', required: true}],
              ops: [
                {type: 'field.set', target: {field: 'rejectionReason'}, value: {type: 'param', param: 'reason'}},
                // A recipe sent back has to be tested again from scratch: the
                // previous pass no longer describes the current recipe.
                {type: 'field.unset', target: {field: 'testOutcome'}},
                {type: 'field.unset', target: {field: 'tester'}},
                {type: 'field.unset', target: {field: 'approver'}},
              ],
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({
          name: 'to-published',
          to: 'published',
          when: '$allActivitiesDone && !defined($fields.rejectionReason)',
        }),
        defineTransition({
          name: 'back-to-drafting',
          to: 'drafting',
          when: 'defined($fields.rejectionReason)',
        }),
      ],
    }),

    defineStage({name: 'published', title: 'Published'}),
  ],
  // One open review per recipe, so two people cannot run competing reviews of
  // the same document.
  start: {
    requirements: [
      {
        type: 'singleSubject',
        name: 'one-open-review',
        title: 'A review is already in progress for this recipe',
      },
    ],
  },
})
