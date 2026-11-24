# Night Shift — Abductions Dept.

A mobile-first web game about a junior alien intern on the night shift,
abducting sleeping humans with a tractor beam that is far too powerful to use
gently. Fly the saucer through a sleeping town, pick your way in, then float a
floppy, snoring human out past ceiling fans, cats and prize-cow portraits
without waking them.

**Play:** https://starbugstone.github.io/night-shift/ (production, built from `main`)

**Preprod:** https://starbugstone.github.io/night-shift/preprod/ (built from the `preprod` branch,
to try changes before they reach `main`)

**How it's made:** [60 fps explainer videos](https://starbugstone.github.io/night-shift/how-its-made.html)
covering flight and detection, hazards, deep shifts, the ragdoll interiors, sleepers and noise,
the autopilot proofs and progression ([page source](public/how-its-made.html), [media](public/media/README.md)).

## Develop

```sh
npm install
npm run dev      # http://localhost:5173
npm test
npm run build
```

## Deploy

Pushing to `main` or `preprod` runs the tests of the pushed branch, then rebuilds and publishes both
sites to GitHub Pages ([workflow](.github/workflows/pages.yml)). Try a change on `preprod` first,
then merge it into `main`. Both sites share one save in the browser.

Design: [docs/GDD.md](docs/GDD.md) · Art brief: [docs/ART_BRIEF.md](docs/ART_BRIEF.md) · Agent guide: [AGENTS.md](AGENTS.md)
