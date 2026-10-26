/* ========================================================
   COEN'S TELECOM - SITE SEARCH (coens-search.js)
   Makes the homepage search box work:
   - /reparaties/?q=…          → sends the visitor to the right brand page,
                                 or shows a friendly "kies een merk" notice
   - /reparaties/apple/?q=…    → filters the model cards on the page
   - /reparaties/samsung/?q=…
   Needs no extra CSS: the notice uses inline styles in the site's colours.
   ======================================================== */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var q = (params.get('q') || '').trim();
  if (!q) return;

  var path = window.location.pathname.replace(/\/+$/, '') + '/';

  // "iPhone 16 Pro" -> "iphone16pro"
  function compact(s) {
    return String(s)
      .toLowerCase()
      .replace(/&amp;/g, '&')
      .replace(/[^a-z0-9]+/g, '');
  }
  function tokens(s) {
    return String(s).toLowerCase().split(/[^a-z0-9+]+/).filter(function (t) { return t.length > 0; });
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var brandPages = {
    apple:   { url: '/reparaties/apple/',   test: /iphone|apple|ipad|ipod|airpod|macbook|imac|iwatch|apple ?watch/i },
    samsung: { url: '/reparaties/samsung/', test: /samsung|galaxy|\b[saz] ?\d{1,2}\b|z ?flip|z ?fold|\bnote\b/i }
  };

  function detectBrand(query) {
    if (brandPages.apple.test.test(query)) return 'apple';
    if (brandPages.samsung.test.test(query)) return 'samsung';
    return null;
  }

  var noticeStyle = 'margin:0 auto 28px;max-width:1240px;background:#eef4ff;border:1.5px solid rgba(30,111,255,.35);' +
    'border-radius:14px;padding:16px 20px;display:flex;flex-wrap:wrap;align-items:center;gap:12px 18px;' +
    'font-size:.95rem;color:#1b2533;line-height:1.5;';
  var linkStyle = 'color:#1E6FFF;font-weight:600;white-space:nowrap;';
  var formStyle = 'display:flex;gap:8px;flex:1 1 260px;min-width:0;';
  var inputStyle = 'flex:1;min-width:0;height:42px;border:1.5px solid rgba(10,22,40,.15);border-radius:9px;padding:0 14px;font-size:.95rem;background:#fff;color:#081220;';
  var btnStyle = 'height:42px;padding:0 18px;border:none;border-radius:9px;background:#1E6FFF;color:#fff;font-weight:600;cursor:pointer;font-size:.9rem;';

  function searchForm(action, value) {
    return '<form method="GET" action="' + action + '" style="' + formStyle + '" role="search">' +
      '<input type="text" name="q" value="' + escapeHtml(value) + '" aria-label="Zoek een model" style="' + inputStyle + '">' +
      '<button type="submit" style="' + btnStyle + '">Zoeken</button></form>';
  }

  function makeNotice(html) {
    var el = document.createElement('div');
    el.className = 'coens-search-notice';
    el.setAttribute('role', 'status');
    el.style.cssText = noticeStyle;
    el.innerHTML = html;
    return el;
  }

  function firstSectionContainer() {
    var sec = document.querySelector('.coens-hero ~ .coens-section, .coens-hero ~ section');
    return sec ? (sec.querySelector('.coens-container') || sec) : null;
  }

  function scrollToEl(el) {
    if (!el) return;
    var nav = document.querySelector('.coens-nav');
    var offset = (nav ? nav.getBoundingClientRect().height : 0) + 16;
    var top = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  /* ---------- /reparaties/ : route to the right brand page ---------- */
  function routeFromOverview() {
    var brand = detectBrand(q);
    if (brand) {
      window.location.replace(brandPages[brand].url + '?q=' + encodeURIComponent(q));
      return;
    }
    var container = firstSectionContainer();
    if (!container) return;
    var notice = makeNotice(
      '<span>Geen prijslijst gevonden voor <strong>&ldquo;' + escapeHtml(q) + '&rdquo;</strong>. ' +
      'Kies hieronder een merk, of <a href="/opsturen/" style="' + linkStyle + '">stuur uw toestel op</a> voor een vrijblijvende prijsopgave.</span>' +
      searchForm('/reparaties/', q)
    );
    container.insertBefore(notice, container.firstChild);
    scrollToEl(notice);
  }

  /* ---------- brand pages : filter the model cards ---------- */
  function filterBrandPage() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.gsm-device-card'));
    if (!cards.length) return;

    var qc = compact(q);
    var qTokens = tokens(q).map(compact).filter(function (t) {
      // brand words don't narrow anything down on a brand page
      return t && ['iphone', 'apple', 'samsung', 'galaxy', 'reparatie', 'reparaties', 'scherm', 'accu', 'prijs'].indexOf(t) === -1;
    });

    function cardText(card) {
      var meta = card.querySelector('.gsm-device-meta') || card;
      return compact(meta.textContent);
    }
    function matches(card) {
      var text = cardText(card);
      if (qc && text.indexOf(qc) !== -1) return true;
      if (!qTokens.length) return false;
      return qTokens.every(function (t) { return text.indexOf(t) !== -1; });
    }

    var hits = cards.filter(matches);
    var container = firstSectionContainer();
    var brandWord = path.indexOf('/apple/') !== -1 ? 'iPhone' : 'Samsung';

    if (!qTokens.length || hits.length === cards.length) {
      // query was just the brand name: everything already matches
      return;
    }

    if (!hits.length) {
      if (container) {
        var none = makeNotice(
          '<span>Geen exacte match voor <strong>&ldquo;' + escapeHtml(q) + '&rdquo;</strong>. ' +
          'Hieronder staan alle ' + brandWord + '-modellen. Staat uw toestel er niet bij? ' +
          '<a href="/winkels/" style="' + linkStyle + '">Bel of app een winkel</a>.</span>' +
          searchForm(path, q)
        );
        container.insertBefore(none, container.firstChild);
        scrollToEl(none);
      }
      return;
    }

    // hide non-matching cards, and any series block that ends up empty
    cards.forEach(function (card) {
      card.style.display = hits.indexOf(card) !== -1 ? '' : 'none';
    });
    Array.prototype.forEach.call(document.querySelectorAll('.gsm-brand-section'), function (sec) {
      var visible = Array.prototype.some.call(sec.querySelectorAll('.gsm-device-card'), function (c) {
        return c.style.display !== 'none';
      });
      sec.style.display = visible ? '' : 'none';
    });

    if (container) {
      var label = hits.length === 1 ? '1 model gevonden' : hits.length + ' modellen gevonden';
      var notice = makeNotice(
        '<span><strong>' + label + '</strong> voor &ldquo;' + escapeHtml(q) + '&rdquo;. ' +
        '<a href="' + path + '" style="' + linkStyle + '">Toon alle ' + brandWord + '-modellen</a></span>' +
        searchForm(path, q)
      );
      container.insertBefore(notice, container.firstChild);
    }
    scrollToEl(hits[0].closest('.gsm-brand-section') || hits[0]);
  }

  function run() {
    if (path === '/reparaties/') {
      routeFromOverview();
    } else if (path === '/reparaties/apple/' || path === '/reparaties/samsung/') {
      filterBrandPage();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
