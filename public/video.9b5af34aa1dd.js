// Picture first; playback controls appear briefly on interaction, then fade.
(() => {
  const figure = document.querySelector('#watch');
  const video = figure?.querySelector('video');
  const controls = figure?.querySelector('.film-controls');
  const cover = figure?.querySelector('[data-cover]');
  if (!video || !controls || !cover) return;
  const play = controls.querySelector('[data-play]');
  const seek = controls.querySelector('[data-seek]');
  const mute = controls.querySelector('[data-mute]');
  const volume = controls.querySelector('[data-volume]');
  const speed = controls.querySelector('[data-speed]');
  const fullscreen = controls.querySelector('[data-fullscreen]');
  const time = controls.querySelector('[data-time]');
  const status = controls.querySelector('[data-status]');
  const icons = {
    play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M8 5v14M16 5v14" stroke-width="4"/>',
    replay: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
    volume: '<path d="M11 5 6 9H3v6h3l5 4zM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
    muted: '<path d="M11 5 6 9H3v6h3l5 4zM16 9l6 6m0-6-6 6"/>'
  };
  const icon = value => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[value]}</svg>`;
  let started = false;
  let savedVolume = 1;
  let hideTimer;
  let keyboardFocus = false;
  let fallback = false;
  const setVisible = visible => {
    controls.hidden = !started || fallback;
    const shown = visible && started && !fallback;
    controls.classList.toggle('is-visible', shown);
    controls.inert = !shown;
    controls.setAttribute('aria-hidden', String(!shown));
  };
  const hideControls = () => {
    clearTimeout(hideTimer);
    if (!video.paused && !keyboardFocus) setVisible(false);
  };
  const reveal = () => {
    clearTimeout(hideTimer);
    setVisible(true);
    if (!video.paused) hideTimer = setTimeout(hideControls, 2200);
  };
  const format = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  const update = () => {
    const duration = Number.isFinite(video.duration) ? video.duration : Number(video.dataset.duration) || 50;
    seek.max = duration;
    seek.value = video.currentTime;
    seek.setAttribute('aria-valuetext', `${format(video.currentTime)} of ${format(duration)}`);
    seek.style.setProperty('--played', `${video.currentTime / duration * 100}%`);
    time.value = `${format(video.currentTime)} / ${format(duration)}`;
    const action = video.ended ? 'replay' : video.paused ? 'play' : 'pause';
    play.innerHTML = icon(action);
    play.setAttribute('aria-label', video.ended ? 'Replay video' : video.paused ? 'Play video' : 'Pause video');
    cover.hidden = !video.paused;
    cover.classList.toggle('is-started', started);
    cover.setAttribute('aria-label', video.ended ? 'Replay Lantern film' : 'Play Lantern film');
    const isMuted = video.muted || video.volume === 0;
    mute.innerHTML = icon(isMuted ? 'muted' : 'volume');
    mute.setAttribute('aria-label', isMuted ? 'Unmute video' : 'Mute video');
    volume.value = isMuted ? 0 : video.volume;
  };
  const toggle = async () => {
    if (!video.paused) { video.pause(); return; }
    if (video.ended) video.currentTime = 0;
    video.hidden = false;
    try { await video.play(); status.textContent = ''; }
    catch (error) {
      if (error.name === 'AbortError') { update(); return; }
      fallback = true;
      video.controls = true;
      cover.hidden = true;
      controls.hidden = true;
      status.textContent = 'Use the video controls to play.';
    }
  };
  play.addEventListener('click', toggle);
  cover.addEventListener('click', toggle);
  video.addEventListener('click', event => {
    if (event.pointerType === 'touch' && !video.paused && !controls.classList.contains('is-visible')) reveal();
    else toggle();
  });
  figure.addEventListener('pointermove', event => { if (event.pointerType === 'mouse') reveal(); });
  figure.addEventListener('pointerleave', hideControls);
  controls.addEventListener('pointerdown', () => { keyboardFocus = false; reveal(); });
  controls.addEventListener('input', reveal);
  controls.addEventListener('change', reveal);
  figure.addEventListener('keydown', () => { keyboardFocus = true; reveal(); });
  figure.addEventListener('focusout', event => {
    if (!figure.contains(event.relatedTarget)) { keyboardFocus = false; hideControls(); }
  });
  seek.addEventListener('input', () => {
    if (video.readyState > 0) video.currentTime = Number(seek.value);
  });
  mute.addEventListener('click', () => {
    if (video.muted || video.volume === 0) { video.volume = savedVolume || 1; video.muted = false; }
    else { savedVolume = video.volume; video.muted = true; }
  });
  volume.addEventListener('input', () => {
    video.volume = Number(volume.value);
    video.muted = video.volume === 0;
    if (video.volume > 0) savedVolume = video.volume;
  });
  speed.addEventListener('change', () => { video.playbackRate = Number(speed.value); });
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement === figure) await document.exitFullscreen();
      else if (figure.requestFullscreen) await figure.requestFullscreen();
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
    } catch { status.textContent = 'Fullscreen is unavailable in this browser.'; }
  });
  document.addEventListener('fullscreenchange', () => {
    fullscreen.setAttribute('aria-label', document.fullscreenElement === figure ? 'Exit fullscreen' : 'Enter fullscreen');
  });
  // Space and arrows work on the player surface; sliders and selects keep their native keys.
  figure.addEventListener('keydown', event => {
    if (event.target !== figure) return;
    if (event.key === ' ' || event.key === 'k') { event.preventDefault(); toggle(); }
    if (video.readyState > 0 && ['ArrowLeft','ArrowRight'].includes(event.key)) {
      event.preventDefault();
      video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + (event.key === 'ArrowLeft' ? -5 : 5)));
    }
  });
  video.addEventListener('play', () => { started = true; update(); reveal(); });
  video.addEventListener('pause', reveal);
  video.addEventListener('ended', reveal);
  ['timeupdate','loadedmetadata','pause','ended','volumechange','ratechange'].forEach(event => video.addEventListener(event, update));
  figure.tabIndex = 0;
  // The same cover artwork paints as an ordinary image. Native poster remains the no-JS fallback.
  video.removeAttribute('poster');
  video.controls = false;
  setVisible(false);
  update();
})();
