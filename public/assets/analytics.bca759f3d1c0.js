/* Business-site measurement. No form values or arbitrary URL parameters are sent. */
(() => {
  'use strict';
  if (location.hostname !== 'airlantern.com' && location.hostname !== 'www.airlantern.com') return;
  const cleanURL = value => {
    try { const u = new URL(value); return u.origin + u.pathname; } catch { return ''; }
  };
  const params = new URLSearchParams(location.search);
  const campaign = {};
  for (const [input, output] of [['utm_source','campaign_source'],['utm_medium','campaign_medium'],['utm_campaign','campaign_name'],['utm_content','campaign_content']]) {
    const label = params.get(input);
    if (label && /^[a-zA-Z0-9_-]{1,80}$/.test(label)) campaign[output] = label;
  }
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'G-M5F1E5D72D', {
    page_location: location.origin + location.pathname,
    page_referrer: cleanURL(document.referrer),
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_flags: 'SameSite=Lax;Secure',
    ...campaign
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-M5F1E5D72D';
  document.head.append(script);
  const send = (name, values = {}) => window.gtag('event', name, {page_location:location.origin+location.pathname, page_path:location.pathname, ...campaign, ...values});
  document.querySelectorAll('a[href*="calendar.google.com/calendar"]').forEach(a => a.addEventListener('click', () => send('book_call_click', {cta_location:a.dataset.ctaLocation || 'website'})));
  document.querySelectorAll('a[href^="mailto:"]').forEach(a => a.addEventListener('click', () => send('email_click', {cta_location:a.dataset.ctaLocation || 'website'})));
  document.querySelectorAll('video').forEach(video => {
    const milestones = new Set();
    video.addEventListener('play', () => {if (!milestones.has(0)) { milestones.add(0); send('video_start', {video_name:'lantern_business_film'}); }});
    video.addEventListener('timeupdate', () => {
      if (!Number.isFinite(video.duration)) return;
      for (const percent of [25,50,75]) if (video.currentTime/video.duration*100 >= percent && !milestones.has(percent)) {
        milestones.add(percent);send('video_progress', {video_name:'lantern_business_film',video_percent:percent});
      }
    });
    video.addEventListener('ended', () => send('video_complete', {video_name:'lantern_business_film'}));
  });
})();
