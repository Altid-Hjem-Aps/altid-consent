# altid-consent

Marketing consent for every Altid landing page, decided once at Altid Hjem level.

**Status: design only. There is no code yet.** Read [docs/design.md](docs/design.md).

When v1 lands, adopting it on a landing page is one line:

```tsx
<ConsentBlock brand="forsikring" />
```

The sentences, the family of brands and the rules live here. A site says which
brand it is, and that is the whole integration. When consent changes, it
changes here, and every site gets it as an update PR.

Changes to consent go through Altid Hjem. `CODEOWNERS` and branch protection
enforce that once the owners are named — which is also why this repository must
stay public: on GitHub Free, branch protection exists only on public
repositories.
