# altid-consent

Marketing consent for every Altid landing page, decided once at Altid Hjem level.

A site says which brand it is. The sentences, the family of brands, the rules and
the version live here. When consent changes, it changes here, and every site
picks it up with a version bump.

v1 covers the four family brands: `forsikring`, `energi`, `mobil`, `mad`.
altidhjem.dk cannot adopt v1 yet — Altid Hjem is the parent and sender named in
every sentence ("fra Altid Hjem"), not a family member, so what its own narrow
sentence should say is Altid Hjem's decision to make first.

- **Why it works this way:** [DECISIONS.md](DECISIONS.md)
- **What every version said, word for word:** [CHANGELOG.md](CHANGELOG.md)
- **The design behind it:** [docs/design.md](docs/design.md)

## Install

```bash
npm install "github:Altid-Hjem-Aps/altid-consent#v1.0.0"
```

Installed by git tag, not from a registry: no tokens, no `.npmrc`. npm builds the
package on install (the `prepare` script runs `npm run build`), so the machine
installing it needs access to GitHub and must not disable lifecycle scripts
(`--ignore-scripts`, or a package manager that blocks install scripts by
default) — otherwise there is no `dist` and nothing to import. React 19 is a
peer dependency.

## Use it

```tsx
import { INITIAL_CONSENT, consentFlags, consentVersion } from 'altid-consent'
import { ConsentBlock } from 'altid-consent/react'

const [consentState, setConsentState] = useState(INITIAL_CONSENT)

<ConsentBlock brand="mad" value={consentState} onChange={setConsentState} />

// at submit
const { own, group } = consentFlags(consentState)
const version = consentVersion('mad')
```

`brand` is one of `forsikring`, `energi`, `mobil`, `mad`. Your form holds the
state because it needs it at submit. The component's default colours are
altidforsikring.dk's; `dark` switches to the dark-background colours, and
`colors={{ accent: '#dcd799' }}` overrides what differs on your site (that one
is Altid Mad's mint) — other sites override whichever colours differ from
Forsikring's, not just accent.

The component uses inline styles only. Tailwind does not scan `node_modules`, so
utility classes in a package would silently not exist on your site.

`altid-consent` has no React in it, so server code and mails can import the
sentences from it directly.

### Events

```ts
import { CONSENT_EVENTS } from 'altid-consent'
// { given: 'Consent Given', scopeChanged: 'Consent Scope Changed' }
```

The package sends nothing — each site passes these names to its own tracker,
with properties `{ brand, scope }`. Every landing page naming events the same
way is what makes consent measurable across sites later without reconciling
separate vocabularies.

## Store it

The package never touches your database and never knows a column name. Map the
flags in your own code:

```ts
marketing_consent_own:   own,
marketing_consent_group: group,
consent_version:         consentVersion('mad'),
```

`own` is your brand. `group` is Altid Hjem and the rest of the family. Store
`consentVersion(brand)` with every consent and never write a version by hand: it
is the template version plus your brand, e.g. `2026-09-24.1-mad`, so every row
proves which wording was accepted and which landing page it came from.

## Adopting on an existing site

| Delete | Replace with |
| --- | --- |
| your consent checkbox component | `<ConsentBlock>` |
| its `useState`s (checked, scope) | one `useState(INITIAL_CONSENT)` |
| hand-written consent sentences and `CONSENT_VERSION` in `lib/copy.ts` | re-exports of `consentSentences(brand)` and `consentVersion(brand)` |

Keep your constant names if other files import them: re-export the package's
values under the old names and nothing else in your site has to change. Keep
your column names too; renaming is optional and never a condition of adopting.

**How to know it worked:** run your existing test suite. What counts as "worked"
depends on whether your live text already matches `consentSentences(brand)`:

- If it already matches (this was true for Forsikring's first adoption), the
  only assertions that may change are ones that hard-code a version string. If
  anything else needs editing beyond import paths, the adoption is wrong — that
  is the signal, not an obstacle to work around.
- If it does not match, your sentence assertions change too, and that is
  expected: visitors now see the package's wording instead of your old text,
  and your stored version moves to text they did not see before. That is a
  wording change worth recording as a decision — in your own change log or PR
  description — not a regression to hide by editing the test until it passes.

**What stays yours:** the signup route, `db.ts`, the confirmation mail and its
headings, the consent token, the preference centre, your column names.

## Starting a new site (Energi, Mobil)

Nothing to delete. Add the flags next to your signup data, for example:

```sql
alter table public.signup
  add column marketing_consent_own   boolean,
  add column marketing_consent_group boolean,
  add column consent_version         text,
  add column consent_at              timestamptz;
```

Then use the component as above.

## Upgrading

A new consent version arrives as a new tag. Point your dependency at it, run your
tests, deploy. Showing new text needs a deploy anyway, so that is the whole job.
An update bot can open that PR for you: Renovate supports dependencies pinned to
a git tag; check whether Dependabot does before relying on it.

## Changing consent

Consent changes go through Altid Hjem. `.github/CODEOWNERS` names the owners:
every change arrives as a pull request approved by one of them other than its
author. That is a team rule, not one GitHub enforces — branch protection is not
switched on. For any change to a sentence or the family list:

1. Bump `CONSENT_TEMPLATE_VERSION` in `src/version.ts`.
2. Record the exact new text in `CHANGELOG.md`.
3. Add a new entry for it in `test/version.test.ts` — the failing test prints
   the exact line. Never edit or remove an existing entry; the current version
   must stay the newest one.
4. After merge, tag the release (`vX.Y.Z`) so sites can point at it.

Adding a brand to the family is a new consent scope: people who consented under
an earlier version did not consent to the new brand, and their stored version
proves it.

Keep this repository public. The organisation is on GitHub Free, where branch
protection and required code-owner review exist only on public repositories;
making it private would silently drop the rule that consent goes through Altid
Hjem.

## If you rename your columns later

- Never a bare `ALTER TABLE … RENAME COLUMN`: the deployed code keeps using the
  old name for as long as the deploy takes, and every write in that window is a
  lost consent. Add the new column, backfill, deploy code writing both, stop
  writing the old, drop it.
- An RPC parameter named after the old column gets a new function signature
  alongside the old one, not an in-place edit.
- Confirmation links already in inboxes survive: the token encodes the flags by
  position, not by name.
- Form values do not: a preference page already open in a browser still posts
  the old name after your server has moved on. Accept both for a while.

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
```
