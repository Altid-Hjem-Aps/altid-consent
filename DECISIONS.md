# Decisions

Why consent works the way it does on every Altid landing page. To deviate, argue
with the reason, not with a blank page — and take it to Altid Hjem, not to one
brand.

## The box is never pre-ticked

Whichever sentence is showing. A pre-ticked box is not consent (CJEU, Planet49),
and "pre-ticked, but only for the narrow scope" is still pre-ticked.

## Refusing is exactly as easy as accepting

Leave the box unticked; nothing else is asked. Consent is never a condition for
joining a waitlist (GDPR art. 7(4), koblingsforbud).

## The broad sentence is the default; narrowing costs one visible click

One sentence covering the family reads as an invitation. The earlier layouts —
two near-identical boxes, then a lead plus two labelled boxes — read as a wall
of terms, and people stopped before the button. Anyone who wants less sees the
link right under the box.

## Switching scope clears the tick

A person can only consent to the sentence they are looking at. Without this, a
tick given to one sentence would silently carry over to another.

## The per-flag sentences are whole sentences

A site's confirmation mail quotes the `own` or `group` sentence as the consent
itself — clicking the link in that mail IS the act of consenting. A fragment
like "Om Altid Forsikring" would not stand on its own there. Together, `own` and
`group` cover exactly what the broad sentence covers; a test enforces it.

## The sender is named in the sentence

"fra Altid Hjem". The legal entity and CVR live in each site's footer and
privacy policy; a legal suffix in a family-facing sentence made it read like a
contract. Every brand is still named in full, which is what the spam guidance
requires.

## Versions derive from the template

Nobody writes a version by hand. Change the wording or the family and the
version moves, so the stored proof of what each person accepted moves with it.
A test refuses a text change that does not bump the version.

## The package never touches a database

It returns `{ own, group }`; each site maps that onto its own columns. A config
string naming a column can disagree with the database without the compiler
noticing, and on these tables a failed write is a lost consent that cannot be
reconstructed.
