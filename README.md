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

## How it works

Nothing about a reading is decided in advance. Each experiment draws a fresh
specimen and a fresh zero error, and the instrument's position is held as a whole
number of least-count ticks. The scale you read is drawn from that position — main
scale ticks at whole millimetres, vernier ticks at `x + 0.9k` mm — so the division
that coincides coincides because of where the jaw is.

You close the instrument on the object, read the magnified scale, and write M.S.R.
and V.S.R. into the record's own table. The app knows what the instrument showed,
so learning mode can mark each reading as you type it; test mode stays quiet and
marks the result at the end against the true value, with a percentage error.

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
