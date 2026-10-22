# Task 2 Report: Court geometry and versioned profiles

## Status

DONE — independent review clean; no fix rounds required.

## Delivered

- `src/rules/court.js`: metric court construction for 2v2, 4v4 and 6v6; documented x/z coordinate convention; row, end and side line zones; lane strips; spine geometry; inclusive circle/line-zone overlap; explicit `guardLaneIds` for each supported format.
- `src/rules/profiles.js`: immutable Traditional, Competitive Standard, Quick Match and Pro v0.1 records; replay-safe lookup validates profile id, version and timing shape using Task 1 validation.
- Focused tests in `tests/rules/court.test.js` and `tests/rules/profiles.test.js` cover exact dimensions, edges, immutability, profile separation, invalid references, and each format's actual guard spawn placement.

## Verification

- Task 2 focused tests: 6 passed, 0 failed.
- Full suite: 16 passed, 0 failed.
- Independent review: clean; reviewer found no actionable correctness issues.

## Review and scope notes

- Follow-up research resolved smaller-format placement. The [British Council International Inspiration Daria Bandha guide](https://www.britishcouncil.org/sites/default/files/international_inspiration_traditional_games_resources_full_set_part1_0.pdf) describes defenders as restricted to allocated spaces and says the court is divided into equal spaces equal to the defenders. The [Traditional Games of Bangladesh survey](https://www.researchgate.net/publication/372515215_Traditional_Games_of_Bangladeshpdf_Dr_Sydur_Rahman_Lipon_and_Sudip_Chakroborthy) says court count varies with participants and identifies interior row walkways and the central Sikka walkway. The master plan's D18 placement remains authoritative for 6v6 (four interior row guards plus back-end guard). B1 assigns all three interior rows to 4v4 and the frontmost interior row to the sole 2v2 guard; the 2v2 choice is explicitly an implementation inference that preserves the same first-barrier geometry.
- Placement is resolved in `createCourt().guardLaneIds` and consumed consistently by match initialization, movement clamping, and defender resets.

- The profile consequences and timing values follow master-plan §6; geometry follows §§7.1–7.4 and constants in §25. The v2.1 addendum makes no B1 rule changes.
- The supplied ZIP omits `.git`, so the recorded branch and commit checkpoint could not be resumed as repository history; prior IDs remain preserved in the progress ledger. No commit was fabricated.
- No files under `sources/` were changed. No renderer, external service, or runtime dependency was added.

## Report path

`Dariabandha_Resume_Package/.superpowers/sdd/2026-10-22-dariabandha-b1-rules-core/task-2-report.md`
