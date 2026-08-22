/* =============================================================================
 * Cuayo — storyboard script (refactored)
 * -----------------------------------------------------------------------------
 * Faithful, readability-first port of `sbJS_cuayo_code.js`.
 * Every timing, easing, position and RNG call is preserved — only names,
 * structure and comments changed so the intent is clear.
 *
 * The sandbox injects `Sprite` (and `print`); everything else here is a local.
 * The master schedule runs from the two calls at the very bottom:
 *     background(); midground(INTRO);
 *
 * Timeline model:
 *   - Time is in seconds.
 *   - One beat = 60 / BPM  (175 BPM → ≈ 0.343s). Motion is beat-aligned.
 *   - `schedule()` runs a list of [renderFn, beats] cues on a shared clock,
 *     advancing by `beats * BEAT` per scene — the same `t += b*n` the original
 *     did by hand, here taken care of automatically.
 * ========================================================================== */


/* =============================================================================
 * 1. Timing & tuning constants
 * ========================================================================= */
const BPM = 175;                    // track tempo — drives the whole clock
const BEAT = 60 / BPM;              // seconds per beat (≈ 0.3429s)
const OFFSET = 1.3;                  // the start of the first beat

// Beat subdivisions — self-documenting note lengths instead of raw multiples.
const EIGHTH     = BEAT / 2;        // "half beat" — quick squash wrinkles
const TENTH      = BEAT * 0.1;      // pop-in micro-wrinkle for the fan stamps
const QUARTER    = BEAT * 0.25;     // 16th note — the fan grid step
const TWO_BEAT   = BEAT * 2;
const FOUR_BEAT  = BEAT * 4;

// The cuayo's facial expressions, cycled through by the fan bursts.
const EXPRESSIONS = ["normal", "smile", "cry"];

// Fan loop counts (kept from the original): 14-beat spin/scatter, 16-beat drift.
const SPIN_COUNT  = 14 * 4;
const DRIFT_COUNT = 16 * 4;

// When each fan's cuayos clear to make room for the next fan.
const FAN_CLEAR = BEAT * 15;


/* =============================================================================
 * 2. Seeded PRNG (mulberry32)
 * ========================================================================= */
function mulberry32(seed) {
    return function () {
        let s = (seed += 0x6D2B79F5);
        s = Math.imul(s ^ (s >>> 15), s | 1);
        s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
        return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
    };
}

// One seeded generator shared by every random-led scene. The *order* of calls
// matters for reproducibility — re-seed here to re-roll the layout.
const rng = mulberry32(1);


/* =============================================================================
 * 3. Reusable sprite helpers
 * ========================================================================= */

/**
 * Squash-and-stretch landing. Briefly distorts the sprite at `t`, then snaps
 * back to neutral with an "in" ease so it reads as a bounce.
 *   strength  – scales the bounce timing (0.25 = tiny, 1 = normal).
 *   imbalance – horizontal/vertical imbalance (−0.5 = stretch).
 */
function squish(sprite, t, strength = 1, imbalance = 0.1) {
    const s = sprite.sample(t);
    sprite.scaleX(t, s.sizeH + imbalance, EIGHTH * strength, "o");
    sprite.scaleY(t, s.sizeV - imbalance, EIGHTH * strength, "o");
    sprite.scaleX(t + EIGHTH, s.sizeH, BEAT * 1.5 * strength, "i");
    sprite.scaleY(t + EIGHTH, s.sizeV, BEAT * 1.5 * strength, "i");
}

/**
 * A line of cuayos marching along a bottom conveyor, one beat-staggered.
 */
function conveyor(t, n) {
    for (let i = 0; i < n; i++) {
        const c = new Sprite("normal", { y: -0.6, size: 0.5 });
        c.moveY(t, 0.5, BEAT, "o");
        squish(c, t, 0.25, -0.5);
        squish(c, t + BEAT);
        c.moveX(t + BEAT, 0, BEAT, "o");
        c.moveX(t + BEAT * 3, -0.5, BEAT, "o");
        t += TWO_BEAT;
    }
}

/**
 * Feeder-driven "echo burst": an invisible spinning cuayo whose current angle
 * is sampled to emit `count` individual cuayos on the 16th-note grid — each
 * one gets its own expression from the `EXPRESSIONS` cycle.
 *   startAngle / targetAngle — spin the feeder (omit to skip the feeder);
 *   scatter                  – drop each spawn at a random scattered position;
 *   driftY                   – drift the fan upward instead of fading it;
 *   mirrorFirst              – whether the very first spawn is mirrored.
 * Returns the time the emission loop ended (start + count * QUARTER).
 */
function echoBurst(startTime, { startAngle = null, targetAngle = null, scatter = false, driftY = false, mirrorFirst = true } = {}) {
    const count = driftY ? DRIFT_COUNT : SPIN_COUNT;
    let t = startTime;

    const feeder = startAngle !== null
        ? (() => {
            const f = new Sprite("normal", { size: 0, angle: startAngle });
            f.rotate(startTime, targetAngle, BEAT * 14);
            return f;
        })()
        : null;

    for (let i = 0; i < count; i++) {
        const props = { size: 0, sizeH: i % 2 === 0 ? (mirrorFirst ? 1 : -1) : (mirrorFirst ? -1 : 1) };
        if (feeder) props.angle = feeder.sample(t).angle;
        if (scatter) { props.x = 0.35 + rng() * 0.3; props.y = 0.35 + rng() * 0.3; }

        const spark = new Sprite(EXPRESSIONS[i % 3], props);
        spark.scale(t, 0.5, 0.1, "o");                 // pop in
        spark.scale(t + 0.1, 2, BEAT * 4 - 0.1, "i"); // swell out
        if (driftY) spark.moveY(startTime + BEAT * 14, 3, TWO_BEAT, "i");
        else spark.fade(startTime + FAN_CLEAR, 0);
        t += QUARTER;
    }
    return t;
}


/* =============================================================================
 * 4. Scene render functions (each takes a start time)
 * ========================================================================= */

/**
 * Sway arrival: a single cuayo fades in, sways side-to-side with a squeezed
 * bounce, then pops out to make room for the next shot.
 */
function sceneCuayoSway(startTime) {
    let t = startTime;
    const cuayo = new Sprite("normal", { size: 0.5, alpha: 0 });

    cuayo.fade(t, 1);
    cuayo.scale(t, 0.6, TWO_BEAT, "o");
    cuayo.rotate(t, -0.1, TWO_BEAT, "o");  // lean left
    squish(cuayo, t);
    t += TWO_BEAT;

    cuayo.scale(t, 0.7, TWO_BEAT, "o");
    cuayo.rotate(t, 0.1, TWO_BEAT, "o");  // lean right
    squish(cuayo, t);
    t += TWO_BEAT;

    cuayo.scale(t, 0, FOUR_BEAT, "i");
    cuayo.rotate(t, 0, FOUR_BEAT, "i");
}

/**
 * Two crying cuayos shuffle in from either edge — separate individuals — then
 * a third sprouts at centre to close the gap and reach toward the camera.
 */
function sceneEnterFromSides(startTime) {
    let t = startTime;

    // Left cuayo.
    let body = new Sprite("cry", { x: 0.1, y: 0.3, size: 0 });
    body.scale(t, 0.3, BEAT, "o");
    body.moveX(t, 0.2, TWO_BEAT, "o");
    body.scale(t + BEAT, 0, FOUR_BEAT, "i");
    t += BEAT * 1.5;

    // Right cuayo (mirrored so it faces inward).
    body = new Sprite("cry", { x: 0.9, y: 0.3, size: 0, sizeH: -1 });
    body.scale(t, 0.3, BEAT, "o");
    body.moveX(t, 0.8, TWO_BEAT, "o");
    body.scale(t + BEAT, 0, FOUR_BEAT, "i");
    t += BEAT * 1.5;

    // Centre cuayo: pops up, leans toward the camera, then fades.
    body = new Sprite("cry", { x: 0.4, y: 0.7, size: 0 });
    body.scale(t, 0.5, BEAT, "o");
    body.moveX(t, 0.5, BEAT, "o");
    body.moveY(t, 0.5, BEAT, "o");
    body.fade(t + BEAT, 0);
}

/** A single crying cuayo is squashed into a smiling one in two quick motions. */
function sceneSadToSmile(startTime) {
    let t = startTime;

    const sad = new Sprite("cry", { size: 0 });
    sad.scale(t, 0.7, BEAT, "o");
    sad.scale(t + BEAT, 0, BEAT * 3, "i");
    squish(sad, t, 1, 0.5);
    t += TWO_BEAT;

    const joy = new Sprite("smile", { y: 2 });
    joy.moveY(t, 0.5, BEAT, "o");
    joy.scale(t, 0.5, TWO_BEAT, "i");
    joy.fade(t + TWO_BEAT, 0);
}

/** Four neutral cuayos drop in one after another, then a smiling one crowns them. */
function sceneDropRow(startTime) {
    let t = startTime;

    for (const x of [0.2, 0.4, 0.6, 0.8]) {
        const s = new Sprite("normal", { x, y: 1.3, size: 0.2 });
        s.moveY(t, 0.7, BEAT, "o");
        s.moveY(t + BEAT, 1.3, BEAT, "i");
        t += EIGHTH;
    }

    const joy = new Sprite("smile", { y: 1.6, size: 0.3 });
    joy.moveY(t, 0.5, BEAT, "o");
    joy.scale(t + BEAT, 0.5, BEAT, "o");
    joy.fade(t + TWO_BEAT, 0);
}

/* -- Echo-burst variants ----------------------------------------------------- */

/** Spin fan (left-to-right), closing on a feathering smiling cuayo. */
function sceneEchoSpin(startTime) {
    const end = echoBurst(startTime, { startAngle: -0.5, targetAngle: 0.5 });

    const stamp = new Sprite("smile", { size: 0 });
    stamp.scale(end, 1, TENTH, "o");     // quick pop-in
    stamp.scale(end + TENTH, 2, BEAT * 0.9, "io"); // swell
    stamp.scale(end + BEAT, 0, BEAT, "i");         // back out
}

/** Spin fan reversed (right-to-left), closing on a smiling cuayo facing away. */
function sceneEchoSpinBack(startTime) {
    const end = echoBurst(startTime, { startAngle: 0.5, targetAngle: -0.5, mirrorFirst: false });

    const stamp = new Sprite("smile", { size: 0, sizeH: -1 });
    stamp.scale(end, 1, TENTH, "o");
    stamp.scale(end + BEAT, 2, BEAT * 0.25, "o");
    stamp.scale(end + BEAT * 2.25, 0, EIGHTH, "o");
}

/** Fan scattered across the stage, then a big crying cuayo slams it shut. */
function sceneEchoScatter(startTime) {
    const end = echoBurst(startTime, { startAngle: -0.5, targetAngle: 0.5, scatter: true });

    const stomp = new Sprite("cry", { size: 0 });
    stomp.scale(end, 2, BEAT, "o");
    stomp.scale(end + BEAT, 0, BEAT * 3, "i");
}

/** Wide fan that slowly drifts skyward instead of fading. */
function sceneEchoDrift(startTime) {
    echoBurst(startTime, { driftY: true });
}


/* =============================================================================
 * 5. Conveyor & crowd scenes
 * ========================================================================= */

/** A conveyor line builds into a tumbling, spinning crying cuayo. */
function sceneConveyorDance(startTime) {
    let t = startTime;
    conveyor(t, 5);
    t += BEAT * 10;

    // One satisfied little cuayo hops across, then bows out.
    let body = new Sprite("normal", { y: -0.6, size: 0.5 });
    body.moveY(t, 0.5, BEAT, "o");
    squish(body, t, 0.25, -0.5);
    body.fade(t + TWO_BEAT, 0);
    t += TWO_BEAT;

    // A crying cuayo pops in, swells, does a full back-flip, then exits.
    body = new Sprite("cry", { size: 0.5, alpha: 0 });
    body.fade(t, 1);
    body.rotate(t, -0.1, BEAT, "o");
    body.scale(t, 0.7, BEAT, "o");
    t += BEAT * 1.5;
    body.rotate(t, 0.1, BEAT, "o");
    body.scale(t, 1, BEAT, "o");
    t += BEAT * 1.5;
    body.rotate(t, -Math.PI * 2, BEAT * 1.5, "o"); // full back-flip
    body.scale(t, 0.5, BEAT, "o");
    t -= BEAT;
    body.moveX(t + BEAT, 0, BEAT, "o");
    body.moveX(t + BEAT * 3, -0.5, BEAT, "o");
}

/** Conveyor feed, then a drop-row chorus topped by a huge cheering cuayo. */
function sceneConveyorRow(startTime) {
    let t = startTime;
    conveyor(t, 6);
    t += BEAT * 12;

    sceneDropRow(t);
    t += FOUR_BEAT;

    const big = new Sprite("smile", { size: 0.5, alpha: 0 });
    big.fade(t, 1);
    big.moveY(t, 2, BEAT, "i");
    big.scaleX(t, 2, BEAT, "i");
}

/**
 * A crowd "wave": six staggered cuayos bouncing on a beat grid, then a thick
 * band of cuayos rushing left along guide curves, climaxing in one expanding
 * smiling cuayo.
 */
function sceneCrowdWave(startTime) {
    const t0 = startTime;

    // 1. Six staggered cuayos bouncing on a beat grid.
    let t = startTime;
    for (let i = 0; i < 6; i++) {
        const w = new Sprite("normal", { y: -0.5, size: 0.5 });
        squish(w, t - BEAT, 1, -0.5);
        w.moveY(t - BEAT, 0, BEAT, "o");
        w.moveY(t, 0.5, BEAT, "i");
        w.moveY(t + BEAT, 0.9, BEAT, "o");
        w.moveY(t + BEAT * 2, 1.5, BEAT * 3, "o");
        t += TWO_BEAT;
    }

    // 2a. Rising guide curve (sampled horizontally for the band width).
    t = t0;
    const guide = new Sprite("normal", { size: 0 });
    guide.moveY(t, 0.1, FOUR_BEAT, "o");
    t += FOUR_BEAT;
    guide.moveY(t, 0.9, BEAT * 8, "io");
    t += BEAT * 8;
    guide.moveY(t, 0.5, FOUR_BEAT, "i");

    // 2b. Second over-lapping guide — sampled vertically for altitude.
    t = t0;
    const guide2 = new Sprite("normal", { y: 0.1, size: 0 });
    guide2.moveY(t, 0.9, BEAT * 8, "io");
    t += BEAT * 8;
    guide2.moveY(t, 0.1, BEAT * 8, "io");

    // 2c. The rushing band — many small cuayos following the guides + jitter.
    t = t0;
    for (let i = 0; i < 12 * 4; i++) {
        const s = guide.sample(t);
        const s2 = guide2.sample(t);
        let jit = rng() - 0.5;
        const runner = new Sprite("normal", { x: -0.2, y: s.y + jit, size: 0.2 });
        runner.moveX(t, 1.2, BEAT);
        jit = rng() - 0.5;
        runner.moveY(t, s2.y + jit, BEAT);
        t += QUARTER;
    }

    // 3. A lead cuayo leaps across the band, then the smile closes it out.
    const lead = new Sprite("normal", { y: -0.5, size: 0.5 });
    squish(lead, t - BEAT, 1, -0.5);
    lead.moveY(t - BEAT, 0, BEAT, "o");
    lead.moveY(t, 0.5, BEAT, "i");
    lead.moveY(t + BEAT, 0.9, BEAT, "o");
    lead.scale(t + BEAT * 2, 0.9, BEAT, "o");
    lead.moveY(t + BEAT * 2, 0.8, BEAT, "o");
    lead.moveX(t + BEAT * 2, 0.4, BEAT, "o");
    lead.scale(t + BEAT * 3, 2, BEAT, "o");
    lead.moveX(t + BEAT * 3, 0.2, BEAT, "o");
    lead.fade(t + FOUR_BEAT, 0);
    t += FOUR_BEAT;

    const ender = new Sprite("smile", { x: 0.2, y: 0.8, size: 2.1, alpha: 0 });
    ender.fade(t, 1);
    ender.fade(t, 0, BEAT * 16, "i");
}


/* =============================================================================
 * 6. Scene cue lists & the schedule runner
 * ========================================================================= */

/**
 * Runs a list of [renderFn, beats] cues back-to-back on a shared clock and
 * returns the time when the whole list is done.
 *
 * Each cue is rendered at a progressively advancing clock (matching the
 * original, which passed each scene a forward-stepped `t`). The returned time
 * is computed as `startTime + BEAT * totalBeats` in a single add — the same
 * way the original advanced its outer clock (`t += b*n`) — so the value the
 * next block receives is bit-for-bit identical.
 */
function schedule(cues, startTime) {
    let t = startTime;
    let total = 0;
    for (const [render, beats] of cues) {
        render(t);
        t += BEAT * beats;
        total += beats;
    }
    return startTime + BEAT * total;
}

// First movement — 4 beats per scene (sway, enter, sway, sad→smile).
const SEQ_SWAY = [
    [sceneCuayoSway, 4],
    [sceneEnterFromSides, 4],
    [sceneCuayoSway, 4],
    [sceneSadToSmile, 4],
];

// Second movement — same opening, but ends on the gathering row.
const SEQ_DROP = [
    [sceneCuayoSway, 4],
    [sceneEnterFromSides, 4],
    [sceneCuayoSway, 4],
    [sceneDropRow, 4],
];

// Third movement — triple sway bounce, then the row.
const SEQ_TRIPLE_SWAY = [
    [sceneCuayoSway, 4],
    [sceneCuayoSway, 4],
    [sceneCuayoSway, 4],
    [sceneDropRow, 4],
];

// Echo-burst movement (16 beats per fan of cuayos).
const SEQ_ECHO = [
    [sceneEchoSpin, 16],
    [sceneEchoSpinBack, 16],
    [sceneEchoScatter, 16],
    [sceneEchoDrift, 16],
];

// Conveyor movement (16 beats per scene).
const SEQ_CONVEYOR = [
    [sceneConveyorDance, 16],
    [sceneConveyorRow, 16],
    [sceneConveyorDance, 16],
    [sceneCrowdWave, 16],
];


/* =============================================================================
 * 7. Layers
 * ========================================================================= */

/**
 * Background: a warm colour flare leads the intro, then a long draining rush
 * fills the rest of the track.
 */
function background() {
    flareBg(OFFSET + BEAT * 32);
    bgRush(BEAT * 180);
}

/** A warm strip of magenta/white circle bursts leading into the intro. */
function flareBg(startTime) {
    let t = startTime;
    for (let i = 0; i < 32; i++) {
        const magentaCircle = new Sprite("magenta", { size: 0 });
        magentaCircle.scale(t, 2, TWO_BEAT, "o");
        const whiteCircle = new Sprite("white", { size: 0 });
        whiteCircle.scale(t + BEAT * 0.25, 2, TWO_BEAT, "o");
        t += BEAT;
    }
}

/** Two cross-recolling guides sweeping the background, with gritty streaks. */
function bgRush(startTime) {
    const t0 = startTime;
    let t = t0;

    // Guide A: an upward then settling sweep.
    const guide = new Sprite("normal", { y: 0.1, size: 0 });
    guide.moveY(t, 0.1, BEAT * 8, "io");
    t += BEAT * 8;
    guide.moveY(t, 0.9, BEAT * 8, "io");
    t = t0;

    // Guide B: a vertical cross.
    const guide2 = new Sprite("normal", { size: 0 });
    guide2.moveY(t, 0.9, FOUR_BEAT, "o");
    t += FOUR_BEAT;
    guide2.moveY(t, 0.1, BEAT * 8, "io");
    t += BEAT * 8;
    guide2.moveY(t, 0.5, FOUR_BEAT, "i");
    t = t0;

    // Jittered streaks riding along the guides (reusing the neutral cuayo
    // graphic as a plain streak, not a distinct cuayo).
    for (let i = 0; i < 12 * 4; i++) {
        const s = guide.sample(t);
        const s2 = guide2.sample(t);
        let jit = rng() - 0.5;
        const streak = new Sprite("normal", { x: 1.2, y: s.y + jit / 2, size: 0.1, sizeH: -1 });
        streak.moveX(t, -0.2, TWO_BEAT);
        jit = rng() - 0.5;
        streak.moveY(t, s2.y + jit / 2, TWO_BEAT);
        t += QUARTER;
    }
}

/**
 * Midground (main action): a huge cuayo fades in/out across the intro, then
 * the timed timelines run in sequence — each scene animating new cuayos.
 */
function midground(startTime) {
    const intro = new Sprite("normal", { size: 3, alpha: 0 });
    intro.fade(0, 1, startTime);           // fade in across the intro window
    intro.scale(0, 0.5, startTime, "i"); // and swell as it does
    intro.fade(startTime, 0);             // then clear

    let t = schedule(SEQ_SWAY, startTime);   // +16 beats
    t = schedule(SEQ_DROP, t);                // +16
    t = schedule(SEQ_SWAY, t);                // +16
    t = schedule(SEQ_TRIPLE_SWAY, t);         // +16
    t = schedule(SEQ_ECHO, t);                // +64
    t = schedule(SEQ_CONVEYOR, t);            // +64
}


/* =============================================================================
 * Master launch — build the whole picture.
 * ========================================================================= */
background();
midground(OFFSET);