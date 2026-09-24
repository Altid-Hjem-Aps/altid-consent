# Changelog

The exact consent text of every template version. A stored `consent_version` is
only proof of what a person accepted if you can show what that version said, so
every version is recorded here in full and never edited afterwards.

Stored versions are `<template version>-<brand>`, e.g. `2026-09-24.1-forsikring`.
Versions from before this package (e.g. `2026-07-14.2-mad`, `2026-09-23.3-af`)
were site-specific; their text lives in each site's git history.

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
