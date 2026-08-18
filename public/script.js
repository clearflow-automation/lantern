/* Lantern — airlantern.com
   Everything here is enhancement. The page is complete without it: reveals
   only hide under html.js, the header is absolute until JS pins it, and the
   contact bar shows by default. If this file never loads, nothing is lost
   but the shine. */
(function () {
  'use strict';
  var d = document;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yr = d.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ── The lit reveal ──────────────────────────────────────────────── */
  var lifts = [].slice.call(d.querySelectorAll('.lift'));
  if (reduce || !('IntersectionObserver' in window)) {
    lifts.forEach(function (el) { el.classList.add('on'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.add('on');
        io.unobserve(el);
        el.addEventListener('transitionend', function clear() {
          el.style.transitionDelay = '';
          el.removeEventListener('transitionend', clear);
        });
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    lifts.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      io.observe(el);
    });
  }

  /* ── The sticky contact bar rises once the hero is behind you ────── */
  var bar = d.getElementById('bar');
  var hero = d.getElementById('hero');
  function onScroll() {
    if (bar) bar.classList.toggle('on', window.scrollY > (hero ? hero.offsetHeight - 72 : 420));
  }
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  /* ── The lamp across the whole page (fine pointers only) ─────────── */
  var lamp = d.querySelector('.page-lamp');
  if (lamp && !reduce && matchMedia('(pointer: fine)').matches) {
    var px = 50, py = -10, ptx = px, pty = py, praf = null;
    var pPaint = function () {
      lamp.style.setProperty('--px', px.toFixed(2) + '%');
      lamp.style.setProperty('--py', py.toFixed(2) + '%');
    };
    var pChase = function () {
      px += (ptx - px) * 0.12;
      py += (pty - py) * 0.12;
      pPaint();
      praf = (Math.abs(ptx - px) > 0.05 || Math.abs(pty - py) > 0.05)
        ? requestAnimationFrame(pChase) : null;
    };
    addEventListener('pointermove', function (e) {
      ptx = e.clientX / innerWidth * 100;
      pty = e.clientY / innerHeight * 100;
      lamp.classList.add('on');
      if (!praf) praf = requestAnimationFrame(pChase);
    }, { passive: true });
  }

  /* ── Hold the lantern ────────────────────────────────────────────── */
  /* Fine pointer: the light follows the cursor. Touch: it drifts slowly,
     like a lamp swinging, and stops when the hero leaves the viewport. */
  if (hero && !reduce) {
    var lx = 50, ly = 42, tx = lx, ty = ly, raf = null;

    var paint = function () {
      hero.style.setProperty('--lx', lx.toFixed(2) + '%');
      hero.style.setProperty('--ly', ly.toFixed(2) + '%');
    };

    if (matchMedia('(pointer: fine)').matches) {
      var chase = function () {
        lx += (tx - lx) * 0.09;
        ly += (ty - ly) * 0.09;
        paint();
        raf = (Math.abs(tx - lx) > 0.05 || Math.abs(ty - ly) > 0.05)
          ? requestAnimationFrame(chase) : null;
      };
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width * 100;
        ty = (e.clientY - r.top) / r.height * 100;
        if (!raf) raf = requestAnimationFrame(chase);
      });
    } else {
      var heroSeen = true, t0 = performance.now();
      var drift = function (now) {
        raf = null;
        if (!heroSeen) return;
        var t = (now - t0) / 1000;
        lx = 50 + 16 * Math.sin(t * 0.35);
        ly = 40 + 9 * Math.sin(t * 0.22 + 1.7);
        paint();
        raf = requestAnimationFrame(drift);
      };
      raf = requestAnimationFrame(drift);
      new IntersectionObserver(function (entries) {
        heroSeen = entries[0].isIntersecting;
        if (heroSeen && !raf) raf = requestAnimationFrame(drift);
      }).observe(hero);
    }
  }
})();
