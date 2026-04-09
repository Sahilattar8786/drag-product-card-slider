# product-card-slider

Lightweight, zero-dependency image slider built for product cards. Drag, swipe, hover-preview — works in React, Vue, Shopify, or plain HTML.

**~3 KB** gzipped · **Zero dependencies** · **Plug & play**

---

## Live Demo

> Both demos fetch real product data from [Platzi Fake Store API](https://api.escuelajs.co/api/v1/products).

| Demo | Description |
|---|---|
| [`examples/index.html`](./examples/index.html) | **Vanilla JS** — Default, Hover Preview, Autoplay, Custom Arrows |
| [`examples/react-demo.html`](./examples/react-demo.html) | **React CDN** — Component, Hook, Mode Switcher (no build tools) |

**Run locally:**

```bash
# Any static server works — the demos use ES modules
npx serve .
# Then open http://localhost:3000/examples/
```

---

## Features

- **Drag & swipe** with momentum — smooth on mobile and desktop
- **Hover preview** — Shopify-style zone-based image switching on mouse move
- **Autoplay on hover** — auto-advance images while the cursor is over the card
- **Lazy loading** — only loads images as they're needed (IntersectionObserver)
- **Navigation arrows** — appear on hover (desktop), always visible (mobile)
- **Dot indicators** — shows active slide position
- **Keyboard navigation** — Arrow keys when focused
- **Accessible** — ARIA labels, roles, and live regions
- **Looping** — optional infinite loop
- **Tiny footprint** — styles auto-injected, no CSS import required
- **Framework-agnostic** — works everywhere

---

## Installation

```bash
npm install product-card-slider
```

Or via CDN:

```html
<script src="https://unpkg.com/product-card-slider/dist/product-card-slider.umd.min.js"></script>
```

---

## Quick Start

### HTML

```html
<div class="product-slider" id="slider">
  <img src="product-1.jpg" alt="Front view">
  <img src="product-2.jpg" alt="Side view">
  <img src="product-3.jpg" alt="Back view">
</div>
```

### JavaScript (ESM)

```js
import ProductCardSlider from 'product-card-slider';

new ProductCardSlider('#slider', {
  showDots: true,
  showArrows: true,
});
```

### JavaScript (CDN / UMD)

```html
<script src="https://unpkg.com/product-card-slider/dist/product-card-slider.umd.min.js"></script>
<script>
  new ProductCardSlider('#slider', { showDots: true });
</script>
```

### Initialize all sliders at once

```js
ProductCardSlider.initAll('.product-slider', {
  hoverPreview: true,
  showDots: true,
});
```

---

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `autoplay` | `boolean` | `false` | Auto-advance slides on hover |
| `interval` | `number` | `3000` | Autoplay interval in ms |
| `showDots` | `boolean` | `true` | Show dot indicators |
| `showArrows` | `boolean` | `true` | Show prev/next arrow buttons |
| `loop` | `boolean` | `false` | Loop back to first/last slide |
| `swipeThreshold` | `number` | `50` | Min drag distance (px) to trigger slide change |
| `lazyLoad` | `boolean` | `true` | Lazy load off-screen images |
| `hoverPreview` | `boolean` | `false` | Zone-based hover-to-preview (Shopify-style) |
| `momentum` | `boolean` | `true` | Fast flick advances slide even below threshold |
| `injectCSS` | `boolean` | `true` | Auto-inject styles (set `false` to use your own) |
| `ariaLabel` | `string` | `'Product image slider'` | ARIA label for the slider region |
| `prevArrow` | `string \| HTMLElement \| null` | `null` | Custom previous arrow (see below) |
| `nextArrow` | `string \| HTMLElement \| null` | `null` | Custom next arrow (see below) |

### Custom Arrows

The `prevArrow` and `nextArrow` options accept three types of values:

**`null` (default)** — uses the built-in SVG chevron inside a `<button>`:

```js
new ProductCardSlider('#slider'); // default arrows
```

**HTML string** — your markup is injected as `innerHTML` of a generated `<button>`:

```js
new ProductCardSlider('#slider', {
  prevArrow: '<i class="fa fa-chevron-left"></i>',
  nextArrow: '<i class="fa fa-chevron-right"></i>',
});
```

**DOM element** — your element is adopted directly (moved into the slider):

```js
new ProductCardSlider('#slider', {
  prevArrow: document.querySelector('.my-prev-btn'),
  nextArrow: document.querySelector('.my-next-btn'),
});
```

In all cases the library automatically:
- Adds `pcs-arrow` + `pcs-prev` / `pcs-next` classes to the element
- Manages the `disabled` and `aria-disabled` attributes at the edges
- Attaches the click handler for navigation

This works with any element type (`<button>`, `<div>`, `<a>`, `<span>`, etc.). Use `[disabled]` in your CSS to style the disabled state:

```css
.my-prev-btn[disabled] {
  opacity: 0.3;
  pointer-events: none;
}
```

---

## Methods

```js
const slider = new ProductCardSlider('#slider');

slider.next();      // Go to next slide
slider.prev();      // Go to previous slide
slider.goTo(2);     // Jump to slide at index 2
slider.destroy();   // Clean up all listeners and observers
```

### Static Methods

```js
// Initialize multiple sliders, returns an array of instances
const sliders = ProductCardSlider.initAll('.product-slider', options);

// Retrieve existing instance from a DOM element
const instance = ProductCardSlider.getInstance(element);
```

---

## Events

Listen for slide changes via the `pcs:change` custom event:

```js
document.querySelector('#slider').addEventListener('pcs:change', (e) => {
  console.log('Current slide:', e.detail.index);
});
```

---

## CSS Customization

Styles are auto-injected by default. To use your own stylesheet instead:

```js
new ProductCardSlider('#slider', { injectCSS: false });
```

Then import the standalone CSS:

```css
@import 'product-card-slider/css';
```

Or link it directly:

```html
<link rel="stylesheet" href="node_modules/product-card-slider/dist/product-card-slider.css">
```

### Class Reference

| Class | Element |
|---|---|
| `.pcs` | Container (auto-added) |
| `.pcs-track` | Flex track holding slides |
| `.pcs-slide` | Individual slide wrapper |
| `.pcs-arrow` | Arrow button (both) |
| `.pcs-prev` | Previous arrow |
| `.pcs-next` | Next arrow |
| `.pcs-dots` | Dots container |
| `.pcs-dot` | Individual dot |
| `.pcs-active` | Active dot |
| `.pcs-grab` | Applied during drag (disables transition) |
| `.pcs-hover` | Applied during hover-preview mode |

---

## React Usage

```jsx
import { useRef, useEffect } from 'react';
import ProductCardSlider from 'product-card-slider';

function ProductSlider({ images }) {
  const ref = useRef(null);

  useEffect(() => {
    const slider = new ProductCardSlider(ref.current, {
      showDots: true,
      hoverPreview: true,
    });
    return () => slider.destroy();
  }, []);

  return (
    <div ref={ref}>
      {images.map((src, i) => (
        <img key={src} src={i === 0 ? src : undefined} data-src={i > 0 ? src : undefined} alt="" />
      ))}
    </div>
  );
}
```

A full React wrapper component with a `useProductSlider` hook is available in [`examples/react-wrapper.jsx`](./examples/react-wrapper.jsx).

**No build tools?** Open [`examples/react-demo.html`](./examples/react-demo.html) — a complete React 18 CDN demo with live API data, mode switcher, and hook usage. Zero setup required.

---

## Vue Usage

```vue
<template>
  <div ref="slider">
    <img v-for="(src, i) in images" :key="src"
         :src="i === 0 ? src : undefined"
         :data-src="i > 0 ? src : undefined" alt="" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import ProductCardSlider from 'product-card-slider';

const props = defineProps({ images: Array });
const slider = ref(null);
let instance;

onMounted(() => {
  instance = new ProductCardSlider(slider.value, { showDots: true });
});

onBeforeUnmount(() => instance?.destroy());
</script>
```

---

## Shopify Liquid Usage

```html
<div class="product-slider" data-slider>
  {% for image in product.images %}
    <img
      {% if forloop.first %}src{% else %}data-src{% endif %}="{{ image | img_url: '500x' }}"
      alt="{{ image.alt | escape }}"
    >
  {% endfor %}
</div>

<script src="https://unpkg.com/product-card-slider/dist/product-card-slider.umd.min.js"></script>
<script>
  ProductCardSlider.initAll('[data-slider]', {
    hoverPreview: true,
    showDots: true,
    showArrows: true,
  });
</script>
```

---

## Performance

Optimized for large product grids (50+ cards):

- **Lazy loading** via `IntersectionObserver` — off-screen images are not downloaded
- **GPU-accelerated** — uses `translate3d` for composited transforms
- **No reflows** — layout reads and writes are batched
- **rAF-throttled** hover and resize handlers
- **Passive listeners** where applicable
- **WeakMap instance tracking** — no memory leaks, GC-friendly
- **ResizeObserver** for container-level resize handling (no global polling)

---

## Browser Support

Works in all modern browsers supporting [Pointer Events](https://caniuse.com/pointer):

- Chrome 55+
- Firefox 59+
- Safari 13+
- Edge 79+

---

## License

MIT
