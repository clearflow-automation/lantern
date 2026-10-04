// Original AI Flow Motion artwork and choreography; adapted for the local Lantern page.
(()=>{

const LOOP = 9;
const PK = [['in1a', 0, .45], ['in1b', .45, .7], ['in2a', .25, .4], ['in2b', .65, .65], ['in3a', .5, .4], ['in3b', .9, .65], ['cl', .2, .9], ['a1', 1.8, .6], ['a2', 2.9, .7], ['bL', 1.8, .5], ['bR', 1.8, .5], ['rr', 1.9, .9], ['rc', 3.8, .6], ['oS', 5.2, .9], ['oF', 5.2, .75], ['oO', 5.2, .55]];
const clamp = v => Math.max(0, Math.min(1, v));
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eob = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const bump = (t, at, amp = .08, dur = .45) => { const u = (t - at) / dur; return u > 0 && u < 1 ? 1 + amp * Math.sin(Math.PI * u) : 1; };
const glowAmt = (t, a, b) => (t > a && t < b) ? Math.sin(Math.PI * (t - a) / (b - a)) : 0;


class FlowMotion {
  constructor(root) {
    this.root=root; this.control=root.closest(".ai-flow-motion-window"); this.el={}; this.len={};
    this.elapsed=0; this.lastFrame=null; this.raf=null; this.visible=false; this.paused=false;
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
    root.querySelectorAll('[data-k]').forEach(n=>{this.el[n.dataset.k]=n});
    ['arrow','spark',...PK.map(p=>p[0])].forEach(k=>{if(this.el[k])this.len[k]=this.el[k].getTotalLength()});
    this.fit=()=>{
      const width=root.getBoundingClientRect().width;
      this.phone=width<680;
      root.dataset.flowVariant=this.phone?'phone':'desktop';
      ['xls2','ppt'].forEach(k=>{if(this.el[k])this.el[k].style.transformOrigin=this.phone?'50% 100%':'50% 50%'});
      this.el.stage.style.transform=`scale(${width/1536})`;
    };
    this.resize=new ResizeObserver(this.fit);this.resize.observe(root);this.fit();
    this.observer=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;this.sync()},{threshold:.05});this.observer.observe(root);
    // The diagram itself can be paused by touch or keyboard; no separate toolbar button.
    this.control.setAttribute('role','button');this.control.tabIndex=0;
    const toggle=()=>{if(this.reduced.matches)return;this.paused=!this.paused;this.sync()};
    this.control.addEventListener('click',toggle);
    this.control.addEventListener('keydown',event=>{
      if(event.key===' '||event.key==='Enter'){event.preventDefault();toggle()}
    });
    this.reduced.addEventListener('change',()=>this.sync());
    document.addEventListener('visibilitychange',()=>this.sync());
    this.paint(6.5,false);this.sync();
  }
  sync() {
    const running=this.visible&&!document.hidden&&!this.paused&&!this.reduced.matches;
    this.control.setAttribute('aria-label',this.reduced.matches?'Business flow: information, rules, AI tasks and team review':this.paused?'Resume business flow animation: Sales, Operations, Finance, Rules & Scripts, Team Review':'Pause business flow animation: Sales, Operations, Finance, Rules & Scripts, Team Review');
    this.control.setAttribute('aria-pressed',String(this.paused));
    this.control.setAttribute('aria-disabled',String(this.reduced.matches));
    this.root.dataset.flowRunning=String(running);
    if(this.reduced.matches)this.paint(6.5,false);
    if(running&&this.raf===null)this.raf=requestAnimationFrame(n=>this.tick(n));
    if(!running&&this.raf!==null){cancelAnimationFrame(this.raf);this.raf=null;this.lastFrame=null;}
  }
  tick(now) {
    if(!this.root.isConnected){this.raf=null;return}
    if(this.lastFrame!==null)this.elapsed+=(now-this.lastFrame)/1000;
    this.lastFrame=now;
    const t=this.elapsed%LOOP;this.paint(t,true);this.root.dataset.flowTime=t.toFixed(3);
    this.raf=requestAnimationFrame(n=>this.tick(n));
  }
  paint(t, animate) {
    const E = this.el;
    const set = (k, tf, extra) => { const n = E[k]; if (!n) return; n.style.transform = tf; if (extra) Object.assign(n.style, extra); };

    // typing dots
    for (let r = 0; r < 3; r++) for (let j = 0; j < 3; j++) {
      const n = E['d' + r + j]; if (!n) continue;
      const s = animate ? Math.max(0, Math.sin(t * Math.PI * 2.4 - j * .8 - r * .6)) : 0;
      n.style.transform = `translateY(${-4 * s}px)`; n.style.opacity = .5 + .5 * s;
    }

    // packets
    PK.forEach(([k, st, dur], i) => {
      const n = E['pk' + i], p = E[k]; if (!n || !p) return;
      const u = (t - st) / dur;
      if (!animate || u < 0 || u > 1) { n.setAttribute('opacity', 0); return; }
      const pt = p.getPointAtLength(this.len[k] * eio(u));
      n.setAttribute('cx', pt.x); n.setAttribute('cy', pt.y);
      n.setAttribute('opacity', Math.min(1, u * 8, (1 - u) * 8));
    });

    // flowing dashes
    const off = -(t * 28) % 15;
    if (E.a1) E.a1.style.strokeDashoffset = off;
    if (E.a2) E.a2.style.strokeDashoffset = off;

    // inputs
    set('whatsapp', `scale(${bump(t, 0, .05)})`);
    set('notes', `scale(${bump(t, .25, .05)})`);
    set('excel', `scale(${bump(t, .5, this.phone ? .17 : .05, this.phone ? .75 : .45)})`);
    set('badge1', `scale(${bump(t, .4, .14)})`);
    set('badge2', `scale(${bump(t, .6, .14)})`);
    set('badge3', `scale(${bump(t, .85, .14)})`);
    set('cloud', `translateY(${animate ? Math.sin(t * Math.PI * 2 / 4.5) * 5 : 0}px) scale(${bump(t, .15, .05)})`);

    // rules
    const rg = glowAmt(t, 1.05, 2.1);
    const rs = Math.max(bump(t, 1.15, .05), bump(t, 1.3, .05), bump(t, 1.55, .06));
    set('rules', `scale(${rs})`, { filter: `drop-shadow(0 0 ${rg * 22}px rgba(47,110,240,${rg * .45}))` });
    const xp=bump(t,2.25,this.phone ? .32 : .1,this.phone ? .95 : .45)-1;
    const pp=bump(t,this.phone?2.45:2.25,this.phone ? .32 : .1,this.phone ? .95 : .45)-1;
    set('xls2', `translateY(${this.phone?-28*xp:0}px) scale(${1+xp})`);
    set('ppt', `translateY(${this.phone?-28*pp:0}px) scale(${1+pp})`);

    // agents
    const ag = glowAmt(t, 2.3, this.phone ? 3.55 : 3.1);
    set('agents', `translateY(${this.phone?-10*ag:0}px) scale(${1 + ag * (this.phone ? .26 : .04)})`, { filter: `drop-shadow(0 0 ${ag * 26}px rgba(255,129,50,${ag * .65}))` });

    // review
    const rv = glowAmt(t, 2.7, 3.9);
    set('avatar', `scale(${Math.max(bump(t, 2.75, .06), bump(t, 3.55, .1))})`, { filter: `drop-shadow(0 0 ${rv * 20}px rgba(11,42,138,${rv * .35}))` });

    // results: grow, hold, reset
    const out = animate ? 1 - eio(clamp((t - 8.35) / .55)) : 1;
    const grow = (at, d = .55) => animate ? eob(clamp((t - at) / d)) : 1;
    ['bar1', 'bar2', 'bar3'].forEach((k, i) => {
      const g = grow(4.4 + i * .15);
      const s = .55 + .45 * g * out;
      set(k, `scaleY(${s})`);
    });
    const ad = animate ? eio(clamp((t - 4.85) / .6)) * out : 1;
    if (E.arrow) { E.arrow.style.strokeDasharray = this.len.arrow; E.arrow.style.strokeDashoffset = this.len.arrow * (1 - ad); E.arrow.style.opacity = ad < .02 ? 0 : 1; }
    if (E.arrowHead) E.arrowHead.style.opacity = clamp((ad - .85) / .15);
    const tk = animate ? eob(clamp((t - 5.2) / .45)) : 1;
    const tkv = .6 + .4 * Math.min(1, tk) * out;
    set('tick', `scale(${.8 + .2 * tk * out + (bump(t, 5.2, .1) - 1)})`, { opacity: tkv });

    // departments
    const ms = .55 + .45 * grow(5.75) * out;
    set('mbars', `scaleY(${ms})`);
    const sp = animate ? eio(clamp((t - 6.05) / .6)) * out : 1;
    if (E.spark) { E.spark.style.strokeDasharray = this.len.spark; E.spark.style.strokeDashoffset = this.len.spark * (1 - sp); E.spark.style.opacity = sp < .02 ? 0 : 1; }
    if (E.sparkHead) E.sparkHead.style.opacity = clamp((sp - .85) / .15);
    ['li0', 'li1', 'li2'].forEach((k, i) => {
      const v = animate ? eio(clamp((t - 5.75 - i * .15) / .4)) * out : 1;
      const n = E[k]; if (!n) return;
      n.style.opacity = .45 + .55 * v; n.style.transform = `translateX(${-10 * (1 - v)}px)`;
    });
  }


}
const root=document.querySelector('[data-flow2]');
if(root)new FlowMotion(root);
})();
