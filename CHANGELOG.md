# Changelog

The exact consent text of every template version. A stored `consent_version` is
only proof of what a person accepted if you can show what that version said, so
every version is recorded here in full and never edited afterwards.

Stored versions are `<template version>-<brand>`, e.g. `2026-09-24.1-forsikring`.
Versions from before this package (e.g. `2026-07-14.2-mad`, `2026-09-23.3-af`)
were site-specific; their text lives in each site's git history.

This version covers the package's own sentences only — the ones `consentSentences`
generates. Text a site owns itself, such as its confirmation-mail headings, is not
versioned here.

## 2026-10-16.2

Second template. Three changes, all of them in what a visitor reads:

- The broad sentence now names every brand as a sender and what each one mails about, instead of "Altid Hjem og hele familien".
- A "Hvem står bag?" link next to the broad sentence opens the companies behind those brands.
- `hjem` (altidhjem.dk) is a brand of its own: one combined box, the broad sentence only, no narrow sentence and no narrow link. Ticking it stores both flags.

Why `.2` and not `.1`: altidforsikring.dk, altidmad.dk and altidhjem.dk each went live on 2026-10-16 with their own site versions `2026-10-16.1-af`, `2026-10-16.1-mad` and `2026-10-16.1-hjem`. A package version `2026-10-16.1-mad` would be the same stored string as altidmad.dk's, for different narrow and group wording (below). A stored version must name one text only, so the template starts at `.2`.

Family, in order: Forsikring, Energi, Mobil, Mad. Sender: Altid Hjem.

Broad sentence (`all`), the same for every brand including `hjem`:

> Ja tak til nyheder og gode tilbud på mail om forsikring, el, mobil og madvarer fra Altid Hjem, Altid Forsikring, Altid Energi, Altid Mobil og Altid Mad.

Withdraw line: `Afmeld når som helst`. Link back to the broad sentence: `Hele familien igen? Skift her`. Senders link (shown next to the broad sentence only, never ticks the box): `Hvem står bag?`

Senders list, in this order, opened by the senders link:

- Altid Hjem ApS (CVR 45637476): Altid Hjem og Altid Forsikring
- Altid Mobil ApS (CVR 46169093): Altid Mobil
- Altid Energi ApS (CVR 44373580): Altid Energi
- Spari ApS (CVR 44307170): Altid Mad

### forsikring

- own: Ja tak til nyt og gode tilbud på mail om Altid Forsikring fra Altid Hjem.
- group: Ja tak til nyt og gode tilbud på mail fra Altid Hjem og resten af familien: Energi, Mobil og Mad.
- narrow link: Kun Forsikring? Skift her

### energi

- own: Ja tak til nyt og gode tilbud på mail om Altid Energi fra Altid Hjem.
- group: Ja tak til nyt og gode tilbud på mail fra Altid Hjem og resten af familien: Forsikring, Mobil og Mad.
- narrow link: Kun Energi? Skift her

### mobil

- own: Ja tak til nyt og gode tilbud på mail om Altid Mobil fra Altid Hjem.
- group: Ja tak til nyt og gode tilbud på mail fra Altid Hjem og resten af familien: Forsikring, Energi og Mad.
- narrow link: Kun Mobil? Skift her

### mad

- own: Ja tak til nyt og gode tilbud på mail om Altid Mad fra Altid Hjem.
- group: Ja tak til nyt og gode tilbud på mail fra Altid Hjem og resten af familien: Forsikring, Energi og Mobil.
- narrow link: Kun Mad? Skift her

### hjem

- Broad sentence, withdraw line and senders link only, as above.
- No own or group sentence and no narrow link: altidhjem.dk keeps one combined box. Ticking it stores both flags (`own` and `group`).
- The per-brand sentences in altidhjem.dk's preference centre are not part of this template.

### How stored versions relate to the site versions from before the package

- `2026-10-16.1-af` (altidforsikring.dk) and `2026-10-16.2-forsikring` accepted identical wording: broad sentence, senders list, own and group sentences, withdraw line and links.
- `2026-10-16.1-hjem` (altidhjem.dk) and `2026-10-16.2-hjem` accepted identical wording: the combined box, the withdraw line and the senders list. The launch notice above the box is the site's own text and is not versioned here.
- `2026-10-16.1-mad` (altidmad.dk) and `2026-10-16.2-mad` did NOT accept identical wording. The broad sentence and the senders list are identical. The narrow and group sentences are a deliberate wording change for Mad, decided by Alexander Thorup on 2026-10-16: altidmad.dk moves to the package's uniform wording, like every other brand. Under the site's version `2026-10-16.1-mad` the narrow link showed this own sentence (and the confirmation mail and preference centre quoted it):

  > Ja tak. Jeg vil gerne modtage e-mails med nyheder, tilbud og anden markedsføring om Altid Mad fra Altid Hjem ApS. Jeg kan til enhver tid trække mit samtykke tilbage.

  and the group sentence was:

  > Ja tak. Jeg vil gerne modtage e-mails med nyheder, lanceringer, tilbud og anden markedsføring om Altid Hjem, Altid Forsikring og Altid Mobil fra Altid Hjem ApS. Jeg kan til enhver tid trække mit samtykke tilbage.

  (it left Energi out; it was never on the signup form, only in the confirmation mail and the preference centre). A row stored as `2026-10-16.2-mad` accepted the package's `mad` sentences above, not these two. Under the site's version `2026-10-16.1-mad`, a row with `own` true and `group` false accepted the old own sentence. A row with both flags true accepted the broad sentence, which is identical under either version.

## 2026-09-24.1

First template. Reproduces altidforsikring.dk's text exactly as it stood under
that site's own version `2026-09-23.3-af`: a row stored as `2026-09-23.3-af` and a
row stored as `2026-09-24.1-forsikring` accepted identical wording.

Family, in order: Forsikring, Energi, Mobil, Mad. Sender: Altid Hjem.

Broad sentence (`all`), the same for every brand:

> Ja tak til nyt og gode tilbud på mail fra Altid Hjem og hele familien: Forsikring, Energi, Mobil og Mad.

Withdraw line: `Afmeld når som helst`. Link back to the broad sentence: `Hele familien igen? Skift her`.

### forsikring

- own: Ja tak til nyt og gode tilbud på mail om Altid Forsikring fra Altid Hjem.
- group: Ja tak til nyt og gode tilbud på mail fra Altid Hjem og resten af familien: Energi, Mobil og Mad.
- narrow link: Kun Forsikring? Skift her

### energi

- own: Ja tak til nyt og gode tilbud på mail om Altid Energi fra Altid Hjem.
- group: Ja tak til nyt og gode tilbud på mail fra Altid Hjem og resten af familien: Forsikring, Mobil og Mad.
- narrow link: Kun Energi? Skift her

### mobil

- own: Ja tak til nyt og gode tilbud på mail om Altid Mobil fra Altid Hjem.
- group: Ja tak til nyt og gode tilbud på mail fra Altid Hjem og resten af familien: Forsikring, Energi og Mad.
- narrow link: Kun Mobil? Skift her

### mad

- own: Ja tak til nyt og gode tilbud på mail om Altid Mad fra Altid Hjem.
- group: Ja tak til nyt og gode tilbud på mail fra Altid Hjem og resten af familien: Forsikring, Energi og Mobil.
- narrow link: Kun Mad? Skift her
