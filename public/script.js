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
