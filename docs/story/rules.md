# Storytelling rules

These rules apply to every place the game tells its story: memos, reports, Zib's bubbles, sleepers' mumbles,
Gazette headlines, loading tips, trophy text, and the films and interludes between shifts. They gather rules
that were spread across the GDDs, the story decisions and the user's feedback. Where a rule has a test, the test
is named; [REGRESSIONS.md](../REGRESSIONS.md) lists them all.

Read first: the story bible in [GDD-6 §1](../GDD-6-story.md#1-story-bible), the [story decisions](decisions.md) and
the [continuity review](continuity-review.md). They are canon.

## 1. Canon and continuity

- Characters act as the bible says. Zib is keen, polite and a magpie. Vrell is tired, dry and secretly cares.
  Krix is the toaster intern who went to OBELISK™. A scene that needs someone to act out of character is the
  wrong scene.
- Facts only change in the order the season sets them. A lore term (OBELISK™, Temporal Dispatch, Form 88-MPH,
  the parking ring, Bubbles…) never appears before the level that sets it up, and no screen spoils a later
  payoff. Guards: `tests/ui-copy-continuity.test.ts` (C8, C11).
- Every new lore term, payoff or deadline word gets a token in `tests/ui-copy-continuity.test.ts`.

## 2. Cause and effect

- Each beat follows from the one before it: "because of that…", "but then…", never "and also…". If two beats
  can swap places without anyone noticing, one of them is not doing a job.
- Each beat changes something: who knows what, who has what, who is in trouble. Write down what changes.
- A level's story comes in through its memo, pays off in its report and hands the player to the next level.
  The arrival on the map is tied to the story (`AGENTS.md`, varied openings).

## 3. Readable by everyone

- **It works cold.** A player who skipped every memo still follows the picture: the Three-Depth Rule in
  [GDD-6 §3](../GDD-6-story.md#the-three-depth-rule-respecting-text-skippers). The picture carries the beat;
  the words add the joke.
- **Text stays up long enough to read.** Anything that leaves the screen on its own stays up for
  `readSeconds()` (`src/core/read-time.ts`), never a fixed duration. Failure cards wait for a tap. Guards:
  `tests/shell-speech-timers.test.ts` (C5), `tests/flight-spotted-tap.test.ts` (F6).
- **Text fits at phone size**, in English and French, at 1×. Guard: C4.

## 4. Humour

- Tone: PG-13, leaning 16. Innuendo, butt and probe jokes, mild swearing. Nothing sexually explicit, no slurs,
  nobody real mocked.
- References are instantly obvious and known worldwide. One reference per line, quoted right. French may use
  the French dub's wording of the same reference, never a France-only one. Guards: C7, C10, C12.
- Vary the jokes: mix personal gags with film nods; don't repeat a phrase or template a joke. Guard: C6.
- At most 2–3 running jokes in any level or screen. Set a running joke up plainly before paying it off.
  Retired gags stay retired ([GDD-6 §6](../GDD-6-story.md#6-running-jokes)).
- Grimsby levels stay generic with at most one-line references. Era levels are built on one film, with at most one
  outside reference.
- One or two callbacks per level to people, objects or events the player has met. They must work cold, and
  should feel natural. If none fits, start a small new arc.

## 5. Levels

- Each level after L1 has one town pickup, hinted in its memo in EN and FR (C1).
- Every souvenir, pickup and specimen has a trophy slot with EN and FR text (C2).
- A new mechanic is taught by a memo line or prompt that has a reason in the story
  (`tests/abduct-mechanic-taught.test.ts`).

## 6. Films and interludes

The first intro cut (2026-11-27) was rejected because it had no storyboard: shots with no link between them, UI
pieces collaged together and rough rendering. The redo was approved once it had real illustrated keyframes and one
story told shot by shot. These rules keep it that way.

### Storyboard before anything is rendered

Write the storyboard as a table before making any picture or code. One row per shot:

| Column | What it holds |
| --- | --- |
| Shot | Number and a two- or three-word title ("The Zap"). |
| We see | What the frame shows, concretely: who, where, doing what. |
| What changes | The one beat this shot adds. |
| Why now | How it follows from the previous shot. |
| Line (EN / FR) | At most one caption: who speaks, and the words. |
| Camera and sound | The move and the cut into the next shot, plus any sound cue. |

The storyboard is reviewed before rendering, and the film follows it.

### Structure

- One film tells one small story with a start, a turn and an end. 4–8 shots, one beat per shot.
- The last shot hands over to what the player does next (the intro irises in on the L1 farmhouse).
- Each shot reads with the captions off. Check it with the Clean toggle.

### Pictures

- Use concrete illustrated keyframes of the real cast and places. Don't build shots from UI pieces, icons or
  placeholder shapes.
- The cast looks the same in every film and in the game: Zib small, green and wide-eyed; Vrell a tired purple blob
  with glasses and a clipboard; the patched saucer with its bandage. Places match the map (Route 9, Doyle's farm).
- The camera moves with purpose: drift to reveal, push in for emphasis, and cut on the action. Use the same
  easing and the same look throughout, and keep the frame filled with no image edge in view.

### Captions and reading time

- Show one caption at a time and label who speaks. Put speech in quotes (“…” EN, « … » FR) and leave narration
  plain.
- A caption is at most two lines at phone size (about 80 characters).
- **A caption is fully visible for at least `readSeconds()` of its longer language (EN or FR).** Fade-in and
  fade-out don't count toward that time. The formula is the game's: about 15 characters a second plus a beat,
  2.4–7 s.
- A caption never crosses a cut and never overlaps the next one. If a line needs more time than the action, slow
  the calm end of the shot so the camera keeps creeping. Don't cut the line short or speed up the reading.
- In the game, a film never moves to the next page before its reading time. A tap moves on once the line can
  be read, and Skip is always there. `src/ui/dispatch-finale.ts` is the reference.

### Sound and motion

- Sound cues are soft and cartoony, with no UI clicks. Sound is off until the viewer turns it on in a preview.
- With reduced motion, use gentle dissolves and no shake or flash. The reading times stay the same.

### Who does what

- Fable directs films: the storyboard, the shot choices and the render (user, 2026-11-28).
- Evidence is the film itself, previewed at phone size in EN and FR, along with the storyboard table and each
  caption's time on screen.

## 7. Check before you ship story work

1. Does each beat follow from the last, and is it clear what changes?
2. Does it work with no text, and does every line stay up for `readSeconds()` in both languages?
3. Is it in character and in canon, with no spoiler and no lore before its setup?
4. Is every reference obvious and worldwide, with no more than 2–3 running jokes?
5. Films: is there a storyboard table, with concrete images, one beat per shot, captions inside their shots, and
   a hand-off to play?
6. Have you run the guards in §1–§5 (`npm test`)?
