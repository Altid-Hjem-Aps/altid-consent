# Unified consent block — design

Status: design, awaiting approval. No package code yet.

## The model in one paragraph

Altid Hjem is the umbrella. Consent is decided once, at Altid Hjem level, and
lives in one package that Altid Hjem owns. Every landing page — Hjem, Forsikring,
Mad, and later Energi and Mobil — installs it, says which brand it is, and that
is the whole integration. When consent changes, it changes in the package; each
site merges a bot PR and redeploys. No sub-brand re-decides anything.

Each landing page keeps its own signup database. Auth is shared, but only inside
the app. This design does not change either of those facts.

## Why

The three existing landing pages ask for marketing consent with copies of one
another's code. `lib/consent-token.ts` is byte-identical across
altid-forsikring-site, altid-mad-site and landing-page: 130 lines, zero
divergence. `emails/consent-confirm.ts` differs by 10 lines of 113. There is no
sharing mechanism at all; all three `package.json` files are even named
`"altid-hjem"`.

The copying has already cost real work. The Forsikring group sentence was copied
verbatim from the Mad site, where it was correct; on Forsikring it named Altid
Forsikring a second time — the overlap that was reported — and omitted Energi
and Mad (fixed in PR #18, on one site only). And `marketing_consent_mad` exists
in all three databases, including altidhjem.dk, where nothing is called Mad.

Energi and Mobil are not built yet. Every one of these mistakes is queued to be
copied into them. Doing this now is cheaper than it will ever be again.

## Non-goals

- Deciding consent for any sub-brand. That is the point: nobody below Altid Hjem
  decides it.
- Renaming anyone's database columns.
- Shared signup, or linking landing-page consent to the app's shared auth. See
  "Known gaps".
- Unifying the preference centre file itself (it stays per site; it only starts
  importing its sentences from the package).

## The package

**`Altid-Hjem-Aps/altid-consent`** — its own public repository under the
organisation, from day one.

- **Owned by Altid Hjem.** A `CODEOWNERS` file and branch protection on `main`
  require approval from the people responsible for Altid Hjem. Nobody else can
  change consent, including whoever wrote v1.
- **Public is what makes that enforceable.** The organisation is on GitHub
  Free, where branch protection and required code-owner review exist only on
  public repositories. Making this repo private would silently drop the
  protection, and with it the rule that consent changes go through Altid Hjem.
- **Installed by git tag.** Each site depends on
  `github:Altid-Hjem-Aps/altid-consent#v1.0.0`. No registry, no tokens in any CI,
  no publish rights to manage. Public is safe: the sentences are already public
  on every site, and the token code signs with a key each site supplies at
  runtime.
- **Two entry points.** `altid-consent` for the browser component and sentences;
  `altid-consent/server` for the token and the confirmation-mail body. The token
  code handles a secret and must never land in a client bundle.

### What moves in

| From each site | Today | In the package |
| --- | --- | --- |
| `lib/consent-token.ts` | byte-identical on all three | lifts unchanged |
| the consent block in `WaitlistForm` | three variants | one component |
| consent sentences in `lib/copy.ts` | three variants | generated per brand |
| consent body of `emails/consent-confirm.ts` | 10 lines differ | generated per brand |

The signup route, `db.ts`, the preference centre and the database stay with each
site. Those are site-shaped, not consent-shaped.

### What a site writes

```tsx
<ConsentBlock brand="forsikring" />
```

That is the entire configuration. The package owns everything brand-related:
display names, the family list, the broad and narrow sentences, the opt-down
link. "Hele familien" is every brand; "resten af familien" is every brand except
the one the site is. When a brand is added to the family, it is added once, in
the package, and appears on every site.

The component hands the site `{ own: boolean, group: boolean }`. The site's own
`db.ts` maps that to its columns in two plain lines:

```ts
marketing_consent_mad:   consent.own,   // Forsikring's existing column name
marketing_consent_group: consent.group,
```

The package never touches a database and never knows a column name. A config
string naming a column can disagree with the database without the compiler
noticing, and on this table a failed write is a lost consent that cannot be
reconstructed. Typed site code is checked.

### Versions

The package computes each site's stored version:

```ts
export const CONSENT_VERSION = consentVersion('forsikring')
// → '2026-09-23.3-forsikring'
```

It is the template version plus the brand key. Change any sentence or the family
list in the package, and the template version moves, so the stored proof of what
each person accepted moves with it — automatically, with no human remembering to
bump anything. The brand key in the string also means every row says which
landing page it came from, which is what makes the databases comparable when you
measure across them.

Upgrading is not a sub-brand decision. Each site runs an update bot on the
package; a new consent version arrives as a PR, CI runs, it gets merged and
deployed. That is the minimum possible effort, because showing new text requires
a deploy anyway. Renovate supports npm dependencies pinned to a git tag; verify
whether Dependabot does before choosing it, since the package is installed by
tag, not from a registry.

**Adding a brand to the family is a new consent scope.** People who consented
under an earlier version did not consent to the new brand, and their rows prove
it: their version string points at the old family list. The package makes the
change safe; it does not make it free. Altid Hjem decides when that is worth it.

### Files the package ships

- **`README.md`** — for someone with a working site and no context. What each
  deleted file becomes; the one line of config; the two lines of glue; how to
  know it worked (run your own test suite unchanged — if assertions need more
  than import-path edits, the adoption is wrong); what stays yours. Plus a
  greenfield section for Energi and Mobil: the component, the two columns to
  create, named `marketing_consent_own` and `marketing_consent_group`.
- **`DECISIONS.md`** — the decisions and why, so nobody starts a discussion from
  a blank page:
  - The box is never pre-ticked, whichever sentence is showing.
  - Refusing is exactly as easy as accepting: leave the box unticked.
  - The broad sentence is the default; narrowing costs one visible click.
  - Switching scope clears an existing tick, so a person can only consent to the
    sentence they are looking at.
  - The mail's quote IS the consent — clicking the link in the confirmation mail
    is the act of consenting — so per-flag sentences stay whole sentences.
  - The sender is named in the sentence; legal entity and CVR live in the footer
    and privacy policy.
  - Versions derive from the template; nobody writes one by hand.
- **`CHANGELOG.md`** — the exact text of every version. A stored version string
  is only proof if you can show what it said. Today that answer is scattered
  across three repos' git history; here it is one file.
- **Event names.** Constants for `Consent Given`, `Consent Scope Changed`, with
  `brand` and `scope` properties. The package does not send anything — each site
  uses its own Amplitude — but every site names events the same way, so
  measuring across landing pages later needs no reconciliation.

### If a site ever renames its columns

Not planned, and not needed: once the package is in, `mad` survives in exactly
one line of Forsikring's `db.ts`. But if a team does rename later, the README
says how:

- **Never a bare `ALTER TABLE ... RENAME COLUMN`.** The deployed code references
  the old name for as long as the deploy takes, and every write in that window
  fails. Add the new column, backfill, deploy code writing both, stop writing
  the old, drop it.
- **The RPC too.** `redeem_consent_token(p_mad, ...)` gets a new signature
  alongside the old, not an in-place edit.
- **Safe:** confirmation links already in inboxes. The token encodes consent
  positionally (`${own ? 1 : 0}${group ? 1 : 0}`), not by name.
- **Not safe:** form values. The preference centre and confirm page post
  `value="mad"`; a page already open in a browser posts the old value after the
  server has moved on. Accept both for a window.

## Sequencing

1. **Create the repo.** Done: `Altid-Hjem-Aps/altid-consent`, public, holding
   only this document. Still open: `CODEOWNERS` and branch protection naming
   Altid Hjem's owners — the one step that needs someone else, and it must be
   in place before any code lands.
2. **v1 as a PR into that repo.** Component, sentence generation for every
   brand, token, version derivation, the four files above, tests. Reviewed and
   merged by Altid Hjem's owners — not by the author.
3. **Forsikring adopts.** One PR on `consent/unifiedconsent`: install by tag,
   delete what moved, two lines in `db.ts`, preference centre imports its
   sentences. No schema change. The package's first template must reproduce
   today's Forsikring text exactly; the stored version string still changes
   format (`2026-09-23.3-af` → the package's `…-forsikring`), so the CHANGELOG
   records that the two identify the same text.
4. **Everyone else, whenever they like.** Hjem and Mad adopt in their own PRs.
   Energi and Mobil start on it. Nothing waits on Forsikring, and Forsikring
   waits on nobody after step 2.

## Testing

- **Package:** every brand in the family renders a broad sentence, a narrow
  sentence and an opt-down link, so no brand-specific assumption hides in a
  template. The per-flag sentences together cover exactly what the broad one
  covers — the invariant PR #18 left unguarded, and it belongs where the
  sentences are generated. The template version changes when any sentence or the
  family list changes. The token keeps its existing tests.
- **Forsikring:** the existing 270 tests stay green with import paths as the only
  permitted edit. No assertion weakened, retargeted or deleted — an unchanged
  assertion set is the only real proof that adoption changed nothing. Plus one
  unit test over `db.ts`: `own` lands in the column this site actually uses.

## Known gaps — flagged, not solved here

**Unsubscribe does not cross sites.** The sender is Altid Hjem ApS everywhere,
but consent lives in three databases. Someone who ticks "hele familien" on both
Forsikring and Mad and then unsubscribes from a Mad mail is cleared only in Mad's
database; Forsikring's still says `group: true`, for the same sender they just
left. Withdrawal must be as easy as giving consent, and from the person's side
they unsubscribed from Altid Hjem. **To check first:** do all sites send from
one Resend account with a shared suppression list? If yes, it is covered at send
time. If not, it is a real gap, and it belongs to Altid Hjem.

**Landing-page consent and app auth are unconnected.** The app's shared auth
knows nothing about what a person consented to on a landing page. The AF
workspace docs state the authoritative consent register is not yet decided, so
this design does not pick one. What it does is make every landing page record
the same shape — `{ own, group, version }` with the brand in the version — which
is what makes connecting them cheap once that decision is made.

## Open questions

- Who goes in `CODEOWNERS` for Altid Hjem.
- altidhjem.dk gains the opt-down link on adoption ("Kun Altid Hjem?"), since
  the component is the same everywhere. A visible change there; Hjem's to accept
  when it adopts.
