# Liftbook

Offline gym log (PWA) that tracks the **order** you do exercises in. Replaces the old Google Keep notes.

- Live: https://moonmoneyduck.github.io/liftbook/ — open in Chrome on the phone → ⋮ → *Add to Home screen / Install app*.
- Source of truth: this Drive folder. Deploy = copy the files into the `liftbook` GitHub repo and push (GitHub Pages serves `main`).
- All workout data lives only in the phone's browser storage (`localStorage` key `liftbook.v1`). Settings → Export makes a JSON backup.

## Files
- `index.html` — the whole app (CSS + JS inline).
- `sw.js` — offline cache; serves the cached app, fetches the newest version in the background (on page load, and when the app comes back to the screen) and shows "New version ready". Whenever `sw.js` itself changes, also bump `CACHE` (liftbook-vN), or the new worker's install can overwrite the page before the old one notices the change.
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
- v4 (21 Oct 2026): each physio set is its own row (kg × reps/seconds, + Add set / − Set). A log entry keeps the best set as `w`/`v` (heaviest set that reached the bottom of the range), `sets` = count, and `list` = every set when they differed. Old active sessions (one row + a sets count) are converted by `phRows`.
- "Shoulder press (bottom part)" (Aalborg, Gym80, 8–12 then +5 kg) was added by `addPhysioPress()` (`db.physioPress`), with the 10 "only at the bottom" sessions from Keep (20 Sep – 18 Oct 2026). Those sessions are still in the gym log under Gym80 Shoulder Press Machine too.
## Photos (v4)
- IndexedDB `liftbook-photos`: store `photos` = {id, owner, date, t, thumb} (loaded at start), store `full` = {id, blob} (loaded when opened). owner = gym exercise id, `ph:<physio item id>` or `body`. NOT in the JSON backup.
- Shrunk on the phone to 1600 px / 360 px JPEG (decoded once). Date = EXIF date if found in the first 128 KB, else the file date.
- Where: exercise page + exercise menu (⋯ → Add photo) and thumbnails on the workout card; physio exercise sheet + card; Progress → Body photos (grid + viewer with older/newer).
- Deleting an exercise / physio exercise, or Erase all, deletes its photos.

## Rest alert in headphones (v4)
- Settings → "Sound in headphones when rest is over" posts a silent notification (tag `lb-rest`, body `REST 120 s · until 14:32:10`) when a rest starts or is changed (±15), and removes it when the timer is stopped or 20 s after it ended. `sw.js` opens the app when it's tapped.
- A MacroDroid macro on the phone does the waiting and plays a sound only when headphones are connected (the web app can't detect headphones and is paused with the screen off).

- Search (exercise picker + Progress) matches every typed word and ignores spaces and dashes, so "pull down" finds "Pulldown".
