/* Hótel Lækur · „Eitt kvöld"
   A Mirror House transplant. One master ScrollTrigger lerps the ground from day
   to night and writes three CSS vars on :root; every section inherits. ONE
   writer, never per-element.

   Lenis is DESKTOP ONLY: smooth touch stops iOS Safari minimising its own
   chrome and wrecks momentum.

   Every resting state in the CSS is the VISIBLE one, so no-JS and reduced-motion
   render the whole document; JS only arms the hidden start states. */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);

  root.classList.add('js');

  /* ---------- the ground -----------------------------------------------
     Three-pole where Mirror House is two: their own sunset earns a warm step
     that an ice-to-basalt arc did not have. */
  /* The ground holds day until the film starts, turns THROUGH the film in
     lockstep with the sky being scrubbed, and is fully night the moment the
     scrub completes. The arc below is expressed in FILM-RELATIVE time, and the
     film's own span is MEASURED off the section each time the layout settles.
     Hard-coded document fractions were desktop-only by construction: the phone
     lays the page out at a different height, so the sky and the ground turned
     at different moments there. Nothing to re-measure by hand now. */
  var ARC = [
    { t: 0.000, c: '#F4F1E8', ink: '#2A2E22', soft: '#E7E2D4' },
    { t: 0.313, c: '#EADAC2', ink: '#2A2418', soft: '#DCC9AE' },
    { t: 0.590, c: '#A8714E', ink: '#F6EFE4', soft: '#8E5C3E' },
    { t: 0.819, c: '#3E3242', ink: '#F1ECE2', soft: '#4A3C4E' },
    { t: 1.000, c: '#0D191E', ink: '#EDEAE0', soft: '#16242B' },
  ];
  var STOPS = [];
  function filmSpan() {
    var sec = document.querySelector('.film');
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (!sec || max <= 0) return null;
    var top = sec.getBoundingClientRect().top + window.pageYOffset;
    /* the pin is sticky, so the scrub ends one viewport before the section does */
    var end = top + sec.offsetHeight - window.innerHeight;
    if (end <= top) return null;
    return { a: Math.max(0, Math.min(1, top / max)), b: Math.max(0, Math.min(1, end / max)) };
  }
  function buildStops() {
    var sp = filmSpan() || { a: 0.45, b: 0.594 };
    STOPS = [{ at: 0, c: ARC[0].c, ink: ARC[0].ink, soft: ARC[0].soft }];
    for (var i = 0; i < ARC.length; i++) {
      STOPS.push({ at: sp.a + (sp.b - sp.a) * ARC[i].t, c: ARC[i].c, ink: ARC[i].ink, soft: ARC[i].soft });
    }
    var last = ARC[ARC.length - 1];
    STOPS.push({ at: 1, c: last.c, ink: last.ink, soft: last.soft });
  }
  buildStops();

  var hex2rgb = function (h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); };
  var mixHex = function (a, b, t) {
    var A = hex2rgb(a), B = hex2rgb(b);
    return 'rgb(' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); }).join(',') + ')';
  };
  function paletteAt(p) {
    var i = 0;
    while (i < STOPS.length - 2 && p > STOPS[i + 1].at) i++;
    var a = STOPS[i], b = STOPS[i + 1];
    var t = Math.max(0, Math.min(1, (p - a.at) / ((b.at - a.at) || 1)));
    return { c: mixHex(a.c, b.c, t), ink: mixHex(a.ink, b.ink, t), soft: mixHex(a.soft, b.soft, t) };
  }
  var lastC = '', lastInk = '', lastSoft = '', lastNight = null;
  /* THE STATUS STRIP HAS ONE WRITER.
     While the hero photograph fills the screen the strip must be the
     photograph's own dark sky, not the ground the page has not reached yet.
     Driving it from the ground alone is what made the top of the page white
     over a night-time hero. Safari 26 ignores theme-color entirely and samples
     .tintplate's background-color instead, so both are set from here and kept
     in step; other browsers use the meta. */
  var HERO_STRIP = '#12202A';
  var lastStrip = '';
  function paintStrip() {
    var c = body.classList.contains('at-hero') ? HERO_STRIP : (lastNight ? '#0D191E' : '#F4F1E8');
    if (c === lastStrip) return;
    lastStrip = c;
    var meta = document.getElementById('themeColor');
    if (meta) meta.setAttribute('content', c);
  }
  function writeGround(p) {
    var g = paletteAt(p);
    if (g.c !== lastC) { root.style.setProperty('--lk-c', g.c); lastC = g.c; }
    if (g.ink !== lastInk) { root.style.setProperty('--lk-ink', g.ink); lastInk = g.ink; }
    if (g.soft !== lastSoft) { root.style.setProperty('--lk-soft', g.soft); lastSoft = g.soft; }
    /* derive "is it night" from the canvas itself rather than a hard-coded
       progress number, so retuning STOPS can never desync the two */
    var rgb = g.c.match(/\d+/g);
    var night = rgb && (+rgb[0] * 0.299 + +rgb[1] * 0.587 + +rgb[2] * 0.114) < 110;
    if (night !== lastNight) {
      lastNight = night;
      body.dataset.ground = night ? 'night' : 'day';
      root.style.colorScheme = night ? 'dark' : 'light';
      paintStrip();
    }
  }

  /* ---------- the six rooms, from one table -----------------------------
     Sizes and occupancies from the hotel's own booking page. Rates read from
     their Booking availability table on 2026-08-27 (2 nights, June 2027,
     breakfast and 11% VAT included), divided to a per-night figure. Only three
     of the six had a live rate that night; the rest say so rather than guess. */
  var ROOMS = [
    { n: 'Single Room', size: '12 m²', sleeps: '1 guest', rate: null,
      img: 'room-attic', alt: 'A single room with a window onto the field',
      copy: 'The smallest room in the house, with its own entrance and its own bathroom, a kettle with coffee and tea, and a window that faces the weather.' },
    { n: 'Double Room', size: '18 m²', sleeps: '2 guests', rate: null,
      img: 'room-double', alt: 'A double room with a made bed and a reading lamp',
      copy: 'A double bed, wooden floors, a private bathroom and a private entrance. The hot tub and the sauna are a short walk across the yard and cost nothing.' },
    { n: 'Triple Room', size: '21 m²', sleeps: '3 guests', rate: null,
      img: 'room-twin', alt: 'A triple room with three beds under a sloped ceiling',
      copy: 'Three beds without bunks, which is rarer here than it should be. Good for friends travelling together or a family with one child.' },
    { n: 'Quadruple Room', size: '27 m²', sleeps: '4 guests', rate: 68964,
      img: 'room-lounge', alt: 'A larger room with four beds and a seating corner',
      copy: 'A double bed and two singles with room left over to sit down, which matters when four people are drying out after a day on the south coast.' },
    { n: 'Junior Cottage Suite', size: '32 m²', sleeps: '4 guests', rate: 80706,
      img: 'room-suite', alt: 'The junior cottage suite with a terrace and a river view',
      copy: 'A suite in the cottage row with a terrace of its own and the brook in front of it. A large double bed, a sofa bed in the living room, and the view the hotel is named after.' },
    { n: 'Cottage Suite', size: '50 m²', sleeps: '6 guests', rate: 89564,
      img: 'terrace', alt: 'The cottage suite, with its own entrance onto the deck',
      copy: 'The largest of them. Two bedrooms and a sofa bed in the living room, fifty square metres, its own deck, and the water running past the end of it.' },
  ];
  /* formatted by hand: toLocaleString('is-IS') falls back to a comma separator
     wherever that locale data is absent, which is wrong in Icelandic */
  var isk = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
  (function buildRooms() {
    var host = document.getElementById('roomlist');
    if (!host) return;
    /* KOBU's hotel index: offset cards rather than a flat table, so six rooms
       read as a row of places instead of a price list. Every room shows its
       own photograph; the rate sits on the name's baseline. */
    host.innerHTML = ROOMS.map(function (r, i) {
      var rate = r.rate
        ? '<span class="rc_rate fig">' + isk(r.rate) + ' kr.<em>/night</em></span>'
        : '<span class="rc_rate fig"><em>on request</em></span>';
      return '' +
      '<article class="rc' + (i % 2 ? ' rc--low' : '') + '">' +
        '<figure class="frame rc_fig"><img src="assets/img/' + r.img + '.webp" srcset="assets/img/' + r.img + '-sm.webp 1000w, assets/img/' + r.img + '.webp 2000w" sizes="(max-width:860px) 100vw, 44vw" alt="' + r.alt + '" loading="lazy"></figure>' +
        '<div class="rc_row"><h3 class="rc_name">' + r.n + '</h3>' + rate + '</div>' +
        '<p class="rc_spec fig">' + r.size + ' · sleeps ' + parseInt(r.sleeps, 10) + '</p>' +
        '<p class="rc_copy">' + r.copy + '</p>' +
      '</article>';
    }).join('');
  })();

  /* While the hero photograph fills the screen the difference blend carries the
     bar on its own, so the veil and the sampler plate follow the photograph
     rather than the day ground the page has not reached yet. */
  function syncHero() {
    body.classList.toggle('at-hero', window.scrollY < window.innerHeight * 0.72);
    paintStrip();
  }
  syncHero();
  window.addEventListener('scroll', syncHero, { passive: true });

  /* ---------- off-canvas ---------- */
  var burger = document.getElementById('burger');
  var panel = document.getElementById('panel');
  var lenis = null, lockY = 0, navOpen = false;
  function lock() {
    if (lenis) { lenis.stop(); return; }
    lockY = window.scrollY;
    body.style.position = 'fixed'; body.style.top = -lockY + 'px';
    body.style.left = '0'; body.style.right = '0'; body.style.width = '100%';
  }
  function unlock() {
    if (lenis) { lenis.start(); return; }
    body.style.position = ''; body.style.top = '';
    body.style.left = ''; body.style.right = ''; body.style.width = '';
    window.scrollTo(0, lockY);
  }
  function toggleNav(next) {
    navOpen = next;
    body.classList.toggle('nav-open', navOpen);
    panel.setAttribute('aria-hidden', navOpen ? 'false' : 'true');
    burger.setAttribute('aria-expanded', navOpen ? 'true' : 'false');
    navOpen ? lock() : unlock();
  }
  if (burger && panel) {
    burger.addEventListener('click', function () { toggleNav(!navOpen); });
    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { if (navOpen) toggleNav(false); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && navOpen) toggleNav(false); });
  }

  /* ---------- THE BOOKING PANEL -----------------------------------------
     Ours, not Godo's. The choosing happens in the page's own language; Godo
     still takes the reservation.

     GODO INTEGRATION, and what is real vs what needs their confirmation:
     - The property is propid 70825 on property.godo.is (read off the embed on
       their live site, 2026-08-27). That number is verified.
     - The parameter NAMES Godo expects for a prefilled arrival, departure and
       occupancy are NOT published and were not testable from outside, so they
       are declared once here rather than scattered through the code. Confirm
       them with Godo (or from a booking made on the live widget with the network
       tab open) and change this object only.
     - Until they are confirmed the hand-off still works: it opens the property's
       own booking page, which is exactly what their site does today, except the
       guest arrives having already chosen. Nothing here invents a rate or a
       confirmation; the panel never claims a booking is made. */
  var GODO = {
    base: 'https://property.godo.is/booking2.php',
    propid: '70825',
    params: { checkin: 'checkin', checkout: 'checkout', guests: 'adults', room: 'roomtype' },
  };

  (function bookingPanel() {
    var form = document.getElementById('bkForm');
    if (!form) return;
    var $ = function (id) { return document.getElementById(id); };
    var IN = $('bkIn'), OUT = $('bkOut'), G = $('bkGuests'), CAP = $('bkCap');
    var BOX = $('bkOutBox'), T = $('bkSumTitle'), N = $('bkSumNote');
    var PN = $('bkPrice'), PS = $('bkPriceSub'), ERR = $('bkErr');

    /* the three rooms with a rate we actually read, plus the three without */
    var PICKS = ROOMS.map(function (r, i) { return { i: i, n: r.n, size: r.size, cap: parseInt(r.sleeps, 10), rate: r.rate }; });
    var OFFER = PICKS.filter(function (r) { return r.rate; });

    $('bkPills').innerHTML = OFFER.map(function (r, i) {
      return '<label class="bk_pill"><input type="radio" name="bkroom" value="' + r.i + '" data-cap="' + r.cap + '" data-rate="' + r.rate + '"' + (i === 0 ? ' checked' : '') + '>' +
        '<span><b>' + r.n + '</b><em>' + r.size + ' · sleeps ' + r.cap + '</em>' +
        '<i>' + isk(r.rate) + ' kr.</i></span></label>';
    }).join('');

    function isoDay(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    var today = isoDay(new Date());
    IN.min = today; OUT.min = today;

    function picked() { return form.querySelector('input[name="bkroom"]:checked'); }
    function nights() {
      if (!IN.value || !OUT.value) return 0;
      var ms = new Date(OUT.value + 'T00:00:00') - new Date(IN.value + 'T00:00:00');
      return ms > 0 ? Math.round(ms / 86400000) : 0;
    }
    function syncRoom() {
      var r = picked(); if (!r) return;
      var cap = parseInt(r.getAttribute('data-cap'), 10);
      G.max = cap; CAP.textContent = 'up to ' + cap;
      if (parseInt(G.value, 10) > cap) G.value = cap;
    }
    function syncDates() {
      if (!IN.value) { OUT.min = today; return; }
      var nx = new Date(IN.value + 'T00:00:00'); nx.setDate(nx.getDate() + 1);
      var min = isoDay(nx);
      OUT.min = min;
      if (OUT.value && OUT.value < min) OUT.value = '';
    }
    function syncOut() {
      var r = picked(), n = nights();
      if (!r || !n) { BOX.hidden = true; return; }
      var rate = parseInt(r.getAttribute('data-rate'), 10);
      var gross = rate * n;
      var net = Math.round(gross * 0.83);
      BOX.hidden = false;
      T.textContent = n + (n === 1 ? ' night' : ' nights') + ' in the ' + PICKS[+r.value].n;
      N.textContent = 'Breakfast, 11% VAT and the lodging tax are already in this figure. Godo confirms the final price.';
      PN.textContent = isk(net) + ' kr.';
      PS.textContent = 'with bookdirect, from ' + isk(gross);
    }
    function sync() { syncRoom(); syncDates(); syncOut(); }

    form.querySelectorAll('input[name="bkroom"]').forEach(function (r) {
      r.addEventListener('change', function () { syncRoom(); syncOut(); });
    });
    IN.addEventListener('change', function () { syncDates(); syncOut(); ERR.hidden = true; });
    OUT.addEventListener('change', function () { syncOut(); ERR.hidden = true; });
    G.addEventListener('input', function () { ERR.hidden = true; });
    sync();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var r = picked(), n = nights();
      var cap = r ? parseInt(r.getAttribute('data-cap'), 10) : 0;
      var g = parseInt(G.value, 10);
      if (!IN.value || !OUT.value) { ERR.textContent = 'Pick an arrival and a departure.'; ERR.hidden = false; (IN.value ? OUT : IN).focus(); return; }
      if (!n) { ERR.textContent = 'Departure has to be after arrival.'; ERR.hidden = false; OUT.focus(); return; }
      if (!(g >= 1 && g <= cap)) { ERR.textContent = 'That room sleeps ' + cap + '. Pick a larger one, or fewer guests.'; ERR.hidden = false; G.focus(); return; }
      ERR.hidden = true;
      var u = new URL(GODO.base);
      u.searchParams.set('propid', GODO.propid);
      u.searchParams.set(GODO.params.checkin, IN.value);
      u.searchParams.set(GODO.params.checkout, OUT.value);
      u.searchParams.set(GODO.params.guests, String(g));
      window.open(u.toString(), '_blank', 'noopener');
    });
  })();

  /* ---------- the film's frames ----------------------------------------
     Pre-decoded and drawn to a canvas, NEVER a scrubbed <video>: measured on
     the Mirror House clip, only ~104 of 241 frames ever reached the screen.
     Sequential load so early frames land first and the nearest-loaded fallback
     always has something to paint. */
  var FRAMES = 121;
  var small = window.innerWidth < 768;
  var frameSrc = function (i) {
    return 'assets/film/' + (small ? 'frames-828' : 'frames') + '/f' + String(i + 1).padStart(3, '0') + '.jpg';
  };
  var shots = new Array(FRAMES).fill(null);
  var started = false, loadedCount = 0;
  function loadFrames() {
    if (started) return;
    started = true;
    /* Order matters more than speed here. Loading 1,2,3… means a phone that has
       fetched a third of the sequence can only scrub the first third and then
       freezes; the nearest-loaded fallback has nothing ahead of it. Coarse-to-
       fine passes (every 8th, then 4th, 2nd, all) mean partial coverage always
       spans the whole film and simply gets smoother as the rest lands. */
    var order = [], seen = {};
    for (var stride = 8; stride >= 1; stride = stride >> 1) {
      for (var i = 0; i < FRAMES; i += stride) { if (!seen[i]) { seen[i] = 1; order.push(i); } }
    }
    var next = 0;
    var step = function () {
      if (next >= order.length) return;
      var idx = order[next++];
      var im = new Image();
      im.decoding = 'async';
      im.onload = function () { shots[idx] = im; loadedCount++; step(); };
      im.onerror = step;
      im.src = frameSrc(idx);
    };
    /* four in flight: enough to fill quickly, few enough not to stall the page */
    step(); step(); step(); step();
  }

  /* ---------- the loader ------------------------------------------------
     The seam draws down the middle while the page loads, then the two halves
     part along it. The wordmark then opens out of its own rule in the same
     gesture, so the loading element rehearses the signature rather than being
     a bar that fades. */
  function finishLoad() {
    body.classList.add('loaded');
    body.classList.remove('is-loading');
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    document.dispatchEvent(new CustomEvent('lk:revealed'));
  }

  (function runLoader() {
    var seam = document.getElementById('loaderSeam');
    var place = document.getElementById('loaderPlace');
    var halves = document.querySelectorAll('.loader_half');
    var done = false;
    var finish = function () { if (done) return; done = true; finishLoad(); };

    /* no GSAP or reduced motion: no curtain at all, the page is simply there */
    if (reduced || !hasGSAP || !seam) {
      var el = document.getElementById('loader');
      if (el) el.style.display = 'none';
      finish();
      return;
    }

    var state = { p: 0 };
    gsap.timeline({
      onComplete: function () {
        /* The screen parts along the seam, and then the seam does not fade: it
           SHRINKS onto the wordmark's own rule, which sits at the exact
           horizontal centre because .wm_row is a 1fr/auto/1fr grid. The line
           the page opened along becomes the line the words open out of. */
        var rule = document.getElementById('wmRule');
        var H = window.innerHeight;
        var box = rule ? rule.getBoundingClientRect() : null;
        var tl = gsap.timeline({ onComplete: finish });
        tl.to(place, { opacity: 0, duration: .3, ease: 'power2.in' }, 0)
          .to(halves[0], { xPercent: -100, duration: 1.1, ease: 'expo.inOut' }, .08)
          .to(halves[1], { xPercent: 100, duration: 1.1, ease: 'expo.inOut' }, .08);
        if (box && box.height > 4) {
          /* transform-origin is the top, so scaling then translating by the
             rule's top lands the seam exactly on it */
          tl.to(seam, { scaleY: box.height / H, y: box.top, duration: .95, ease: 'expo.inOut' }, .45);
        } else {
          tl.to(seam, { opacity: 0, duration: .4 }, .5);
        }
      },
    })
      .to(seam, { scaleY: 1, duration: 1.15, ease: 'power2.inOut' }, 0)
      .to(place, { opacity: .55, duration: .7, ease: 'power2.out' }, .25);

    /* never let a slow asset hold the page hostage */
    gsap.delayedCall(3.2, finish);
  })();

  loadFrames();

  /* ---------- no GSAP or reduced motion: static, but still themed ---------- */
  if (reduced || !hasGSAP) {
    writeGround(0);
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.lines, .rev').forEach(function (el) { io.observe(el); });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  if (!isTouch) {
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    /* exposed so a headless harness can position the page exactly: driving the
       wheel and waiting lets Lenis coast on and every measurement lands late */
    window.__lenis = lenis;
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  }
  gsap.ticker.lagSmoothing(0);

  /* ---------- THE GROUND: one master trigger, one writer ---------- */
  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: function (self) { writeGround(self.progress); },
    onRefresh: function (self) { buildStops(); writeGround(self.progress); },
  });
  writeGround(0);

  /* ---------- THE SEAM REVEAL ------------------------------------------
     A 1px rule stands where the words meet, draws itself, then Hótel opens
     leftward out of it and Lækur rightward. clip-path plus a small outward x,
     so the words feel pushed out rather than merely uncovered. */
  (function seam() {
    var L = document.getElementById('wmL'), R = document.getElementById('wmR'), rule = document.getElementById('wmRule');
    if (!L || !R || !rule) return;
    gsap.set(rule, { scaleY: 0 });
    gsap.set(L, { clipPath: 'inset(0% 0% 0% 100%)', x: 26 });
    gsap.set(R, { clipPath: 'inset(0% 100% 0% 0%)', x: -26 });
    gsap.set(['.hero_sub', '.hero_meta'], { opacity: 0, y: 18 });
    document.addEventListener('lk:revealed', function () {
      /* the loader's seam has already landed on this exact box, so the real
         rule simply takes over in the same frame: no draw, no flicker */
      var loaderSeam = document.getElementById('loaderSeam');
      gsap.set(rule, { scaleY: 1 });
      if (loaderSeam) gsap.set(loaderSeam, { opacity: 0 });
      gsap.timeline()
        .to(L, { clipPath: 'inset(0% 0% 0% 0%)', x: 0, duration: 1.5, ease: 'expo.out' }, .12)
        .to(R, { clipPath: 'inset(0% 0% 0% 0%)', x: 0, duration: 1.5, ease: 'expo.out' }, '<')
        .to(['.hero_sub', '.hero_meta'], { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: .1 }, '-=0.85');
    }, { once: true });
    /* scroll keeps parting them, and the rule outlives the words */
    gsap.to(L, { xPercent: -9, opacity: .1, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 } });
    gsap.to(R, { xPercent: 9, opacity: .1, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 } });
    gsap.to(rule, { scaleY: 3.2, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 } });
  })();

  /* ---------- hero photograph: ambient only, never scroll-jacked ---------- */
  gsap.to('.hero_media img', {
    yPercent: 8, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  /* ---------- reveals ------------------------------------------------
     The hidden state is armed ONLY for elements that start below the fold, and
     every trigger carries an onRefresh guard that shows anything the scroller
     has already passed. A reveal must never be able to leave content invisible:
     that is the failure mode of a scroll library eating a programmatic jump. */
  function arm(el, dy) {
    var below = el.getBoundingClientRect().top > window.innerHeight * 0.92;
    if (!below) { gsap.set(el, { opacity: 1, y: 0 }); return; }
    gsap.set(el, { opacity: 0, y: dy });
    var show = function () { gsap.to(el, { opacity: 1, y: 0, duration: .95, ease: 'power3.out', overwrite: 'auto' }); };
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true, onEnter: show,
      onRefresh: function (self) { if (self.progress > 0) show(); },
    });
  }
  gsap.utils.toArray('.lines').forEach(function (el) { arm(el, 26); });
  gsap.utils.toArray('.copy, .facts, .scores, .around_list, .roomlist, .table_strip, .bk').forEach(function (el) { arm(el, 18); });
  /* last resort: if anything is still hidden once everything has settled, show it */
  window.addEventListener('load', function () {
    setTimeout(function () {
      document.querySelectorAll('.lines, .copy, .facts, .scores, .around_list, .roomlist, .table_strip, .bk').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && parseFloat(getComputedStyle(el).opacity) < 0.05) gsap.set(el, { opacity: 1, y: 0 });
      });
      ScrollTrigger.refresh();
    }, 600);
  });

  /* ---------- frames drift while on screen ---------- */
  gsap.utils.toArray('.frame').forEach(function (f) {
    var im = f.querySelector('img');
    if (!im) return;
    gsap.fromTo(im, { scale: 1.075, yPercent: -2 },
      { scale: 1, yPercent: 2, ease: 'none',
        scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------- THE FILM -------------------------------------------------- */
  (function film() {
    var canvas = document.getElementById('filmCanvas');
    var section = document.querySelector('.film');
    var phase = document.getElementById('filmPhase');
    if (!canvas || !section) return;

    /* alpha:true on purpose: an opaque context paints black before the first
       frame lands, which reads as a broken section */
    var ctx = canvas.getContext('2d', { alpha: true });
    var painted = -1;

    function size() {
      if (!canvas.clientWidth || !canvas.clientHeight) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      if (painted >= 0) draw(painted, true);
    }
    function blit(img) {
      var cw = canvas.width, ch = canvas.height;
      var s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      var w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    }
    function draw(i, force) {
      if (!canvas.width) return;
      if (i === painted && !force) return;
      var img = shots[i];
      if (!img) {
        /* fall back to the nearest frame actually held, so a partial load still
           animates instead of freezing on frame one */
        for (var d = 1; d < FRAMES; d++) {
          if (shots[i - d]) { img = shots[i - d]; break; }
          if (shots[i + d]) { img = shots[i + d]; break; }
        }
      }
      if (!img) return;
      blit(img);
      painted = i;
      canvas.dataset.frame = String(i);
      if (!body.classList.contains('film-live')) body.classList.add('film-live');
    }

    var PHASES = [[0, 'Kvöld'], [0.45, 'Rökkur'], [0.78, 'Nótt']];
    var lastPhase = '';
    function setPhase(p) {
      var word = PHASES[0][1];
      for (var i = 0; i < PHASES.length; i++) if (p >= PHASES[i][0]) word = PHASES[i][1];
      if (word !== lastPhase && phase) {
        lastPhase = word;
        /* cross-fade the word rather than swapping it mid-frame */
        phase.classList.add('is-turning');
        setTimeout(function () { phase.textContent = word; phase.classList.remove('is-turning'); }, 200);
      }
    }

    size();
    window.addEventListener('resize', size, { passive: true });

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: function (self) {
        draw(Math.min(FRAMES - 1, Math.round(self.progress * (FRAMES - 1))));
        setPhase(self.progress);
      },
      onRefresh: function () { size(); },
    });
  })();


  /* TEMPORARY ?diag=1 read-out — real WebKit will not let me attach a console,
     so the page reports its own state on screen. Removed before hand-off. */
  if (location.search.indexOf('diag=1') >= 0) {
    setTimeout(function () {
      var q = function (sel) {
        var e = document.querySelector(sel); if (!e) return sel + ':MISSING';
        var r = e.getBoundingClientRect(), c = getComputedStyle(e);
        return sel + ' op=' + c.opacity + ' clip=' + (c.clipPath || '-').slice(0, 26) +
               ' tf=' + (c.transform || '-').slice(0, 30) + ' h=' + Math.round(r.height) +
               ' t=' + Math.round(r.top) + ' bl=' + c.mixBlendMode;
      };
      var d = document.createElement('div');
      d.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#000;color:#0f0;font:10px/1.35 monospace;padding:6px;white-space:pre-wrap';
      d.textContent = [
        'body=' + document.body.className,
        'bodyBg=' + getComputedStyle(document.body).backgroundColor,
        q('#wmL'), q('#wmR'), q('#wmRule'), q('.hero_sub'), q('.hero_meta'),
        q('#loader'), q('.loader_half--l'), q('#loaderSeam'),
        'gsap=' + (!!window.gsap) + ' ST=' + (!!window.ScrollTrigger) + ' touch=' + window.matchMedia('(hover: none) and (pointer: coarse)').matches,
        'canvas=' + (function () { var c = document.getElementById('filmCanvas'); return c ? c.width + 'x' + c.height + ' f=' + c.dataset.frame : 'none'; })(),
      ].join('\n');
      document.body.appendChild(d);
    }, 6000);
  }

})();
