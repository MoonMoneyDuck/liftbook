# Liftbook

Offline gym log (PWA) that tracks the **order** you do exercises in. Replaces the old Google Keep notes.

- Live: https://moonmoneyduck.github.io/liftbook/ — open in Chrome on the phone → ⋮ → *Add to Home screen / Install app*.
- Source of truth: this Drive folder. Deploy = copy the files into the `liftbook` GitHub repo and push (GitHub Pages serves `main`).
- All workout data lives only in the phone's browser storage (`localStorage` key `liftbook.v1`). Settings → Export makes a JSON backup.

## Files
- `index.html` — the whole app (CSS + JS inline).
- `sw.js` — offline cache; serves the cached app, fetches the newest version in the background and shows "New version ready".
- `manifest.webmanifest`, `icon*.png`, `icon.svg` — install metadata and icons.

## Order model
- Each logged exercise stores `pos` (order in the workout) and `gpos` (order among exercises for the same muscle group). The model uses `gpos`.
- Strength per session = best set's estimated 1RM (Epley, reps capped at 15).
- Factor for slot k = how strong you are as the k-th exercise vs. 1st. Starts at 100/95/91/88/86 %, then learns from your log: every non-first session is compared with the nearest first-slot session of the same exercise within 60 days (ratio capped to 0.75–1.10), shrunk toward the start values with 4 pseudo-observations.
- Suggestions scale last time's weights by factor(today's slot) / factor(last slot). Charts and PRs use 1RM ÷ factor ("as if done first").
- Cross-muscle fatigue (e.g. triceps after chest pressing) is not modelled.

## Gyms
Aalborg (Gym & Fitness), Brønderslev, Klarup, Other (Manna, Hals, FW…). Chosen on the start screen (`settings.gym`); each workout has `gym`, each exercise has `gym` ('' = any gym). Picking another gym's exercise during a workout makes a copy for the current gym (separate history). Progress and History have their own gym filter.

## Keep import (v2)
- All 135 Keep notes were scraped 19 Oct 2026 → `keep-import/keep.json` (raw, NOT deployed).
- `keep-import/build_seed.py keep.json ../keep-seed.json keep-import/translations.json` builds `keep-seed.json` (455 workouts, 177 exercises, 2,974 sets). Danish notes are translated via `translations.json`.
- Gym rules: a note/line mentioning Manna/Hals/FW → Other; Brønderslev → Brønderslev; otherwise Aalborg (user's own convention: "no tag = GF"). Unnamed exercises on a day where another exercise names the gym get that gym.
- Order: "3." after the date = 3rd exercise; "(1. Bryst)" = 1st chest exercise. Entries with no number get pos/gpos 0 = "order not noted" (excluded from the order model, shown as ?).
- 8 entries with impossible dates (e.g. "18/20-2023") were skipped.
- The app imports `keep-seed.json` once (`db.keepV2`). A corrected seed needs a new flag (e.g. keepV3).

## Physio mode (v3)
- Two unlabelled Keep notes from the physio, "Nicklas skulder" and "Nicklas træningsprogram ben", are their own mode (Gym/Physio toggle at the top). They are kept in `db.physio`, apart from the gym log: no order model, no PRs.
- `keep-import/build_physio.py nicklas.json ../physio-seed.json` → `physio-seed.json` (2 programs, 20 exercises incl. old versions). The raw note text is in `keep-import/nicklas.json`. Exercise headings, rules and translations are hand-written in the script.
- The notes are numbered sessions without dates ("12. 22×8"). Timed holds are kg × seconds. Each exercise has a rule: from–to reps/seconds, then +kg. The app suggests one step on (+1 rep / +5 s, or +kg at the top of the range).
- Gym-specific versions (leg press, calf hold, last exercise) show only at their gym. Old versions are hidden from sessions but keep their history.
- Imported once (`db.physioV1`).
