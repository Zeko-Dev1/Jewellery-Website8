 'use strict';

  /* ─── PRELOADER ─────────────────────────── */
  (function () {
    const pl = document.getElementById('preloader');
    function hidePl() {
      pl.classList.add('pl-done');
      setTimeout(function () { if (pl.parentNode) pl.parentNode.removeChild(pl); }, 1100);
    }
    if (document.readyState === 'complete') {
      setTimeout(hidePl, 2000);
    } else {
      window.addEventListener('load', function () { setTimeout(hidePl, 2000); });
    }
  })();

  /* ─── LANGUAGE SWITCHER ─────────────────── */
  const html     = document.documentElement;
  const langBtn  = document.getElementById('langBtn');
  const langBtnM = document.getElementById('langBtnMob');
  function setLang(lang) {
    html.setAttribute('data-lang', lang);
    html.setAttribute('lang', lang);
    const label = lang === 'sq' ? 'EN' : 'SQ';
    if (langBtn)  langBtn.textContent  = label;
    if (langBtnM) langBtnM.textContent = label;
    const track = document.querySelector('.marquee-track');
    if (track) {
      track.style.animation = 'none';
      void track.offsetWidth;
      track.style.animation = '';
    }
  }
  [langBtn, langBtnM].filter(Boolean).forEach(btn => {
    btn.addEventListener('click', () => {
      setLang(html.getAttribute('data-lang') === 'sq' ? 'en' : 'sq');
    });
  });

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
  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();

  /* ─── MOBILE MENU ───────────────────────── */
  const ham      = document.getElementById('ham');
  const mob      = document.getElementById('mob');
  const mobClose = document.getElementById('mobClose');

  function openMob()  { mob.classList.add('open'); ham.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeMob() { mob.classList.remove('open'); ham.classList.remove('open'); document.body.style.overflow = ''; }

  ham.addEventListener('click', () => mob.classList.contains('open') ? closeMob() : openMob());
  mobClose.addEventListener('click', closeMob);
  document.querySelectorAll('.mob-lnk').forEach(l => l.addEventListener('click', closeMob));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && mob.classList.contains('open')) closeMob(); });

  /* ─── PRODUCT FILTER ────────────────────── */
  const pills = document.querySelectorAll('.f-pill');
  const cards = document.querySelectorAll('.prod-card');

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('on'));
      pill.classList.add('on');
      const f = pill.dataset.f;
      cards.forEach(c => {
        const match = f === 'all' || (c.dataset.cat || '').split(' ').includes(f);
        c.classList.toggle('hide', !match);
      });
      const grid = document.getElementById('pgrid');
      if (grid) grid.scrollLeft = 0;
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
    if (visual) visual.classList.add('img-loading');
    img.addEventListener('load', function () {
      if (visual) visual.classList.remove('img-loading');
      img.classList.add('img-ready');
    });
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

  /* ─── SORT PRODUCT GRID BY CATEGORY ──────────────────────── */
  (function() {
    const grid = document.getElementById('pgrid');
    if (!grid) return;
    const catOrder = ['crowns', 'necklaces', 'brooches', 'bracelets', 'watches', 'hallka', 'rings', 'earrings'];
    const sortedCards = Array.from(grid.querySelectorAll('.prod-card'));
    /* Multi-category cards ("crowns bestseller") sort by their first category,
       so the featured crown stays first in the mobile slider */
    sortedCards.sort(function(a, b) {
      const ai = catOrder.indexOf((a.dataset.cat || '').split(' ')[0]);
      const bi = catOrder.indexOf((b.dataset.cat || '').split(' ')[0]);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
    sortedCards.forEach(function(card) { grid.appendChild(card); });
  })();

  /* ─── CATALOG PIECE NUMBERS ──────────────────────── */
  /* data-piece goes on .prod-body — the CSS ::before reads attr() from there */
  document.querySelectorAll('#pgrid .prod-card').forEach(function(card, i) {
    const n = String(i + 1).padStart(2, '0');
    card.dataset.piece = n;
    const body = card.querySelector('.prod-body');
    if (body) body.dataset.piece = n;
  });
