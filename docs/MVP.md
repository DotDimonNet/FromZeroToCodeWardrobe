# MVP strategy and acceptance criteria

## The problem

People own useful clothes but forget what is available, repeat the same combinations and keep items they no longer wear. Buying more is often easier than making sense of what is already there.

## The smallest useful loop

1. Catalogue a top, a bottom and shoes.
2. Set practical preferences and generate an outfit.
3. Save a combination and reuse/share it.
4. Offer an unused piece to someone else.
5. Complete a reservation and handover.

Validate this loop with five learners or wardrobe owners before adding more integrations. Ask each person to find a wearable outfit in under two minutes and reserve one item without help. Track completion, time, errors, rejected suggestions and whether they return to a saved look. These are proposed validation measures, not claimed results.

## Acceptance examples

| Story                          | Done when                                                                                                                                                 |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I want to catalogue my clothes | A valid piece survives refresh; I can edit its details and favorite state; another account cannot see or change it.                                       |
| I want fewer choices           | Combined filters narrow the same wardrobe; clearing filters restores the list; an empty result gives a useful next step.                                  |
| I need a summer look           | Only available, summer-compatible pieces are suggested; each suggestion has top, bottom and shoes; restrictive preferences return an honest empty result. |
| I want to share one look       | Sharing is opt-in; a signed-out viewer can open the link; revocation makes the old URL return 404.                                                        |
| I want to pass something on    | I can publish a sale, loan or giveaway; free giveaways cannot have a price; I cannot reserve my own listing.                                              |
| Two people want the same item  | Exactly one reservation succeeds; the other receives a conflict; the price is copied from the server's listing.                                           |
| I need a reliable account      | Registration requires activation; password reset tokens expire and become invalid after use; sign-out removes access to private endpoints.                |

## Delivery stages

1. **Domain first:** vocabulary, entities, constraints and outfit rules.
2. **Persistence:** relational model, repository interfaces, SQLite migration and seed.
3. **Vertical slice:** create/list/edit a garment through controller, handler, repository and React form.
4. **Identity:** registration, activation, cookies, CSRF and owner boundaries.
5. **Product loop:** suggestions, saved looks and revocable sharing.
6. **Exchange loop:** listings, conditional reservation and status transitions.
7. **Delivery:** tests, dependency checks, reproducible build, documentation and demo.

For estimation, break each stage into observable outcomes and record a range, dependencies and acceptance tests. Re-estimate after the first vertical slice. Do not promise the whole application in a fixed beginner timeline without measuring progress.

## Deliberate next iterations

User-uploaded photos with scanning/storage limits; additional outfit layers; opt-in trend feeds; account deletion/export; marketplace moderation; location/contact privacy controls; messaging; payment provider integration; managed SQL migration; metrics and backups. Add one only after evidence shows it improves the core loop.
