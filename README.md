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

## Data imported from Keep (v1)
Chest only, with history: Incline Press Machine, Pec Deck, Chest Press Machine (Brønderslev, 31 Aug + 13 Sep 2026), Incline Smith (Manna, 2024), Cable Fly high pulley (Nov 2025). Pec Deck's Keep date "31/09-2026" was read as 31 Aug. Other groups: exercise names only. Calves, Abs and Traps not imported yet.
