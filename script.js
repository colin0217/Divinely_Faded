const toggle=document.querySelector('#menu-toggle'),menu=document.querySelector('#menu');function closeMenu(){menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');document.body.style.overflow=''}toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');document.body.style.overflow=open?'hidden':''});menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});const lightbox=document.querySelector('#lightbox');document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>{lightbox.querySelector('img').src=button.dataset.image;lightbox.showModal()}));document.querySelector('#close-photo')?.addEventListener('click',()=>lightbox?.close());lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close()});
// Smaller Kings Domain-proportioned vertical video cards; remove The Experience menu link.
(()=>{
 document.querySelectorAll('#menu a').forEach(a=>{if(a.textContent.trim().toLowerCase()==='the experience')a.remove()});
 const style=document.createElement('style');
 style.textContent='@media(min-width:701px){.df-tiktok-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;justify-content:center!important;gap:30px!important;max-width:1500px!important;margin-inline:auto!important}.df-tiktok-card{aspect-ratio:2/3!important}}';
 document.head.appendChild(style);
})();

// Kings Domain inspired desktop-only scroll motion and pure opacity hero fade.
(()=>{const st=document.createElement("style");st.id="df-elegant-scroll-v2";st.textContent="@media(min-width:701px) and (prefers-reduced-motion:no-preference){\n.hero .desktop-hero-tagline{animation:df-tagline-fade 950ms ease-out 140ms both!important}\n@keyframes df-tagline-fade{from{opacity:0}to{opacity:1}}\n}\n\n@media(min-width:701px) and (prefers-reduced-motion:no-preference){\n  .df-motion-ready{\n    opacity:0;\n    transform:translate3d(0,22px,0);\n    transition:opacity 780ms cubic-bezier(.22,1,.36,1),transform 780ms cubic-bezier(.22,1,.36,1);\n    transition-delay:var(--df-motion-delay,0ms);\n  }\n  .df-motion-ready.df-motion-in{opacity:1;transform:translate3d(0,0,0)}\n  .df-tiktok-card.df-motion-ready{transform:translate3d(0,25px,0)}\n  .df-tiktok-card.df-motion-ready.df-motion-in{transform:translate3d(0,0,0)}\n  .photo-pair.df-reveal-ready img{transition:clip-path 1100ms cubic-bezier(.22,1,.36,1),transform 1100ms cubic-bezier(.22,1,.36,1);transform:scale(1.045)}\n  .photo-pair.df-reveal-ready img.df-revealed{transform:scale(1)}\n}\n";document.head.appendChild(st)})();

(()=>{
  if(!window.matchMedia('(min-width:701px) and (prefers-reduced-motion:no-preference)').matches || !('IntersectionObserver' in window))return;
  const selectors=[
    '.experience .intro > .eyebrow',
    '.experience .intro > h2',
    '.experience .intro-copy > p',
    '.services .section-heading > .eyebrow',
    '.services .section-heading > h2',
    '.services .section-heading > p',
    '.review > .eyebrow',
    '.review > .stars',
    '.review > blockquote',
    '.df-tiktok-grid > .df-tiktok-card',
    '[data-df-reveal]'
  ];
  const items=selectors.flatMap(selector=>Array.from(document.querySelectorAll(selector)));
  const io=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      entry.target.classList.add('df-motion-in');
      io.unobserve(entry.target);
    }
  },{threshold:.12,rootMargin:'0px 0px -5% 0px'});
  const groups=new Map();
  for(const element of items){
    const parent=element.closest('[data-df-reveal-group],.intro,.intro-copy,.section-heading,.review,.df-tiktok-grid')||element.parentElement;
    if(!groups.has(parent))groups.set(parent,[]);
    groups.get(parent).push(element);
  }
  for(const elements of groups.values()){
    elements.forEach((element,index)=>{
      const rect=element.getBoundingClientRect();
      // Never hide content already on screen at initialization.
      if(rect.top<window.innerHeight*.88 && rect.bottom>0)return;
      element.style.setProperty('--df-motion-delay',Math.min(index,3)*115+'ms');
      element.classList.add('df-motion-ready');
      io.observe(element);
    });
  }
})();


// Mobile refinements only. The desktop design stays untouched.
(()=>{
 const css=`
@media(max-width:700px){
  .experience{padding-bottom:20px!important}
  .services{padding-top:30px!important}
  .experience .intro{padding-top:27px!important}
  .experience .intro > h2{margin-bottom:12px!important}
  .experience .intro > .df-mobile-seat{display:inline-block!important;justify-self:start;margin:3px 0 28px!important}
  .experience .intro-copy > .text-link{display:none!important}
  .experience .intro-copy{padding-bottom:0!important}
  .experience .intro-copy p:last-of-type{margin-bottom:0!important}
  .df-tiktok-reels{overflow:hidden}
  .df-tiktok-grid{padding:0 5vw 4px!important;gap:12px!important;scrollbar-width:none!important;-ms-overflow-style:none!important;overscroll-behavior-x:contain}
  .df-tiktok-grid::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}
  .df-tiktok-card{flex:0 0 78vw!important;max-width:310px!important}
  .service-list details > summary{transition:background .25s ease,color .25s ease,padding .25s ease}
  .service-list details[open] > summary{background:#f1f0ec!important;color:#080808!important;padding-left:12px!important;padding-right:12px!important}
  .service-list details[open] > summary .price,.service-list details[open] > summary .price small,.service-list details[open] > summary .plus{color:#080808!important}
}
@media(max-width:700px) and (prefers-reduced-motion:no-preference){
 .df-mobile-reveal-ready{opacity:0;transform:translate3d(0,21px,0);transition:opacity .8s cubic-bezier(.22,1,.36,1),transform .8s cubic-bezier(.22,1,.36,1);transition-delay:var(--df-mobile-delay,0ms)}
 .df-mobile-reveal-ready.df-mobile-visible{opacity:1;transform:translate3d(0,0,0)}
 .photo-pair.df-mobile-photo-ready img{transition:clip-path 1.05s cubic-bezier(.22,1,.36,1),transform 1.05s cubic-bezier(.22,1,.36,1);transform:scale(1.035)}
 .photo-pair.df-mobile-photo-ready img:first-child{clip-path:inset(0 0 100% 0)}
 .photo-pair.df-mobile-photo-ready img:last-child{clip-path:inset(100% 0 0 0);transition-delay:130ms}
 .photo-pair.df-mobile-photo-ready img.df-mobile-photo-in{clip-path:inset(0);transform:scale(1)}
}
`;
 const st=document.createElement('style');st.id='df-mobile-polish';st.textContent=css;document.head.appendChild(st);
 const intro=document.querySelector('.experience .intro');
 const seat=intro?.querySelector('.intro-copy > .text-link');
 const heading=intro?.querySelector('h2');
 if(seat && heading){
   const mobileSeat=seat.cloneNode(true);
   mobileSeat.classList.add('df-mobile-seat');
   mobileSeat.style.display='none';
   heading.insertAdjacentElement('afterend',mobileSeat);
 }
 if(!window.matchMedia('(max-width:700px) and (prefers-reduced-motion:no-preference)').matches||!('IntersectionObserver' in window))return;
 const onScreen=el=>{
   const r=el.getBoundingClientRect();
   return r.top<innerHeight*.85 && r.bottom>0;
 };
 const motionItems=[
  '.experience .intro>.eyebrow','.experience .intro>h2','.experience .intro>.df-mobile-seat',
  '.experience .intro-copy>p',
  '.services .section-heading>.eyebrow','.services .section-heading>h2',
  '.services .section-heading>p',
  '.feature .eyebrow','.feature h2','.feature .pill',
  '.review>.eyebrow','.review>.stars','.review>blockquote',
  '.df-tiktok-grid>.df-tiktok-card',
  '[data-df-reveal]'
 ].flatMap(sel=>Array.from(document.querySelectorAll(sel)));
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('df-mobile-visible');observer.unobserve(entry.target)}
 },{threshold:.08,rootMargin:'0px 0px -5% 0px'});
 const counts=new Map();
 for(const el of motionItems){
  if(onScreen(el))continue;
  const group=el.closest('[data-df-reveal-group],.intro,.intro-copy,.section-heading,.feature,.review,.df-tiktok-grid')||el.parentElement;
  const idx=counts.get(group)||0;counts.set(group,idx+1);
  el.style.setProperty('--df-mobile-delay',Math.min(idx,3)*110+'ms');
  el.classList.add('df-mobile-reveal-ready');
  observer.observe(el);
 }
 const photo=document.querySelector('.experience .photo-pair');
 if(photo && !onScreen(photo)){
  photo.classList.add('df-mobile-photo-ready');
  const photoObserver=new IntersectionObserver(entries=>{
   if(entries.some(entry=>entry.isIntersecting)){
    photo.querySelectorAll('img').forEach(img=>img.classList.add('df-mobile-photo-in'));
    photoObserver.disconnect();
   }
  },{threshold:.1});
  photoObserver.observe(photo);
 }
})();

// Mobile-only opposing photo reveals and video arrow navigation.
(()=>{
 const st=document.createElement('style');st.id='df-mobile-photo-tiktok-v2';
 st.textContent=`
 .df-tiktok-controls{display:none}
 @media(max-width:700px){
  .df-tiktok-grid,.df-tiktok-grid *{touch-action:pan-y!important}
  .df-tiktok-grid{scrollbar-width:none!important;scroll-padding-inline:5vw}
  .df-tiktok-grid::-webkit-scrollbar{display:none!important}
  .df-tiktok-controls{display:flex;align-items:center;justify-content:center;gap:26px;padding:18px 20px 3px;color:#eee}
  .df-tiktok-controls button{appearance:none;border:1px solid #777;border-radius:50%;background:transparent;color:#fff;width:46px;height:46px;display:grid;place-items:center;font-size:23px;line-height:1;cursor:pointer}
  .df-tiktok-controls button:disabled{opacity:.28;cursor:default}
  .df-tiktok-position{font:500 11px/1.4 Arial,sans-serif;letter-spacing:2px;min-width:52px;text-align:center}
 }
 @media(max-width:700px) and (prefers-reduced-motion:no-preference){
  .photo-pair.df-mobile-photo-v2 img:first-child{clip-path:inset(0 0 100% 0)}
  .photo-pair.df-mobile-photo-v2 img:last-child{clip-path:inset(100% 0 0 0)}
  .photo-pair.df-mobile-photo-v2.df-mobile-photo-v2-visible img:first-child{animation:df-mob-down 1100ms cubic-bezier(.22,1,.36,1) both}
  .photo-pair.df-mobile-photo-v2.df-mobile-photo-v2-visible img:last-child{animation:df-mob-up 1100ms cubic-bezier(.22,1,.36,1) 130ms both}
  @keyframes df-mob-down{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0)}}
  @keyframes df-mob-up{from{clip-path:inset(100% 0 0 0)}to{clip-path:inset(0)}}
 }`;
 document.head.appendChild(st);
 if(!matchMedia('(max-width:700px)').matches)return;
 const pair=document.querySelector('.experience .photo-pair');
 if(pair&&matchMedia('(prefers-reduced-motion:no-preference)').matches){
  pair.classList.remove('df-mobile-photo-ready');
  pair.querySelectorAll('img').forEach(img=>img.classList.remove('df-mobile-photo-in'));
  pair.classList.add('df-mobile-photo-v2');
  const show=()=>pair.classList.add('df-mobile-photo-v2-visible');
  if('IntersectionObserver' in window){
   const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){show();observer.disconnect()}},{threshold:.04});
   observer.observe(pair);
   const r=pair.getBoundingClientRect();
   if(r.top<innerHeight*.85&&r.bottom>0)requestAnimationFrame(()=>requestAnimationFrame(show));
  }else requestAnimationFrame(show);
 }
 const grid=document.querySelector('.df-tiktok-grid');
 if(!grid)return;
 const cards=Array.from(grid.querySelectorAll('.df-tiktok-card'));
 if(cards.length<2)return;
 const nav=document.createElement('div');nav.className='df-tiktok-controls';nav.setAttribute('aria-label','Browse videos');
 nav.innerHTML='<button type="button" aria-label="Previous video">‹</button><span class="df-tiktok-position" aria-live="polite">1 / '+cards.length+'</span><button type="button" aria-label="Next video">›</button>';
 grid.insertAdjacentElement('afterend',nav);
 const [prev,next]=nav.querySelectorAll('button'),label=nav.querySelector('.df-tiktok-position');
 let current=0;
 const update=()=>{label.textContent=(current+1)+' / '+cards.length;prev.disabled=current===0;next.disabled=current===cards.length-1};
 const trackStyle=document.createElement('style');
 trackStyle.id='df-mobile-carousel-track-fix';
 trackStyle.textContent=`
 @media(max-width:700px){
  .df-tiktok-reels{overflow:hidden!important;max-width:100vw!important}
  .df-tiktok-grid{width:max-content!important;max-width:none!important;overflow:visible!important;overflow-x:visible!important;overflow-y:visible!important;scroll-snap-type:none!important;scrollbar-width:none!important;transform:translate3d(0,0,0);transition:transform .45s cubic-bezier(.22,1,.36,1);-webkit-overflow-scrolling:auto!important;will-change:transform}
  .df-tiktok-grid::-webkit-scrollbar{display:none!important}
  .df-tiktok-grid,.df-tiktok-grid *{touch-action:pan-y!important}
  .df-tiktok-card{flex-shrink:0!important}
  .service-list details[open] .service-detail{padding-top:20px!important}
  .service-list details[open] .service-detail p:first-child{margin-top:0!important}
 }
 @media(max-width:700px) and (prefers-reduced-motion:reduce){.df-tiktok-grid{transition:none!important}}
 `;
 document.head.appendChild(trackStyle);
 const centerActive=(instant=false)=>{
  const viewport=grid.closest('.df-tiktok-reels');
  if(!viewport)return;
  const padding=parseFloat(getComputedStyle(grid).paddingLeft)||0;
  const cardWidth=cards[current].getBoundingClientRect().width;
  const relativeOffset=cards[current].offsetLeft-cards[0].offsetLeft;
  const x=(viewport.clientWidth-cardWidth)/2-padding-relativeOffset;
  if(instant)grid.style.transition='none';
  grid.style.transform='translate3d('+x+'px,0,0)';
  if(instant)requestAnimationFrame(()=>requestAnimationFrame(()=>grid.style.removeProperty('transition')));
 };
 const move=step=>{
  current=Math.max(0,Math.min(cards.length-1,current+step));
  centerActive();
  update();
 };
 // Horizontal swipe changes cards; vertical gestures still scroll the page.
 let origin=null;
 grid.addEventListener('touchstart',e=>{
  if(e.touches.length!==1)return;
  origin={x:e.touches[0].clientX,y:e.touches[0].clientY};
 },{passive:true});
 grid.addEventListener('touchend',e=>{
  if(!origin||!e.changedTouches.length)return;
  const dx=e.changedTouches[0].clientX-origin.x;
  const dy=e.changedTouches[0].clientY-origin.y;
  origin=null;
  if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.25)move(dx<0?1:-1);
 },{passive:true});
 grid.addEventListener('touchcancel',()=>{origin=null},{passive:true});
 prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));update();
 // Keep every card, including first and last, centered in the mobile viewport.
 centerActive(true);
 window.addEventListener('resize',()=>centerActive(true),{passive:true});
})();

// Mobile-only Kings Domain inspired footer. Desktop stays unchanged.
(()=>{const style=document.createElement("style");style.id="df-kings-mobile-footer";style.textContent="\n@media(max-width:700px){\n  .df-new-footer{\n    display:flex!important;flex-direction:column!important;\n    padding:0 0 45px!important;gap:0!important;background:#080808!important;\n  }\n  .df-new-footer .df-footer-photo{\n    order:-1!important;width:100%!important;height:77vw!important;\n    min-height:0!important;max-height:none!important;\n    overflow:hidden!important;margin:0!important;\n  }\n  .df-new-footer .df-footer-photo img{\n    height:100%!important;object-position:center top!important;\n  }\n  .df-new-footer .df-footer-photo-logo strong{font-size:clamp(29px,7vw,44px)!important}\n  .df-new-footer .df-footer-photo-logo small{font-size:clamp(8px,1.9vw,12px)!important}\n  .df-new-footer .df-footer-left{\n    width:100%!important;display:grid!important;\n    grid-template-columns:minmax(0,.95fr) minmax(0,1.25fr)!important;\n    column-gap:18px!important;row-gap:0!important;\n    padding:36px 5vw 0!important;align-items:start!important;\n  }\n  .df-new-footer h2{\n    grid-column:1!important;grid-row:1!important;min-width:0!important;\n    font-size:clamp(32px,8.3vw,45px)!important;line-height:1.03!important;\n    letter-spacing:-.055em!important;margin:0!important;font-weight:750!important;\n  }\n  .df-new-footer .df-footer-nav{\n    grid-column:2!important;grid-row:1!important;width:100%!important;\n    grid-template-columns:1fr 1fr!important;gap:10px!important;margin:0!important;\n  }\n  .df-new-footer .df-footer-links{gap:10px!important;font-size:clamp(13px,3.7vw,18px)!important;line-height:1.25!important}\n  .df-new-footer .df-footer-links a{white-space:nowrap}\n  .df-new-footer .df-footer-address{\n    grid-column:1/-1!important;grid-row:2!important;\n    margin:28px 0 14px!important;font-size:12px!important;\n  }\n  .df-new-footer .df-footer-bottom-links{\n    grid-column:1/-1!important;grid-row:3!important;\n    display:flex!important;gap:10px 20px!important;flex-wrap:wrap!important;\n    margin:0 0 23px!important;font-size:12px!important;line-height:1.5!important;\n  }\n  .df-new-footer .df-footer-social{\n    grid-column:1/-1!important;grid-row:4!important;\n    margin:0 0 24px!important;gap:21px!important;\n  }\n  .df-new-footer .df-footer-social a{width:34px!important;height:34px!important}\n  .df-new-footer .df-footer-social svg{width:30px!important;height:30px!important}\n  .df-new-footer .df-footer-copyright{\n    grid-column:1!important;grid-row:5!important;margin:0!important;\n    font-size:11px!important;line-height:1.5!important;align-self:end!important;\n  }\n}\n@media(max-width:370px){\n .df-new-footer .df-footer-left{column-gap:10px!important}\n .df-new-footer .df-footer-links{font-size:12px!important}\n .df-new-footer h2{font-size:clamp(28px,8vw,34px)!important}\n}\n";document.head.appendChild(style)})();
