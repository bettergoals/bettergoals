# bettergoals.ai

A community resource from the [Sooner Safer Happier](https://soonersaferhappier.com) community for crafting better goals and outcomes — delivering **better value, sooner, safer and happier**. Supported by [TeamForm](https://teamform.co).

Built live, in the open, by the community: every feature on this site started as an idea on the [board](https://build.bettergoals.ai). This repo is the **product website**; the build experience lives in [`bettergoals/build-bettergoals`](https://github.com/bettergoals/build-bettergoals), deployed at build.bettergoals.ai.

## How it works

1. **Ideas are GitHub issues** on this repo. Anyone opens one via the [idea form](../../issues/new?template=idea.yml) — it appears on the live board at [build.bettergoals.ai](https://build.bettergoals.ai) within seconds.
2. **The community endorses.** 👍 reactions are votes; 3+ marks an idea as endorsed. Discussion happens in issue comments.
3. **Claude builds it.** When a maintainer adds the `doing` label, a GitHub Action runs Claude Code, which implements the idea and opens a pull request.
4. **Humans review and ship.** Every PR gets a Vercel preview deployment. The community reviews; merging ships to production.

Labels drive the board columns: `idea` → Ideas, `discussing` → Discussing, `doing` → Doing, `done` → Done.

## Development

```bash
npm install
cp .env.example .env.local   # add a GITHUB_TOKEN (required while the repo is private)
npm run dev
```

The board falls back to demo data when GitHub is unreachable, so the site always works.

## Structure

See [CLAUDE.md](CLAUDE.md) — it doubles as the guide for the automated Claude Code builds, including guardrails.

## Operations

- **Deploy:** Vercel, linked to this repo. `main` → production (bettergoals.ai); PRs → preview URLs.
- **Secrets:** `ANTHROPIC_API_KEY` (GitHub Actions secret) powers the automated builds. `GITHUB_TOKEN` (Vercel env var) raises the GitHub API rate limit for the board.
- **Feature flags:** `NEXT_PUBLIC_EMAIL_SIGNIN=true` surfaces the email + PIN contribution path on [/contribute](https://bettergoals.ai/contribute). Leave it unset until sign-in is live on the builder app.
- **Principles:** community-owned in [PRINCIPLES.md](PRINCIPLES.md); edits via PR appear on the site within a minute of merging (no redeploy needed).
- **Skills:** downloadable AI-assistant skills live in `public/skills/` and are auto-listed at [/skills](https://bettergoals.ai/skills).
