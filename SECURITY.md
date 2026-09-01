# Security posture — bettergoals.ai

This document describes the security controls for bettergoals.ai (product site, this repo) and build.bettergoals.ai ([`build-bettergoals`](https://github.com/bettergoals/build-bettergoals)), mapped to SOC 2 Trust Services Criteria. A SOC 2 *report* requires an independent audit over an observation period; this is the control inventory that work would build on.

Report a vulnerability: open a private security advisory on this repo, or email the maintainer.

## Implemented technical controls

**Access control (CC6.1–6.3)**
- No user database and no stored credentials. GitHub identity gates all contribution writes (issues, comments, reactions, PRs).
- Board card moves require a facilitator passcode: compared in constant time server-side, held as an httpOnly/secure/SameSite cookie, 12-hour expiry.
- Email sign-in (builder, ships dark until enabled): stateless one-time PINs bound to email + expiry via HMAC-SHA256; 30-day HMAC-signed httpOnly session cookies; no secrets or PII persisted server-side.
- GitHub API access uses a fine-grained PAT scoped to one repo with least privilege (Issues RW, Contents R), stored only in Vercel env vars.
- Automated builds authenticate via the Claude Code GitHub App and a repo-scoped Actions secret (`ANTHROPIC_API_KEY`); workflow `permissions:` blocks grant only what each job needs.

**Change management (CC8.1)**
- All production changes flow: PR → `preview` branch (staging at preview.bettergoals.ai) → human review → promotion PR → `main` (production). AI-built changes are never merged without human review.
- CI requires `npm run build` to pass before automated PRs open; guardrails in `CLAUDE.md` prohibit automated edits to workflows and security-relevant files.

**System hardening (CC6.6–6.8)**
- Security headers on every response (both apps): HSTS with preload, nosniff, X-Frame-Options DENY, strict referrer policy, restrictive Permissions-Policy. TLS terminated by Vercel; HTTP redirects to HTTPS.
- Best-effort per-IP rate limiting on the passcode and PIN endpoints (documented limitation: in-memory per serverless instance; durable KV-backed limiting is planned with the voting feature).
- No secrets in code; `.env.example` documents required variables. Dependencies: minimal set, `npm audit` clean at time of writing.

**Data & privacy (C1, P-series)**
- The only personal data handled today is GitHub's public profile data. The email sign-in feature is designed so emails appear only in signed cookies held by the user's own browser and in Resend's transactional log — never in public GitHub content and never in a database we operate.

## Operational controls

Automated:

- [x] Dependabot alerts + automated security fixes enabled on both repos; weekly grouped dependency-update PRs via `.github/dependabot.yml` (npm + Actions)
- [x] Branch protection on product `main`: changes via pull request, force-pushes and deletions blocked (admins exempt so the promotion flow stays one-click)
- [x] Monthly security-review issue opened automatically (`security-review-reminder.yml`): access reviews, log review, Dependabot triage, secret-rotation cadence — closed issues form the audit trail

## Owner checklist

These need the org owner (settings, not code) and are the gap between "hardened" and "audit-ready":

- [ ] Require 2FA for all members of the `bettergoals` GitHub org (org settings → Authentication security; the enforcing account must have 2FA first)
- [ ] Extend branch protection to product `preview` and builder `main` (same settings as product `main`)
- [ ] Restrict Vercel project access to named team members; review via the monthly issue
- [ ] Before enabling email sign-in: verify the sending domain in Resend, set a strong `SESSION_SECRET` (32+ random bytes), and add the KV-backed rate limiter
- [ ] If pursuing an actual SOC 2 Type I/II report: engage an auditor and stand up evidence collection (e.g. Vanta/Drata) — the controls above are the inputs; this requires a commercial engagement and an observation period and cannot be completed from the repo

## Known accepted risks

- Anyone with the facilitator passcode can trigger paid automated builds; passcode is shared per-workshop and should be rotated after each event (change `BOARD_PASSCODE` in Vercel).
- In-memory rate limiting resets per serverless instance — adequate against casual abuse, not sustained attack.
- Content Security Policy is not yet enforced (Next.js inline-script nonce work); tracked as a hardening follow-up.
