const stages = ['Ask','Watch','Write down','Measure','Redesign','Pilot'];
const dialog = document.getElementById('method-examples');
const panels = [...document.querySelectorAll('[data-example-panel]')];
const buttons = [...document.querySelectorAll('[data-example-step]')];
const chooser = document.getElementById('example-select');
const scroller = document.getElementById('example-scroll');
const previous = document.getElementById('example-previous');
const next = document.getElementById('example-next');
const outputButtons = [...document.querySelectorAll('[data-output]')];
const outputPanels = [...document.querySelectorAll('[data-output-panel]')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let current = 0;
let returnFocus = null;
let returnScroll = 0;
let returnAnchorTop = 0;
let returnViewport = {width:0,height:0};
let previousOverflow = '';
function selectOutput(key) {
  outputButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.output===key)));
  outputPanels.forEach(panel=>{panel.hidden=panel.dataset.outputPanel!==key});
}
function selectExample(index, output='comparison') {
  if(index<0||index>=stages.length)return;
  current=index;
  panels.forEach((panel,i)=>{panel.hidden=i!==index});
  buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
  chooser.value=String(index);
  previous.disabled=index===0;
  next.firstChild.textContent=index===5?'Back to Ask ':`Next: ${stages[index+1]} `;
  document.getElementById('example-progress').textContent=`${index+1} of 6 · ${stages[index]}`;
  if(index===5)selectOutput(output);
  scroller.scrollTop=0;
}
function openExample(index,output,opener) {
  returnFocus=opener;
  returnScroll=window.scrollY;
  returnAnchorTop=opener.getBoundingClientRect().top;
  returnViewport={width:innerWidth,height:innerHeight};
  previousOverflow=document.body.style.overflow;
  selectExample(index,output);
  document.body.style.overflow='hidden';
  dialog.showModal();
  document.getElementById('example-close').focus({preventScroll:true});
}
document.querySelectorAll('[data-example-open]').forEach(button=>button.addEventListener('click',()=>openExample(Number(button.dataset.exampleOpen),button.dataset.exampleOutput||'comparison',button)));
buttons.forEach((button,i)=>{
  button.setAttribute('aria-controls',panels[i].id);
  button.addEventListener('click',()=>selectExample(i));
});
chooser.addEventListener('change',()=>selectExample(Number(chooser.value)));
previous.addEventListener('click',()=>selectExample(current-1));
next.addEventListener('click',()=>selectExample(current===5?0:current+1));
document.getElementById('example-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{
  if(event.target===dialog){
    const rect=dialog.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
  }
});
dialog.addEventListener('close',()=>{
  document.body.style.overflow=previousOverflow;
  const resized=innerWidth!==returnViewport.width||innerHeight!==returnViewport.height;
  const target=resized&&returnFocus?.isConnected
    ? window.scrollY+returnFocus.getBoundingClientRect().top-Math.min(returnAnchorTop,innerHeight-90)
    : returnScroll;
  window.scrollTo({top:target,behavior:'instant'});
  if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
});
outputButtons.forEach(button=>button.addEventListener('click',()=>selectOutput(button.dataset.output)));
selectExample(0);
const mobileMenu=document.querySelector('.mobile-menu');
mobileMenu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{mobileMenu.open=false}));
mobileMenu.addEventListener('keydown',event=>{
  if(event.key==='Escape'){mobileMenu.open=false;mobileMenu.querySelector('summary').focus()}
});
if(!reducedMotion.matches&&'IntersectionObserver' in window){
  const reveals=[...document.querySelectorAll('.home-section')];
  document.body.classList.add('home-motion');
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.remove('pending');observer.unobserve(entry.target)}
  }),{threshold:.04});
  reveals.forEach(section=>{section.classList.add('home-reveal','pending');observer.observe(section)});
  setTimeout(()=>reveals.forEach(section=>section.classList.remove('pending')),4500);
}

(function(){
  var f=document.getElementById('askform'); if(!f) return;
  var err=document.getElementById('askerr'), ph=f.phone, btn=f.querySelector('button');
  function fail(m){err.textContent=m;err.hidden=false;ph.setAttribute('aria-invalid','true');ph.focus();}
  function clear(){err.hidden=true;err.textContent='';ph.removeAttribute('aria-invalid');}
  function looksLikeANumber(v){
    if(/[A-Za-z]/.test(v)) return false;
    var d=v.replace(/\D/g,'');
    return d.length>=10 && d.length<=13;
  }
  ph.addEventListener('input',clear);
  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    if(f._honey.value) return;
    var v=ph.value.trim();
    if(!v) return fail('Leave a number and I\'ll call you back.');
    if(!looksLikeANumber(v)) return fail('That does not look like a number I can call. Ten digits is enough.');
    clear();
    btn.disabled=true; btn.textContent='Sending\u2026';
    fetch('https://formsubmit.co/ajax/da68bdf022916e7f4771c192cd673f08',{method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({_subject:'airlantern.com \u2014 call-back (systems)',
        site:'airlantern.com',business:f.business.value.trim().slice(0,120),phone:v,
        message:f.message.value.trim().slice(0,1200)})})
    .then(function(r){if(!r.ok) throw new Error('request failed');return r.json()})
    .then(function(j){
      if(j.success!=='true') throw new Error('rejected');
      f.innerHTML='<p class="askform__state">Got it. I\'ll call you, usually the same day.</p>';
    })
    .catch(function(){
      btn.disabled=false; btn.textContent='Ask me to call you';
      fail('That did not send. Please email vaishnandit@airlantern.com.');
    });
  });
})();

document.querySelectorAll('a[href^="https://wa.me/"],a[href^="tel:"],a[href^="mailto:"]').forEach(link=>link.addEventListener('click',()=>{const channel=link.href.startsWith('tel:')?'phone':link.href.startsWith('mailto:')?'email':'whatsapp';if(typeof gtag==='function')gtag('event','contact_click',{contact_channel:channel});}));

const walkthroughStages = [
  ['01 / ASK','Start with one recent job.','Your team talks us through what arrived, who touched it and what happened next.'],
  ['02 / WATCH','Follow the real trail.','We trace the messages, files and handoffs. The waiting becomes part of the work.'],
  ['03 / WRITE DOWN','Put the process on paper.','The team checks the map, corrects the sequence and names each handoff.'],
  ['04 / MEASURE','Separate work from waiting.','Time, cost and open questions sit together without pretending every figure is known.'],
  ['05 / REDESIGN','Change the step that holds it up.','A clear input check and an owner for the handoff remove one avoidable pause.'],
  ['06 / PILOT','Try it, then measure again.','The team runs the revised process. What worked, what waited and what needs attention becomes visible.']
];
const walkthroughDuration = 36000;
const walkthroughPlayer = document.querySelector('.walkthrough-player');
const walkthroughPlay = document.getElementById('walkthrough-play');
const walkthroughProgress = document.getElementById('walkthrough-progress-fill');
const walkthroughChapters = [...document.querySelectorAll('[data-walkthrough-chapter]')];
const walkthroughSelect = document.getElementById('walkthrough-select');
const walkthroughAudio = document.getElementById('walkthrough-audio');
const walkthroughVoice = document.getElementById('walkthrough-voice');
let walkthroughElapsed = 0;
let walkthroughStartedAt = 0;
let walkthroughFrame = 0;
let walkthroughPlaying = false;

function showWalkthroughStage(index) {
  const safe = Math.max(0,Math.min(5,index));
  walkthroughPlayer.dataset.walkthroughStep=String(safe);
  document.getElementById('walkthrough-stage-number').textContent=walkthroughStages[safe][0];
  document.getElementById('walkthrough-stage-title').textContent=walkthroughStages[safe][1];
  document.getElementById('walkthrough-stage-caption').textContent=walkthroughStages[safe][2];
  walkthroughChapters.forEach((button,i)=>i===safe?button.setAttribute('aria-current','step'):button.removeAttribute('aria-current'));
  walkthroughSelect.value=String(safe);
}
function paintWalkthrough() {
  const now=walkthroughPlaying?Math.min(walkthroughDuration,walkthroughElapsed+performance.now()-walkthroughStartedAt):walkthroughElapsed;
  walkthroughProgress.style.transform=`scaleX(${now/walkthroughDuration})`;
  showWalkthroughStage(Math.min(5,Math.floor(now/6000)));
  document.getElementById('walkthrough-time').textContent=`0:${String(Math.floor(now/1000)).padStart(2,'0')} / 0:36`;
  if(walkthroughPlaying&&now<walkthroughDuration)walkthroughFrame=requestAnimationFrame(paintWalkthrough);
  if(walkthroughPlaying&&now>=walkthroughDuration)stopWalkthrough(true);
}
function stopWalkthrough(complete=false) {
  if(walkthroughPlaying)walkthroughElapsed=complete?walkthroughDuration:Math.min(walkthroughDuration,walkthroughElapsed+performance.now()-walkthroughStartedAt);
  walkthroughPlaying=false;
  cancelAnimationFrame(walkthroughFrame);
  walkthroughAudio.pause();
  walkthroughPlay.querySelector('span').textContent=complete?'↻':'▶';
  walkthroughPlay.querySelector('b').textContent=complete?'Replay':'Continue';
  walkthroughPlay.setAttribute('aria-label',complete?'Replay walkthrough':'Continue walkthrough');
  paintWalkthrough();
}
function playWalkthrough() {
  if(reducedMotion.matches)return;
  if(walkthroughElapsed>=walkthroughDuration)walkthroughElapsed=0;
  walkthroughPlaying=true;
  walkthroughStartedAt=performance.now();
  walkthroughAudio.currentTime=walkthroughElapsed/1000;
  walkthroughAudio.play().catch(()=>{});
  walkthroughPlay.querySelector('span').textContent='Ⅱ';
  walkthroughPlay.querySelector('b').textContent='Pause';
  walkthroughPlay.setAttribute('aria-label','Pause walkthrough');
  paintWalkthrough();
}
function jumpWalkthrough(index) {
  walkthroughElapsed=index*6000;
  walkthroughAudio.currentTime=walkthroughElapsed/1000;
  if(walkthroughPlaying)walkthroughStartedAt=performance.now();
  paintWalkthrough();
}
walkthroughPlay.addEventListener('click',()=>walkthroughPlaying?stopWalkthrough():playWalkthrough());
walkthroughChapters.forEach((button,index)=>button.addEventListener('click',()=>jumpWalkthrough(index)));
walkthroughSelect.addEventListener('change',()=>jumpWalkthrough(Number(walkthroughSelect.value)));
walkthroughVoice.addEventListener('click',()=>{
  walkthroughAudio.muted=!walkthroughAudio.muted;
  const enabled=!walkthroughAudio.muted;
  walkthroughVoice.setAttribute('aria-pressed',String(enabled));
  walkthroughVoice.setAttribute('aria-label',enabled?'Turn narration off':'Turn narration on');
  walkthroughVoice.querySelector('span').textContent=enabled?'🔊':'🔇';
  walkthroughVoice.querySelector('b').textContent=enabled?'Voice on':'Voice off';
});
if(reducedMotion.matches){walkthroughPlay.querySelector('b').textContent='Choose a step';walkthroughPlay.disabled=true}
showWalkthroughStage(0);
paintWalkthrough();
