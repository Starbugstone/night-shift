# Language

The whole game is in English or French. Two buttons on the title switch every string, the logo, the report stamps and the SPOTTED stamp. The choice is saved; with no saved choice the game follows the browser language.

## Sub-features

- `lang-toggle` switches EN/FR from the title; the lit button is the current language.
- `lang-persist` saves the choice (`save.lang`: `auto`, `en`, `fr`) and restores it after a reload.
- `lang-url` `?lang=en|fr` overrides the language for one load without saving it.
- `lang-art` shows French lettered art (`ui/logo_fr`, `ui/stamp_*_fr`, Gary's `room/saucer_poster_fr`) and sets `document.title` and `<html lang>`.

## How to get to it (user POV)

- On the title, tap **EN** or **FR** to the left of the speaker button (bottom right).
- `?lang=fr` opens any entry in French for that load only.

## Driving it with Playwright

Preconditions: a fresh context. The runner's Chromium has no `fr` locale, so `auto` resolves to English.

- **Toggle.** Read `window.__nightShift.lang` (`'en'`). Run `await game.tap(400, 902)` for FR. Check `lang === 'fr'`, `document.documentElement.lang === 'fr'`, `document.title` matches `/Équipe de nuit/`, and `(await game.stored()).lang === 'fr'`. Capture the French title (logo « ÉQUIPE DE NUIT », **Pointer**).
- **Persist.** `await game.open()` and check the language is still `fr`. Clock in and capture a French Work Orders list and a lock notice (`Livrez d’abord le fermier Doyle.`).
- **URL override.** `await game.open('/?lang=en')`: the UI is English but `stored().lang` stays `'fr'`. A plain `game.open()` returns to French.
- **Back to English.** `await game.tap(324, 902)` and check the stored value is `'en'`.

## Gotchas

- Tapping the language that is already lit writes nothing.
- `?reset=1` puts `lang` back to `auto`.
- To test French through `auto` you need a Chromium context with a `fr-FR` locale, which this runner does not create. Use the toggle or `?lang=fr`.
- The doctor's `/Night Shift/` title check runs on the fresh context only; after switching to French the tab title is « Équipe de nuit — Service des Enlèvements ».
- `tests/ui-i18n.test.ts` covers key parity, placeholders, untranslated French and typography headlessly.
