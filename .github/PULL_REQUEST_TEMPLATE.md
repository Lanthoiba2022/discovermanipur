## Summary

<!-- What does this change, and why? Keep it short. -->

## Linked issue

Closes #

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Content (new listing, correction, photos)
- [ ] Accessibility
- [ ] Documentation
- [ ] Refactor, tooling or CI

## Screenshots

<!-- Required for any UI change: before and after, on desktop and on a phone-width screen. Delete this section otherwise. -->

## How I tested it

<!-- The routes you checked, with or without environment variables, browsers and devices. -->

## Checklist

- [ ] `npm run lint`, `npm run typecheck` and `npm run build` pass locally with no environment variables set.
- [ ] This pull request covers one issue, and I was assigned to it.
- [ ] No secrets, keys, tokens or `.env.local` contents are included.
- [ ] No real personal data (private phone numbers, home addresses, emails) is included. Examples use placeholders such as `you@example.com`.
- [ ] Any photo I added is my own or carries a licence that allows reuse, and is credited in `src/lib/data/photo-credits.ts`.
- [ ] Facts I added about places have a public source, linked above or in the listing's `sources`.
- [ ] Protected pages call `requireAdmin` / `requireHost` themselves, and Server Actions validate input and resolve the user from the session (if relevant).
- [ ] I have read and understood every line, including any written with an AI assistant.
