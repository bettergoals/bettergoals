export const SITE = {
  name: "bettergoals.ai",
  tagline: "Craft better goals, together.",
  description:
    "A community resource from the Sooner Safer Happier community for crafting better goals and outcomes — delivering better value, sooner, safer and happier.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://bettergoals.ai",
  repo: process.env.GITHUB_REPO ?? "bettergoals/bettergoals",
};

export const REPO_URL = `https://github.com/${SITE.repo}`;
/** The separate builder app where ideas are proposed, endorsed, and moved to Doing */
export const BUILD_URL = process.env.NEXT_PUBLIC_BUILD_URL ?? "https://build.bettergoals.ai";
export const NEW_IDEA_URL = `${REPO_URL}/issues/new?template=idea.yml`;

/** Sign-in on the builder app — email + 6-digit PIN, no GitHub account needed */
export const BUILD_SIGNIN_URL = `${BUILD_URL}/signin`;

/**
 * Email + PIN sign-in lives in the builder repo and ships dark until its Vercel
 * project has the mail/session secrets. Flip NEXT_PUBLIC_EMAIL_SIGNIN=true here
 * once it is live, and the email path appears as the lead route on /contribute.
 */
export const EMAIL_SIGNIN_ENABLED = process.env.NEXT_PUBLIC_EMAIL_SIGNIN === "true";

/** 👍 votes needed before an idea counts as endorsed by the group */
export const ENDORSE_THRESHOLD = 3;
