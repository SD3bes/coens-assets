/* ========================================================
   COEN'S TELECOM - FULL MOUNTED CLIENT PLATFORM
   ======================================================== */
(function() {
  console.log("Coen's Platform Script Loaded Successfully!");

  // 1. INJECT GOOGLE FONTS
  if (!document.getElementById('coens-fonts')) {
    const fontPreconnect1 = document.createElement('link');
    fontPreconnect1.rel = 'preconnect';
    fontPreconnect1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(fontPreconnect1);

    const fontPreconnect2 = document.createElement('link');
    fontPreconnect2.rel = 'preconnect';
    fontPreconnect2.href = 'https://fonts.gstatic.com';
    fontPreconnect2.crossOrigin = 'anonymous';
    document.head.appendChild(fontPreconnect2);

    const fontLink = document.createElement('link');
    fontLink.id = 'coens-fonts';
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(fontLink);
  }

  // 2. INJECT CSS STYLESHEET
  if (!document.getElementById('coens-styles')) {
    const style = document.createElement('style');
    style.id = 'coens-styles';
    style.innerHTML = `
      *, *::before, *::after { box-sizing: border-box !important; margin: 0; padding: 0; }
      :root {
        --coens-navy: #081220; --coens-blue: #1E6FFF; --coens-blue-hover: #004ecc;
        --coens-gold: #F5A623; --coens-white: #ffffff; --coens-gray-100: #f4f6fa;
        --coens-gray-600: #62728d; --coens-gray-800: #1b2533;
        --coens-border-light: rgba(10, 22, 40, 0.08); --coens-shadow: 0 12px 36px rgba(8, 18, 32, 0.08);
        --coens-radius: 14px;
      }
      body, html { font-family: 'Inter', sans-serif !important; background-color: var(--coens-white) !important; color: var(--coens-gray-800) !important; line-height: 1.6 !important; margin: 0 !important; padding: 0 !important; }
      a { text-decoration: none !important; color: inherit; }

      .coens-top-bar { background: #050b14; color: rgba(255, 255, 255, 0.8); font-size: 0.82rem; padding: 8px 6%; border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
      .coens-top-inner { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
      .coens-trust-list { display: flex; gap: 20px; list-style: none; padding: 0; margin: 0; }
      .coens-trust-list li { display: inline-flex; align-items: center; gap: 6px; }

      .coens-nav { position: sticky; top: 0; z-index: 999; background: rgba(8, 18, 32, 0.96); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding: 16px 6%; }
      .coens-nav-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
      .coens-logo { font-family: 'Syne', sans-serif !important; font-size: 1.6rem; font-weight: 800; color: var(--coens-white) !important; }
      .coens-logo span { color: var(--coens-gold); }
      .coens-menu { display: flex; list-style: none; gap: 24px; align-items: center; margin: 0; padding: 0; }
      .coens-menu a { color: rgba(255, 255, 255, 0.8) !important; font-size: 0.92rem; font-weight: 500; transition: color 0.2s; position: relative; padding: 4px 0; }
      .coens-menu a:hover, .coens-menu a.active { color: var(--coens-white) !important; }
      .coens-menu a.active::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 100%; height: 2px; background: var(--coens-blue); }
      .coens-btn-cta { background: var(--coens-blue); color: var(--coens-white) !important; font-weight: 600; font-size: 0.88rem; padding: 10px 22px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }

      .coens-hero { background: linear-gradient(135deg, #050c17 0%, var(--coens-navy) 60%, #0a2552 100%); padding: 70px 6% 50px; color: var(--coens-white); text-align: center; }
      .coens-hero h1 { font-family: 'Syne', sans-serif !important; font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; margin-bottom: 12px; }
      .coens-hero h1 span { color: var(--coens-gold); }
      .coens-search-box { max-width: 720px; margin: 28px auto 14px; background: rgba(255, 255, 255, 0.08); padding: 8px; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.15); display: flex; gap: 8px; }
      .coens-input-wrap { position: relative; flex: 1; }
      .coens-input-wrap input { width: 100% !important; height: 50px !important; background: var(--coens-white) !important; border: none !important; border-radius: 10px !important; padding: 0 18px 0 44px !important; font-size: 0.95rem !important; outline: none !important; }
      .coens-search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--coens-gray-600); }
      .coens-btn-search { background: var(--coens-blue); color: var(--coens-white); border: none; padding: 0 28px; border-radius: 10px; font-weight: 700; cursor: pointer; }

      .coens-quick-tags { display: flex; justify-content: center; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
      .coens-quick-chip { font-size: 0.8rem; color: rgba(255, 255, 255, 0.65); padding: 5px 12px; border-radius: 20px; background: rgba(255, 255, 255, 0.06); cursor: pointer; transition: all 0.2s; }
      .coens-quick-chip:hover { background: rgba(255, 255, 255, 0.18); color: var(--coens-white); }

      .coens-container { max-width: 1200px; margin: 0 auto; padding: 50px 6%; }
      .coens-brands-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 16px; margin-bottom: 36px; }
      .coens-brand-card { background: var(--coens-white); border: 1.5px solid var(--coens-border-light); border-radius: var(--coens-radius); padding: 20px 14px; text-align: center; cursor: pointer; transition: all 0.2s; }
      .coens-brand-card.active, .coens-brand-card:hover { border-color: var(--coens-blue); box-shadow: var(--coens-shadow); transform: translateY(-2px); }
      .coens-brand-card .icon { font-size: 2.2rem; margin-bottom: 6px; }
      .coens-brand-card h3 { font-family: 'Syne', sans-serif !important; font-size: 1.05rem; color: var(--coens-navy); }

      .coens-repair-layout { display: grid; grid-template-columns: 300px 1fr; gap: 32px; }
      .coens-models-box { background: var(--coens-gray-100); border-radius: var(--coens-radius); padding: 20px; height: fit-content; }
      .coens-models-box h4 { font-family: 'Syne', sans-serif !important; margin-bottom: 12px; }
      .coens-model-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
      .coens-model-item { padding: 10px 14px; border-radius: 8px; background: var(--coens-white); cursor: pointer; font-size: 0.9rem; border: 1px solid var(--coens-border-light); }
      .coens-model-item.active, .coens-model-item:hover { background: var(--coens-blue); color: var(--coens-white); border-color: var(--coens-blue); }

      .coens-prices-box { background: var(--coens-white); border: 1.5px solid var(--coens-border-light); border-radius: 18px; padding: 28px; box-shadow: var(--coens-shadow); }
      .coens-repair-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: var(--coens-gray-100); border-radius: 12px; margin-bottom: 12px; }
      .coens-repair-desc h5 { font-size: 0.98rem; font-weight: 600; color: var(--coens-navy); margin-bottom: 2px; }
      .coens-repair-desc p { font-size: 0.8rem; color: var(--coens-gray-600); margin: 0; }
      .coens-price-val { font-family: 'Syne', sans-serif !important; font-weight: 800; font-size: 1.2rem; color: var(--coens-navy); margin-right: 16px; }

      .coens-footer { background: #040910; color: rgba(255, 255, 255, 0.65); padding: 50px 6% 30px; font-size: 0.88rem; margin-top: 60px; }
      @media (max-width: 800px) {
        .coens-repair-layout { grid-template-columns: 1fr; }
        .coens-menu { display: none; }
      }
    `;
    document.head.appendChild(style);
  }

  // 3. DATABASE
  const DB = {
    apple: {
      name: "Apple iPhone",
      models: [
        {
          name: "iPhone 16 Pro Max",
          repairs: [
            { n: "Origineel OLED Scherm", p: "€ 389,-", t: "30-45 min" },
            { n: "Batterij Vervanging", p: "€ 109,-", t: "30 min" },
            { n: "Achterkant Glas", p: "€ 189,-", t: "60 min" }
          ]
        },
        {
          name: "iPhone 15",
          repairs: [
            { n: "Origineel Scherm", p: "€ 249,-", t: "30 min" },
            { n: "Batterij Vervanging", p: "€ 89,-", t: "30 min" },
            { n: "Laadpoort USB-C", p: "€ 89,-", t: "30 min" }
          ]
        },
        {
          name: "iPhone 14 / 13",
          repairs: [
            { n: "OLED Scherm Vervanging", p: "€ 189,-", t: "30 min" },
            { n: "Batterij", p: "€ 79,-", t: "30 min" }
          ]
        }
      ]
    },
    samsung: {
      name: "Samsung Galaxy",
      models: [
        {
          name: "Galaxy S24 Ultra",
          repairs: [
            { n: "Dynamic AMOLED 2X Scherm", p: "€ 319,-", t: "45 min" },
            { n: "Originele Batterij", p: "€ 79,-", t: "30 min" }
          ]
        },
        {
          name: "Galaxy S23",
          repairs: [
            { n: "AMOLED Scherm", p: "€ 189,-", t: "45 min" },
            { n: "Batterij", p: "€ 69,-", t: "30 min" }
          ]
        },
        {
          name: "Galaxy A54",
          repairs: [
            { n: "Super AMOLED Scherm", p: "€ 129,-", t: "45 min" },
            { n: "Batterij", p: "€ 59,-", t: "30 min" }
          ]
        }
      ]
    },
    google: {
      name: "Google Pixel",
      models: [
        {
          name: "Pixel 8 Pro",
          repairs: [
            { n: "Origineel OLED Scherm", p: "€ 269,-", t: "45 min" },
            { n: "Batterij", p: "€ 79,-", t: "30 min" }
          ]
        },
        {
          name: "Pixel 7",
          repairs: [
            { n: "OLED Scherm", p: "€ 169,-", t: "45 min" },
            { n: "Batterij", p: "€ 69,-", t: "30 min" }
          ]
        }
      ]
    },
    xiaomi: {
      name: "Xiaomi",
      models: [
        {
          name: "Xiaomi 14",
          repairs: [
            { n: "AMOLED Scherm", p: "€ 199,-", t: "45 min" },
            { n: "Batterij", p: "€ 65,-", t: "30 min" }
          ]
        }
      ]
    }
  };

  // 4. MOUNT FUNCTION
  function mount(root) {
    root.innerHTML = `
      <div class="coens-top-bar">
        <div class="coens-top-inner">
          <ul class="coens-trust-list">
            <li>⚡ Klaar terwijl u wacht</li>
            <li>🛡️ No cure, no pay</li>
            <li>☕ Kop koffie staat klaar</li>
          </ul>
          <div><span style="color:var(--coens-gold);">3 Filialen:</span> Bergeijk • Bladel • Valkenswaard</div>
        </div>
      </div>

      <nav class="coens-nav">
        <div class="coens-nav-inner">
          <a href="/" class="coens-logo">Coen<span>'s</span></a>
          <ul class="coens-menu">
            <li><a href="/">Home</a></li>
            <li><a href="/reparaties/" class="active">Reparaties &amp; Merken</a></li>
            <li><a href="/tweede-kansjes/">Tweede Kansjes</a></li>
            <li><a href="/opsturen/">Toestel Opsturen</a></li>
            <li><a href="/inruilen/">Inruilen</a></li>
            <li><a href="/winkels/">Winkels &amp; Contact</a></li>
          </ul>
          <a href="/winkels/" class="coens-btn-cta">Vind Winkel</a>
        </div>
      </nav>

      <section class="coens-hero" id="reparaties">
        <h1>Vind Uw Toestel &amp; <span>Reparatie</span></h1>
        <p>Selecteer uw merk of voer uw toestelnaam in om direct tarieven en reparatietijden te zien.</p>

        <div class="coens-search-box">
          <div class="coens-input-wrap">
            <span class="coens-search-icon">🔍</span>
            <input type="text" id="coens-search-input" placeholder="Typ merk of model (bijv. iPhone 15, S24, Pixel)...">
          </div>
          <button type="button" class="coens-btn-search" id="coens-search-btn">Zoeken</button>
        </div>

        <div class="coens-quick-tags">
          <span>Snel zoeken:</span>
          <span class="coens-quick-chip" data-query="iPhone 15">iPhone 15</span>
          <span class="coens-quick-chip" data-query="S24">Galaxy S24</span>
          <span class="coens-quick-chip" data-query="Pixel 8">Pixel 8</span>
          <span class="coens-quick-chip" data-query="apple">Alle Apple</span>
        </div>
      </section>

      <section class="coens-container">
        <div class="coens-brands-row">
          <div class="coens-brand-card active" data-brand="apple">
            <div class="icon">🍏</div>
            <h3>Apple</h3>
            <span style="font-size:0.8rem; color:var(--coens-gray-600);">iPhone &amp; iPad</span>
          </div>
          <div class="coens-brand-card" data-brand="samsung">
            <div class="icon">📱</div>
            <h3>Samsung</h3>
            <span style="font-size:0.8rem; color:var(--coens-gray-600);">Galaxy S / A / Z</span>
          </div>
          <div class="coens-brand-card" data-brand="google">
            <div class="icon">🌐</div>
            <h3>Google</h3>
            <span style="font-size:0.8rem; color:var(--coens-gray-600);">Pixel Reeks</span>
          </div>
          <div class="coens-brand-card" data-brand="xiaomi">
            <div class="icon">⚡</div>
            <h3>Xiaomi</h3>
            <span style="font-size:0.8rem; color:var(--coens-gray-600);">Redmi &amp; Mi</span>
          </div>
        </div>

        <div class="coens-repair-layout">
          <div class="coens-models-box">
            <h4>Kies uw model</h4>
            <ul class="coens-model-list" id="coens-models-target"></ul>
          </div>

          <div class="coens-prices-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid var(--coens-border-light); padding-bottom:14px;">
              <h3 id="coens-price-title" style="font-family:'Syne'; font-size:1.3rem;">Tarieven</h3>
              <span style="font-size:0.85rem; color:var(--coens-blue); font-weight:600;">✓ Inclusief montage &amp; garantie</span>
            </div>
            <div id="coens-repairs-target"></div>
          </div>
        </div>
      </section>

      <footer class="coens-footer">
        <div style="max-width:1200px; margin:0 auto; text-align:center;">
          &copy; 2026 Coen's Telecom. Bergeijk • Bladel • Valkenswaard.
        </div>
      </footer>
    `;

    bindEvents();
  }

  function bindEvents() {
    function selectBrand(brandKey) {
      document.querySelectorAll('.coens-brand-card').forEach(c => {
        c.classList.toggle('active', c.getAttribute('data-brand') === brandKey);
      });
      renderModels(brandKey);
    }

    function renderModels(brandKey) {
      const brandData = DB[brandKey];
      const listEl = document.getElementById('coens-models-target');
      if (!listEl || !brandData) return;
      listEl.innerHTML = '';

      brandData.models.forEach((m, idx) => {
        const li = document.createElement('li');
        li.className = 'coens-model-item ' + (idx === 0 ? 'active' : '');
        li.textContent = m.name;
        li.addEventListener('click', () => {
          document.querySelectorAll('.coens-model-item').forEach(item => item.classList.remove('active'));
          li.classList.add('active');
          renderRepairs(m);
        });
        listEl.appendChild(li);
      });

      if (brandData.models.length > 0) {
        renderRepairs(brandData.models[0]);
      }
    }

    function renderRepairs(model) {
      const titleEl = document.getElementById('coens-price-title');
      const targetEl = document.getElementById('coens-repairs-target');
      if (!titleEl || !targetEl) return;

      titleEl.textContent = 'Tarieven voor ' + model.name;
      targetEl.innerHTML = '';

      model.repairs.forEach(r => {
        const div = document.createElement('div');
        div.className = 'coens-repair-item';
        div.innerHTML = `
          <div class="coens-repair-desc">
            <h5>${r.n}</h5>
            <p>Duur: circa ${r.t} • No cure, no pay</p>
          </div>
          <div style="display:flex;align-items:center;">
            <span class="coens-price-val">${r.p}</span>
            <a href="/winkels/" class="coens-btn-cta">Afspraak</a>
          </div>
        `;
        targetEl.appendChild(div);
      });
    }

    function doSearch(customQuery) {
      const input = document.getElementById('coens-search-input');
      const query = (customQuery || (input ? input.value : '')).trim().toLowerCase();
      if (!query) return;

      for (const [key, data] of Object.entries(DB)) {
        if (key.indexOf(query) !== -1 || data.name.toLowerCase().indexOf(query) !== -1) {
          selectBrand(key);
          document.getElementById('reparaties')?.scrollIntoView({ behavior: 'smooth' });
          return;
        }
        const foundModel = data.models.find(m => m.name.toLowerCase().indexOf(query) !== -1);
        if (foundModel) {
          selectBrand(key);
          renderRepairs(foundModel);
          document.getElementById('reparaties')?.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      alert('Geen specifiek model gevonden voor "' + query + '". Kies een van de merken hieronder.');
    }

    document.querySelectorAll('.coens-brand-card').forEach(card => {
      card.addEventListener('click', () => {
        selectBrand(card.getAttribute('data-brand'));
      });
    });

    document.querySelectorAll('.coens-quick-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        doSearch(chip.getAttribute('data-query'));
      });
    });

    document.getElementById('coens-search-btn')?.addEventListener('click', () => doSearch());
    document.getElementById('coens-search-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') doSearch();
    });

    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    if (q) {
      const input = document.getElementById('coens-search-input');
      if (input) input.value = q;
      doSearch(q);
    } else {
      renderModels('apple');
    }
  }

  // 5. RESILIENT POLLING INITIALIZER (Mounts even if DOM is still rendering)
  let attempts = 0;
  function startMount() {
    const root = document.getElementById('coens-app-root');
    if (root) {
      mount(root);
    } else if (attempts < 50) {
      attempts++;
      setTimeout(startMount, 50);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startMount);
  } else {
    startMount();
  }
})();
