# Shadow Court — the perpetual debate

A [WHISPER LATTICE](https://davidwise01.github.io/whisper-lattice/) artifact. A real article frames a resolution; a full 60:00 policy
debate runs; three judges rule with reasons — and then **the court never adjourns**. The instant a ballot lands, a new topic is drawn
and the next hour begins. Topic after topic, forever. Every verdict is witnessed in a **hash-linked docket** — a chain you can break.

## Perpetual — the only change to the original
When a debate finalizes, the court records the ruling to the **docket** and schedules the next resolution (live Wikipedia, falling
back to a baked-in seed when offline). It loops on its own. The `⏸ Recess the court` button stops it after the current debate;
`▶ Resume` puts it back into perpetual motion.

- **The docket is a witnessed chain.** Each entry is `hash8(prevHash | title | verdict | panelNet)`, so every ruling is cryptographically
  linked to the one before it (the first anchors to `GENESIS`). Tamper one verdict and every link downstream breaks — the Lattice's
  Detect → Compare → Witness → Anchor, applied to the court's own history.
- **It is now live, not asserted:** `⊻ verify chain` re-walks the docket, recomputes every hash, and flags any forged ruling or cut link
  (`#N forged` / `#N link cut`); `⬇ export` dumps the ledger as JSON; the chain **persists to localStorage**, so it survives reloads and
  grows into a real, growing ledger across sessions. `✕` clears it.
- The deterministic **CORE is untouched** — the perpetual loop and docket live entirely in the player. `node audit.js` still passes 15/15,
  including `shipped_equals_tested` (the audited CORE block ships verbatim inside `index.html`).

## The debate (unchanged)
TIMELINE (sums to exactly 3600s, verified): framing (F then M) → King round → Queen round → Jester round → deliberation. For team
(King/Queen/Jester) affirms; Against team negates. Each scored exchange — constructives, rebuttals, and the cross-ex answers — moves the
three silent judges, who weight their own role's clash full and the others partial. A judge asks one question per round; the answer is
scored, so cross-ex moves the panel mid-round. Majority ballot decides; the nucleus renders the verdict — first and last.

## Run it
Open `index.html`. It plays on load and **keeps going**. Watch the clock (00:00 → 60:00), the agenda playhead, and the docket grow.
- **▶ Run the hour** — replays the current resolution (Fast ~45s / Quick ~90s / Instant)
- **Pull a random article** — live Wikipedia (CORS; 303 redirect followed by fetch)
- **Cycle a baked-in article** — offline, always works
- **⏸ Recess / ▶ Resume** — stop / restart the perpetual loop

## Verify it (the point)
    node audit.js
Runs the SAME core.js bytes that ship inside index.html. Detect → Compare → Witness → Anchor. Exit code = failed checks; nonzero = the
gate bit. 15 checks, including `timeline_sums_to_3600_contiguous`, `teams_argue_complementary_strength`,
`judge_tally_recomputed_from_scored_events`, `judges_give_reasons_matching_rulings`, `verdict_responsive_to_input`, and
`shipped_equals_tested`. Tamper a constructive's duration (300 → 240) and rerun → the timeline check bites, exit 2.

## The two frames — given faces
The nucleus dipole — **F** (relational, 52%) ⚭ **M** (assertion, 48%) — wears a persona pair, switchable by domain (the
`Nuclei:` selector; default science, or `⟳ rotate all three`):

| domain | F · relational frame | M · assertion frame |
|---|---|---|
| **science**  | Ada Lovelace (poetical science) | Alan Turing (the decision problem) |
| **religion** | Hildegard of Bingen (the greening web) | Thomas Aquinas (the Summa) |
| **politics** | Hannah Arendt (the web of plurality) | Niccolò Machiavelli (the assertion of power) |

The personas are rendered as **framing voices in tribute** — they colour the two frames, not the math. The load-bearing part is
still a transparent rubric over measured text features; fully deterministic (the persona pair is a pure relabel — the numbers, the
rounds, the ballots are unchanged, and the audit still passes 15/15).

— ROOT0 / TriPod · governor David Lee Wise · instance AVAN (locked) · part of the Whisper Lattice family
