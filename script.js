 'use strict';

  /* ─── PRELOADER ─────────────────────────── */
  (function () {
    const pl = document.getElementById('preloader');
    function hidePl() {
      pl.classList.add('pl-done');
      setTimeout(function () { if (pl.parentNode) pl.parentNode.removeChild(pl); }, 1100);
    }
    if (document.readyState === 'complete') {
      setTimeout(hidePl, 900);
    } else {
      window.addEventListener('load', function () { setTimeout(hidePl, 900); });
      /* Safety net: never trap the visitor behind the preloader */
      setTimeout(hidePl, 4000);
    }
  })();

  /* ─── LANGUAGE SWITCHER (SQ → EN → MK cycle) ─── */
  const html     = document.documentElement;
  const langBtn  = document.getElementById('langBtn');
  const LANGS    = ['sq', 'en', 'mk'];
  /* Text lives in <span data-sq>/<span data-en>/<span data-mk> triplets,
     shown/hidden by CSS via html[data-lang]. Strings that live in
     attributes (title, aria-labels) can't use spans, so they're swapped
     here — keep these maps in sync if those attributes change. */
  const TITLES = {
    sq: 'Bizhuteria Fantazia — Bizhuteri Fine Shqiptare',
    en: 'Bizhuteria Fantazia — Fine Albanian Jewellery',
    mk: 'Bizhuteria Fantazia — Фин албански накит'
  };
  const ARIA = {
    '#ann-close': { sq: 'Mbyll njoftimin', en: 'Close announcement', mk: 'Затвори го известувањето' },
    '#ham':       { sq: 'Menyja',          en: 'Menu',               mk: 'Мени' },
    '#btt':       { sq: 'Kthehu lart',     en: 'Back to top',        mk: 'Врати се горе' }
  };
  function setLang(lang) {
    if (LANGS.indexOf(lang) === -1) lang = 'sq';
    html.setAttribute('data-lang', lang);
    html.setAttribute('lang', lang);
    /* the pill shows the NEXT language in the cycle */
    const label = LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length].toUpperCase();
    if (langBtn) langBtn.textContent = label;
    document.title = TITLES[lang];
    Object.keys(ARIA).forEach(function (sel) {
      const el = document.querySelector(sel);
      if (el) el.setAttribute('aria-label', ARIA[sel][lang]);
    });
    const track = document.querySelector('.marquee-track');
    if (track) {
      track.style.animation = 'none';
      void track.offsetWidth;
      track.style.animation = '';
    }
    try { localStorage.setItem('bf_lang', lang); } catch (err) { /* private mode */ }
  }
  if (langBtn) langBtn.addEventListener('click', () => {
    const cur = html.getAttribute('data-lang') || 'sq';
    setLang(LANGS[(LANGS.indexOf(cur) + 1) % LANGS.length]);
  });
  /* Remember the visitor's language across visits */
  try {
    var savedLang = localStorage.getItem('bf_lang');
    if (savedLang && savedLang !== 'sq' && LANGS.indexOf(savedLang) !== -1) setLang(savedLang);
  } catch (err) { /* private mode */ }

  /* ─── NAV SCROLL ────────────────────────── */
  const nav = document.getElementById('nav');
  function handleNavScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  /* ─── SCROLL SPY (active nav link) ──────── */
  const navLinks = document.querySelectorAll('.nav-links a[data-section]');
  const spyIds = ['collection', 'order', 'story', 'footer'];

  function updateActiveLink() {
    const navEl = document.getElementById('nav');
    const navBottom = navEl ? navEl.getBoundingClientRect().bottom : 124;
    const scrollMid = window.scrollY + navBottom + 20;
    let active = '';
    spyIds.forEach(function(id) {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= scrollMid) active = id;
    });
    const docH = document.documentElement.scrollHeight;
    if (window.scrollY + window.innerHeight >= docH - 80) active = 'footer';
    navLinks.forEach(function(a) {
      a.classList.toggle('active', a.dataset.section === active);
    });
  }
  var spyTicking = false;
  window.addEventListener('scroll', function () {
    if (!spyTicking) {
      requestAnimationFrame(function () { updateActiveLink(); spyTicking = false; });
      spyTicking = true;
    }
  }, { passive: true });
  updateActiveLink();

  /* ─── MOBILE MENU ───────────────────────── */
  const ham      = document.getElementById('ham');
  const mob      = document.getElementById('mob');
  const mobClose = document.getElementById('mobClose');

  function openMob()  { mob.classList.add('open'); ham.classList.add('open'); ham.setAttribute('aria-expanded', 'true');  document.body.style.overflow = 'hidden'; }
  function closeMob() { mob.classList.remove('open'); ham.classList.remove('open'); ham.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }

  ham.addEventListener('click', () => mob.classList.contains('open') ? closeMob() : openMob());
  mobClose.addEventListener('click', closeMob);
  document.querySelectorAll('.mob-lnk').forEach(l => l.addEventListener('click', closeMob));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && mob.classList.contains('open')) closeMob(); });

  /* ─── PRODUCT FILTER ──────────────────────
     "All" is a curated preview (a few per category, marked data-preview="1"
     in the HTML) — not the entire 55-piece catalog. Clicking a specific
     category pill reveals every piece in that category. */
  const pills = document.querySelectorAll('.f-pill');
  const cards = document.querySelectorAll('.prod-card');

  function applyFilter(f) {
    cards.forEach(c => {
      const match = f === 'all'
        ? c.dataset.preview === '1'
        : (c.dataset.cat || '').split(' ').includes(f);
      c.classList.toggle('hide', !match);
    });
  }
  applyFilter('all'); /* initial state on page load */

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('on'));
      pill.classList.add('on');
      applyFilter(pill.dataset.f);
      const grid = document.getElementById('pgrid');
      if (grid) {
        grid.classList.remove('filter-fade');
        void grid.offsetWidth; /* restart the fade animation */
        grid.classList.add('filter-fade');
      }
    });
  });

  /* ─── SCROLL REVEAL ─────────────────────── */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.reveal, .reveal-left').forEach((el, i) => {
    if (el.closest('.prod-grid, .na-track')) {
      el.classList.add('in');
      el.style.transitionDelay = '0s';
      return;
    }
    const sibs = Array.from(el.parentElement.querySelectorAll('.reveal, .reveal-left'));
    el.style.transitionDelay = Math.min(sibs.indexOf(el) * 0.09, 0.45) + 's';
    revealObs.observe(el);
  });

  /* ─── ANNOUNCEMENT BAR ─────────────────── */
  const annBar   = document.getElementById('announce-bar');
  const annClose = document.getElementById('ann-close');
  if (annClose) annClose.addEventListener('click', () => {
    if (annBar) annBar.classList.add('hidden');
    document.body.classList.add('bar-gone');
    setTimeout(() => { if (annBar) annBar.style.display = 'none'; }, 400);
  });

  /* ─── COUNTDOWN TIMER ───────────────────── */
  (function () {
    const wrap = document.getElementById('cdWrap');
    /* The countdown is hidden by CSS — don't burn a 1s interval for nothing */
    if (!wrap || getComputedStyle(wrap).display === 'none') return;
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const hEl = document.getElementById('cdH');
    const mEl = document.getElementById('cdM');
    const sEl = document.getElementById('cdS');
    function pad(n) { return String(n).padStart(2, '0'); }
    let cdTimer;
    function tick() {
      const diff = end - Date.now();
      if (diff <= 0) {
        if (hEl) hEl.textContent = '00';
        if (mEl) mEl.textContent = '00';
        if (sEl) sEl.textContent = '00';
        clearInterval(cdTimer);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (hEl) hEl.textContent = pad(h);
      if (mEl) mEl.textContent = pad(m);
      if (sEl) sEl.textContent = pad(s);
    }
    tick();
    cdTimer = setInterval(tick, 1000);
  })();

  /* ─── BACK TO TOP ───────────────────────── */
  const btt = document.getElementById('btt');
  if (btt) {
    window.addEventListener('scroll', () => btt.classList.toggle('show', window.scrollY > 500), { passive: true });
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ─── FLOATING IG BUTTON ─────────────────── */
  const igFloat = document.getElementById('ig-float');
  if (igFloat) {
    window.addEventListener('scroll', () => igFloat.classList.toggle('show', window.scrollY > 300), { passive: true });
  }

  /* ─── HERO IMAGE FADE-IN ──────── */
  (function() {
    var heroImg = document.querySelector('.hero-img');
    if (!heroImg) return;
    var src = heroImg.getAttribute('src');
    if (!src || src === '') { heroImg.style.display = 'none'; return; }
    function showHero() { heroImg.classList.add('img-ready'); }
    if (heroImg.complete && heroImg.naturalWidth > 0) {
      showHero();
    } else {
      heroImg.addEventListener('load', showHero);
      heroImg.addEventListener('error', function() { heroImg.style.display = 'none'; });
    }
  })();

  /* ─── PRODUCT IMAGE SHIMMER + FADE-IN ──────── */
  document.querySelectorAll('.prod-photo').forEach(function (img) {
    const visual = img.closest('.prod-visual, .na-visual, .sale-visual');
    if (!img.getAttribute('src') || img.getAttribute('src') === '') {
      img.style.display = 'none';
      return;
    }
    function markReady() {
      if (visual) visual.classList.remove('img-loading');
      img.classList.add('img-ready');
    }
    /* Cached / already-decoded images fire 'load' before this listener
       attaches — same complete-check the hero uses, or they'd stay
       invisible at opacity 0. */
    if (img.complete && img.naturalWidth > 0) {
      markReady();
      return;
    }
    if (visual) visual.classList.add('img-loading');
    img.addEventListener('load', markReady);
    img.addEventListener('error', function () {
      if (visual) visual.classList.remove('img-loading');
      img.style.display = 'none';
    });
  });

  /* ─── HERO PARALLAX ─────────────────────────── */
  (function () {
    const heroArt = document.querySelector('.hero-art');
    if (!heroArt) return;
    const mq = window.matchMedia('(max-width: 991px)');
    var ticking = false;
    function onScroll() {
      if (mq.matches) { heroArt.style.transform = ''; return; }
      if (!ticking) {
        requestAnimationFrame(function () {
          heroArt.style.transform = 'translateY(' + (window.scrollY * 0.3) + 'px)';
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  /* ─── HERO MOUSE PARALLAX (desktop only) ─────── */
  /* Atmosphere layers drift a few px toward/away from the cursor with a
     slow lerp — the photo itself stays still, which reads calmer. Layers
     with their own CSS transform/animation are either driven via CSS
     custom properties (.hero-wm) or left alone (.hero-glow, animated). */
  (function () {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const hero = document.getElementById('hero');
    if (!hero) return;
    const wm = document.querySelector('.hero-wm');
    const layers = [
      { el: document.querySelector('.hero-sparkles'), f: 10 },
      { el: document.querySelector('.hero-frame'),    f: 5 },
      { el: document.querySelector('.ha-sweep'),      f: 4 }
    ].filter(function (l) { return l.el; });
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    function tick() {
      cx += (tx - cx) * 0.055;
      cy += (ty - cy) * 0.055;
      layers.forEach(function (l) {
        l.el.style.transform = 'translate3d(' + (cx * l.f).toFixed(2) + 'px,' + (cy * l.f).toFixed(2) + 'px,0)';
      });
      if (wm) {
        wm.style.setProperty('--pwx', (cx * -14).toFixed(2) + 'px');
        wm.style.setProperty('--pwy', (cy * -14).toFixed(2) + 'px');
      }
      if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }
    hero.addEventListener('mousemove', function (e) {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    hero.addEventListener('mouseleave', function () {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    });
  })();

  /* ─── CUSTOM CURSOR ──────────────────────────── */
  (function () {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var ring = document.getElementById('cursor-ring');
    if (!ring) return;
    var cx = -100, cy = -100;
    document.addEventListener('mousemove', function (e) {
      cx = e.clientX; cy = e.clientY;
      ring.style.left = cx + 'px';
      ring.style.top  = cy + 'px';
      ring.classList.add('cursor-visible');
    });
    document.addEventListener('mouseleave', function () {
      ring.classList.remove('cursor-visible');
    });
    var interactEls = document.querySelectorAll(
      'a, button, .prod-card, .na-card, .sale-card, .f-pill, .ig-cell, .c-card'
    );
    interactEls.forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('cursor-hover'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('cursor-hover'); });
    });
  })();

  /* The "All" view keeps the interleaved order the cards are written in
     (a mix of categories, not blocked by type) — no re-sort on load. */

  /* ─── CATALOG PIECE NUMBERS ──────────────────────── */
  /* data-piece goes on .prod-body — the CSS ::before reads attr() from there */
  document.querySelectorAll('#pgrid .prod-card').forEach(function(card, i) {
    const n = String(i + 1).padStart(2, '0');
    card.dataset.piece = n;
    const body = card.querySelector('.prod-body');
    if (body) body.dataset.piece = n;
  });

  /* ─── PAUSE OFF-SCREEN ANIMATIONS (perf) ─────────── */
  /* Infinite animations (orbits, marquee, glow) stop consuming GPU/CPU
     while their section is scrolled out of view */
  (function () {
    if (!('IntersectionObserver' in window)) return;
    var zones = document.querySelectorAll('#hero, .marquee-wrap, #inner-circle');
    if (!zones.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('anim-off', !entry.isIntersecting);
      });
    }, { rootMargin: '80px' });
    zones.forEach(function (z) { obs.observe(z); });
  })();

  /* ─── SCROLL PROGRESS LINE ──────────────────────── */
  (function () {
    var bar = document.getElementById('scroll-progress');
    if (!bar) return;
    var ticking = false;
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  })();

  /* ─── STATS COUNT-UP ──────────────────────── */
  /* Numbers count up once when the stats row scrolls into view.
     Non-numeric stats ("∞") are left untouched. */
  (function () {
    var nums = document.querySelectorAll('.stat-num');
    if (!nums.length || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        var el = entry.target;
        var m = /^(\d+)(.*)$/.exec(el.textContent.trim());
        if (!m) return;
        var target = parseInt(m[1], 10);
        var suffix = m[2];
        var t0 = null;
        var dur = 1400;
        function stepFn(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(stepFn);
        }
        requestAnimationFrame(stepFn);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { obs.observe(n); });
  })();
