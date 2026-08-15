document.addEventListener('DOMContentLoaded', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(hover: none)').matches;

    /* ---------- Scroll reveal (fade-in / slide-up) — with safety nets ---------- */
    const animated = document.querySelectorAll('.fade-in, .slide-up');
    const revealAll = () => animated.forEach(el => el.classList.add('visible'));
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.05, rootMargin: '0px 0px -5% 0px' });
        animated.forEach(el => io.observe(el));
        // Safety net 1: reveal anything already in view shortly after load (never blank on open).
        setTimeout(() => animated.forEach(el => {
            if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('visible');
        }), 600);
        // Safety net 2: nothing stays hidden — reveal everything after the page settles.
        window.addEventListener('load', () => setTimeout(revealAll, 2600));
    } else {
        revealAll(); // no IntersectionObserver support → just show everything
    }

    /* ---------- Count-up numbers ---------- */
    const counters = document.querySelectorAll('.count-up');
    const countIO = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseFloat(el.dataset.target);
            const suffix = el.dataset.suffix || '';
            if (reduceMotion) { el.textContent = target + suffix; obs.unobserve(el); return; }
            const duration = 1100;
            const start = performance.now();
            const tick = (now) => {
                const p = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(target * eased) + suffix;
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            obs.unobserve(el);
        });
    }, { threshold: 0.6 });
    counters.forEach(el => countIO.observe(el));

    /* ---------- 3D tilt on cards / phone ---------- */
    if (!reduceMotion && !isTouch) {
        const MAX = 8; // degrees
        document.querySelectorAll('[data-tilt]').forEach(el => {
            let raf = null;
            const onMove = (e) => {
                const r = el.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                if (raf) cancelAnimationFrame(raf);
                raf = requestAnimationFrame(() => {
                    el.style.transform =
                        `perspective(900px) rotateX(${(-py * MAX).toFixed(2)}deg) rotateY(${(px * MAX).toFixed(2)}deg) translateY(-4px)`;
                });
            };
            const reset = () => {
                if (raf) cancelAnimationFrame(raf);
                el.style.transform = '';
            };
            el.addEventListener('mousemove', onMove);
            el.addEventListener('mouseleave', reset);
        });
    }

    /* ---------- Hero lantern glow follows the pointer ---------- */
    const hero = document.querySelector('.hero');
    const glow = document.querySelector('.hero-glow');
    if (hero && glow && !reduceMotion && !isTouch) {
        let raf = null;
        hero.addEventListener('mousemove', (e) => {
            const r = hero.getBoundingClientRect();
            const x = e.clientX - r.left, y = e.clientY - r.top;
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                glow.style.left = x + 'px';
                glow.style.top = y + 'px';
            });
        });
    }

    /* ---------- FAQ accordion ---------- */
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            const answer = btn.nextElementSibling;
            btn.setAttribute('aria-expanded', String(!expanded));
            if (answer) answer.hidden = expanded;
        });
    });

    /* ---------- Mobile nav toggle ---------- */
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            const open = navLinks.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', String(open));
        });
        navLinks.querySelectorAll('a').forEach(a =>
            a.addEventListener('click', () => {
                navLinks.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
            })
        );
    }

    /* ---------- Contact form via Web3Forms ---------- */
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const original = btn.textContent;
            btn.textContent = 'Sending...';
            btn.disabled = true;
            try {
                const res = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(Object.fromEntries(new FormData(form)))
                });
                const data = await res.json();
                btn.textContent = data.success ? 'Got it — we’ll be in touch ✓' : 'Something went wrong — try WhatsApp';
                if (data.success) form.reset();
            } catch (err) {
                btn.textContent = 'Network error — try WhatsApp';
            }
            btn.disabled = false;
            setTimeout(() => { btn.textContent = original; }, 3500);
        });
    }
});

/* ==========================================================================
   THE LANTERN LAYER
   ========================================================================== */
(function () {
    'use strict';
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* --- carried-lantern glow: the owned motif --------------------------- */
    document.querySelectorAll('.lit').forEach(function (sec) {
        if (window.innerWidth < 900) return;
        sec.addEventListener('mousemove', function (e) {
            var r = sec.getBoundingClientRect();
            sec.style.setProperty('--lx', ((e.clientX - r.left) / r.width * 100) + '%');
            sec.style.setProperty('--ly', ((e.clientY - r.top) / r.height * 100) + '%');
            sec.classList.add('awake');
        });
        sec.addEventListener('mouseleave', function () { sec.classList.remove('awake'); });
    });

    /* --- signature moment: the search that finds nothing ------------------ */
    var serp = document.getElementById('serp');
    if (!serp) return;
    var qEl = document.getElementById('serpQ');
    var body = document.getElementById('serpBody');
    var QUERY = 'boutique in sector 31 gurgaon';

    function row(o) {
        return '<div class="serp-row' + (o.you ? ' serp-you' : '') + '">' +
            '<div class="serp-fav">' + o.fav + '</div><div>' +
            '<div class="serp-t">' + o.title + (o.you ? '<span class="serp-chip">Your website</span>' : '') + '</div>' +
            '<div class="serp-u">' + o.url + '</div>' +
            '<div class="serp-d">' + o.desc + '</div></div></div>';
    }

    var LISTING = { fav: 'JD', title: 'Top 10 Boutiques in Sector 31, Gurgaon', url: 'justdial.com › gurgaon › boutiques',
        desc: 'A directory listing with your phone number, buried among forty others.' };
    var RIVAL_A = { fav: 'B', title: 'Designer &amp; Bridal Wear — Sector 29', url: 'aboutique.in',
        desc: 'Photos, prices, WhatsApp button. Open 10am–8pm. 4.6★' };
    var RIVAL_B = { fav: 'S', title: 'Custom Tailoring Studio, Gurugram', url: 'anotherboutique.co.in',
        desc: 'Lookbook, made-to-measure enquiry form, directions.' };
    var YOU = { fav: 'Y', you: true, title: 'Your Boutique — Bridal &amp; Ethnic Wear, Sector 31', url: 'yourboutique.in',
        desc: 'Your photos, your prices, your 4.8★ reviews — and one tap to WhatsApp you.' };

    var BEFORE = row(LISTING) + row(RIVAL_A) + row(RIVAL_B) +
        '<div class="serp-miss"><strong>Your shop isn&#8217;t here.</strong>' +
        '<p>Same street. Better reviews. But nothing for Google to show, so they scroll past you.</p></div>';
    var AFTER = row(YOU) + row(LISTING) + row(RIVAL_A);

    var state = 'before';
    function paint(next) {
        state = next;
        body.style.opacity = 0;
        setTimeout(function () {
            body.innerHTML = (state === 'before') ? BEFORE : AFTER;
            body.style.opacity = 1;
        }, reduced ? 0 : 190);
    }
    body.style.transition = 'opacity .19s ease';

    document.querySelectorAll('.serp-toggle button').forEach(function (b) {
        b.addEventListener('click', function () {
            document.querySelectorAll('.serp-toggle button').forEach(function (x) { x.classList.remove('on'); });
            b.classList.add('on');
            paint(b.dataset.state);
        });
    });

    /* type the query once, when it scrolls into view */
    var typed = false;
    new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) {
            if (!en.isIntersecting || typed) return;
            typed = true; obs.disconnect();
            if (reduced) { qEl.textContent = QUERY; serp.classList.add('done'); paint('before'); return; }
            var i = 0;
            (function tick() {
                qEl.textContent = QUERY.slice(0, ++i);
                if (i < QUERY.length) return setTimeout(tick, 45);
                serp.classList.add('done');
                setTimeout(function () { paint('before'); }, 260);
            })();
        });
    }, { threshold: 0.35 }).observe(serp);
})();

/* --- contact form -> WhatsApp composer (no backend, nothing to break) ----- */
(function () {
    'use strict';
    var f = document.getElementById('contactForm');
    if (!f) return;
    f.removeAttribute('action'); f.removeAttribute('method');
    f.addEventListener('submit', function (e) {
        e.preventDefault();
        function v(n) { var el = f.querySelector('[name="' + n + '"]'); return el && el.value.trim(); }
        var lines = ['Hi Lantern, I saw your website.'];
        if (v('name')) lines.push('Name: ' + v('name'));
        if (v('business')) lines.push('Business: ' + v('business'));
        if (v('business_type')) lines.push('Type: ' + v('business_type'));
        if (v('area')) lines.push('Area: ' + v('area'));
        if (v('phone')) lines.push('Phone: ' + v('phone'));
        lines.push('', 'I would like to talk about a website.');
        window.open('https://wa.me/919711105497?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
})();
