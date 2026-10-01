# Issue and pull request labels

The issue forms in `.github/ISSUE_TEMPLATE/` and `.github/dependabot.yml` apply some of
these labels automatically. GitHub skips a label that does not exist in the repository,
so maintainers should create the set below once (Issues → Labels).

| Label | Colour | Used for |
| --- | --- | --- |
| `bug` | `#d73a4a` | Something does not work (bug report form) |
| `enhancement` | `#a2eeef` | New feature or improvement (feature request form) |
| `content` | `#0e8a16` | Listing content: new places and corrections |
| `new-place` | `#c2e0c6` | A suggested new place, stay, eatery or maker |
| `correction` | `#fbca04` | Wrong or outdated information on a listing |
| `needs-triage` | `#ededed` | Not yet reviewed by a maintainer |
| `needs-verification` | `#f9d0c4` | Content waiting for its sources to be checked |
| `good first issue` | `#7057ff` | Small, self-contained, good for newcomers |
| `help wanted` | `#008672` | Maintainers would welcome a contributor |
| `hacktoberfest` | `#ff7518` | Open for Hacktoberfest contributions |
| `hacktoberfest-accepted` | `#ff7518` | Pull request accepted for Hacktoberfest |
| `spam` | `#000000` | Low-effort or contribution-farming pull request |
| `invalid` | `#e4e669` | Not valid or not actionable |
| `duplicate` | `#cfd3d7` | Already reported |
| `accessibility` | `#5319e7` | WCAG and assistive technology work |
| `i18n` | `#bfdadc` | Translation and language support |
| `security` | `#b60205` | Hardening work that is safe to discuss in public |
| `dependencies` | `#0366d6` | Dependency updates (Dependabot) |

Difficulty labels from [GOOD_FIRST_ISSUES.md](GOOD_FIRST_ISSUES.md) map to
`good first issue` for the easy tier; use `help wanted` together with an `intermediate`
or `advanced` note in the issue body for the others.

Never use the `security` label for an unfixed vulnerability. Those go through private
reporting, as described in [SECURITY.md](../SECURITY.md).
