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

  /* ---------- 9. Homepage advice wizard (provider + data usage) ---------- */
  function adviesWizard() {
    if (!document.getElementById('coens-advies-wizard')) return;
    function current() {
      var p = document.querySelector('input[name="coens_wiz_prov"]:checked'), d = document.querySelector('input[name="coens_wiz_data"]:checked');
      return { prov: p ? p.value : 'KPN', data: d ? d.value : '10-50 GB' };
    }
    function sync(scrollToSteps) {
      var c = current();
      Array.prototype.forEach.call(document.querySelectorAll('[data-prov-card]'), function (el) { el.classList.toggle('is-active', el.getAttribute('data-prov-card') === c.prov); });
      var heading = document.getElementById('coens-dynamic-prov-heading');
      if (heading) heading.textContent = 'Abonnement bij ' + c.prov + '? Wij regelen het voor u.';
      var msg = 'Hallo Coen’s, ik wil graag advies over een ' + c.prov + '-abonnement. Ik gebruik ongeveer ' + c.data.toLowerCase() + ' data per maand. Wat raden jullie aan?';
      var cta = document.getElementById('wiz-cta-link');
      if (cta) { cta.href = WA + '?text=' + encodeURIComponent(msg); cta.target = '_blank'; cta.rel = 'noopener'; }
      var stepBtn = document.getElementById('coens-step-store-btn');
      if (stepBtn) stepBtn.href = '/winkels/?provider=' + encodeURIComponent(c.prov) + '&data=' + encodeURIComponent(c.data) + '#contact';
      if (scrollToSteps) { var sec = document.getElementById('abonnementen'); if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }
    document.addEventListener('change', function (e) { if (e.target && (e.target.name === 'coens_wiz_prov' || e.target.name === 'coens_wiz_data')) sync(false); });
    document.addEventListener('click', function (e) {
      var pill = e.target.closest('[data-prov-card]');
      if (pill) { var r = document.querySelector('input[name="coens_wiz_prov"][value="' + pill.getAttribute('data-prov-card') + '"]'); if (r) r.checked = true; sync(true); return; }
      var navCard = e.target.closest('[data-nav-href]');
      if (navCard && !e.target.closest('a')) window.location.href = navCard.getAttribute('data-nav-href');
    });
    document.addEventListener('keydown', function (e) { var pill = e.target.closest && e.target.closest('[data-prov-card]'); if (pill && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pill.click(); } });
    sync(false);
  }

  /* ---------- 10. Winkels contact form: prefill from ?provider=&data= ---------- */
  function prefillContact() {
    var q = new URLSearchParams(location.search), prov = q.get('provider'), data = q.get('data');
    if (!prov) return;
    var ta = document.querySelector('textarea[name="your-message"], textarea[name="Bericht"]');
    if (ta && !ta.value) ta.value = 'Ik wil graag advies over een ' + prov + '-abonnement' + (data ? ' (ik gebruik ongeveer ' + data.toLowerCase() + ' data per maand)' : '') + '.';
  }

  /* ---------- 11. Contact forms: submit to Contact Form 7 (server-side mail) instead of mailto: ---------- */
  function cf7Forms() {
    var forms = document.querySelectorAll('form[data-cf7]');
    if (!forms.length) return;
    function token() {
      var cfg = window.wpcf7_recaptcha;
      if (!cfg || !cfg.sitekey || typeof grecaptcha === 'undefined' || !grecaptcha.execute) return Promise.resolve('');
      return new Promise(function (res) {
        try { grecaptcha.ready(function () { grecaptcha.execute(cfg.sitekey, { action: 'contactform' }).then(res, function () { res(''); }); }); } catch (e) { res(''); }
      });
    }
    function waText(form) {
      var lines = [];
      Array.prototype.forEach.call(form.querySelectorAll('input, select, textarea'), function (el) {
        if (!el.name || el.name.charAt(0) === '_' || el.type === 'checkbox' || el.type === 'hidden' || el.type === 'submit' || !el.value) return;
        var grp = el.closest('.coens-form-group'), lab = grp && grp.querySelector('label');
        var label = lab ? lab.textContent.replace(/\s*\*\s*$/, '').replace(/\s+/g, ' ').trim() : el.name;
        lines.push(label + ': ' + el.value);
      });
      return 'Hallo Coen\u2019s, ik stuur dit via de website (' + (form.getAttribute('data-cf7-label') || document.title.split(' - ')[0]) + ').\n\n' + lines.join('\n');
    }
    Array.prototype.forEach.call(forms, function (form) {
      var id = form.getAttribute('data-cf7'), status = form.querySelector('.coens-form-status'), btn = form.querySelector('[type="submit"]');
      if (!status) { status = document.createElement('div'); status.className = 'coens-form-status'; status.setAttribute('aria-live', 'polite'); form.appendChild(status); }
      function show(kind, msg) { status.className = 'coens-form-status is-' + kind; status.textContent = msg; status.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        Array.prototype.forEach.call(form.querySelectorAll('.is-invalid'), function (el) { el.classList.remove('is-invalid'); });
        if (!form.checkValidity()) { form.reportValidity(); return; }
        var fd = new FormData(form);
        fd.append('_wpcf7', id); fd.append('_wpcf7_version', '6.0'); fd.append('_wpcf7_locale', 'nl_NL');
        fd.append('_wpcf7_unit_tag', 'wpcf7-f' + id + '-o1'); fd.append('_wpcf7_container_post', '0');
        if (!fd.get('your-source')) fd.append('your-source', location.href);
        if (!fd.get('avg')) fd.append('avg', '1');
        var label = btn ? btn.textContent : ''; if (btn) { btn.disabled = true; btn.textContent = 'Versturen…'; }
        token().then(function (tk) {
          if (tk) fd.append('_wpcf7_recaptcha_response', tk);
          return fetch('/wp-json/contact-form-7/v1/contact-forms/' + id + '/feedback', { method: 'POST', body: fd, credentials: 'same-origin' });
        }).then(function (r) { return r.text().then(function (t) { try { return JSON.parse(t); } catch (e) { return { status: 'blocked', http: r.status }; } }); }).then(function (res) {
          if (btn) { btn.disabled = false; btn.textContent = label; }
          if (res.status === 'mail_sent') { show('ok', res.message); form.reset(); return; }
          if (res.status === 'blocked' || res.http === 415) {
            // The hosting firewall rejects form uploads to WordPress: hand the message to WhatsApp instead.
            window.open(WA + '?text=' + encodeURIComponent(waText(form)), '_blank', 'noopener');
            show('ok', 'Uw bericht staat klaar in WhatsApp: druk daar op verzenden. Liever bellen? 0497-550560.');
            return;
          }
          if (res.status === 'validation_failed' && res.invalid_fields) {
            res.invalid_fields.forEach(function (f) { var el = form.querySelector('[name="' + f.field + '"]'); if (el) el.classList.add('is-invalid'); });
            var first = res.invalid_fields[0]; show('error', (first && first.message) || res.message); return;
          }
          show('error', res.message || 'Het versturen is mislukt. Bel of app ons gerust op 0497-550560.');
        }).catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = label; }
          window.open(WA + '?text=' + encodeURIComponent(waText(form)), '_blank', 'noopener');
          show('ok', 'Uw bericht staat klaar in WhatsApp: druk daar op verzenden. Liever bellen? 0497-550560.');
        });
      });
    });
  }

  /* ---------- 12. Scroll reveal for .reveal elements ---------- */
  function reveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { Array.prototype.forEach.call(els, function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { threshold: 0.15 });
    Array.prototype.forEach.call(els, function (e) { io.observe(e); });
  }

  /* ---------- 13. LN homepage effects: preloader + collage parallax + hero status ---------- */
  function landoFx() {
    var hero = document.querySelector('.ln-hero');
    if (!hero) return;
    // preloader (once per session)
    var seen = false; try { seen = sessionStorage.getItem('coens-loaded') === '1'; } catch (e) {}
    if (!seen) {
      var l = document.createElement('div'); l.className = 'ln-loader';
      l.innerHTML = '<img src="https://www.coens.nl/wp-content/uploads/2017/10/coens_for_dark_72dpi.png" alt="Coen\u2019s"><span>Telecom &amp; More</span>';
      document.body.appendChild(l);
      var hide = function () { l.classList.add('done'); try { sessionStorage.setItem('coens-loaded', '1'); } catch (e) {} setTimeout(function () { l.remove(); }, 700); };
      if (document.readyState === 'complete') setTimeout(hide, 900); else window.addEventListener('load', function () { setTimeout(hide, 700); });
      setTimeout(hide, 3500);
    }
    // collage parallax on pointer move
    var figs = hero.querySelectorAll('.ln-collage figure');
    if (figs.length && window.matchMedia('(hover: hover)').matches) {
      hero.addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        Array.prototype.forEach.call(figs, function (f, i) { var d = (i + 1) * 6; f.style.transform = 'translate(' + (x * d) + 'px,' + (y * d) + 'px)'; });
      });
      hero.addEventListener('mouseleave', function () { Array.prototype.forEach.call(figs, function (f) { f.style.transform = ''; }); });
    }
  }


  /* ---------- 14. Nav 2.0: capsule on scroll, sliding pill, progress line, hide on scroll down ---------- */
  function navFx() {
    var nav = document.querySelector('.coens-nav');
    if (!nav) return;
    var inner = nav.querySelector('.coens-nav-inner');
    var bar = document.createElement('div'); bar.className = 'coens-nav-progress'; nav.appendChild(bar);
    var menu = nav.querySelector('.coens-desktop-nav .coens-menu');
    var glider = null, active = null;
    if (menu) {
      glider = document.createElement('li'); glider.className = 'coens-menu-glider'; glider.setAttribute('aria-hidden', 'true'); menu.appendChild(glider);
      active = menu.querySelector('a.active');
      var moveTo = function (a) {
        if (!a) { glider.classList.remove('on'); return; }
        var mr = menu.getBoundingClientRect(), r = a.getBoundingClientRect();
        glider.style.left = (r.left - mr.left) + 'px'; glider.style.width = r.width + 'px'; glider.classList.add('on');
      };
      var links = menu.querySelectorAll('a');
      Array.prototype.forEach.call(links, function (a) {
        a.addEventListener('mouseenter', function () { Array.prototype.forEach.call(links, function (x) { x.classList.remove('is-lit'); }); a.classList.add('is-lit'); moveTo(a); });
        a.addEventListener('focus', function () { a.classList.add('is-lit'); moveTo(a); });
        a.addEventListener('blur', function () { a.classList.remove('is-lit'); moveTo(active); });
      });
      menu.addEventListener('mouseleave', function () { Array.prototype.forEach.call(links, function (x) { x.classList.remove('is-lit'); }); moveTo(active); });
      var rest = function () { glider.style.transition = 'none'; moveTo(active); setTimeout(function () { glider.style.transition = ''; }, 50); };
      rest(); window.addEventListener('resize', rest); window.addEventListener('load', rest);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(rest);
    }
    var last = window.pageYOffset || 0, ticking = false;
    var update = function () {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? Math.min(100, Math.max(0, y / h * 100)) : 0) + '%';
      nav.classList.toggle('is-scrolled', y > 60);
      var drawer = nav.querySelector('details.coens-mobile-nav');
      var open = drawer && drawer.open;
      if (!open) {
        if (y > 320 && y > last + 6) nav.classList.add('is-hidden');
        else if (y < last - 6 || y <= 320) nav.classList.remove('is-hidden');
      } else nav.classList.remove('is-hidden');
      last = y;
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  ready(function () {
    [footerAppLink, themeToggle, stickyBar, drawerStores, openingHours, wizard, faqSchema, businessSchema, adviesWizard, prefillContact, cf7Forms, reveal, landoFx, navFx].forEach(function (fn) {
      try { fn(); } catch (e) { if (window.console) console.warn('coens-ui:', fn.name, e); }
    });
  });
})();
