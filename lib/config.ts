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

/** 👍 votes needed before an idea counts as endorsed by the group */
export const ENDORSE_THRESHOLD = 3;
