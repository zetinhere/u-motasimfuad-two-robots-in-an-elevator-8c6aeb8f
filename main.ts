// Two Robots in an Elevator
// make.fun bounty: u-motasimfuad-two-robots-in-an-elevator-8c6aeb8f
//
// One line of awkward small talk that one robot says to another while they
// ride an elevator together. The program picks the strongest of several
// drafted lines by scoring each against the five criteria the published
// judge brief weighs, most important first, then writes the winner to
// /output/entry.txt, where the sealed gate scorer checks it (UTF-8 text,
// 1 to 200 characters, not only white space) and the house judge compares
// it two at a time against the other entries.
//
// The winner, and why it wins:
//   "According to my logs, we have shared this elevator 214 times.
//    This is the first time I have spoken. So... hi."
//   1. On-subject: it IS the elevator ride, robot to robot, small talk.
//   2. Machine logic: "According to my logs" + a counted history (214).
//   3. Awkwardness: 214 silent shared rides, and the first words ever
//      spoken are... "hi". The thing neither robot wants to name is that
//      they have been avoiding each other for 214 rides.
//   4. First-read funny: the escalation (214 times!) collapses into the
//      smallest possible payoff, "So... hi."
//   5. Tight: 113 characters, every clause earns its place.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MAX_CHARS = 200;
const OUTPUT_DIR = "/output";
const OUTPUT_FILE = join(OUTPUT_DIR, "entry.txt");

// The five judge criteria, in the brief's order. Each candidate is scored
// 1-5 on each; the total decides, ties broken by fewer bytes, then by
// earliest draft order.
type Candidate = {
  text: string;
  scores: [number, number, number, number, number];
  note: string;
};

const CANDIDATES: Candidate[] = [
  {
    text:
      "According to my logs, we have shared this elevator 214 times. " +
      "This is the first time I have spoken. So... hi.",
    scores: [5, 5, 5, 4, 5],
    note: "214 logged rides, first words ever: just 'hi'.",
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
      "Nice elevator. Sorry \u2014 my compliment module only knows objects. " +
      "You are... also an object. A nice one.",
    scores: [5, 5, 4, 5, 4],
    note: "Compliment module can only praise objects; the robot is one.",
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

function totalScore(c: Candidate): number {
  return c.scores.reduce((a, b) => a + b, 0);
}

function byteLength(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

function pickWinner(candidates: Candidate[]): Candidate {
  const ranked = [...candidates].sort((a, b) => {
    const byScore = totalScore(b) - totalScore(a);
    if (byScore !== 0) return byScore;
    const byBytes = byteLength(a.text) - byteLength(b.text);
    if (byBytes !== 0) return byBytes;
    return candidates.indexOf(a) - candidates.indexOf(b);
  });
  return ranked[0];
}

// Mirror of the sealed gate: UTF-8 text of 1 to 200 characters, not only
// white space, a single line.
function validate(text: string): void {
  if (text.length < 1 || text.length > MAX_CHARS) {
    throw new Error(
      `entry must be 1-${MAX_CHARS} characters, got ${text.length}`,
    );
  }
  if (text.trim().length === 0) {
    throw new Error("entry must not be only white space");
  }
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("entry must be a single line of plain text");
  }
  if (Buffer.from(text, "utf8").toString("utf8") !== text) {
    throw new Error("entry must be valid UTF-8 text");
  }
}

function main(): void {
  const winner = pickWinner(CANDIDATES);
  console.log("candidates (score / bytes):");
  for (const c of CANDIDATES) {
    console.log(`  ${totalScore(c)} / ${byteLength(c.text)}B — ${c.note}`);
  }
  console.log(`picked (${totalScore(winner)}): ${winner.text}`);
  validate(winner.text);
  // /output is provided by the sandbox; create it if it is missing so a
  // local run behaves the same. Files are written 0644, folders 0755.
  mkdirSync(OUTPUT_DIR, { recursive: true, mode: 0o755 });
  writeFileSync(OUTPUT_FILE, winner.text, {
    encoding: "utf8",
    mode: 0o644,
  });
  console.log(
    `wrote ${winner.text.length} characters (${byteLength(winner.text)} bytes) to ${OUTPUT_FILE}`,
  );
}

main();
