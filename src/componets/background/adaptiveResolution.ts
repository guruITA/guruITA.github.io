// Picks the render resolution of a fullscreen shader so the GPU can keep it up, also on weak GPUs.
// A shader's cost grows with its pixel count, and a soft background looks nearly the same at a lower
// resolution that CSS scales up.
//
// Measured on an Intel UHD 630 (city shader): integrated GPUs and phones first run at turbo speed and
// look fine, then after 7-14 seconds of heavy load drop to about a sixth of that speed (10 fps), and
// they stay slow even after the resolution goes down. Watching the frame rate only notices that once
// it is too late. So the resolution starts from a pixel budget per second that the GPU can keep up
// (about 11 million pixels per second on that Intel GPU, which then stayed smooth for minutes);
// the frame rate check stays as a safety net. Measuring the GPU time instead did not work:
// onSubmittedWorkDone in Chrome mostly measures how often the browser polls the GPU.

// The first frames after start are slow anyway (page load, shader compile); they say nothing about the GPU
const WARMUP_MS = 1500;
// Frames are judged per window of at least this long, so one hiccup does not change the resolution
const WINDOW_MS = 500;
const MIN_WINDOW_FRAMES = 5;
// A gap this long is a pause (hidden tab, page frozen), not a slow GPU; weak GPUs were measured
// at up to ~470 ms per frame, which must still count
const PAUSE_MS = 1000;
// Too slow: frames take a quarter longer than they should (at 60 fps: under ~48 fps), in this many
// windows in a row, so a single hitch (a chunk loading) does not count
const SLOW_FACTOR = 1.25;
const SLOW_WINDOWS = 2;
// A lower resolution that does not make frames at least this much faster means something else sets the
// pace: a frame cap (Chrome's energy saver, iOS Low Power Mode and some laptops on battery run at 30 fps)
// or a GPU that already slowed down. The resolution then goes back, and frames are judged against that pace.
// With vsync a GPU that is too slow also sits at exactly 30 fps and one step may not get it under 60,
// so it takes this many steps without effect to decide.
const LOWERING_HELPED = 0.9;
const LOWERINGS_TO_DECIDE = 2;
// Hopeless: under 15 fps at the lowest resolution for this many windows in a row (4 s, longer than the
// stalls of chunks and shader compiles loading); a 30 fps cap never gets there
const HOPELESS_MS = 1000 / 15;
const HOPELESS_WINDOWS = 8;
// Room to spare: frames within a tenth of the target, for this many windows in a row
const FAST_FACTOR = 1.1;
const FAST_WINDOWS_TO_RAISE = 6;
// After this long without slow frames, the budgeted resolution may be tried again, and GPUs that
// keep their speed under load may go above the budget
const FAST_WINDOWS_TO_RESET_CEILING = 20;
// pixel steps; 0.64 and 1.21 are 0.8 and 1.1 per side
const LOWER_STEP = 0.64;
const RAISE_STEP = 1.21;

export interface AdaptiveResolutionOptions {
    // highest and lowest device pixel ratio to render at
    maxRatio: number;
    minRatio: number;
    // pixels per second the GPU can keep up with this shader (see the measurements above)
    pixelsPerSecond: number;
    // the budget is only the start: dedicated GPUs keep their speed under load, so after a long run of
    // fast frames they may go higher. Integrated GPUs and phones must not, they looked fast until they slowed down.
    raiseAboveBudget: boolean;
    // frame rate the budget is spread over, normally the highest the shader renders at
    fps: number;
    // even the lowest resolution is far too slow for this device
    onTooSlow?: () => void;
}

export function createAdaptiveResolution({
    maxRatio,
    minRatio,
    pixelsPerSecond,
    raiseAboveBudget,
    fps,
    onTooSlow,
}: AdaptiveResolutionOptions) {
    let cssArea = 1;
    // the budget per frame; the frame rate check never raises the resolution above it
    const budget = pixelsPerSecond / fps;
    // pixels per frame to render; the ratio follows from it and the CSS size
    let pixels = budget;
    // after slow frames, stay below the resolution that was too slow until frames have been fast
    // for a long while, so the picture does not keep switching
    let ceiling = budget;

    let startedAt = -1;
    let windowStart = -1;
    let lastFrame = -1;
    let frames = 0;
    // the time the frames of this window should have taken at their own target frame rates
    let expectedMs = 0;
    let fastWindows = 0;
    let slowWindows = 0;
    let hopelessWindows = 0;
    let gaveUp = false;
    // a frame cap found by lowering the resolution without effect; 0 while none is known
    let paceMs = 0;
    // the resolution before the latest lowerings, to check whether they helped
    // slowness is frame time over the target of that window: 1 is on time, at 30 fps idle as at 60 while scrolling
    let lowered: { from: number; slowness: number; targetMs: number; steps: number; slowestBefore: number } | null =
        null;
    // the fewest pixels per frame that were ever too slow; going above the budget stays clear of it,
    // so a strong GPU does not keep retrying a resolution that stuttered
    let slowestKnown = Infinity;

    // pixels actually rendered: the budget kept between the lowest and highest ratio
    const effective = () => Math.min(maxRatio * maxRatio * cssArea, Math.max(minRatio * minRatio * cssArea, pixels));
    const ratio = () => Math.sqrt(effective() / cssArea);
    const atMinimum = () => pixels <= minRatio * minRatio * cssArea;
    const atMaximum = () => pixels >= maxRatio * maxRatio * cssArea;

    const judge = (averageMs: number, frameTargetMs: number) => {
        const slowness = averageMs / frameTargetMs;
        // a cap that went away (charger plugged in) shows as frames well under it
        if (paceMs > 0 && averageMs < paceMs * 0.8) {
            paceMs = 0;
        }
        // only a window with the same target frame rate tells whether the lowering helped: when scrolling
        // stops (60 -> 30 fps) a capped device looks on time without being any faster
        if (lowered && Math.abs(frameTargetMs - lowered.targetMs) <= lowered.targetMs * 0.1) {
            const { from, slowness: before, targetMs: loweredTargetMs, steps, slowestBefore } = lowered;
            lowered = null;
            // under 15 fps it is not a cap; keep lowering towards the minimum instead
            if (slowness > before * LOWERING_HELPED && averageMs <= HOPELESS_MS) {
                if (steps < LOWERINGS_TO_DECIDE && !atMinimum()) {
                    lowered = { from, slowness: before, targetMs: loweredTargetMs, steps: steps + 1, slowestBefore };
                    pixels = effective() * LOWER_STEP;
                    return;
                }
                // a cap, not a resolution that was too slow
                pixels = from;
                ceiling = Math.max(ceiling, from);
                slowestKnown = slowestBefore;
                paceMs = averageMs;
            }
        }

        hopelessWindows = atMinimum() && averageMs > HOPELESS_MS ? hopelessWindows + 1 : 0;
        if (hopelessWindows >= HOPELESS_WINDOWS && !gaveUp) {
            gaveUp = true;
            onTooSlow?.();
            return;
        }

        const targetMs = Math.max(frameTargetMs, paceMs);
        if (averageMs > targetMs * SLOW_FACTOR) {
            fastWindows = 0;
            slowWindows += 1;
            // one lowering at a time: the previous one is judged first
            if (slowWindows >= SLOW_WINDOWS && !atMinimum() && !lowered) {
                slowWindows = 0;
                lowered = { from: pixels, slowness, targetMs: frameTargetMs, steps: 1, slowestBefore: slowestKnown };
                slowestKnown = Math.min(slowestKnown, effective());
                ceiling = effective() * 0.9;
                pixels = effective() * LOWER_STEP;
            }
            return;
        }
        slowWindows = 0;
        fastWindows = averageMs < targetMs * FAST_FACTOR ? fastWindows + 1 : 0;
        if (fastWindows === 0 || fastWindows % FAST_WINDOWS_TO_RAISE !== 0) {
            return;
        }
        if (fastWindows >= FAST_WINDOWS_TO_RESET_CEILING) {
            ceiling = Math.max(ceiling, Math.min(budget, slowestKnown * 0.9));
            const higher = Math.min(effective() * RAISE_STEP, slowestKnown * 0.9);
            if (raiseAboveBudget && pixels >= ceiling && !atMaximum() && higher > effective()) {
                ceiling = higher;
            }
        }
        if (pixels < ceiling) {
            pixels = Math.min(ceiling, effective() * RAISE_STEP);
        }
    };

    return {
        // device pixel ratio to render at now
        get ratio() {
            return ratio();
        },
        setCssSize(width: number, height: number) {
            cssArea = Math.max(1, width * height);
        },
        // Call for every rendered frame with its rAF time and the frame rate it should reach
        sample(now: number, targetFps: number) {
            if (startedAt < 0) {
                startedAt = now;
            }
            if (now - startedAt < WARMUP_MS) {
                return;
            }
            if (lastFrame < 0 || now - lastFrame > PAUSE_MS) {
                windowStart = now;
                frames = 0;
                expectedMs = 0;
            } else {
                frames += 1;
                expectedMs += 1000 / targetFps;
            }
            lastFrame = now;
            const elapsed = now - windowStart;
            if (elapsed >= WINDOW_MS && frames >= MIN_WINDOW_FRAMES) {
                judge(elapsed / frames, expectedMs / frames);
                windowStart = now;
                frames = 0;
                expectedMs = 0;
            }
        },
    };
}
