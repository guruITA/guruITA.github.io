import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './Carousel.module.scss';

interface CarouselProps {
    // the layout of the row; it only scrolls sideways where that class makes it (see styles/_carousel.scss)
    className: string;
    label: string;
    dotLabel: (index: number, count: number) => string;
    children: ReactNode;
}

// A row of cards that you swipe sideways on small screens. The dots only show while the row
// actually scrolls, so on wide screens the cards stay a plain grid.
function Carousel({ className, label, dotLabel, children }: CarouselProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [scrollable, setScrollable] = useState(false);
    const [active, setActive] = useState(0);
    const count = Children.count(children);

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        // the card whose middle is closest to the middle of the row is the one in view
        const update = () => {
            setScrollable(track.scrollWidth > track.clientWidth + 1);
            const middle = track.scrollLeft + track.clientWidth / 2;
            let nearest = 0;
            let distance = Infinity;
            Array.from(track.children).forEach((child, index) => {
                const card = child as HTMLElement;
                const cardDistance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - middle);
                if (cardDistance < distance) {
                    distance = cardDistance;
                    nearest = index;
                }
            });
            setActive(nearest);
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(track);
        track.addEventListener('scroll', update, { passive: true });
        return () => {
            observer.disconnect();
            track.removeEventListener('scroll', update);
        };
    }, []);

    const show = (index: number) => {
        const track = trackRef.current;
        const card = track?.children[index] as HTMLElement | undefined;
        if (!track || !card) return;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        track.scrollTo({
            left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2,
            behavior: reduceMotion ? 'auto' : 'smooth',
        });
    };

    return (
        <>
            <div ref={trackRef} className={className} role="group" aria-label={label}>
                {children}
            </div>
            {scrollable && (
                <div className={styles.dots}>
                    {Array.from({ length: count }, (_, index) => (
                        <button
                            type="button"
                            key={index}
                            aria-label={dotLabel(index, count)}
                            aria-current={index === active ? 'true' : undefined}
                            onClick={() => show(index)}
                        />
                    ))}
                </div>
            )}
        </>
    );
}

export default Carousel;
