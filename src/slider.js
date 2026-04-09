// ProductCardSlider v1.0.0 | MIT License
// https://github.com/Sahilattar8786/drag-product-card-slider

const DEFAULTS = {
  autoplay: false,
  interval: 3000,
  showDots: true,
  showArrows: true,
  loop: false,
  swipeThreshold: 50,
  lazyLoad: true,
  hoverPreview: false,
  momentum: true,
  injectCSS: true,
  ariaLabel: 'Product image slider',
  prevArrow: null,
  nextArrow: null,
};

const CSS = '.pcs{position:relative;overflow:hidden;touch-action:pan-y;user-select:none}.pcs-track{display:flex;will-change:transform;transition:transform .3s ease}.pcs-track.pcs-grab{transition:none}.pcs-slide{flex:0 0 100%;min-width:0}.pcs-slide img{display:block;width:100%;height:100%;object-fit:cover;pointer-events:none}.pcs-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:2;background:rgba(255,255,255,.9);border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;padding:0;color:#333}.pcs-prev{left:6px}.pcs-next{right:6px}.pcs:hover .pcs-arrow,.pcs:focus-within .pcs-arrow{opacity:1}.pcs-arrow[disabled]{opacity:.3!important;cursor:default;pointer-events:none}.pcs-arrow svg{width:14px;height:14px}.pcs-dots{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:5px;z-index:2}.pcs-dot{width:6px;height:6px;border-radius:50%;border:none;padding:0;background:rgba(255,255,255,.5);cursor:pointer;transition:background .2s}.pcs-dot.pcs-active{background:#fff}@media(max-width:768px){.pcs-arrow{opacity:.85}}.pcs-hover .pcs-track{transition-duration:.15s}';

let cssInjected = false;

function ensureCSS() {
  if (cssInjected || typeof document === 'undefined') return;
  cssInjected = true;
  const el = document.createElement('style');
  el.textContent = CSS;
  el.setAttribute('data-pcs', '');
  (document.head || document.documentElement).appendChild(el);
}

function chevron(d) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>';
}

class ProductCardSlider {
  /**
   * WeakMap prevents memory leaks — when the DOM element is GC'd, the
   * entry is automatically removed. Also prevents double-initialization.
   */
  static _map = new WeakMap();

  /**
   * Initialize sliders on all elements matching a selector.
   * @param {string|NodeList|HTMLElement[]} selector
   * @param {Object} options
   * @returns {ProductCardSlider[]}
   */
  static initAll(selector, options = {}) {
    const els = typeof selector === 'string'
      ? document.querySelectorAll(selector)
      : selector;
    return Array.from(els).map(el => new ProductCardSlider(el, options));
  }

  /**
   * Retrieve an existing instance attached to an element.
   * @param {HTMLElement} el
   * @returns {ProductCardSlider|null}
   */
  static getInstance(el) {
    return ProductCardSlider._map.get(el) || null;
  }

  /**
   * @param {string|HTMLElement} selector — CSS selector (first match) or DOM element
   * @param {Object} options
   */
  constructor(selector, options = {}) {
    const el = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (!el) return;

    // Return existing instance to prevent duplicate init
    const existing = ProductCardSlider._map.get(el);
    if (existing) return existing;

    this.el = el;
    this.o = { ...DEFAULTS, ...options };
    this.idx = 0;
    this.count = 0;
    this.track = null;
    this.slides = null;
    this.dots = null;
    this.prevBtn = null;
    this.nextBtn = null;

    // Internal drag state
    this._d = { on: false, locked: false, isH: false, sx: 0, sy: 0, dx: 0, t0: 0 };
    this._timers = { auto: null, raf: null, hover: null };
    this._obs = null;
    this._ro = null;
    this._dead = false;

    // Pre-bind handlers so they can be cleanly removed
    this._bPD = this._onDown.bind(this);
    this._bPM = this._onMove.bind(this);
    this._bPU = this._onUp.bind(this);
    this._bKD = this._onKey.bind(this);
    this._bME = this._onEnter.bind(this);
    this._bML = this._onLeave.bind(this);
    this._bMM = this._onHoverMove.bind(this);
    this._bRS = this._onResize.bind(this);

    ProductCardSlider._map.set(el, this);
    if (this.o.injectCSS) ensureCSS();

    this._build();
    this._bind();
    this._lazy();
    this._go(0, false);
  }

  /* ------------------------------------------------------------------ */
  /*  DOM Construction                                                   */
  /* ------------------------------------------------------------------ */

  _build() {
    const el = this.el;
    const imgs = Array.from(el.querySelectorAll('img'));
    this.count = imgs.length;
    if (!this.count) return;

    el.classList.add('pcs');
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', this.o.ariaLabel);
    el.setAttribute('tabindex', '0');

    this.track = document.createElement('div');
    this.track.className = 'pcs-track';
    this.track.setAttribute('aria-live', 'polite');

    imgs.forEach((img, i) => {
      const slide = document.createElement('div');
      slide.className = 'pcs-slide';
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${i + 1} of ${this.count}`);

      // Convert subsequent images to lazy-loadable if they have src
      if (this.o.lazyLoad && i > 0 && img.src && !img.dataset.src) {
        img.dataset.src = img.src;
        img.removeAttribute('src');
      }

      slide.appendChild(img);
      this.track.appendChild(slide);
    });

    // Replace original children with the structured track
    el.innerHTML = '';
    el.appendChild(this.track);
    this.slides = this.track.children;

    if (this.o.showArrows && this.count > 1) {
      this.prevBtn = this._mkArrow('prev', 'Previous image');
      this.nextBtn = this._mkArrow('next', 'Next image');
      el.appendChild(this.prevBtn);
      el.appendChild(this.nextBtn);
    }

    if (this.o.showDots && this.count > 1) {
      const wrap = document.createElement('div');
      wrap.className = 'pcs-dots';
      wrap.setAttribute('role', 'tablist');
      this.dots = [];
      for (let i = 0; i < this.count; i++) {
        const dot = document.createElement('button');
        dot.className = 'pcs-dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `Image ${i + 1}`);
        dot.addEventListener('click', () => this.goTo(i));
        this.dots.push(dot);
        wrap.appendChild(dot);
      }
      el.appendChild(wrap);
    }
  }

  /**
   * Build or adopt an arrow element.
   *  - null          → generate a <button> with SVG chevron (default)
   *  - string        → use as innerHTML inside a generated <button>
   *  - HTMLElement   → adopt it directly (moved into the slider container)
   */
  _mkArrow(dir, label) {
    const custom = dir === 'prev' ? this.o.prevArrow : this.o.nextArrow;
    let btn;

    if (custom instanceof HTMLElement) {
      btn = custom;
    } else {
      btn = document.createElement('button');
      btn.innerHTML = typeof custom === 'string'
        ? custom
        : chevron(dir === 'prev' ? 'M15 18L9 12l6-6' : 'M9 6l6 6-6 6');
    }

    btn.classList.add('pcs-arrow', 'pcs-' + dir);
    if (!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', label);

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btn.hasAttribute('disabled')) return;
      dir === 'prev' ? this.prev() : this.next();
    });
    return btn;
  }

  /* ------------------------------------------------------------------ */
  /*  Event Binding                                                      */
  /* ------------------------------------------------------------------ */

  _bind() {
    if (this.count <= 1) return;

    this.el.addEventListener('pointerdown', this._bPD);
    this.el.addEventListener('keydown', this._bKD);

    if (this.o.autoplay || this.o.hoverPreview) {
      this.el.addEventListener('mouseenter', this._bME);
      this.el.addEventListener('mouseleave', this._bML);
    }

    // Use ResizeObserver when available (no debounce needed); fall back to window resize
    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(this._bRS);
      this._ro.observe(this.el);
    } else {
      window.addEventListener('resize', this._bRS, { passive: true });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Lazy Loading via IntersectionObserver                              */
  /* ------------------------------------------------------------------ */

  _lazy() {
    if (!this.o.lazyLoad || typeof IntersectionObserver === 'undefined') return;

    this._obs = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          delete img.dataset.src;
        }
        this._obs.unobserve(img);
      }
    }, { root: this.el, rootMargin: '0px 200% 0px 200%' });

    this.track.querySelectorAll('img[data-src]').forEach(img => this._obs.observe(img));
  }

  /* ------------------------------------------------------------------ */
  /*  Pointer / Drag Handling                                            */
  /* ------------------------------------------------------------------ */

  _onDown(e) {
    if (e.button !== 0) return;
    if (e.target.closest('.pcs-arrow,.pcs-dot')) return;

    const d = this._d;
    d.on = true;
    d.locked = false;
    d.sx = e.clientX;
    d.sy = e.clientY;
    d.dx = 0;
    d.t0 = Date.now();

    this.track.classList.add('pcs-grab');

    document.addEventListener('pointermove', this._bPM);
    document.addEventListener('pointerup', this._bPU);
    document.addEventListener('pointercancel', this._bPU);
  }

  _onMove(e) {
    const d = this._d;
    if (!d.on) return;

    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;

    // Direction lock: first 5px of movement decides horizontal vs vertical
    if (!d.locked) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      d.locked = true;
      d.isH = Math.abs(dx) >= Math.abs(dy);
      if (!d.isH) { this._endDrag(); return; }
    }
    if (!d.isH) return;
    e.preventDefault();

    d.dx = dx;
    const w = this.el.offsetWidth;
    let offset = dx;

    // Rubber-band resistance at edges when loop is off
    if (!this.o.loop) {
      const atStart = this.idx === 0 && dx > 0;
      const atEnd = this.idx === this.count - 1 && dx < 0;
      if (atStart || atEnd) offset = dx * 0.3;
    }

    this.track.style.transform = `translate3d(${-this.idx * w + offset}px,0,0)`;
  }

  _onUp() {
    const d = this._d;
    if (!d.on) return;

    const dx = d.dx;
    const dt = Date.now() - d.t0;
    const speed = dt > 0 ? Math.abs(dx) / dt : 0;
    const th = this.o.swipeThreshold;

    // Advance if drag distance exceeds threshold OR a fast flick was detected
    const shouldAdvance = Math.abs(dx) > th || (this.o.momentum && speed > 0.4);

    if (shouldAdvance && dx !== 0) {
      dx < 0 ? this.next() : this.prev();
    } else {
      this._go(this.idx);
    }

    this._endDrag();
  }

  _endDrag() {
    this._d.on = false;
    this.track.classList.remove('pcs-grab');
    document.removeEventListener('pointermove', this._bPM);
    document.removeEventListener('pointerup', this._bPU);
    document.removeEventListener('pointercancel', this._bPU);
  }

  /* ------------------------------------------------------------------ */
  /*  Keyboard Navigation                                                */
  /* ------------------------------------------------------------------ */

  _onKey(e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); this.prev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); }
  }

  /* ------------------------------------------------------------------ */
  /*  Hover Behavior                                                     */
  /* ------------------------------------------------------------------ */

  _onEnter() {
    if (this.o.autoplay) this._startAuto();
    if (this.o.hoverPreview) {
      this.el.classList.add('pcs-hover');
      this.el.addEventListener('mousemove', this._bMM);
    }
  }

  _onLeave() {
    this._stopAuto();
    if (this.o.hoverPreview) {
      this.el.classList.remove('pcs-hover');
      this.el.removeEventListener('mousemove', this._bMM);
      this._go(0);
    }
  }

  /**
   * Zone-based hover preview: divide the card width into N zones
   * (one per image) and snap to the zone under the cursor.
   * Throttled via requestAnimationFrame to avoid layout thrashing.
   */
  _onHoverMove(e) {
    if (this._d.on) return;
    if (this._timers.hover) return;

    this._timers.hover = requestAnimationFrame(() => {
      this._timers.hover = null;
      const rect = this.el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const zone = Math.floor((x / rect.width) * this.count);
      const i = Math.max(0, Math.min(zone, this.count - 1));
      if (i !== this.idx) this._go(i);
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Resize Handling                                                    */
  /* ------------------------------------------------------------------ */

  _onResize() {
    if (this._timers.raf) cancelAnimationFrame(this._timers.raf);
    this._timers.raf = requestAnimationFrame(() => this._go(this.idx, false));
  }

  /* ------------------------------------------------------------------ */
  /*  Core Navigation                                                    */
  /* ------------------------------------------------------------------ */

  _go(index, animate = true) {
    const max = this.count - 1;

    if (this.o.loop) {
      if (index < 0) index = max;
      else if (index > max) index = 0;
    } else {
      index = Math.max(0, Math.min(index, max));
    }

    this.idx = index;
    const x = -index * this.el.offsetWidth;

    if (!animate) this.track.classList.add('pcs-grab');
    this.track.style.transform = `translate3d(${x}px,0,0)`;

    if (!animate) {
      // Force reflow so the browser registers the no-transition state,
      // then restore transitions on the next frame.
      void this.track.offsetHeight;
      requestAnimationFrame(() => this.track.classList.remove('pcs-grab'));
    }

    this._sync();
    this._preload(index);
    this.el.dispatchEvent(new CustomEvent('pcs:change', { detail: { index } }));
  }

  /** Eagerly load images adjacent to the current slide */
  _preload(i) {
    for (let off = -1; off <= 1; off++) {
      const j = i + off;
      if (j < 0 || j >= this.count) continue;
      const img = this.slides[j]?.querySelector('img[data-src]');
      if (img) {
        img.src = img.dataset.src;
        delete img.dataset.src;
      }
    }
  }

  _sync() {
    this._setDisabled(this.prevBtn, !this.o.loop && this.idx === 0);
    this._setDisabled(this.nextBtn, !this.o.loop && this.idx === this.count - 1);
    if (this.dots) {
      this.dots.forEach((dot, i) => {
        dot.classList.toggle('pcs-active', i === this.idx);
        dot.setAttribute('aria-selected', String(i === this.idx));
      });
    }
  }

  _setDisabled(el, flag) {
    if (!el) return;
    if (flag) el.setAttribute('disabled', '');
    else el.removeAttribute('disabled');
    el.setAttribute('aria-disabled', String(flag));
  }

  /* ------------------------------------------------------------------ */
  /*  Autoplay                                                           */
  /* ------------------------------------------------------------------ */

  _startAuto() {
    this._stopAuto();
    this._timers.auto = setInterval(() => this.next(), this.o.interval);
  }

  _stopAuto() {
    if (this._timers.auto) {
      clearInterval(this._timers.auto);
      this._timers.auto = null;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  /** Advance to the next slide */
  next() { this._go(this.idx + 1); }

  /** Go back to the previous slide */
  prev() { this._go(this.idx - 1); }

  /** Jump to a specific slide index */
  goTo(index) { this._go(index); }

  /** Clean up all event listeners, observers, and timers */
  destroy() {
    if (this._dead) return;
    this._dead = true;

    this._stopAuto();
    if (this._timers.raf) cancelAnimationFrame(this._timers.raf);
    if (this._timers.hover) cancelAnimationFrame(this._timers.hover);
    if (this._obs) this._obs.disconnect();
    if (this._ro) this._ro.disconnect();
    else window.removeEventListener('resize', this._bRS);

    this.el.removeEventListener('pointerdown', this._bPD);
    this.el.removeEventListener('keydown', this._bKD);
    this.el.removeEventListener('mouseenter', this._bME);
    this.el.removeEventListener('mouseleave', this._bML);
    this.el.removeEventListener('mousemove', this._bMM);
    document.removeEventListener('pointermove', this._bPM);
    document.removeEventListener('pointerup', this._bPU);
    document.removeEventListener('pointercancel', this._bPU);

    ProductCardSlider._map.delete(this.el);
  }
}

export default ProductCardSlider;
