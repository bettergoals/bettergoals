/**
 * "How do I get everyone else to write better outcomes?"
 *
 * The Outcome Coach reviews your draft. This is the other half of the job:
 * taking outcomes to the people whose goals, forums and reports you don't
 * control — your boss, the PMO, your peers.
 *
 * The guidance here is deliberately conversational rather than a framework.
 * It follows the coach design principles: it hands you questions and sentences
 * you could actually say, it never claims to know your organisation, and it
 * assumes the other person has a good reason for asking for outputs.
 */

export type Move = { title: string; text: string };

export type Objection = {
  /** What you'll actually hear. */
  heard: string;
  /** What's usually underneath it — the fear, not the words. */
  meaning: string;
  /** Something you could say out loud, in one breath. */
  say: string;
};

export type Audience = {
  id: string;
  /** Tab label — short. */
  label: string;
  /** Page heading for this audience. */
  heading: string;
  /** One line on why this conversation is hard. */
  blurb: string;
  /** The pressure they're under, which is why they ask for outputs. */
  pressure: string;
  /** A first sentence that doesn't start a fight. */
  opener: string;
  moves: Move[];
  objections: Objection[];
  /** What to leave behind, once the conversation is over. */
  afterwards: string;
  /** How you'll know it landed — none of these are "they agreed". */
  signals: string[];
  /** Who they are, for the rehearsal prompt. */
  promptWho: string;
  /** What you want out of it, for the rehearsal prompt. */
  promptWant: string;
};

export const AUDIENCES: Audience[] = [
  {
    id: "boss",
    label: "My boss",
    heading: "Talking to your boss about outcomes",
    blurb:
      "They set the goal you were given. Changing its shape looks, from where they sit, like loosening a promise they already made to somebody else.",
    pressure:
      "Your boss is accountable for a commitment that was almost certainly made in output form — a date, a launch, a line in a plan. Asking them to swap it for an outcome sounds like asking them to be vaguer with their own boss. So don't ask for vaguer. Offer them something safer to promise: a number they can stand behind, and an early signal that tells them months in advance whether it's coming.",
    opener:
      "Can I show you how I'd measure success on this? I want to check we'd both recognise it when it happens.",
    moves: [
      {
        title: "Bring one real goal, not a philosophy",
        text: "Pick the goal they care most about this quarter — theirs, not a tidy example. Rewriting one live goal in front of them teaches more than any explanation of outcomes over outputs, and it can't be filed for later.",
      },
      {
        title: "Show both versions side by side",
        text: "The output as it's written today, and the outcome underneath it. Then ask which one they'd rather report on. Let the pair of sentences make the argument so you don't have to.",
      },
      {
        title: "Keep their deliverable in the frame",
        text: "Outcomes over outputs has never meant “no deliverables”. Say it plainly: same work, same date, different definition of done. Most resistance is the fear that the work is being renegotiated.",
      },
      {
        title: "Ask for exactly one thing: the baseline",
        text: "“Can we agree what the number is today, before we agree the target?” That single question does more teaching than a deck, because it's the question nobody can answer with a milestone.",
      },
    ],
    objections: [
      {
        heard: "I need something concrete I can commit to.",
        meaning:
          "They're afraid an outcome can't be evidenced, and they'll be the one standing there without an answer.",
        say: "An outcome with a baseline, a target and a date is more concrete than a delivery date — it says what we'll have, not just when we'll be finished.",
      },
      {
        heard: "The board wants dates.",
        meaning: "Dates are the currency they're paid in. You won't win by devaluing them.",
        say: "Then let's give them both: the date the change should show up, and the early signal we'll see weeks before that.",
      },
      {
        heard: "We already know what to build.",
        meaning:
          "They may well be right. What they're hearing is that their judgement is being questioned.",
        say: "Then let's write down what we expect it to change. If we're right, that's the win we get to claim. If we're wrong, we find out in weeks instead of at go-live.",
      },
      {
        heard: "This lets the team off the hook.",
        meaning: "Outcomes sound softer than deadlines to anyone who hasn't tried to hit one.",
        say: "It's the opposite. An output you can finish is easier to hit than a number you have to move.",
      },
    ],
    afterwards:
      "Send one paragraph, not a deck: the outcome in the “from x to y by when” shape, the one leading indicator, and the deliverable still sitting inside it. Ask them to correct it. A boss who edits your outcome owns it.",
    signals: [
      "They quote your measure back to you in a meeting you weren't in.",
      "They ask “what's the baseline?” about something that has nothing to do with you.",
      "A goal you didn't write turns up in outcome shape.",
    ],
    promptWho:
      "my manager, who set this goal and is accountable for it upwards. They are under pressure to commit to dates and deliverables.",
    promptWant:
      "to agree an outcome — a baseline, target, timeframe and one leading indicator — without them feeling I am renegotiating the commitment or questioning their judgement.",
  },
  {
    id: "pmo",
    label: "The PMO",
    heading: "Getting outcomes into the PMO",
    blurb:
      "The PMO isn't the obstacle. It's a function measured on whether the portfolio is on plan, being asked to govern something that doesn't fit its columns.",
    pressure:
      "A PMO reports RAG status, milestones and spend against forecast. Outcomes threaten every one of those columns, and nothing in their remit rewards the risk. Don't ask them to give up their reporting — offer them a column that answers a question their current pack can't: is it working?",
    opener:
      "You're being asked whether we're on plan. Could we also give you something that answers whether it's working?",
    moves: [
      {
        title: "Speak in their artefacts",
        text: "Bring the actual template they collect — the milestone sheet, the status slide — and fill it in for one initiative with outcomes sitting alongside the milestones. Meet the governance where it already is.",
      },
      {
        title: "Add a column, don't remove one",
        text: "First slice: one line per initiative — measure, baseline, target, date. The milestones stay exactly where they are. Nothing you propose should require anyone to stop reporting anything.",
      },
      {
        title: "Make “safe to miss” explicit",
        text: "A PMO will only accept an outcome measure if a red number can be a learning rather than an escalation. Agree what happens when the number doesn't move — before it doesn't move.",
      },
      {
        title: "Give them a standard, not a taste",
        text: "Outcomes are impossible to govern when every team writes them differently. Hand over a pattern and a canvas so consistency is a template, not a judgement call they have to defend.",
      },
    ],
    objections: [
      {
        heard: "Outcomes don't roll up into a portfolio view.",
        meaning: "They need to aggregate hundreds of items into one page for an exec.",
        say: "We don't need to add them up. Fewer, bigger outcomes read fine as a list — and eight outcomes tell the exec more than two hundred green milestones.",
      },
      {
        heard: "Teams will game the measure.",
        meaning: "They've watched it happen, and they'll be the ones who have to explain it.",
        say: "They will, if it's a target with consequences and no counterweight. Pair every measure with a guardrail metric and review both — that's governance work you're better placed to do than we are.",
      },
      {
        heard: "Who's accountable if the outcome isn't met?",
        meaning: "Accountability is the PMO's whole job, and it currently has a clear answer.",
        say: "The same person as today. What changes is the conversation — what we learned and what we'd change, instead of who slipped.",
      },
      {
        heard: "This is more reporting.",
        meaning: "It probably is, at first, and they carry the cost of collecting it.",
        say: "It should end up replacing some. Try one initiative for a quarter and count how many status questions the measure answers on its own.",
      },
    ],
    afterwards:
      "Leave a one-page before-and-after of a real initiative, in their own template. Then volunteer: be the pilot, and bring the numbers yourself for a quarter so the first attempt costs them nothing.",
    signals: [
      "The measure appears in their pack without you sending it.",
      "Steering asks about the leading indicator before the milestone.",
      "A measure goes red and gets a conversation instead of an action item.",
    ],
    promptWho:
      "our PMO / portfolio governance function. They are measured on whether the portfolio is on plan, and they report milestones, RAG status and spend.",
    promptWant:
      "to get one outcome measure into their existing reporting for a single initiative as a pilot, without asking them to drop anything or take on risk they can't defend.",
  },
  {
    id: "peers",
    label: "My team and peers",
    heading: "Teaching your team and peers",
    blurb:
      "They already suspect that finishing things isn't the same as helping anyone. What stops them is that their goals were handed down, and rewriting them feels like either insubordination or homework.",
    pressure:
      "Peers don't need persuading that output goals are hollow — they've lived it. They need permission and a first move small enough to survive a normal week. Anything that looks like a training programme will lose to their inbox.",
    opener:
      "Want to spend twenty minutes turning one of our goals into something we'd actually be proud to hit?",
    moves: [
      {
        title: "Run it, don't teach it",
        text: "Book an hour, bring three real goals from your own area, and rewrite them together. Nobody has ever learned outcomes from a definition — they learn them from watching a goal they recognise get better.",
      },
      {
        title: "Write the bad version first, out loud",
        text: "Put the output-shaped goal on the board and ask: could we finish every word of this and nothing be better for anyone? The laugh in the room is the lesson. Use your own goal for this, never theirs.",
      },
      {
        title: "Let the check be the bad guy",
        text: "Paste a draft into the Outcome Coach and read the gaps together. It is far easier to argue with a score than with a colleague, and it takes you out of the role of the person who marks other people's work.",
      },
      {
        title: "Send them away with one artefact",
        text: "One canvas, or one skill they can point their own AI at. Education that needs you in the room doesn't spread — and the goal is that the next outcome gets written without you.",
      },
    ],
    objections: [
      {
        heard: "Our goals are set for us.",
        meaning: "They think this needs permission they don't have.",
        say: "Then leave the goal alone and write the outcome underneath it. You're not renegotiating the commitment, you're saying what it's for.",
      },
      {
        heard: "We don't have the data.",
        meaning: "They believe a measure without a number is a failed exercise.",
        say: "Write “we don't measure this yet” as the baseline. That's a finding, not a blocker — and it's usually the most useful line on the page.",
      },
      {
        heard: "Isn't this just OKRs? OKRs didn't work here.",
        meaning: "They survived a rollout that became a form.",
        say: "Most rollouts failed because they became a form. Try it on one goal you already care about and see whether the conversation is better. Skip the template until it earns its place.",
      },
      {
        heard: "I don't have time for this.",
        meaning: "Correct, for anything shaped like a course.",
        say: "Twenty minutes, one goal, the one you're least sure about. If it isn't clearer at the end, we stop.",
      },
    ],
    afterwards:
      "There's nothing to send. Put the rewritten goal where the work already happens — the board, the wiki page, the top of the stand-up — so the new shape is the one people see every day.",
    signals: [
      "Someone brings you a goal you didn't ask about.",
      "“What's the baseline?” starts being asked by someone else.",
      "The first outcome you had nothing to do with shows up.",
    ],
    promptWho:
      "my peers and team — people at roughly my level who mostly agree with me in principle but have goals handed down to them and very little spare time.",
    promptWant:
      "to run a short, practical session on one or two of our real goals so that at least one person writes their next outcome without me in the room.",
  },
];

export const DEFAULT_AUDIENCE = AUDIENCES[0];

export function audienceFor(id: string | undefined): Audience {
  return AUDIENCES.find((a) => a.id === id) ?? DEFAULT_AUDIENCE;
}

/** A 60-minute session, for when "a chat" isn't enough. */
export const SESSION_AGENDA: Move[] = [
  {
    title: "0–10 · Why we're here",
    text: "One goal from your own area that you know is output-shaped, and the honest story of what it cost. You go first, and you use your own work as the cautionary tale.",
  },
  {
    title: "10–20 · The one question",
    text: "“Could we finish all of this and nothing be better for anyone?” Run it over two or three real goals from the room. Don't define anything yet.",
  },
  {
    title: "20–40 · Rewrite one goal, together",
    text: "Pick the goal with the most energy behind it. Fill in who it's for, what changes for them, the baseline, the target and the date. Leave the gaps visible rather than guessing numbers.",
  },
  {
    title: "40–50 · Check it, out loud",
    text: "Run the draft through the Outcome Coach and read the gaps together. Argue with the score — that argument is the session.",
  },
  {
    title: "50–60 · One commitment each",
    text: "Everyone names one goal they'll rewrite this week and who they'll show it to. No template rollout, no follow-up deck.",
  },
];

/** Ways this goes wrong, all of them tempting. */
export const PITFALLS: string[] = [
  "Sending the principles as pre-reading. Nobody reads homework about goals; bring a goal instead.",
  "Correcting somebody's goal in public. The point is to make outcomes feel safe, and a corrected goal in a group chat teaches the opposite lesson.",
  "Leading with the vocabulary. “Outputs versus outcomes” is our shorthand, not theirs — describe the change you want and let them name it.",
  "Bringing a scorecard to a colleague. The check exists so you don't have to be the marker.",
  "Trying to convert everyone. One boss and one peer who write real outcomes will out-teach any campaign.",
];

/**
 * A prompt for rehearsing the conversation with an AI before having it for
 * real. Carries your draft only if you brought one — and asks the AI to coach
 * and role-play rather than write your script for you.
 */
export function buildRehearsalPrompt(audience: Audience, draft?: string): string {
  const lines = [
    "I want to help someone else write better outcomes. I'm not asking you to fix my own goal right now — this is about the conversation.",
    "",
    `Who I'm talking to: ${audience.promptWho}`,
    `What I want from the conversation: ${audience.promptWant}`,
  ];

  if (draft && draft.trim()) {
    lines.push(
      "",
      "The goal we'll be talking about:",
      '"""',
      draft.trim(),
      '"""'
    );
  }

  lines.push(
    "",
    "Coach me, then rehearse with me:",
    "1. Ask me what this person is actually measured on, and what they'd lose if my version won.",
    "2. Help me find the version of the outcome that makes their job easier, not harder.",
    "3. Then role-play them — sceptical but reasonable, not a cartoon — and let me practise. Push back the way they really would.",
    "4. Afterwards, tell me which of my sentences would have landed and which would have started a fight.",
    "",
    "Use the bettergoals.ai outcome principles as the standard: start with customer and problem; outcomes over outputs;",
    "treat the outcome as a hypothesis; measure movement and impact with a baseline, target and timeframe; connect it to",
    "strategy and value; and write it so anyone can understand it.",
    "",
    "Ask one question at a time. Don't invent facts, baselines or quotes about my organisation — if you need something, ask.",
    "No names or personal details: refer to everyone by their role. I want to leave with sentences I would actually say out loud,",
    "not a script that sounds like a consultant."
  );

  return lines.join("\n");
}
