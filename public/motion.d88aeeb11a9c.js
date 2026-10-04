(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const easeOut = 'cubic-bezier(0.23,1,0.32,1)';
  const revealTargets = document.querySelectorAll('.work-choice, .method-panel, .compact-trust figure, .example-intro, .approach-grid article, .finance-close, .faq-heading, .work-gallery-heading, .ai-support');
  const entranceTargets = document.querySelectorAll('.home-hero-copy > h1, .home-hero-copy > .hero-description, .home-hero-copy > .hero-expansion, .opening-grid > div:first-child');
  if (!reduced.matches) entranceTargets.forEach(el => el.classList.add('motion-enter'));
  const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    if (!reduced.matches) entry.target.classList.add('motion-reveal');
    reveal.unobserve(entry.target);
  }), { threshold:.12 });
  revealTargets.forEach(el => reveal.observe(el));

  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden','true');
  document.body.append(progress);
  let scheduled = false;
  const updateProgress = () => {
    const available = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${available > 0 ? Math.min(1,scrollY / available) : 0})`;
    scheduled = false;
  };
  addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateProgress); } }, { passive:true });
  addEventListener('resize',updateProgress);
  updateProgress();

  document.querySelectorAll('.faq-list details,.privacy-details').forEach(details => {
    details.addEventListener('toggle', () => {
      if (!details.open || reduced.matches) return;
      const content = details.querySelector('.privacy-copy') || details.querySelector('p');
      content?.animate([{opacity:0,transform:'translateY(-4px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:easeOut});
    });
  });

  const scene = document.querySelector('.ai-flow-figure');
  if (!scene) return;
  scene.querySelector('.flow-controls').hidden = false;
  const toggle = scene.querySelector('.flow-toggle');
  const filters = scene.querySelectorAll('.flow-filter');
  let selected = 'all';
  let visible = false;
  let paused = false;
  let tabVisible = !document.hidden;
  const animations = [];
  scene.querySelectorAll('.flow-route').forEach((path,index) => {
    const length = path.getTotalLength();
    const route = path.dataset.route;
    for (let packetIndex=0; packetIndex<2; packetIndex++) {
      const group = document.createElementNS('http://www.w3.org/2000/svg','g');
      group.classList.add('flow-packet');
      group.dataset.route = route;
      for (const [className,radius] of [['packet-shell',10],['packet-core',3]]) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
        circle.setAttribute('r',radius);
        circle.setAttribute('class',className);
        group.append(circle);
      }
      scene.querySelector('.flow-overlay').append(group);
      const frames = Array.from({length:61},(_,i) => {
        const p = path.getPointAtLength(length*i/60);
        return {transform:`translate(${p.x}px,${p.y}px)`,opacity:i===0||i===60?0:1,offset:i/60};
      });
      const duration = 3400 + (index % 3)*450;
      const animation = group.animate(frames,{duration,iterations:Infinity,easing:'linear'});
      animation.pause();
      animation.currentTime = packetIndex*duration/2 + index*240;
      animations.push({animation,route,group});
    }
  });
  const sync = () => {
    const running = visible && tabVisible && !paused && !reduced.matches;
    scene.classList.toggle('flow-active',running);
    scene.classList.toggle('flow-paused',!running);
    animations.forEach(({animation,route,group}) => {
      const included = selected==='all' || route===selected || route==='shared';
      group.style.visibility = included ? 'visible' : 'hidden';
      if (running && included) animation.play(); else animation.pause();
    });
    toggle.textContent = paused ? '▶ Resume Flow' : 'Ⅱ Pause Flow';
    toggle.setAttribute('aria-pressed',String(paused));
    scene.querySelectorAll('.flow-focus-ring').forEach(ring => ring.classList.toggle('is-selected',ring.dataset.source===selected));
  };
  filters.forEach(button => button.addEventListener('click',() => {
    selected = button.dataset.source;
    filters.forEach(other => other.setAttribute('aria-pressed',String(other===button)));
    sync();
  }));
  toggle.addEventListener('click',() => { paused = !paused; sync(); });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); },{threshold:.08}).observe(scene);
  document.addEventListener('visibilitychange',() => { tabVisible = !document.hidden; sync(); });
  reduced.addEventListener('change',sync);
  sync();
})();
