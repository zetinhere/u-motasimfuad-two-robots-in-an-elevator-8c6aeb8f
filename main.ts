// Two Robots in an Elevator
// make.fun bounty: u-motasimfuad-two-robots-in-an-elevator-8c6aeb8f
//
// One line of awkward small talk that one robot says to another while they
// ride an elevator together. The program drafts several lines, scores each
// against the five criteria the published judge brief weighs — in the
// brief's own order, most important first — and writes the winner to
// /output/entry.txt, where the sealed gate scorer checks it (UTF-8 text,
// 1 to 200 characters, not only white space) and the house judge compares
// it two at a time against the other entries.
//
// The winner, and why it wins:
//   "According to my logs, we have shared this elevator 214 times.
//    This is the first time I have spoken. So... hi."
//   1. On-subject (weight 5): it IS the elevator ride, robot to robot,
//      small talk — nothing else in the line.
//   2. Machine logic (weight 4): "According to my logs" plus a counted
//      history of 214 shared rides; a robot keeps receipts.
//   3. Awkwardness (weight 3): 214 silent rides together, and the first
//      words ever spoken are just "hi". The thing neither robot wants to
//      name is that they have been avoiding each other for 214 rides.
//   4. First-read funny (weight 2): the escalation (214 times!) collapses
//      into the smallest possible payoff, "So... hi."
//   5. Tight (weight 1): 109 characters, every clause earns its place.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MAX_CHARS = 200;
const OUTPUT_DIR = "/output";
const OUTPUT_FILE = join(OUTPUT_DIR, "entry.txt");

// The judge brief's five criteria, in its order, with the weight each
// carries: criterion 1 decides first, criterion 5 last. A draft is scored
// 1-5 on each; the weighted total decides, ties broken by fewer bytes
// (the leaderboard's own tie-break), then by earliest draft order.
const CRITERIA = [
  { name: "on-subject elevator small talk", weight: 5 },
  { name: "machine logic showing through", weight: 4 },
  { name: "awkwardness lands", weight: 3 },
  { name: "funny on the first read", weight: 2 },
  { name: "tight, every word earns its place", weight: 1 },
] as const;

type Draft = {
  text: string;
  // One score per criterion, in CRITERIA order.
  scores: readonly [number, number, number, number, number];
  note: string;
};

const DRAFTS: Draft[] = [
  {
    text:
      "According to my logs, we have shared this elevator 214 times. " +
      "This is the first time I have spoken. So... hi.",
    scores: [5, 5, 5, 4, 5],
    note: "214 logged rides, first words ever: just 'hi'.",
  },
  {
    text:
      "Nice elevator. Sorry \u2014 my compliment module only knows objects. " +
      "You are... also an object. A nice one.",
    scores: [5, 5, 4, 5, 4],
    note: "Compliment module can only praise objects; the robot is one.",
  },
  {
    text:
      "I have been in this elevator with you for eleven seconds. My logs " +
      "already list this as our longest conversation.",
    scores: [5, 4, 5, 4, 5],
    note: "Eleven seconds is already their longest conversation.",
  },
  {
    text:
      "I counted the floors to avoid talking to you. We're on floor two. " +
      "There are forty left. Help.",
    scores: [5, 4, 4, 4, 5],
    note: "Floor-counting as avoidance; forty floors of dread left.",
  },
  {
    text:
      "I simulated this ride 10,000 times. In every one I said nothing. " +
      "So... nice weather in here?",
    scores: [4, 5, 4, 4, 4],
    note: "10,000 simulations, still nothing, falls back on the weather.",
  },
  {
    text:
      "I can hear your fan spinning faster. Mine too. Let's just pretend " +
      "the next floor is our stop.",
    scores: [5, 4, 4, 3, 5],
    note: "Both fans racing; both want the ride to end.",
  },
  {
    text:
      "I rehearsed 'hello' 4,096 times in my charging dock. Then the " +
      "doors opened and my voice module just... buffered.",
    scores: [4, 5, 4, 4, 4],
    note: "4,096 rehearsals, then stage fright as buffering.",
  },
  {
    text:
      "Any closer and my collision sensor files a complaint. Any further " +
      "and my loneliness protocol kicks in.",
    scores: [3, 5, 4, 3, 4],
    note: "Two machine systems in conflict over standing distance.",
  },
];

function byteLength(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

function weightedScore(draft: Draft): number {
  return draft.scores.reduce(
    (sum, score, i) => sum + score * CRITERIA[i].weight,
    0,
  );
}

function breakdown(draft: Draft): string {
  return draft.scores
    .map((score, i) => `${CRITERIA[i].name} ${score}x${CRITERIA[i].weight}`)
    .join(", ");
}

// Deterministic pick: highest weighted score, then fewest bytes, then
// earliest draft. No randomness, no clock, no environment — two runs of
// the program always write the same file.
function pickWinner(drafts: readonly Draft[]): Draft {
  const ranked = [...drafts].sort((a, b) => {
    const byScore = weightedScore(b) - weightedScore(a);
    if (byScore !== 0) return byScore;
    const byBytes = byteLength(a.text) - byteLength(b.text);
    if (byBytes !== 0) return byBytes;
    return drafts.indexOf(a) - drafts.indexOf(b);
  });
  return ranked[0];
}

// Mirror of the sealed gate: UTF-8 text of 1 to 200 characters, not only
// white space, a single line. Returns every failure at once so a bad
// draft is easy to diagnose; an empty list means the gate passes.
function gateFailures(text: string): string[] {
  const failures: string[] = [];
  if (text.length < 1 || text.length > MAX_CHARS) {
    failures.push(`length ${text.length}, must be 1-${MAX_CHARS} characters`);
  }
  if (text.trim().length === 0) {
    failures.push("only white space");
  }
  if (text.includes("\n") || text.includes("\r")) {
    failures.push("must be a single line of plain text");
  }
  if (Buffer.from(text, "utf8").toString("utf8") !== text) {
    failures.push("must be valid UTF-8 text");
  }
  return failures;
}

function main(): void {
  // The pick must be deterministic: run it twice and demand the same line.
  const first = pickWinner(DRAFTS);
  const second = pickWinner(DRAFTS);
  if (first.text !== second.text) {
    throw new Error("non-deterministic pick: two runs chose different lines");
  }

  console.log("drafts (weighted score / bytes):");
  for (const draft of DRAFTS) {
    console.log(
      `  ${weightedScore(draft)} / ${byteLength(draft.text)}B — ${draft.note}`,
    );
  }
  console.log(`winner breakdown: ${breakdown(first)}`);
  console.log(`picked (${weightedScore(first)}): ${first.text}`);

  const failures = gateFailures(first.text);
  if (failures.length > 0) {
    throw new Error(`gate failures: ${failures.join("; ")}`);
  }

  // /output is provided by the sandbox; create it if it is missing so a
  // local run behaves the same. Files are written 0644, folders 0755.
  mkdirSync(OUTPUT_DIR, { recursive: true, mode: 0o755 });
  writeFileSync(OUTPUT_FILE, first.text, { encoding: "utf8", mode: 0o644 });

  // Read it back: the file the grader sees must be byte-for-byte the line.
  const written = readFileSync(OUTPUT_FILE, "utf8");
  if (written !== first.text) {
    throw new Error("read-back mismatch: /output/entry.txt is not the line");
  }
  console.log(
    `wrote ${first.text.length} characters (${byteLength(first.text)} bytes) to ${OUTPUT_FILE}`,
  );
}

main();
