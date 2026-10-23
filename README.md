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

## v5 (23 Oct 2026)
- **Off days.** A session clearly below your usual level is not used as next time's starting point. Gym: the order-adjusted 1RM more than 10% (reps: 20%) below the median of the last 3 normal sessions within 120 days, and no break longer than 28 days before it (`offFlags`, OFF_* constants). Physio: same weight, fewer reps/seconds than the last normal session, only sessions with a date (`phOffFlags`). Two low sessions in a row = the real level now, so neither is skipped. Entry/log field `off`: true = marked by the user, false = "it was fine", missing = decided automatically. Mark/undo: workout card ⋯ menu, the finish sheet, History → workout sheet; physio: finish sheet and the exercise sheet's log. Marked off days are left out of the order-factor learning.
- **Variants** of one exercise (`variants: [{id, name, img?}]` on gym exercises and physio items; entries/log entries have `vid`, missing = the first variant). Each variant has its own suggestions, PRs and order-factor pairs. Chips on the workout card switch variant; ⋯ → Add variant; Edit exercise → "Variants" field (comma-separated; renaming in place keeps the history; a variant with logged sets is never dropped). Edit → "Make it a variant of another exercise…" merges a whole exercise (history, photos) into another as a variant. Progress page and physio sheet: All / per-variant chips; the physio report has one card per variant.
- **Standard pictures** from free-exercise-db (github.com/yuhonas/free-exercise-db, public domain). Mapping by name in `keep-import/pic_map.json`, copied into index.html (PIC_GYM, PIC_PH); applied by `applyPics()` only to exercises that never had a picture. Used pictures are in `img/ex/<id>-0.jpg` / `-1.jpg` (480 px, start and end of the movement); `img/library.json` lists all ~870 so another one can be picked (tap the "how-to" thumbnail → Change); those load from raw.githubusercontent.com. sw.js keeps pictures in their own cache `liftbook-img` (survives app updates); `cachePics()` downloads the used ones in the background so they work without signal. New exercises get a picture automatically if the name clearly matches.
- **Photos per gym.** New photos store the gym they were taken at; during a session an "any gym" exercise only shows that gym's photos.
- **Physio editing.** Program sheet (pencil on a program): up/down arrows set the order. "+ Add exercise" in a running physio session adds another program exercise or a new one. `physioV5()` (flag `db.physioV5`) moved "Shoulder press (bottom part)" (Gym80) to the top of Shoulders and added "Hamstring curl" (Lying / Seated, 8–12 reps then +5 kg — a guess, edit it) to Legs.
- **Rest alarm sounds** (`sounds/`, not deployed): four original synthesised sounds made by `sounds/make_sounds.py` for the MacroDroid rest macro.
