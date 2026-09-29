# Recipe Review Queue

A Sanity Studio where a recipe cannot be published until somebody **other than
its author** has actually cooked it.

Built for the [DEV x Sanity Challenge, Path Two](https://dev.to/challenges/sanity-2026-09-16).

## The idea

Recipe sites publish recipes nobody made. "Approved" usually means one person
clicked a button on their own work. This makes that structurally impossible
rather than discouraged by policy.

A recipe moves through four stages:

```
Drafting -> Testing -> Approval -> Published
```

with a rejection at either Testing or Approval looping back to Drafting.

The constraint that matters is one filter in
[`workflows/recipeReview.ts`](workflows/recipeReview.ts):

```ts
filter: '!defined($fields.tester) && $fields.author.id != $actor.id'
```

The author is excluded from claiming the test. A recipe only reaches Approval
once a second person has cooked it and written up what happened, so "approved"
is a claim backed by evidence rather than a status someone set on their own
work.

Two supporting decisions:

- **A failed test releases the tester** (`field.unset` on `tester`), so the
  retry is open to anyone rather than stuck with whoever found the problem.
- **Send-back from Approval clears `testOutcome`**, forcing a fresh test. The
  old pass described a different version of the recipe.

A `singleSubject` start requirement keeps one open review per recipe.

## Running it

Requires **Node 22.12+**. Sanity Studio 6 refuses to start on older versions,
and npm will half-install without a clear error.

```bash
npm install
npm run dev          # http://localhost:3333
```

To deploy the workflow definition or seed content you need a write token in
`.env` (gitignored):

```
SANITY_AUTH_TOKEN=<editor-role token>
```

```bash
npx tsx scripts/deployWorkflow.ts   # deploy the definition
npx tsx scripts/seedRecipes.ts      # three sample recipes
npx tsx scripts/resetInstances.ts   # clear instances between demo runs
npx tsx scripts/walkthrough.ts      # drive an instance from the CLI
```

**`scripts/walkthrough.ts` authenticates as the API token**, so the engine
records the robot as the author. That is enough to prove the author is locked
out of testing, but it cannot walk a recipe to Published: that needs a
genuinely different signed-in person, which is the whole point. Do the full
loop in the Studio with two accounts.

## Layout

| Path | What it is |
| --- | --- |
| `workflows/recipeReview.ts` | The workflow definition. The interesting file. |
| `schemaTypes/recipe.ts` | Recipe document: ingredients, method, test notes. |
| `sanity.config.ts` | Studio config, workflow plugin mounted on the document. |
| `sanity.workflow.ts` | Deployment config for the definition. |
| `scripts/` | Deploy, seed, reset, and a CLI walkthrough. |

## Notes on building against early access

Sanity Workflows is early access. Two things that cost time:

- The cookbook documents a `sanity-workflows` CLI for deploying definitions.
  That package is not on npm. Deployment goes through the programmatic
  `engine.deployDefinitions()` path instead, which is what
  `scripts/deployWorkflow.ts` does.
- `sanity@6` requires Node 22.12+. On Node 20 the install appears to succeed
  while leaving `package.json` untouched and `node_modules/.bin` empty.

## Project

Sanity project `qomqzwv7`, dataset `production` (public).
