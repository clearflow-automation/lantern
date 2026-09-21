(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var campaign = {
    campaign_source: params.get('utm_source') || undefined,
    campaign_medium: params.get('utm_medium') || undefined,
    campaign_name: params.get('utm_campaign') || undefined,
    campaign_content: params.get('utm_content') || undefined
  };

  function send(name, values) {
    if (typeof window.gtag !== 'function') return;
    var payload = Object.assign({
      page_path: window.location.pathname
    }, campaign, values || {});
    Object.keys(payload).forEach(function (key) {
      if (payload[key] === undefined || payload[key] === '') delete payload[key];
    });
    window.gtag('event', name, payload);
  }

  document.querySelectorAll('a[href*="calendar.google.com/calendar"]').forEach(function (link) {
    link.addEventListener('click', function () {
      send('book_call_click', {
        cta_location: link.dataset.ctaLocation || 'unspecified',
        link_url: link.href
      });
    });
  });

  document.querySelectorAll('a[href^="mailto:"]').forEach(function (link) {
    link.addEventListener('click', function () {
      send('email_click', {
        cta_location: link.dataset.ctaLocation || 'unspecified'
      });
    });
  });

  document.querySelectorAll('video').forEach(function (video) {
    video.addEventListener('play', function handleFirstPlay() {
      send('video_start', {
        video_name: video.getAttribute('aria-label') || 'lantern_explainer'
      });
      video.removeEventListener('play', handleFirstPlay);
    });
  });

})();
