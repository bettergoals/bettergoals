# bettergoals.ai

A community website from the Sooner Safer Happier executive community for crafting better goals and outcomes. Community members propose ideas as GitHub issues, endorse them with 👍 reactions, and endorsed ideas (labelled `doing`) are built automatically by Claude Code via GitHub Actions.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4 (CSS-based config in `app/globals.css`)
- Deployed on Vercel: PRs get preview deployments; `main` is production (bettergoals.ai)
- No database — GitHub Issues are the datastore for ideas; markdown files are the datastore for content

## Layout

This repo is the PRODUCT website only. The build experience (kanban board, card moves) lives in the separate repo `bettergoals/build-bettergoals`, deployed at build.bettergoals.ai — do not add board/move features here.

- `app/` — routes: `/` (landing), `/principles`, `/skills`, `/contribute`, `/qr`
- `lib/config.ts` — site constants (repo, builder URL, endorse threshold)
- `public/skills/*.md` — downloadable skills; the Skills page auto-lists them (frontmatter `name:` and `description:` required)
- `PRINCIPLES.md` — rendered at `/principles`, fetched live from GitHub with local fallback

## Commands

- `npm run dev` — dev server
- `npm run build` — production build; MUST pass before any commit
- `npm run lint` — eslint

## Guardrails for automated builds

You may be running unattended from a GitHub Action. Follow these strictly:

1. **Never** edit or delete `.github/workflows/**`, `CLAUDE.md`, or the footer attribution to TeamForm and Sooner Safer Happier in `components/SiteChrome.tsx`.
2. Keep changes scoped to the one idea you were asked to build. No drive-by refactors.
3. Match the existing visual language: Tailwind utilities, the `ink`/`chalk`/`sooner`/`safer`/`happier` theme colors, rounded-2xl cards, generous whitespace.
4. Prefer no new dependencies. If one is genuinely needed, it must be well-known and actively maintained.
5. No secrets in code. Server-only env vars: `GITHUB_TOKEN` (optional, raises API rate limits), `GITHUB_REPO`.
6. Everything must work without JavaScript-heavy client state — server components by default, client components only for interactivity.
7. `npm run build` must pass before you open a PR.
8. New pages must be linked from the nav (in `components/SiteChrome.tsx`) or an existing page, and must render sensibly on mobile.
9. Align content with `PRINCIPLES.md` — outcomes over outputs; accessible to novices, powerful for experts.
