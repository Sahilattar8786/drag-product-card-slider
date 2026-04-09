/**
 * React wrapper for ProductCardSlider
 *
 * Usage:
 *   import ProductSlider from './react-wrapper';
 *
 *   <ProductSlider
 *     images={[
 *       { src: '/img/product-1.jpg', alt: 'Front view' },
 *       { src: '/img/product-2.jpg', alt: 'Side view' },
 *       { src: '/img/product-3.jpg', alt: 'Back view' },
 *     ]}
 *     options={{ showDots: true, hoverPreview: true }}
 *     className="my-slider"
 *     onSlideChange={(index) => console.log('Now on slide', index)}
 *   />
 */

import { useRef, useEffect, useCallback } from 'react';
import ProductCardSlider from 'product-card-slider';

export default function ProductSlider({
  images = [],
  options = {},
  className = '',
  style = {},
  onSlideChange,
}) {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || images.length === 0) return;

    instanceRef.current = new ProductCardSlider(el, options);

    const handleChange = (e) => {
      onSlideChange?.(e.detail.index);
    };

    el.addEventListener('pcs:change', handleChange);

    return () => {
      el.removeEventListener('pcs:change', handleChange);
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [images, options, onSlideChange]);

  const goTo = useCallback((i) => instanceRef.current?.goTo(i), []);
  const next = useCallback(() => instanceRef.current?.next(), []);
  const prev = useCallback(() => instanceRef.current?.prev(), []);

  return (
    <div ref={containerRef} className={className} style={style}>
      {images.map((img, i) => (
        <img
          key={img.src}
          src={i === 0 ? img.src : undefined}
          data-src={i > 0 ? img.src : undefined}
          alt={img.alt || ''}
        />
      ))}
    </div>
  );
}

/**
 * Hook for imperative control of a slider instance.
 *
 * Usage:
 *   const { ref, next, prev, goTo } = useProductSlider({ loop: true });
 *   return (
 *     <div ref={ref}>
 *       <img src="a.jpg" /> <img src="b.jpg" />
 *     </div>
 *   );
 */
export function useProductSlider(options = {}) {
  const ref = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    instanceRef.current = new ProductCardSlider(ref.current, options);
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [options]);

  return {
    ref,
    next: () => instanceRef.current?.next(),
    prev: () => instanceRef.current?.prev(),
    goTo: (i) => instanceRef.current?.goTo(i),
    getInstance: () => instanceRef.current,
  };
}
