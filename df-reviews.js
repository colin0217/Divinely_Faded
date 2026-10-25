// df-reviews.js: the reviews carousel inside Colin's .review component (content/reviews.json).
// Accessible by design (WCAG 2.2.2): auto-advance only when motion is allowed, silent to screen readers while it
// rotates (aria-live off), a labelled Pause/Play button, and it stops rotating for good once someone uses a control.
// Without JavaScript the first review shows and the controls stay hidden.
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  Array.prototype.forEach.call(document.querySelectorAll('[data-df-reviews]'), function (sec) {
    var slides = sec.querySelectorAll('.df-review-slide'), nav = sec.querySelector('.df-review-nav');
    if (slides.length < 2 || !nav) return;
    var box = sec.querySelector('.df-review-slides'), pos = sec.querySelector('.df-review-pos'), pause = sec.querySelector('.df-review-pause');
    var i = 0, timer = null, hovered = false;
    nav.hidden = false;
    function show(n) {
      slides[i].classList.remove('is-active'); slides[i].setAttribute('aria-hidden', 'true');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('is-active'); slides[i].removeAttribute('aria-hidden');
      pos.textContent = (i + 1) + ' / ' + slides.length;
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
      box.setAttribute('aria-live', 'polite'); // manual changes are announced
      pause.setAttribute('aria-pressed', 'true'); pause.textContent = pause.dataset.play;
    }
    function start() {
      if (reduce || timer) return;
      box.setAttribute('aria-live', 'off');
      pause.setAttribute('aria-pressed', 'false'); pause.textContent = pause.dataset.pause;
      timer = setInterval(function () { if (!hovered && !document.hidden) show(i + 1); }, 7000);
    }
    sec.querySelector('.df-review-prev').addEventListener('click', function () { stop(); show(i - 1); });
    sec.querySelector('.df-review-next').addEventListener('click', function () { stop(); show(i + 1); });
    pause.addEventListener('click', function () { if (timer) stop(); else start(); });
    ['mouseenter', 'focusin'].forEach(function (e) { sec.addEventListener(e, function () { hovered = true; }); });
    ['mouseleave', 'focusout'].forEach(function (e) { sec.addEventListener(e, function () { hovered = false; }); });
    if (reduce) { pause.hidden = true; box.setAttribute('aria-live', 'polite'); } else start();
  });
})();
