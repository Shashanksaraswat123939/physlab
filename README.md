# PhysLab

Measurement practicals for CBSE Class XI physics, in one HTML file.

Five experiments from the class practical list, each with the record's own aim,
apparatus, formula, procedure, precautions, sources of error and viva:

| # | Experiment | What you measure |
|---|---|---|
| 1 | Vernier calliper — 1 | length, breadth and height of a block; hence its volume |
| 2 | Vernier calliper — 2 | diameter of a sphere; hence its volume |
| 3 | Screw gauge — 1 | diameter of a wire; hence its volume |
| 4 | Screw gauge — 2 | thickness of a sheet, by measuring a stack |
| 5 | Parallelogram of vectors | an unknown weight, on Gravesand's apparatus |

## The calliper has three measuring faces

All three are modelled, and they do not behave alike:

- **outer jaws** — close on to a thing and stop when they touch it, so the specimen
  sets a *lower* bound on the reading
- **inner jaws** — open into a bore and stop against its wall: an *upper* bound
- **depth rod** — runs out of the tail and stops on the bottom of a hole, with a
  **zero error of its own**, which is why the record asks for the height's zero
  error to be found separately

The record's tables are still length, breadth and height. A hollow cylinder sits on
the bench so that the other two faces have something to measure; those two tables
are marked as practice and stay out of the result.

The screw gauge is turned, not slid — a quarter of a division per pixel, one full
turn per 400 px, so the drum moves at about the speed of the pointer instead of
flying past. Past contact the ratchet slips rather than letting you force it on.

## The unknown is drawn fresh

Every experiment draws its own specimen and its own zero error, and an experiment
you have not started is drawn **again on every visit** — otherwise the unknown
would be frozen in the saved state and there would be nothing left to find the
second time you opened it.

Work in progress is never touched: one reading written down, or one constant
filled in, and that specimen and everything on it comes back exactly.

## How it works

Nothing about a reading is decided in advance. Each experiment draws a fresh
specimen and a fresh zero error, and the instrument's position is held as a whole
number of least-count ticks. The scale you read is drawn from that position — main
scale ticks at whole millimetres, vernier ticks at `x + 0.9k` mm — so the division
that coincides coincides because of where the jaw is.

You close the instrument on the object, read the magnified scale, and type the
figures straight into the table — **S.No, M.S.R., V.S.R., Total, Corrected** for the
calliper, **S.No, P.S.R., C.S.R., Total, Corrected** for the screw gauge, with the
mean underneath. **Every figure in the table is yours** — the reading, the total,
the corrected total. The app works one thing out, the mean of the corrected
column, and marks the rest against the instrument.

Each of the five trials keeps its own error for good, worked out from the
specimen's seed, so the instrument shows the reading for whichever row is next to
be filled in and releases once you have written it down. Learning mode marks each
figure as you type it; test mode stays quiet and marks the result at the end
against the true value, with a percentage error.

The parallelogram experiment is a small drawing board: slotted weights drag on to
the hangers, the junction is solved for rather than placed, and the paper carries
line, freehand, rubber and scale tools so the parallelogram is constructed by hand.
The diagonal is never given — it is where your own two parallels cross.

A draggable magnifying glass re-renders the drawing under it at 4x, clipped to the
lens, so what is under the glass is the same drawing magnified.

## Running it

It is one file with no build step and no dependencies. Open `index.html`, or serve
the folder:

```bash
python -m http.server 5599
```

## Tests

The suites in `tools/` run the page's own script in Node behind a DOM stub, so they
exercise the real functions rather than a copy.

```bash
node tools/test-scale.js    # the drawn scale agrees with the arithmetic
node tools/test-e2e.js      # reading the scale correctly gives the right answer
node tools/test-pg.js       # the drawn threads balance; OC recovers the unknown
node tools/test-paper.js    # a constructed parallelogram gives the unknown back
node tools/test-state.js    # nothing is hardcoded; a tampered save is refused
node tools/test-output.js   # the printed record, and what test mode withholds
```
