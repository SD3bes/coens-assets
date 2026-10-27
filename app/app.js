/* Coen's app (PWA): prices, trade-in, booking, tickets, stores. Runs on https://www.coens.nl/app/ */
(function () {
  'use strict';
  var PHONE = '0497-550560', TEL = 'tel:+31497550560', WA = 'https://wa.me/31497550560', MAIL = 'info@coens.nl';
  var MANIFEST = document.currentScript && document.currentScript.src ? document.currentScript.src.replace(/app\.js(\?.*)?$/, 'manifest.json') : '';
  var ICON = 'https://www.coens.nl/wp-content/uploads/2021/01/coens_for_light_square.png';

  var STORES = [
    { id: 'bergeijk', name: "Coen's Bergeijk", street: 'Hof 31', zip: '5571 CB', city: 'Bergeijk', email: 'bergeijk@coens.nl', tip: 'Gratis parkeren (blauwe zone) voor de deur op het Hof.', dest: "Coen's Bergeijk, Hof 31, 5571 CB Bergeijk" },
    { id: 'bladel', name: "Coen's Bladel", street: 'Sniederslaan 55 A', zip: '5531 EH', city: 'Bladel', email: 'bladel@coens.nl', tip: 'Ruime parkeergelegenheid in het centrum.', dest: "Coen's Bladel, Sniederslaan 55 A, 5531 EH Bladel" },
    { id: 'valkenswaard', name: "Coen's Valkenswaard", street: 'Passage 1', zip: '5554 AH', city: 'Valkenswaard', email: 'valkenswaard@coens.nl', tip: 'In de overdekte Passage in het winkelhart.', dest: "Coen's Valkenswaard, Passage 1, 5554 AH Valkenswaard" }
  ];
  var HOURS = '09:00-17:30|09:00-17:30|09:00-17:30|09:00-17:30|09:00-17:30|09:00-17:00|-';
  var DAYS = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
  var PROBLEMS = ['Scherm gebarsten', 'Accu / batterij', 'Laadpoort', 'Camera', 'Speaker / microfoon', 'Waterschade', 'Software', 'Backcover / glas', 'Anders'];
  var BRANDS = { apple: { label: 'Apple iPhone', url: '/reparaties/apple/' }, samsung: { label: 'Samsung Galaxy', url: '/reparaties/samsung/' } };

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function toast(msg) { var t = $('.ca-toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 2200); }
  function nowAms() {
    try {
      var p = new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
      var wd = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].indexOf(o.weekday.slice(0, 2).toLowerCase());
      return { day: wd < 0 ? (new Date().getDay() + 6) % 7 : wd, mins: parseInt(o.hour, 10) * 60 + parseInt(o.minute, 10) };
    } catch (e) { var d = new Date(); return { day: (d.getDay() + 6) % 7, mins: d.getHours() * 60 + d.getMinutes() }; }
  }
  function toMins(t) { var a = t.split(':'); return +a[0] * 60 + +a[1]; }
  function status() {
    var week = HOURS.split('|'), n = nowAms(), today = week[n.day];
    if (today && today !== '-') {
      var r = today.split('-'), o = toMins(r[0]), c = toMins(r[1]);
      if (n.mins >= o && n.mins < c) { var soon = c - n.mins <= 45; return { cls: soon ? 'is-soon' : 'is-open', text: (soon ? 'Sluit om ' : 'Nu open · tot ') + r[1] }; }
      if (n.mins < o) return { cls: 'is-closed', text: 'Opent vandaag om ' + r[0] };
    }
    for (var i = 1; i <= 7; i++) { var d = (n.day + i) % 7, h = week[d]; if (h && h !== '-') return { cls: 'is-closed', text: 'Gesloten · opent ' + (i === 1 ? 'morgen' : DAYS[d]) + ' ' + h.split('-')[0] }; }
    return { cls: 'is-closed', text: 'Gesloten' };
  }
  function fetchCards(url) {
    return fetch(url, { credentials: 'same-origin' }).then(function (r) { return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html'), out = [];
      var sections = doc.querySelectorAll('.gsm-brand-section');
      var groups = sections.length ? Array.prototype.map.call(sections, function (s) { return { title: ((s.querySelector('h2, h3') || {}).textContent || '').trim(), cards: s.querySelectorAll('.gsm-device-card') }; }) : [{ title: '', cards: doc.querySelectorAll('.gsm-device-card') }];
      groups.forEach(function (g) {
        Array.prototype.forEach.call(g.cards, function (c) {
          var name = ((c.querySelector('h4') || {}).textContent || '').trim(); if (!name) return;
          out.push({ group: g.title, name: name, sub: ((c.querySelector('.gsm-device-quickprice') || {}).textContent || '').trim(),
            rows: Array.prototype.map.call(c.querySelectorAll('.gsm-rep-item'), function (i) {
              return { name: ((i.querySelector('strong') || {}).textContent || '').trim(), sub: ((i.querySelector('.gsm-rep-item-left span') || {}).textContent || '').trim(), price: ((i.querySelector('.gsm-rep-item-price') || {}).textContent || '').trim(), hi: i.classList.contains('highlight') };
            }) });
        });
      });
      return out;
    });
  }
  function compact(s) { return s.toLowerCase().replace(/[^a-z0-9]/g, ''); }

  /* ---------- state ---------- */
  var state = { tab: 'home', brand: 'apple', models: {}, model: null, q: '', tradein: null, tq: '', booking: { type: 'reparatie' } };
  var root = document.getElementById('coens-app');
  var qs = new URLSearchParams(location.search);

  /* ---------- views ---------- */
  function viewHome() {
    var s = status(), tickets = store('coens-tickets') || [];
    return '<div class="ca-install" id="ca-install"><strong>Zet Coen’s op uw beginscherm</strong><p id="ca-install-text">Dan opent de app met één tik, net als een gewone app.</p><button class="ca-btn gold sm" id="ca-install-btn">Installeren</button><button class="ca-dismiss" id="ca-install-no">Niet nu</button></div>' +
      '<h1 class="ca-h1">Waarmee kunnen we helpen?</h1><p class="ca-sub">Eerlijke prijzen, klaar terwijl u wacht. Drie winkels in de Kempen.</p>' +
      '<div class="ca-grid">' +
      '<button class="ca-tile" data-go="prijzen"><span class="ca-ico">🔧</span><strong>Reparatieprijs</strong><small>iPhone en Samsung, alle prijzen incl. BTW</small></button>' +
      '<button class="ca-tile gold" data-go="inruilen"><span class="ca-ico">🔄</span><strong>Inruilwaarde</strong><small>Wat is uw oude toestel waard?</small></button>' +
      '<button class="ca-tile green" data-go="boeken"><span class="ca-ico">📅</span><strong>Reparatie boeken</strong><small>Kies winkel, dag en tijd</small></button>' +
      '<a class="ca-tile" href="/opsturen/"><span class="ca-ico">📦</span><strong>Toestel opsturen</strong><small>Binnen 24–48 uur retour</small></a>' +
      '</div>' +
      (tickets.length ? '<div class="ca-card"><div class="ca-row"><strong>Mijn aanvragen</strong><button class="ca-btn ghost sm" data-go="boeken" data-sub="tickets">Bekijk</button></div><p class="ca-note" style="margin:6px 0 0">' + tickets.length + ' aanvraag' + (tickets.length > 1 ? 'en' : '') + ' · laatste: ' + esc(tickets[0].id) + '</p></div>' : '') +
      '<div class="ca-card"><div class="ca-row"><div><strong>Winkels</strong><div class="ca-note" style="margin:2px 0 0">Bergeijk · Bladel · Valkenswaard</div></div><span class="ca-badge ' + s.cls + '" style="margin:0">' + esc(s.text) + '</span></div>' +
      '<div class="ca-store-actions" style="margin-top:12px"><a class="ca-btn sm" href="' + TEL + '">📞 Bellen</a><a class="ca-btn wa sm" href="' + WA + '" target="_blank" rel="noopener">💬 WhatsApp</a></div></div>' +
      '<div class="ca-card"><strong>Goed om te weten</strong><p class="ca-note" style="margin:6px 0 0">Scherm of accu meestal in 30–45 minuten klaar. No cure, no pay. 3 maanden garantie op het onderdeel en de montage. Geen afspraak nodig, binnenlopen mag altijd.</p></div>';
  }

  function viewPrijzen() {
    var h = '<h1 class="ca-h1">Reparatieprijzen</h1><p class="ca-sub">Rechtstreeks uit onze prijslijst, inclusief BTW en montage.</p>';
    if (state.model) {
      var m = state.model;
      h += '<button class="ca-back" data-back="prijzen">← Alle modellen</button><div class="ca-card"><strong style="font-size:1.05rem">' + esc(m.name) + '</strong>' + (m.sub ? '<div class="ca-note" style="margin:2px 0 0">' + esc(m.sub) + '</div>' : '') +
        '<div class="ca-prices">' + m.rows.map(function (r) { return '<div class="ca-price-row' + (r.hi ? ' hi' : '') + '"><div><strong>' + esc(r.name) + '</strong>' + (r.sub ? '<small>' + esc(r.sub) + '</small>' : '') + '</div><b>' + esc(r.price) + '</b></div>'; }).join('') + '</div>' +
        '<p class="ca-note">Alle prijzen inclusief BTW, montage en 3 maanden garantie. No cure, no pay.</p>' +
        '<button class="ca-btn" data-book="' + esc(m.name) + '">📅 Deze reparatie boeken</button>' +
        '<a class="ca-btn wa" href="' + WA + '?text=' + encodeURIComponent('Hallo, ik heb een vraag over een reparatie voor mijn ' + m.name) + '" target="_blank" rel="noopener">💬 Vraag via WhatsApp</a></div>';
      return h;
    }
    h += '<div class="ca-chips">' + Object.keys(BRANDS).map(function (k) { return '<button class="ca-chip' + (state.brand === k ? ' active' : '') + '" data-brand="' + k + '">' + BRANDS[k].label + '</button>'; }).join('') + '</div>';
    h += '<input class="ca-search" id="ca-q" type="search" placeholder="Zoek uw model, bijv. 15 Pro of S24" value="' + esc(state.q) + '" autocomplete="off">';
    var list = state.models[state.brand];
    if (!list) return h + '<p class="ca-loading">Prijzen laden…</p>';
    if (list.error) return h + '<p class="ca-empty">Prijzen konden niet geladen worden. <a href="' + BRANDS[state.brand].url + '" style="color:var(--blue)">Open de prijslijst</a>.</p>';
    var q = compact(state.q), rows = list.filter(function (m) { return !q || compact(m.name).indexOf(q) >= 0 || compact(m.group).indexOf(q) >= 0; });
    if (!rows.length) return h + '<p class="ca-empty">Geen model gevonden. <a href="' + WA + '" target="_blank" rel="noopener" style="color:var(--blue)">Vraag het via WhatsApp</a>.</p>';
    var cur = null; h += '<div class="ca-list">';
    rows.forEach(function (m, i) {
      if (m.group && m.group !== cur) { cur = m.group; h += '<div class="ca-group">' + esc(cur) + '</div>'; }
      var hi = m.rows.filter(function (r) { return r.hi; })[0] || m.rows[0];
      h += '<button class="ca-item" data-model="' + list.indexOf(m) + '"><span>' + esc(m.name) + (hi ? '<small>' + esc(hi.name) + '</small>' : '') + '</span><span class="ca-price">' + (hi ? esc(hi.price) : '') + ' <span class="ca-arrow">›</span></span></button>';
    });
    return h + '</div>';
  }

  function viewInruilen() {
    var h = '<h1 class="ca-h1">Inruilwaarde</h1><p class="ca-sub">Richtprijzen voor een toestel in nette staat (100% werkend). Definitieve taxatie binnen 10 minuten in de winkel: direct geld of +10% winkeltegoed.</p>';
    h += '<input class="ca-search" id="ca-tq" type="search" placeholder="Zoek uw model" value="' + esc(state.tq) + '" autocomplete="off">';
    if (!state.tradein) return h + '<p class="ca-loading">Inruilwaarden laden…</p>';
    if (state.tradein.error) return h + '<p class="ca-empty">Kon niet laden. <a href="/inruilen/" style="color:var(--blue)">Open de inruilpagina</a>.</p>';
    var q = compact(state.tq), any = false; h += '<div class="ca-list">';
    state.tradein.forEach(function (c) {
      var rows = c.rows.filter(function (r) { return !q || compact(r.name).indexOf(q) >= 0 || compact(c.name).indexOf(q) >= 0; });
      if (!rows.length) return; any = true;
      h += '<div class="ca-group">' + esc(c.name) + '</div>' + rows.map(function (r) { return '<button class="ca-item" data-tradein="' + esc(r.name) + '"><span>' + esc(r.name) + (r.sub ? '<small>' + esc(r.sub) + '</small>' : '') + '</span><span class="ca-price">' + esc(r.price) + ' <span class="ca-arrow">›</span></span></button>'; }).join('');
    });
    h += '</div>';
    if (!any) h += '<p class="ca-empty">Geen model gevonden. Kom langs voor een gratis taxatie, of <a href="' + WA + '" target="_blank" rel="noopener" style="color:var(--blue)">vraag het via WhatsApp</a>.</p>';
    return h + '<div class="ca-card" style="margin-top:14px"><strong>Zo werkt inruilen</strong><p class="ca-note" style="margin:6px 0 10px">1. Kom langs met uw toestel. 2. Wij taxeren het in 10 minuten. 3. U krijgt direct geld, of +10% als winkeltegoed voor een Tweede Kansje of nieuw toestel.</p><button class="ca-btn gold" data-book-type="inruilen">🔄 Inruilen aanvragen</button></div>';
  }

  function viewBoeken() {
    var b = state.booking, tickets = store('coens-tickets') || [];
    if (state.sub === 'tickets') return viewTickets(tickets);
    var dates = []; var d = new Date();
    for (var i = 0; i < 14; i++) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i); var wd = (x.getDay() + 6) % 7; if (wd === 6) continue; dates.push({ v: x.toISOString().slice(0, 10), t: (i === 0 ? 'Vandaag' : i === 1 ? 'Morgen' : DAYS[wd].slice(0, 2) + ' ' + x.getDate() + '/' + (x.getMonth() + 1)) }); }
    var times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
    var h = '<h1 class="ca-h1">Reparatie boeken</h1><p class="ca-sub">Geen afspraak nodig, maar met een aanvraag leggen we het onderdeel voor u klaar. U ontvangt de bevestiging via WhatsApp.</p>';
    if (tickets.length) h += '<button class="ca-btn ghost sm" data-sub="tickets" style="margin-bottom:12px">📋 Mijn aanvragen (' + tickets.length + ')</button>';
    h += '<div class="ca-seg">' + [['reparatie', 'Reparatie'], ['inruilen', 'Inruilen'], ['advies', 'Advies']].map(function (t) { return '<button data-type="' + t[0] + '" class="' + (b.type === t[0] ? 'active' : '') + '">' + t[1] + '</button>'; }).join('') + '</div>';
    h += '<form id="ca-form" class="ca-card">';
    h += '<div class="ca-field"><label>Merk en model</label><input name="model" required placeholder="bijv. iPhone 14 Pro of Galaxy S24" value="' + esc(b.model || '') + '"></div>';
    if (b.type === 'reparatie') h += '<div class="ca-field"><label>Probleem</label><select name="problem">' + PROBLEMS.map(function (p) { return '<option' + (b.problem === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select></div>';
    h += '<div class="ca-field"><label>Winkel</label><select name="store">' + STORES.map(function (s) { return '<option value="' + s.id + '"' + (b.store === s.id ? ' selected' : '') + '>' + s.name + ' – ' + s.street + '</option>'; }).join('') + '</select></div>';
    h += '<div class="ca-two"><div class="ca-field"><label>Dag</label><select name="date">' + dates.map(function (x) { return '<option value="' + x.v + '">' + x.t + '</option>'; }).join('') + '</select></div><div class="ca-field"><label>Tijd (voorkeur)</label><select name="time">' + times.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></div></div>';
    h += '<div class="ca-two"><div class="ca-field"><label>Uw naam</label><input name="name" required placeholder="Voornaam" value="' + esc(b.name || '') + '"></div><div class="ca-field"><label>Telefoon</label><input name="phone" type="tel" required placeholder="06-12345678" value="' + esc(b.phone || '') + '"></div></div>';
    h += '<div class="ca-field"><label>Opmerking (optioneel)</label><textarea name="note" placeholder="Bijv. kleur, of wat er precies gebeurd is"></textarea></div>';
    h += '<button class="ca-btn wa" type="submit">💬 Aanvraag versturen via WhatsApp</button><p class="ca-note" style="margin:10px 0 0">Uw aanvraag wordt als WhatsApp-bericht naar de winkel gestuurd en in de app bewaard onder Mijn aanvragen. Liever bellen? <a href="' + TEL + '" style="color:var(--blue)">' + PHONE + '</a></p></form>';
    return h;
  }

  function viewTickets(tickets) {
    var STEPS = ['Aangevraagd', 'Bevestigd', 'In behandeling', 'Klaar'];
    var h = '<button class="ca-back" data-sub="form">← Nieuwe aanvraag</button><h1 class="ca-h1">Mijn aanvragen</h1><p class="ca-sub">Bewaard op dit toestel. Statusupdates ontvangt u via WhatsApp; u kunt de status hier zelf bijwerken.</p>';
    if (!tickets.length) return h + '<p class="ca-empty">Nog geen aanvragen.</p>';
    tickets.forEach(function (t, i) {
      var st = STORES.filter(function (s) { return s.id === t.store; })[0] || STORES[0], step = STEPS.indexOf(t.status), done = t.status === 'Klaar';
      h += '<div class="ca-ticket"><div class="ca-row"><span class="ca-tid">' + esc(t.id) + '</span><span class="ca-tstatus' + (done ? ' done' : '') + '">' + esc(t.status) + '</span></div>' +
        '<div class="ca-steps">' + STEPS.map(function (s, k) { return '<span class="' + (k <= step ? 'on' : '') + '"></span>'; }).join('') + '</div><div class="ca-steps-labels">' + STEPS.map(function (s) { return '<span>' + s + '</span>'; }).join('') + '</div>' +
        '<p><strong>' + esc(t.type === 'inruilen' ? 'Inruilen' : t.type === 'advies' ? 'Advies' : 'Reparatie') + ':</strong> ' + esc(t.model) + (t.problem ? ' · ' + esc(t.problem) : '') + '<br>' + esc(st.name) + ' · ' + esc(t.date) + ' om ' + esc(t.time) + '</p>' +
        '<div class="ca-tactions"><a class="ca-btn wa sm" href="' + WA + '?text=' + encodeURIComponent('Hallo, wat is de status van mijn aanvraag ' + t.id + ' (' + t.model + ')?') + '" target="_blank" rel="noopener">💬 Status vragen</a>' +
        (!done ? '<button class="ca-btn ghost sm" data-advance="' + i + '">Volgende status</button>' : '') + '<button class="ca-btn ghost sm" data-remove="' + i + '">Verwijderen</button></div></div>';
    });
    return h;
  }

  function viewWinkels() {
    var s = status();
    return '<h1 class="ca-h1">Winkels</h1><p class="ca-sub">Loop binnen zonder afspraak. De koffie staat klaar.</p>' + STORES.map(function (st) {
      return '<div class="ca-card ca-store"><span class="ca-badge ' + s.cls + '">' + esc(s.text) + '</span><h3>' + esc(st.name) + '</h3><div class="ca-addr">' + esc(st.street) + ', ' + esc(st.zip) + ' ' + esc(st.city) + '<br>🅿️ ' + esc(st.tip) + '</div>' +
        '<table class="ca-hours"><tr><td>Maandag t/m vrijdag</td><td>09:00 – 17:30</td></tr><tr><td>Zaterdag</td><td>09:00 – 17:00</td></tr><tr><td>Zondag</td><td>Gesloten</td></tr></table>' +
        '<div class="ca-store-actions"><a class="ca-btn sm" href="https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(st.dest) + '" target="_blank" rel="noopener">🗺️ Route</a><a class="ca-btn ghost sm" href="' + TEL + '">📞 ' + PHONE + '</a></div>' +
        '<p class="ca-note" style="margin:10px 0 0">✉️ <a href="mailto:' + st.email + '" style="color:var(--blue)">' + st.email + '</a></p></div>';
    }).join('') + '<div class="ca-card"><strong>Toestel opsturen?</strong><p class="ca-note" style="margin:6px 0 10px">Niet in de buurt? Stuur uw toestel veilig op via PostNL. Meestal binnen 24 tot 48 uur gerepareerd retour.</p><a class="ca-btn ghost" href="/opsturen/">📦 Naar toestel opsturen</a></div>';
  }

  /* ---------- render ---------- */
  var VIEWS = { home: viewHome, prijzen: viewPrijzen, inruilen: viewInruilen, boeken: viewBoeken, winkels: viewWinkels };
  var TABS = [['home', '🏠', 'Home'], ['prijzen', '🔧', 'Prijzen'], ['inruilen', '🔄', 'Inruilen'], ['boeken', '📅', 'Boeken'], ['winkels', '📍', 'Winkels']];
  function shell() {
    var s = status(), dark = document.documentElement.getAttribute('data-theme') === 'dark';
    root.innerHTML = '<header class="ca-head"><a class="ca-logo" href="/" aria-label="Coen’s"></a><div style="display:flex;gap:8px;align-items:center"><span class="ca-status ' + s.cls + '">' + esc(s.text) + '</span><button class="ca-theme" id="ca-theme" aria-label="Thema wisselen">' + (dark ? '☀' : '☾') + '</button></div></header>' +
      '<main id="ca-main"></main><nav class="ca-tabs" aria-label="Menu">' + TABS.map(function (t) { return '<button data-tab="' + t[0] + '" class="' + (state.tab === t[0] ? 'active' : '') + '"><span class="ca-tico">' + t[1] + '</span>' + t[2] + '</button>'; }).join('') + '</nav><div class="ca-toast"></div>';
  }
  function render() {
    var main = $('#ca-main'); if (!main) { shell(); main = $('#ca-main'); }
    main.innerHTML = '<section class="ca-view active">' + VIEWS[state.tab]() + '</section>';
    Array.prototype.forEach.call(document.querySelectorAll('.ca-tabs button'), function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === state.tab); });
    var hs = $('.ca-head .ca-status'); if (hs) { var s = status(); hs.textContent = s.text; hs.className = 'ca-status ' + s.cls; }
    if (state.tab === 'home') installBanner();
    var q = $('#ca-q'); if (q && state.focusQ) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
    var tq = $('#ca-tq'); if (tq && state.focusTQ) { tq.focus(); tq.setSelectionRange(tq.value.length, tq.value.length); }
    window.scrollTo(0, state.keepScroll ? window.scrollY : 0); state.keepScroll = false;
  }
  function go(tab, sub) { state.tab = tab; state.sub = sub || null; if (tab !== 'prijzen') state.model = null; render(); load(); try { history.replaceState(null, '', '?tab=' + tab); } catch (e) {} }
  function load() {
    if (state.tab === 'prijzen' && !state.models[state.brand]) { var b = state.brand; fetchCards(BRANDS[b].url).then(function (l) { state.models[b] = l; if (state.tab === 'prijzen') render(); }).catch(function () { state.models[b] = { error: true, filter: function () { return []; } }; render(); }); }
    if (state.tab === 'inruilen' && !state.tradein) { fetchCards('/inruilen/').then(function (l) { state.tradein = l; if (state.tab === 'inruilen') render(); }).catch(function () { state.tradein = { error: true, forEach: function () {} }; render(); }); }
  }

  /* ---------- install ---------- */
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredPrompt = e; installBanner(); });
  function isStandalone() { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }
  function installBanner() {
    var el = $('#ca-install'); if (!el) return;
    if (isStandalone() || store('coens-install-dismissed')) { el.classList.remove('show'); return; }
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream, btn = $('#ca-install-btn'), txt = $('#ca-install-text');
    if (deferredPrompt) { btn.style.display = ''; txt.textContent = 'Dan opent de app met één tik, net als een gewone app.'; }
    else if (ios) { btn.style.display = 'none'; txt.innerHTML = 'Tik in Safari op <strong>Delen</strong> (het vierkantje met de pijl) en kies <strong>Zet op beginscherm</strong>.'; }
    else { btn.style.display = 'none'; txt.innerHTML = 'Open het browsermenu (⋮) en kies <strong>App installeren</strong> of <strong>Toevoegen aan startscherm</strong>.'; }
    el.classList.add('show');
  }
  function setupHead() {
    if (MANIFEST) { var l = document.createElement('link'); l.rel = 'manifest'; l.href = MANIFEST; l.crossOrigin = 'anonymous'; document.head.appendChild(l); }
    [['apple-mobile-web-app-capable', 'yes'], ['apple-mobile-web-app-status-bar-style', 'black-translucent'], ['apple-mobile-web-app-title', "Coen's"], ['theme-color', '#081220'], ['mobile-web-app-capable', 'yes']].forEach(function (m) { var e = document.createElement('meta'); e.name = m[0]; e.content = m[1]; document.head.appendChild(e); });
    var ic = document.createElement('link'); ic.rel = 'apple-touch-icon'; ic.href = ICON; document.head.appendChild(ic);
    if (!document.querySelector('meta[name="viewport"]')) { var v = document.createElement('meta'); v.name = 'viewport'; v.content = 'width=device-width, initial-scale=1, viewport-fit=cover'; document.head.appendChild(v); }
    document.title = "Coen's app – prijzen, inruilen en reparatie boeken";
  }

  /* ---------- events ---------- */
  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab],[data-go],[data-brand],[data-model],[data-back],[data-book],[data-book-type],[data-tradein],[data-type],[data-sub],[data-advance],[data-remove],#ca-theme,#ca-install-btn,#ca-install-no]');
    if (!t) return;
    if (t.id === 'ca-theme') { var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', next); try { localStorage.setItem('coens-theme', next); } catch (x) {} t.textContent = next === 'dark' ? '☀' : '☾'; return; }
    if (t.id === 'ca-install-btn') { if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then(function () { deferredPrompt = null; installBanner(); }); } return; }
    if (t.id === 'ca-install-no') { store('coens-install-dismissed', true); installBanner(); return; }
    if (t.hasAttribute('data-tab')) { go(t.getAttribute('data-tab')); return; }
    if (t.hasAttribute('data-go')) { go(t.getAttribute('data-go'), t.getAttribute('data-sub')); return; }
    if (t.hasAttribute('data-brand')) { state.brand = t.getAttribute('data-brand'); state.q = ''; state.model = null; render(); load(); return; }
    if (t.hasAttribute('data-model')) { state.model = state.models[state.brand][+t.getAttribute('data-model')]; render(); return; }
    if (t.hasAttribute('data-back')) { state.model = null; render(); return; }
    if (t.hasAttribute('data-book')) { state.booking = { type: 'reparatie', model: t.getAttribute('data-book') }; go('boeken'); return; }
    if (t.hasAttribute('data-book-type')) { state.booking = { type: t.getAttribute('data-book-type'), model: '' }; go('boeken'); return; }
    if (t.hasAttribute('data-tradein')) { state.booking = { type: 'inruilen', model: t.getAttribute('data-tradein') }; go('boeken'); return; }
    if (t.hasAttribute('data-type')) { readForm(); state.booking.type = t.getAttribute('data-type'); state.keepScroll = true; render(); return; }
    if (t.hasAttribute('data-sub')) { state.sub = t.getAttribute('data-sub') === 'tickets' ? 'tickets' : null; render(); return; }
    if (t.hasAttribute('data-advance')) { var STEPS = ['Aangevraagd', 'Bevestigd', 'In behandeling', 'Klaar'], tk = store('coens-tickets') || [], i = +t.getAttribute('data-advance'); tk[i].status = STEPS[Math.min(STEPS.indexOf(tk[i].status) + 1, 3)]; store('coens-tickets', tk); state.keepScroll = true; render(); return; }
    if (t.hasAttribute('data-remove')) { var tk2 = store('coens-tickets') || []; tk2.splice(+t.getAttribute('data-remove'), 1); store('coens-tickets', tk2); state.keepScroll = true; render(); toast('Aanvraag verwijderd'); return; }
  });
  root.addEventListener('input', function (e) {
    if (e.target.id === 'ca-q') { state.q = e.target.value; state.focusQ = true; state.keepScroll = true; render(); }
    if (e.target.id === 'ca-tq') { state.tq = e.target.value; state.focusTQ = true; state.keepScroll = true; render(); }
  });
  function readForm() { var f = $('#ca-form'); if (!f) return; var fd = new FormData(f); ['model', 'problem', 'store', 'date', 'time', 'name', 'phone', 'note'].forEach(function (k) { if (fd.has(k)) state.booking[k] = fd.get(k); }); }
  root.addEventListener('submit', function (e) {
    if (e.target.id !== 'ca-form') return; e.preventDefault(); readForm();
    var b = state.booking, st = STORES.filter(function (s) { return s.id === b.store; })[0] || STORES[0];
    var tickets = store('coens-tickets') || [], id = 'CT-' + new Date().getFullYear().toString().slice(2) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    var dateTxt = b.date; try { var dd = new Date(b.date + 'T12:00:00'); dateTxt = DAYS[(dd.getDay() + 6) % 7] + ' ' + dd.getDate() + '-' + (dd.getMonth() + 1); } catch (x) {}
    var ticket = { id: id, type: b.type, model: b.model, problem: b.type === 'reparatie' ? b.problem : '', store: st.id, date: dateTxt, time: b.time, name: b.name, phone: b.phone, status: 'Aangevraagd', created: Date.now() };
    tickets.unshift(ticket); store('coens-tickets', tickets);
    var label = b.type === 'inruilen' ? 'Inruilen' : b.type === 'advies' ? 'Advies' : 'Reparatie';
    var msg = 'Hallo Coen’s, ik wil graag een ' + label.toLowerCase() + ' aanvragen via de app.\n\nAanvraag: ' + id + '\nToestel: ' + b.model + (ticket.problem ? '\nProbleem: ' + ticket.problem : '') + '\nWinkel: ' + st.name + '\nWanneer: ' + dateTxt + ' om ' + b.time + '\nNaam: ' + b.name + '\nTelefoon: ' + b.phone + (b.note ? '\nOpmerking: ' + b.note : '') + '\n\nKunnen jullie dit bevestigen?';
    window.open(WA + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    state.booking = { type: 'reparatie' }; state.sub = 'tickets'; render(); toast('Aanvraag ' + id + ' bewaard');
  });

  /* ---------- boot ---------- */
  try { var th = localStorage.getItem('coens-theme'); if (th) document.documentElement.setAttribute('data-theme', th); } catch (e) {}
  if (!document.documentElement.getAttribute('data-theme')) document.documentElement.setAttribute('data-theme', 'light');
  setupHead(); shell();
  var startTab = qs.get('tab'); if (startTab && VIEWS[startTab]) state.tab = startTab;
  render(); load(); setInterval(function () { var hs = $('.ca-head .ca-status'); if (hs) { var s = status(); hs.textContent = s.text; hs.className = 'ca-status ' + s.cls; } }, 60000);
})();
