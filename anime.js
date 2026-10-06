(() => {
  document.querySelectorAll('[data-world]').forEach(link => link.addEventListener('click', () => {
    document.querySelector('[data-filter="' + link.dataset.world + '"]').click();
    document.querySelector('#typeFilter').value = 'Todos';
    document.querySelector('#typeFilter').dispatchEvent(new Event('change'));
  }));
  if (!window.gsap || !window.ScrollTrigger || !window.ScrollToPlugin) return;
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  const SplitText = window.SplitText || null;
  const Flip = window.Flip || null;
  if (SplitText) gsap.registerPlugin(SplitText);
  if (Flip) gsap.registerPlugin(Flip);

  const button = document.querySelector('#motionToggle');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  let userPaused = false;
  try { userPaused = localStorage.getItem('ue-motion-paused') === 'true'; } catch {}

  let context, observer, ticker, loop, skewReset, heroReady = false, rects = null;
  const splits = [];
  const cleanups = [];
  const motionOn = () => !userPaused && !preference.matches;

  const split = (target, vars) => {
    if (!SplitText || !target) return null;
    try { const s = SplitText.create(target, vars); splits.push(s); return s; } catch { return null; }
  };
  const release = s => {
    const i = splits.indexOf(s);
    if (i < 0) return;
    splits.splice(i, 1);
    try { s.revert(); } catch {}
  };

  function stop() {
    observer?.disconnect(); observer = null;
    cleanups.forEach(fn => { try { fn(); } catch {} });
    cleanups.length = 0;
    clearTimeout(skewReset); skewReset = null;
    rects = null;
    document.querySelectorAll('nav a.current').forEach(a => a.classList.remove('current'));
    splits.splice(0).forEach(s => { try { s.revert(); } catch {} });
    context?.revert(); context = null;
    gsap.killTweensOf(window);
    gsap.killTweensOf('dialog');
    document.querySelectorAll('dialog[open]').forEach(d => { try { gsap.set(d, { clearProps: 'opacity,transform' }); } catch {} });
    loop = null; ticker = null; heroReady = false;
    document.documentElement.classList.remove('motion-active');
  }

  function heroPointer() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const layers = [['.scene-background', 10], ['.energy-orb', 30], ['.hero-art', 8], ['.japanese-mark', 6]]
      .map(([sel, depth]) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        return { el, depth, x: gsap.quickTo(el, 'x', { duration: .7, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: .7, ease: 'power3' }) };
      })
      .filter(Boolean);
    const move = e => {
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      layers.forEach(l => { l.x(px * l.depth); l.y(py * l.depth); });
    };
    hero.addEventListener('pointermove', move);
    cleanups.push(() => {
      hero.removeEventListener('pointermove', move);
      layers.forEach(l => { gsap.killTweensOf(l.el); gsap.set(l.el, { x: 0, y: 0 }); });
    });
  }

  function magnetize() {
    gsap.utils.toArray('.hero-actions .primary, .hero-actions .text-link, form .primary, .closing a').forEach(el => {
      const xTo = gsap.quickTo(el, 'x', { duration: .45, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: .45, ease: 'power3' });
      const move = e => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * .3);
        yTo((e.clientY - (r.top + r.height / 2)) * .4);
      };
      const out = () => { xTo(0); yTo(0); };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', out);
      cleanups.push(() => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerleave', out);
        gsap.killTweensOf(el);
        gsap.set(el, { x: 0, y: 0 });
      });
    });
  }

  function renderProducts() {
    const els = gsap.utils.toArray('#products .product');
    const prev = rects;
    rects = null;
    if (motionOn()) {
      els.forEach((el, i) => {
        const id = el.querySelector('[data-product]')?.dataset.product;
        const old = id && prev ? prev.get(id) : null;
        if (old) {
          const now = el.getBoundingClientRect();
          const dx = old.left - now.left;
          const dy = old.top - now.top;
          if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            gsap.from(el, { x: dx, y: dy, duration: .55, ease: 'power3.out', clearProps: 'transform', overwrite: 'auto' });
          } else {
            gsap.from(el, { opacity: .4, scale: .97, duration: .35, ease: 'power2.out', clearProps: 'all', overwrite: 'auto' });
          }
        } else {
          gsap.from(el, { opacity: 0, y: 18, scale: .95, duration: .45, delay: i * .05, ease: 'power3.out', clearProps: 'all', overwrite: 'auto' });
        }
      });
    }
    ScrollTrigger.refresh();
  }

  function start() {
    stop();
    if (!motionOn()) return;
    document.documentElement.classList.add('motion-active');
    heroReady = false;
    context = gsap.context(() => {
      /* Entrada da capa */
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero .eyebrow', { y: 22, opacity: 0, duration: .7 }, 0);
      const h1 = document.querySelector('h1');
      const h1split = split(h1, { type: 'words,chars', charsClass: 'split-char' });
      if (h1split && h1split.chars.length) {
        tl.from(h1split.chars, { yPercent: 85, opacity: 0, duration: .7, stagger: .018, onComplete() { release(h1split); } }, .12);
      } else {
        tl.from(h1, { y: 30, opacity: 0, duration: .9 }, .12);
      }
      tl.from('.intro', { y: 18, opacity: 0, duration: .7 }, .4)
        .from('.hero-actions > *', { y: 14, opacity: 0, duration: .6, stagger: .08 }, .55)
        .from('.hero-foot > span', { y: 10, opacity: 0, duration: .5, stagger: .07 }, .7)
        .from('.hero-shirt, .hero-hoodie', { y: 44, opacity: 0, duration: 1.1, stagger: .15, ease: 'power2.out' }, .1)
        .from('.edition-label, .art-caption', { opacity: 0, duration: .7, stagger: .12 }, .85)
        .from('.energy-orb', { scale: .72, opacity: 0, duration: 1.2, ease: 'power2.out' }, .25)
        .from('.sticker', { scale: 0, rotation: -30, opacity: 0, duration: .7, ease: 'back.out(2.2)' }, 1);
      const jp = split('.japanese-mark', { type: 'chars', charsClass: 'split-char' });
      if (jp && jp.chars.length) tl.from(jp.chars, { opacity: 0, y: 16, duration: .6, stagger: .07, onComplete() { release(jp); } }, .6);
      else tl.from('.japanese-mark', { opacity: 0, duration: .9 }, .6);

      /* Flutuação da capa (só depois da entrada) */
      loop = gsap.timeline({ repeat: -1, yoyo: true, paused: true });
      loop.to('.hero-hoodie', { y: -14, rotation: 9, duration: 3.5, ease: 'sine.inOut' }, 0)
        .to('.sticker', { rotation: -4, y: -6, duration: 3.5, ease: 'sine.inOut' }, 0);
      ScrollTrigger.create({
        trigger: '.hero', start: 'top bottom', end: 'bottom top',
        onToggle: s => { if (heroReady) s.isActive ? loop.play() : loop.pause(); }
      });
      tl.call(() => { heroReady = true; loop.play(); magnetize(); });

      /* Parallax de fundo, progresso de leitura e ticker */
      gsap.to('.scene-background', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
      gsap.to('.reading-progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });
      const strip = document.querySelector('.ticker span');
      if (strip) {
        ticker = gsap.to(strip, { x: () => -Math.max(100, strip.scrollWidth - window.innerWidth), duration: 24, ease: 'none', repeat: -1, yoyo: true });
        ScrollTrigger.create({ trigger: '.ticker', start: 'top bottom', end: 'bottom top', onToggle: s => s.isActive ? ticker.play() : ticker.pause() });
        const skewTo = gsap.quickTo('.ticker', 'skewX', { duration: .4, ease: 'power2' });
        const clampSkew = gsap.utils.clamp(-7, 7);
        ScrollTrigger.create({
          start: 0, end: 'max',
          onUpdate(self) {
            skewTo(clampSkew(self.getVelocity() / -320));
            clearTimeout(skewReset);
            skewReset = setTimeout(() => skewTo(0), 150);
          }
        });
      }

      /* Revelação ao rolar */
      gsap.utils.toArray('.section-heading,.custom > div,.custom form,.how > .eyebrow,.steps article').forEach(el => {
        gsap.from(el, { y: 24, opacity: 0, duration: .75, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 93%', once: true }, clearProps: 'all' });
      });
      gsap.utils.toArray('.how > h2, .faq > h2, .closing h2').forEach(el => {
        const s = split(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
        if (s && s.lines.length) {
          gsap.from(s.lines, { yPercent: 112, duration: .85, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true }, onComplete() { release(s); } });
        } else {
          gsap.from(el, { y: 24, opacity: 0, duration: .75, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 93%', once: true }, clearProps: 'all' });
        }
      });

      /* Cards de universo */
      gsap.utils.toArray('.world-card').forEach((el, i) => {
        gsap.from(el, { y: 35, opacity: 0, duration: .8, delay: i * .08, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 94%', once: true }, clearProps: 'all' });
        gsap.fromTo(el.querySelector('.world-art'), { scale: 1.09 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 } });
        const s = split(el.querySelector('.world-copy strong'), { type: 'chars', charsClass: 'split-char' });
        if (s && s.chars.length) {
          gsap.from(s.chars, { yPercent: 110, opacity: 0, duration: .5, stagger: .03, delay: .3 + i * .08, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 94%', once: true }, onComplete() { release(s); } });
        }
      });

      /* Catálogo: entrada inicial + FLIP por peça ao filtrar */
      gsap.from('#products .product', { y: 22, opacity: 0, duration: .5, stagger: .06, ease: 'power2.out', clearProps: 'all', scrollTrigger: { trigger: '#products', start: 'top 88%', once: true } });
      observer = new MutationObserver(() => renderProducts());
      observer.observe(document.querySelector('#products'), { childList: true });

      /* Link ativo no menu */
      gsap.utils.toArray('nav a[href^="#"]').forEach(link => {
        const sel = link.getAttribute('href');
        if (!sel || sel === '#') return;
        const sec = document.querySelector(sel);
        if (!sec) return;
        ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 45%', onToggle: self => link.classList.toggle('current', self.isActive) });
      });

      if (fine.matches) heroPointer();
    });
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }

  function update() {
    button.hidden = preference.matches;
    button.textContent = userPaused ? 'Ativar animações ▷' : 'Pausar animações Ⅱ';
    button.setAttribute('aria-pressed', String(userPaused));
    start();
  }

  /* Posição dos filtros antes do render (FLIP por id) */
  const snapshot = () => {
    rects = new Map();
    document.querySelectorAll('#products .product').forEach(el => {
      const id = el.querySelector('[data-product]')?.dataset.product;
      if (id) rects.set(id, el.getBoundingClientRect());
    });
  };
  document.addEventListener('click', e => {
    if (motionOn() && e.target instanceof Element && e.target.closest('[data-filter]')) snapshot();
  }, true);
  document.addEventListener('change', e => {
    if (motionOn() && e.target instanceof Element && e.target.id === 'typeFilter') snapshot();
  }, true);

  /* Abertura dos diálogos (aplicada antes do showModal, no mesmo evento) */
  const openAnim = id => {
    const d = document.getElementById(id);
    if (!d || !motionOn()) return;
    const cart = id === 'cartDialog';
    gsap.fromTo(d,
      { opacity: 0, x: cart ? 42 : 0, y: cart ? 0 : 16, scale: cart ? 1 : .96 },
      { opacity: 1, x: 0, y: 0, scale: 1, duration: .4, ease: 'power3.out', overwrite: true, clearProps: 'opacity,transform' });
  };
  document.addEventListener('click', e => {
    if (!motionOn() || !(e.target instanceof Element)) return;
    if (e.target.closest('#openCart')) openAnim('cartDialog');
    else if (e.target.closest('[data-product]')) openAnim('productDialog');
  }, true);
  document.addEventListener('keydown', e => {
    if (!motionOn() || (e.key !== 'Enter' && e.key !== ' ')) return;
    if (e.target instanceof Element && e.target.matches('.product-visual')) openAnim('productDialog');
  }, true);

  button.addEventListener('click', () => {
    const st = Flip ? Flip.getState('nav, #motionToggle, .bag') : null;
    userPaused = !userPaused;
    try { localStorage.setItem('ue-motion-paused', String(userPaused)); } catch {}
    update();
    if (st && motionOn()) Flip.from(st, {
      duration: .4,
      ease: 'power2.inOut',
      onComplete() { gsap.set('nav, #motionToggle, .bag', { clearProps: 'width,height,minWidth,maxWidth,minHeight,maxHeight,transform' }); }
    });
  });
  preference.addEventListener('change', update);

  /* Navegação suave */
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || userPaused || preference.matches || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    const id = link.getAttribute('href');
    const target = id === '#' ? 0 : document.getElementById(id.slice(1));
    if (target === null) return;
    e.preventDefault();
    gsap.to(window, { duration: .85, ease: 'power2.inOut', scrollTo: { y: target, offsetY: 24, autoKill: true } });
    if (id !== '#') history.replaceState(null, '', id);
  });

  window.addEventListener('load', () => { if (document.documentElement.classList.contains('motion-active')) ScrollTrigger.refresh(); }, { once: true });
  update();
})();
