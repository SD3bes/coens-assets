/* Coen's Telecom - Client Engine */
(function() {
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

  function doSearch() {
    const input = document.getElementById('coens-search-input');
    const query = (input ? input.value : '').trim().toLowerCase();
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
  }

  function setup() {
    document.querySelectorAll('.coens-brand-card').forEach(card => {
      card.addEventListener('click', () => {
        selectBrand(card.getAttribute('data-brand'));
      });
    });

    document.getElementById('coens-search-btn')?.addEventListener('click', doSearch);
    document.getElementById('coens-search-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') doSearch();
    });

    renderModels('apple');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();