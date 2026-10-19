# altid-consent

Marketing consent for every Altid landing page, decided once at Altid Hjem level: the sentences, the brand family, the rules and the version live here, and each site picks them up with a version bump.

## Tests

These rules are the same in every Altid repo. Only "In this repo" below differs.

The suite is a cost: every test runs on every PR and has to be read and kept. A test earns its place by catching a wrong behaviour nothing else catches. Coverage is not a goal.

- Testing Trophy. Most tests are behaviour tests through the public entry point, with only the outer boundary faked. Unit tests only for pure logic with real branching. A few end-to-end tests for critical journeys.
- Fake only at the boundary: the thin adapter of ours that talks to something outside the process (an HTTP or SDK client, database access), and the clock. Never fake our own logic to test other logic. A mocking library is fine at the boundary.
- Every new test maps to an acceptance criterion or a named risk: one concrete wrong behaviour a plausible change would cause, in one line. A test that maps to nothing is not added. A bug fix gets a test that fails on the old code.
- Would a wrong implementation pass? Before handing off, break each behaviour you changed on purpose (flip a condition, drop a branch, return the old value), run the targeted tests, then undo it. A break no test catches is a missing assertion; add it.
- Locally, run only the tests that cover what you changed. The full suite is CI's job.
- Test shared code once: one table test of the shared thing, one check per caller that it goes through it. No matrices over shared code (every endpoint times every error, every flag times every state).
- Don't test implementation: private helpers, call order no caller sees, framework or library behaviour, generated code, and in UI code position, size, colour, styling or the exact markup tree. Assert what a user sees or what was sent.
- The PR body states the cost: `+N tests, -M tests, +X s`, X being the wall time of the touched test files before and after.
- Never weaken, skip or delete a failing test to get green. Deleting a test that pins implementation is cleanup: name in the commit the behaviour it guarded and the test that still covers it.

### In this repo

- Entry points: tests call the public functions (`consentSentences`, `consentFlags`, `consentVersion`) and render `<ConsentBlock>` through a state-owning harness the way a site does, with Testing Library (`test/consent-block.test.tsx`).
- Boundary fakes: none; the package has no network, database or clock. jsdom is the DOM (`vitest.config.ts`, `test/setup.ts`).
- Other layers: `test/version.test.ts` fingerprints every sentence per template version; a wording change adds a new entry (the failure prints it), never edits or removes an existing one. `test/changelog.test.ts` checks `CHANGELOG.md` against the code.
- Run: `npx vitest run test/<file>`; all: `npm test` and `npm run typecheck`. There is no CI workflow in this repo yet, so run `npm test` before handing off; the whole suite takes about a second.
