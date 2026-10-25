// df-video.js: play Tim's TikToks inside the site (Peyton 2026-10-24).
// Colin's cards stay exactly as designed until a visitor taps one. Then the card plays the video in place through
// TikTok's official embed player, with one small "Watch on TikTok" link to leave the site on purpose.
// Without JavaScript the cards still open TikTok in a new tab. The card elements are never replaced, because
// script.js caches them for the mobile carousel.
(function () {
  var cards = document.querySelectorAll('.df-tiktok-card[href*="tiktok.com"]');
  if (!cards.length) return;
  var es = (document.documentElement.lang || '').toLowerCase().indexOf('es') === 0;
  var LABEL = es ? 'Ver en TikTok' : 'Watch on TikTok';
  var playing = null;

  function idOf(href) { var m = /\/video\/(\d+)/.exec(href); return m && m[1]; }

  function stop(card) {
    var f = card.querySelector('iframe.df-video-frame'), s = card.querySelector('.df-video-source');
    if (f) f.remove();
    if (s) s.remove();
    card.setAttribute('href', card.dataset.dfHref);
    card.setAttribute('target', '_blank');
    card.setAttribute('aria-label', card.dataset.dfLabel);
    card.classList.remove('is-playing');
  }

  function play(card) {
    var href = card.getAttribute('href'), id = idOf(href);
    if (!id) return false;
    if (playing && playing !== card) stop(playing);
    card.dataset.dfHref = href;
    card.dataset.dfLabel = card.getAttribute('aria-label') || '';
    card.removeAttribute('href'); // no longer a link while it plays, so the source link below is not nested in one
    card.removeAttribute('target');
    card.removeAttribute('aria-label');
    var f = document.createElement('iframe');
    f.className = 'df-video-frame';
    f.src = 'https://www.tiktok.com/player/v1/' + id + '?autoplay=1&controls=1&progress_bar=1&play_button=1&volume_control=1&fullscreen_button=1&music_info=0&description=0&rel=0&native_context_menu=0&closed_caption=1';
    f.title = (card.dataset.dfLabel || 'TikTok video').replace(/ in a new tab$| en una pestaña nueva$/, '');
    f.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture';
    f.setAttribute('allowfullscreen', '');
    var s = document.createElement('a');
    s.className = 'df-video-source';
    s.href = href; s.target = '_blank'; s.rel = 'noopener noreferrer';
    s.textContent = LABEL + ' ↗';
    card.appendChild(f);
    card.appendChild(s);
    card.classList.add('is-playing');
    playing = card;
    return true;
  }

  Array.prototype.forEach.call(cards, function (card) {
    card.addEventListener('click', function (e) {
      if (card.classList.contains('is-playing')) return; // taps inside the player belong to the player
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // modified clicks still open TikTok
      if (play(card)) e.preventDefault();
    });
  });
})();
