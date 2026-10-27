/* Coen's UI add-ons: sticky phone bar, live opening hours, repair wizard, FAQ schema.
   Loaded on every page. Safe to run anywhere: each part only activates when its markup exists. */
(function () {
  'use strict';
  var PHONE = '0497-550560', TEL = 'tel:+31497550560', WA = 'https://wa.me/31497550560';

  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  /* ---------- 1. Sticky bottom bar on phones (Bellen / WhatsApp / Reparatie kiezen) ---------- */
  function stickyBar() {
    if (!document.querySelector('.coens-site-wrapper') || document.querySelector('.coens-sticky-bar')) return;
    var bar = document.createElement('div');
    bar.className = 'coens-sticky-bar';
    bar.setAttribute('aria-label', 'Snel contact');
    bar.innerHTML =
      '<a href="' + TEL + '"><span class="csb-ico">📞</span><span>Bellen</span></a>' +
      '<a href="' + WA + '" target="_blank" rel="noopener"><span class="csb-ico">💬</span><span>WhatsApp</span></a>' +
      '<a href="/#coens-wizard" class="csb-primary"><span class="csb-ico">🔧</span><span>Reparatie kiezen</span></a>';
    document.body.appendChild(bar);
    document.body.classList.add('has-coens-sticky-bar');
  }

  /* ---------- 2. Live opening hours badge ---------- */
  // Default week: Mon-Fri 09:00-17:30, Sat 09:00-17:00, Sun closed. Override per element with
  // data-coens-hours="09:00-17:30|09:00-17:30|09:00-17:30|09:00-17:30|09:00-17:30|09:00-17:00|-" (Mon..Sun)
  var DEFAULT_HOURS = '09:00-17:30|09:00-17:30|09:00-17:30|09:00-17:30|09:00-17:30|09:00-17:00|-';
  var DAYS = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
  function amsterdamNow() {
    try {
      var p = new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
      var wd = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].indexOf(o.weekday.slice(0, 2).toLowerCase());
      return { day: wd < 0 ? new Date().getDay() - 1 : wd, mins: parseInt(o.hour, 10) * 60 + parseInt(o.minute, 10) };
    } catch (e) { var d = new Date(); return { day: (d.getDay() + 6) % 7, mins: d.getHours() * 60 + d.getMinutes() }; }
  }
  function toMins(t) { var a = t.split(':'); return parseInt(a[0], 10) * 60 + parseInt(a[1], 10); }
  function hoursStatus(spec) {
    var week = (spec || DEFAULT_HOURS).split('|'), now = amsterdamNow(), today = week[now.day];
    if (today && today !== '-') {
      var r = today.split('-'), open = toMins(r[0]), close = toMins(r[1]);
      if (now.mins >= open && now.mins < close) {
        var soon = close - now.mins <= 45;
        return { open: true, text: (soon ? 'Sluit om ' : 'Nu open · tot ') + r[1], soon: soon };
      }
      if (now.mins < open) return { open: false, text: 'Opent vandaag om ' + r[0] };
    }
    for (var i = 1; i <= 7; i++) {
      var d = (now.day + i) % 7, h = week[d];
      if (h && h !== '-') return { open: false, text: 'Gesloten · opent ' + (i === 1 ? 'morgen' : DAYS[d]) + ' ' + h.split('-')[0] };
    }
    return { open: false, text: 'Gesloten' };
  }
  function openingHours() {
    var els = document.querySelectorAll('[data-coens-hours]');
    if (!els.length) return;
    function paint() {
      Array.prototype.forEach.call(els, function (el) {
        var s = hoursStatus(el.getAttribute('data-coens-hours'));
        el.textContent = s.text;
        el.classList.toggle('is-open', s.open);
        el.classList.toggle('is-soon', !!s.soon);
        el.classList.toggle('is-closed', !s.open);
      });
    }
    paint(); setInterval(paint, 60000);
  }

  /* ---------- 3. Repair wizard: brand -> model -> prices, read live from our own price pages ---------- */
  var BRANDS = {
    apple: { label: 'Apple', sub: 'iPhone', icon: '🍏', url: '/reparaties/apple/' },
    samsung: { label: 'Samsung', sub: 'Galaxy', icon: '📱', url: '/reparaties/samsung/' },
    other: { label: 'Ander merk', sub: 'Tablet, iPad, overig', icon: '💬' }
  };
  var cache = {};
  function loadModels(brand) {
    if (cache[brand]) return Promise.resolve(cache[brand]);
    return fetch(BRANDS[brand].url, { credentials: 'same-origin' }).then(function (r) { return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var list = Array.prototype.map.call(doc.querySelectorAll('.gsm-device-card'), function (c) {
        var name = (c.querySelector('h4') || {}).textContent || '';
        return {
          name: name.trim(),
          repairs: Array.prototype.map.call(c.querySelectorAll('.gsm-rep-item'), function (i) {
            return {
              name: ((i.querySelector('strong') || {}).textContent || '').trim(),
              sub: ((i.querySelector('.gsm-rep-item-left span') || {}).textContent || '').trim(),
              price: ((i.querySelector('.gsm-rep-item-price') || {}).textContent || '').trim(),
              hi: i.classList.contains('highlight')
            };
          })
        };
      }).filter(function (m) { return m.name; });
      cache[brand] = list; return list;
    });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function wizard() {
    var root = document.getElementById('coens-wizard');
    if (!root) return;
    var state = { step: 1, brand: null, model: null, models: [], q: '' };
    function steps() {
      var names = ['Merk', 'Model', 'Prijs'];
      return '<ol class="cw-steps">' + names.map(function (n, i) {
        var k = i + 1, cls = k < state.step ? 'done' : k === state.step ? 'active' : '';
        return '<li class="' + cls + '"><span>' + (k < state.step ? '✓' : k) + '</span>' + n + '</li>';
      }).join('') + '</ol>';
    }
    function render() {
      var h = '<div class="cw-head"><h3>Reparatie-wizard</h3>' + steps() + '</div>';
      if (state.step === 1) {
        h += '<p class="cw-q">Welk merk heeft u?</p><div class="cw-grid">';
        Object.keys(BRANDS).forEach(function (k) {
          var b = BRANDS[k];
          h += '<button type="button" class="cw-opt" data-brand="' + k + '"><span class="cw-ico">' + b.icon + '</span><strong>' + b.label + '</strong><small>' + b.sub + '</small></button>';
        });
        h += '</div>';
      } else if (state.step === 2) {
        h += '<button type="button" class="cw-back" data-back="1">← Terug</button><p class="cw-q">Kies uw model</p>';
        if (!state.models.length) {
          h += '<p class="cw-loading">Prijzen laden…</p>';
        } else {
          h += '<input type="search" class="cw-search" placeholder="Zoek uw model, bijv. 15 Pro of S24" value="' + esc(state.q) + '" autocomplete="off">';
          var q = state.q.toLowerCase().replace(/\s+/g, '');
          var list = state.models.filter(function (m) { return !q || m.name.toLowerCase().replace(/\s+/g, '').indexOf(q) >= 0; });
          h += '<div class="cw-list">' + (list.length ? list.map(function (m, i) {
            return '<button type="button" class="cw-model" data-model="' + state.models.indexOf(m) + '">' + esc(m.name) + ' <span>›</span></button>';
          }).join('') : '<p class="cw-empty">Geen model gevonden. <a href="' + WA + '" target="_blank" rel="noopener">Vraag het via WhatsApp</a>.</p>') + '</div>';
        }
      } else {
        var m = state.model, b = BRANDS[state.brand];
        h += '<button type="button" class="cw-back" data-back="2">← Terug</button><p class="cw-q">' + esc(m.name) + '</p><div class="cw-prices">';
        m.repairs.forEach(function (r) {
          h += '<div class="cw-price' + (r.hi ? ' hi' : '') + '"><div><strong>' + esc(r.name) + '</strong>' + (r.sub ? '<small>' + esc(r.sub) + '</small>' : '') + '</div><b>' + esc(r.price) + '</b></div>';
        });
        h += '</div><p class="cw-note">Alle prijzen inclusief BTW, montage en 3 maanden garantie. No cure, no pay.</p>';
        h += '<div class="cw-actions"><a class="coens-btn-cta" href="' + b.url + '?q=' + encodeURIComponent(m.name) + '">Alle details &rarr;</a><a class="cw-wa" href="' + WA + '?text=' + encodeURIComponent('Hallo, ik heb een vraag over een reparatie voor mijn ' + m.name) + '" target="_blank" rel="noopener">💬 Vraag via WhatsApp</a></div>';
      }
      root.innerHTML = h;
      var s = root.querySelector('.cw-search');
      if (s && state.q !== undefined && document.activeElement !== s && state.focusSearch) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
    }
    root.addEventListener('click', function (e) {
      var t = e.target.closest('[data-brand],[data-model],[data-back]');
      if (!t) return;
      if (t.hasAttribute('data-back')) { state.step = parseInt(t.getAttribute('data-back'), 10); state.focusSearch = false; render(); return; }
      if (t.hasAttribute('data-brand')) {
        var k = t.getAttribute('data-brand');
        if (k === 'other') { window.open(WA + '?text=' + encodeURIComponent('Hallo, ik heb een vraag over een reparatie van een ander merk / tablet.'), '_blank', 'noopener'); return; }
        state.brand = k; state.step = 2; state.models = []; state.q = ''; state.focusSearch = false; render();
        loadModels(k).then(function (list) { if (state.brand === k) { state.models = list; render(); } })
          .catch(function () { root.querySelector('.cw-loading').innerHTML = 'Prijzen konden niet geladen worden. <a href="' + BRANDS[k].url + '">Bekijk de tarievenlijst</a>.'; });
        return;
      }
      state.model = state.models[parseInt(t.getAttribute('data-model'), 10)]; state.step = 3; render();
      root.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    root.addEventListener('input', function (e) {
      if (e.target.classList.contains('cw-search')) { state.q = e.target.value; state.focusSearch = true; render(); }
    });
    render();
  }

  /* ---------- 4. FAQ schema from the FAQ markup on the page ---------- */
  function faqSchema() {
    var items = document.querySelectorAll('.coens-faq details');
    if (!items.length || document.getElementById('coens-faq-ld')) return;
    var main = Array.prototype.map.call(items, function (d) {
      var q = d.querySelector('summary'), a = d.querySelector('.coens-faq-a, p');
      return q && a ? { '@type': 'Question', name: q.textContent.trim(), acceptedAnswer: { '@type': 'Answer', text: a.textContent.trim() } } : null;
    }).filter(Boolean);
    var s = document.createElement('script'); s.type = 'application/ld+json'; s.id = 'coens-faq-ld';
    s.text = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: main });
    document.head.appendChild(s);
  }

  /* ---------- 5. Business + store structured data (Organization, 3x MobilePhoneStore) ---------- */
  function businessSchema() {
    if (document.getElementById('coens-biz-ld')) return;
    var hours = [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '17:30' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '09:00', closes: '17:00' }
    ];
    function store(id, name, street, zip, city, email) {
      return {
        '@type': 'MobilePhoneStore', '@id': 'https://www.coens.nl/winkels/#' + id, name: "Coen's " + city,
        url: 'https://www.coens.nl/winkels/#' + id, telephone: '+31497550560', email: email,
        image: 'https://www.coens.nl/wp-content/uploads/2017/10/coens_for_dark_72dpi.png',
        address: { '@type': 'PostalAddress', streetAddress: street, postalCode: zip, addressLocality: city, addressRegion: 'Noord-Brabant', addressCountry: 'NL' },
        openingHoursSpecification: hours, priceRange: '€€', parentOrganization: { '@id': 'https://www.coens.nl/#organization' }
      };
    }
    var data = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Organization', '@id': 'https://www.coens.nl/#organization', name: "Coen's Telecom & More", alternateName: "Coen's",
        url: 'https://www.coens.nl', telephone: '+31497550560', email: 'info@coens.nl', foundingDate: '1995',
        logo: 'https://www.coens.nl/wp-content/uploads/2017/10/coens_for_dark_72dpi.png',
        address: { '@type': 'PostalAddress', streetAddress: 'Hof 31', postalCode: '5571 CB', addressLocality: 'Bergeijk', addressCountry: 'NL' },
        areaServed: ['Bergeijk', 'Bladel', 'Valkenswaard', 'De Kempen'] },
      store('bergeijk', 'Bergeijk', 'Hof 31', '5571 CB', 'Bergeijk', 'bergeijk@coens.nl'),
      store('bladel', 'Bladel', 'Sniederslaan 55 A', '5531 EH', 'Bladel', 'bladel@coens.nl'),
      store('valkenswaard', 'Valkenswaard', 'Passage 1', '5554 AH', 'Valkenswaard', 'valkenswaard@coens.nl')
    ] };
    var s = document.createElement('script'); s.type = 'application/ld+json'; s.id = 'coens-biz-ld';
    s.text = JSON.stringify(data); document.head.appendChild(s);
  }

  /* ---------- 6. Store status inside the hamburger drawer (phones / tablets) ---------- */
  function drawerStores() {
    var drawer = document.querySelector('.coens-mobile-drawer');
    if (!drawer || drawer.querySelector('.coens-drawer-stores')) return;
    var stores = [['bergeijk', 'Bergeijk'], ['bladel', 'Bladel'], ['valkenswaard', 'Valkenswaard']];
    var box = document.createElement('div');
    box.className = 'coens-drawer-stores';
    box.innerHTML = '<div class="coens-drawer-stores-title">Onze winkels</div>' + stores.map(function (st) {
      return '<a href="/winkels/#' + st[0] + '"><span>📍 ' + st[1] + '</span><span class="coens-store-status" data-coens-hours="">…</span></a>';
    }).join('') + '<a class="coens-drawer-app" href="/coens-app/">📲 Open de Coen’s app <span>prijzen · inruilen · boeken</span></a>';
    var cta = drawer.querySelector('.coens-btn-cta');
    while (cta && cta.parentNode !== drawer) cta = cta.parentNode;
    if (cta) drawer.insertBefore(box, cta); else drawer.appendChild(box);
  }

  /* ---------- 7. Dark / light theme toggle ---------- */
  var ICON_SUN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var ICON_MOON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    Array.prototype.forEach.call(document.querySelectorAll('.coens-theme-toggle'), function (b) {
      b.innerHTML = (t === 'dark' ? ICON_SUN : ICON_MOON) + '<span class="ctt-label">' + (t === 'dark' ? 'Licht' : 'Donker') + '</span>';
      b.setAttribute('aria-label', t === 'dark' ? 'Schakel naar licht thema' : 'Schakel naar donker thema');
      b.title = b.getAttribute('aria-label');
    });
  }
  function themeToggle() {
    var saved = null; try { saved = localStorage.getItem('coens-theme'); } catch (e) {}
    var nav = document.querySelector('.coens-nav-inner');
    if (nav && !nav.querySelector('.coens-theme-toggle')) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'coens-theme-toggle';
      var mob = nav.querySelector('.coens-mobile-nav');
      if (mob) nav.insertBefore(b, mob); else nav.appendChild(b);
      b.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem('coens-theme', next); } catch (e) {}
        applyTheme(next);
      });
    }
    // Light (the original design) is the default; dark only when the visitor chooses it.
    applyTheme(saved === 'dark' ? 'dark' : 'light');
  }

  /* ---------- 8. App link in the footer ---------- */
  function footerAppLink() {
    var col = Array.prototype.filter.call(document.querySelectorAll('.coens-footer-col h4'), function (h) { return /contact/i.test(h.textContent); })[0];
    if (!col || col.parentNode.querySelector('.coens-footer-app')) return;
    var a = document.createElement('a'); a.className = 'coens-footer-app'; a.href = '/coens-app/';
    a.innerHTML = '📲 Coen’s app: prijzen, inruilen en reparatie boeken';
    col.parentNode.appendChild(a);
  }

  ready(function () {
    [footerAppLink, themeToggle, stickyBar, drawerStores, openingHours, wizard, faqSchema, businessSchema].forEach(function (fn) {
      try { fn(); } catch (e) { if (window.console) console.warn('coens-ui:', fn.name, e); }
    });
  });
})();
