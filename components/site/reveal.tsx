'use client';

import { useEffect, useRef } from 'react';

/**
 * Scroll reveal.
 *
 * Visibility is written straight to the DOM node rather than to React state:
 * the animation is a presentational side effect, and this keeps a long catalogue
 * page from re-rendering once per revealed block. Content is styled visible
 * again for `prefers-reduced-motion` and for browsers without
 * IntersectionObserver, so nothing depends on JavaScript to be readable.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const show = () => node.setAttribute('data-visible', 'true');

    if (typeof IntersectionObserver === 'undefined') {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        show();
        observer.disconnect();
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      data-visible="false"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
