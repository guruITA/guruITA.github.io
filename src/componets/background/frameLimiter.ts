// Lets through at most `fps` frames per second at any refresh rate (60, 75, 90, 120, 144 Hz).
// Frames follow a fixed schedule, so a 90 Hz screen renders two of every three frames (60 fps)
// instead of every other frame (45 fps), which comparing with the last rendered frame would give.
export function createFrameLimiter() {
    let nextFrameTime = 0;
    return (now: number, fps: number): boolean => {
        // a little slack for rAF timestamps that arrive slightly early
        if (now < nextFrameTime - 2) {
            return false;
        }
        // start over from now after a stall instead of rendering a burst of frames to catch up
        nextFrameTime = Math.max(nextFrameTime + 1000 / fps, now);
        return true;
    };
}
