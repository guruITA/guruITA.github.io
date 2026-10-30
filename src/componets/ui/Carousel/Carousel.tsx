import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './Carousel.module.scss';

// time a set of cards stays in view before autoplay moves on
const AUTOPLAY_DELAY = 6000;

interface CarouselProps {
    // the layout of the row; it only scrolls sideways where that class makes it (see styles/_carousel.scss)
    className: string;
    label: string;
    dotLabel: (index: number, count: number) => string;
    // arrow buttons left and right of the row
    controls?: { previous: string; next: string };
    // moves on to the next card by itself, back to the first after the last
    autoplay?: boolean;
    children: ReactNode;
}

// Where the row stops for each card, the way scroll snapping lines it up. Cards at the end that cannot
// reach their snap point share the last stop, so every stop shows something new.
function snapStops(track: HTMLElement) {
    const max = track.scrollWidth - track.clientWidth;
    const stops: number[] = [];
    Array.from(track.children).forEach((child) => {
        const card = child as HTMLElement;
        const align = getComputedStyle(card).scrollSnapAlign;
        const left = align.includes('center')
            ? card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2
            : card.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft);
        const stop = Math.round(Math.min(Math.max(left, 0), max));
        if (stops.length === 0 || stop - stops[stops.length - 1] > 1) {
            stops.push(stop);
        }
    });
    return stops;
}

// A row of cards that you scroll sideways where it does not fit. The dots, and the arrows when asked
// for, only show while the row actually scrolls, so a row that fits stays a plain grid.
function Carousel({ className, label, dotLabel, controls, autoplay = false, children }: CarouselProps) {
    const frameRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const [stops, setStops] = useState<number[]>([]);
    const [active, setActive] = useState(0);
    // the mouse and keyboard focus pause autoplay each on their own, so leaving with one does not undo the other
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const [onScreen, setOnScreen] = useState(false);
    const [reducedMotion] = useState(
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    const scrollable = stops.length > 1;

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        // the stop closest to where the row is now is the one in view
        const update = () => {
            const next = snapStops(track);
            setStops((current) => (current.join() === next.join() ? current : next));
            let nearest = 0;
            next.forEach((stop, index) => {
                if (Math.abs(stop - track.scrollLeft) < Math.abs(next[nearest] - track.scrollLeft)) {
                    nearest = index;
                }
            });
            setActive(nearest);
        };

        update();
        const resize = new ResizeObserver(update);
        resize.observe(track);
        track.addEventListener('scroll', update, { passive: true });
        // autoplay only runs while most of the row is on screen
        const visible = new IntersectionObserver(([entry]) => setOnScreen(entry.intersectionRatio >= 0.5), {
            threshold: 0.5,
        });
        visible.observe(track);
        return () => {
            resize.disconnect();
            visible.disconnect();
            track.removeEventListener('scroll', update);
        };
    }, []);

    const show = useCallback(
        (index: number) => {
            const track = trackRef.current;
            if (!track || stops.length === 0) return;
            // past either end it goes round to the other end
            const stop = stops[(index + stops.length) % stops.length];
            track.scrollTo({ left: stop, behavior: reducedMotion ? 'auto' : 'smooth' });
        },
        [stops, reducedMotion],
    );

    // A new timer starts at every stop, also after a swipe or click, so the cards never move right
    // after someone moved them. It waits while the mouse or keyboard focus is on the row.
    useEffect(() => {
        if (!autoplay || reducedMotion || hovered || focused || !onScreen || !scrollable) return;
        const timer = window.setTimeout(() => {
            if (!document.hidden) show(active + 1);
        }, AUTOPLAY_DELAY);
        return () => window.clearTimeout(timer);
    }, [autoplay, reducedMotion, hovered, focused, onScreen, scrollable, active, show]);

    const showArrows = controls !== undefined && scrollable;

    return (
        <div
            ref={frameRef}
            className={`${styles.frame} ${showArrows ? styles.withArrows : ''}`}
            onPointerEnter={(event) => event.pointerType === 'mouse' && setHovered(true)}
            onPointerLeave={(event) => event.pointerType === 'mouse' && setHovered(false)}
            // only keyboard focus: a click or tap on an arrow also leaves focus on it, which should not stop autoplay
            onFocus={(event) => setFocused(event.target.matches(':focus-visible'))}
            onBlur={(event) => {
                // focus moving between cards and buttons inside the row keeps it paused
                if (!frameRef.current?.contains(event.relatedTarget as Node | null)) setFocused(false);
            }}
        >
            {showArrows && (
                <button
                    type="button"
                    className={`${styles.arrow} ${styles.previous}`}
                    aria-label={controls.previous}
                    onClick={() => show(active - 1)}
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M15 5l-7 7 7 7" />
                    </svg>
                </button>
            )}
            <div ref={trackRef} className={className} role="group" aria-label={label} data-carousel-row>
                {children}
            </div>
            {showArrows && (
                <button
                    type="button"
                    className={`${styles.arrow} ${styles.next}`}
                    aria-label={controls.next}
                    onClick={() => show(active + 1)}
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}
            {scrollable && (
                <div className={styles.dots}>
                    {stops.map((_, index) => (
                        <button
                            type="button"
                            key={index}
                            aria-label={dotLabel(index, stops.length)}
                            aria-current={index === active ? 'true' : undefined}
                            onClick={() => show(index)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Carousel;
