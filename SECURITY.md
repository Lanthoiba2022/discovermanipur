# Security policy

Discover Manipur is a volunteer-run, open-source project. We take reports seriously and
are grateful to anyone who helps keep visitors and contributors safe.

## Supported versions

Only the `main` branch, and the site deployed from it, receives security fixes. There are
no versioned releases.

| Version | Supported |
| --- | --- |
| `main` | Yes |
| Anything else (forks, old commits) | No |

## Reporting a vulnerability

**Please do not open a public issue, discussion or Discord post for a security problem.**

Report it privately through GitHub:

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability**.
3. Describe the issue, how to reproduce it, the affected URL or file, and the impact you
   think it has. A minimal proof of concept helps.

If you cannot use GitHub's private reporting, message a maintainer on
[Discord](https://discord.gg/hgGfm6UpU) **only to ask for a private channel**. Do not post
details there.

## What to expect

This is a volunteer project, so please allow for that:

- We aim to **acknowledge your report within about 5 days**.
- We will tell you whether we can reproduce it and how we plan to fix it, and keep you
  updated as we go.
- When it is fixed, we will publish a GitHub security advisory and credit you, unless you
  prefer to stay anonymous.
- Please give us a reasonable time to fix the issue before you disclose it publicly. We
  suggest 90 days, or sooner once a fix is released.

## Scope

In scope:

- **Authentication and sessions:** sign-up, sign-in, verification codes, session cookies,
  the `/api/auth` proxy, and the Neon Auth webhook at `/api/webhooks/neon-auth`.
- **Authorization:** reaching `/admin/*` or `/host/dashboard` without the right role,
  changing your own role, or reading or changing another user's profile, bookings,
  saved items or itineraries.
- **Server Actions and Route Handlers:** missing input validation, trusting ids from the
  client, or abuse of `/api/chat`, `/api/itinerary` and `/api/place-photo` (for example
  using them to run up third-party API costs, or as an open proxy).
- **Injection and web flaws:** XSS, CSRF, SSRF, open redirects (for example through the
  `next` parameter on `/auth`), and SQL injection.
- **Secrets:** API keys, database URLs or other credentials exposed in the repository,
  the client bundle or responses. Note that `GOOGLE_API_KEY` is intentionally sent to the
  browser for the Kangla map and is protected by HTTP-referrer restrictions; a report
  about it needs to show that the restriction can be bypassed.
- **Supply chain:** a vulnerable dependency that is actually reachable in this app.

Out of scope:

- Missing rate limiting on static or cached pages.
- Missing "best practice" headers or cookie flags without a demonstrated impact.
- Reports produced only by automated scanners, without a working proof.
- Social engineering or phishing of maintainers, contributors or users.
- Denial of service, load testing or volumetric attacks.
- Physical attacks, or attacks needing a compromised device or browser.
- Issues in third-party services themselves (Neon, Google, Brevo, Vercel). Report those
  to the vendor.
- The local development session used when Neon Auth is not configured. It stores data in
  your own browser on purpose and is switched off in production builds.

## Rules for testing

- **Never access, change or delete other people's accounts or data.** Test only with
  accounts you created, and stop as soon as you have shown the issue.
- Prefer testing against your own local copy (`npm run dev`) or your own deployment
  rather than the live site.
- Do not run automated scanners or high-volume requests against the live site.
- Do not use any data you come across for anything other than the report, and delete it
  afterwards.

## Safe harbour

If you act in good faith, follow this policy and avoid harm to users and data, we will
not pursue or support legal action against you for your research, and we will treat
your report as a contribution to the project.
