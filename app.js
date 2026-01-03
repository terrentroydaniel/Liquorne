window.__SPIRITS__=[{"id": "s1", "name": "Highland 12", "brand": "Liquorne Distilling", "type": "Whisky", "country": "Écosse", "abv": 40, "notes": ["miel", "vanille", "fruits secs"]}, {"id": "s2", "name": "Caña Dorada", "brand": "Casa del Sol", "type": "Rhum", "country": "Martinique", "abv": 50, "notes": ["canne", "agrumes", "poivre"]}, {"id": "s3", "name": "Juniper No. 3", "brand": "North Bay", "type": "Gin", "country": "France", "abv": 43, "notes": ["genièvre", "citron", "herbes"]}, {"id": "s4", "name": "Reposado Azul", "brand": "Agave Real", "type": "Tequila", "country": "Mexique", "abv": 40, "notes": ["agave", "caramel", "boisé"]}, {"id": "s5", "name": "Cognac VSOP Réserve", "brand": "Maison Lune", "type": "Cognac", "country": "France", "abv": 40, "notes": ["abricot", "chêne", "épices"]}, {"id": "s6", "name": "Vodka Pure Grain", "brand": "Nordik", "type": "Vodka", "country": "Pologne", "abv": 40, "notes": ["céréales", "poivre blanc", "net"]}];
(() => {
  const spirits = window.__SPIRITS__;
  const app = document.getElementById('app');

  const storeReviewsKey = 'liquorne_reviews_v2';
  const storeCellarKey  = 'liquorne_cellar_v2';

  const STATUS = {
    owned:    { key: 'owned',    label: '✅ Possédé'  },
    tasted:   { key: 'tasted',   label: '🍸 Goûté'    },
    wishlist: { key: 'wishlist', label: '⭐ Wishlist' },
  };

  function loadJson(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      if(!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    }catch{
      return fallback;
    }
  }
  function saveJson(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  function cryptoRandomId(){
    if (window.crypto && crypto.getRandomValues){
      const a = new Uint32Array(4);
      crypto.getRandomValues(a);
      return Array.from(a).map(x=>x.toString(16)).join('-') + '-' + Date.now().toString(16);
    }
    return Math.random().toString(16).slice(2) + '-' + Date.now().toString(16);
  }

  function esc(s){ return (s ?? '').toString().replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  function defaultReviews(){
    return [{
      id: cryptoRandomId(),
      spiritId: 's1',
      rating: 4.5,
      title: 'Classique, efficace',
      text: 'Vanille, miel, un boisé léger. Très facile à boire.',
      createdAtIso: new Date(Date.now() - 1000*60*60*10).toISOString(),
    }];
  }

  let state = {
    route: { name: 'home', spiritId: null, prevTab: 'home' }, // home | cellar | detail | addReview
    q: '',
    filters: { type:'', country:'', abvMin:'', abvMax:'' },
    reviews: loadJson(storeReviewsKey, null) ?? defaultReviews(),
    cellar:  loadJson(storeCellarKey, null) ?? {},
  };

  function persist(){
    saveJson(storeReviewsKey, state.reviews);
    saveJson(storeCellarKey, state.cellar);
  }

  function computeRating(spiritId){
    const rs = state.reviews.filter(r => r.spiritId === spiritId);
    if(rs.length === 0) return { avg: null, count: 0 };
    const sum = rs.reduce((a,r)=>a + Number(r.rating || 0), 0);
    return { avg: sum/rs.length, count: rs.length };
  }

  function getStatus(spiritId){
    const s = state.cellar[spiritId];
    return {
      owned: !!(s && s.owned),
      tasted: !!(s && s.tasted),
      wishlist: !!(s && s.wishlist),
    };
  }

  function toggleStatus(spiritId, key){
    const current = state.cellar[spiritId] || { owned:false, tasted:false, wishlist:false, updatedAtIso: new Date().toISOString() };
    const next = { ...current, [key]: !current[key], updatedAtIso: new Date().toISOString() };
    state.cellar = { ...state.cellar, [spiritId]: next };
    persist();
    render();
  }

  function navTo(route){
    state.route = route;
    render();
  }

  function header(activeTab){
    return `
      <div class="header">
        <div class="brand">
          <img src="assets/icon-192.png" alt="Liquorne" />
          <div>
            <div class="h1">Liquorne</div>
            <div class="p">V2 — Ma cave + filtres + persistance</div>
          </div>
        </div>
        <div class="nav">
          <button class="tab ${activeTab==='home' ? 'active' : ''}" data-tab="home">Explorer</button>
          <button class="tab ${activeTab==='cellar' ? 'active' : ''}" data-tab="cellar">Ma cave</button>
        </div>
      </div>
    `;
  }

  function uniqueSorted(values){
    return Array.from(new Set(values)).sort((a,b)=>a.localeCompare(b, 'fr'));
  }

  function applyFilters(list){
    const qq = state.q.trim().toLowerCase();
    const t  = (state.filters.type || '').trim();
    const c  = (state.filters.country || '').trim();
    const abvMin = state.filters.abvMin === '' ? null : Number(state.filters.abvMin);
    const abvMax = state.filters.abvMax === '' ? null : Number(state.filters.abvMax);

    return list.filter(s => {
      if(qq){
        const blob = `${s.name} ${s.brand} ${s.type} ${s.country}`.toLowerCase();
        if(!blob.includes(qq)) return false;
      }
      if(t && s.type !== t) return false;
      if(c && s.country !== c) return false;
      if(abvMin != null && Number.isFinite(abvMin) && s.abv < abvMin) return false;
      if(abvMax != null && Number.isFinite(abvMax) && s.abv > abvMax) return false;
      return true;
    });
  }

  function spiritCardHtml(s){
    const r = computeRating(s.id);
    const ratingText = (r.avg == null || Number.isNaN(r.avg)) ? '—' : r.avg.toFixed(1);
    const st = getStatus(s.id);
    const badges = [
      st.owned ? '<span class="badge">Possédé</span>' : '',
      st.tasted ? '<span class="badge">Goûté</span>' : '',
      st.wishlist ? '<span class="badge">Wishlist</span>' : '',
    ].filter(Boolean).join(' ');

    return `
      <div class="card spiritCard" role="button" tabindex="0" data-open="${esc(s.id)}">
        <div style="flex:1">
          <div class="title">${esc(s.name)} ${badges ? `<span style="margin-left:8px">${badges}</span>` : ''}</div>
          <div class="sub">${esc(s.brand)} • ${esc(s.type)} • ${esc(s.country)} • ${esc(s.abv)}%</div>
          <div class="notes">
            ${s.notes.slice(0,3).map(n => `<div class="chip">${esc(n)}</div>`).join('')}
          </div>
        </div>
        <div class="scoreBox">
          <div class="score">${ratingText}</div>
          <div class="count">${r.count} avis</div>
        </div>
      </div>
    `;
  }

  function filtersHtml(){
    const types = uniqueSorted(spirits.map(s => s.type));
    const countries = uniqueSorted(spirits.map(s => s.country));

    return `
      <div class="card">
        <div class="gridFilters">
          <input class="input" id="q" placeholder="Recherche (whisky, rhum, marque...)" value="${esc(state.q)}" autocomplete="off" />
          <select id="type">
            <option value="">Type (tous)</option>
            ${types.map(t => `<option value="${esc(t)}" ${state.filters.type===t ? 'selected' : ''}>${esc(t)}</option>`).join('')}
          </select>
          <select id="country">
            <option value="">Pays (tous)</option>
            ${countries.map(c => `<option value="${esc(c)}" ${state.filters.country===c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
          </select>
          <input class="input" id="abvMin" inputmode="decimal" placeholder="ABV min" value="${esc(state.filters.abvMin)}" />
          <input class="input" id="abvMax" inputmode="decimal" placeholder="ABV max" value="${esc(state.filters.abvMax)}" />
        </div>
        <div class="divider"></div>
        <div class="small">Astuce : sur Android → Chrome ⋮ → “Ajouter à l’écran d’accueil” (PWA).</div>
      </div>
    `;
  }

  function homeView(){
    const filtered = applyFilters(spirits);
    const list = filtered.map(spiritCardHtml).join('');

    return `
      ${header('home')}
      <div class="container">
        ${filtersHtml()}
        <div class="row">
          <div style="flex:1; display:flex; flex-direction:column; gap:10px">
            ${list || `<div class="card"><div class="small">Aucun résultat.</div></div>`}
          </div>
          <div class="card" style="width:320px; height:190px">
            <div class="h2">V2</div>
            <div class="small" style="margin-top:8px; line-height:1.5">
              • “Ma cave” (possédé / goûté / wishlist)<br/>
              • Filtres (type, pays, ABV)<br/>
              • Données sauvegardées sur ton téléphone (localStorage)
            </div>
            <div style="margin-top:12px" class="small">
              Ouvre une bouteille pour changer ses statuts.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function cellarSection(title, items){
    return `
      <div class="card">
        <div class="toolbar">
          <div class="h2">${esc(title)}</div>
          <div class="small">${items.length} bouteille(s)</div>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px">
          ${items.length ? items.map(spiritCardHtml).join('') : `<div class="small">Rien pour le moment.</div>`}
        </div>
      </div>
    `;
  }

  function cellarView(){
    const inCellar = spirits.filter(s => {
      const st = getStatus(s.id);
      return st.owned || st.tasted || st.wishlist;
    });

    const owned = inCellar.filter(s => getStatus(s.id).owned);
    const tasted = inCellar.filter(s => getStatus(s.id).tasted);
    const wish = inCellar.filter(s => getStatus(s.id).wishlist);

    return `
      ${header('cellar')}
      <div class="container">
        <div class="card">
          <div class="toolbar">
            <div>
              <div class="h2">Ma cave</div>
              <div class="small">Tes statuts sont enregistrés sur ce navigateur/téléphone.</div>
            </div>
            <button class="btnGhost" id="resetCellar">Réinitialiser</button>
          </div>
        </div>

        ${cellarSection('✅ Possédés', owned)}
        ${cellarSection('🍸 Goûtés', tasted)}
        ${cellarSection('⭐ Wishlist', wish)}
      </div>
    `;
  }

  function detailView(spirit){
    const rs = state.reviews
      .filter(r => r.spiritId === spirit.id)
      .slice()
      .sort((a,b)=>b.createdAtIso.localeCompare(a.createdAtIso));

    const avg = rs.length ? (rs.reduce((a,r)=>a+r.rating,0)/rs.length) : null;

    const st = getStatus(spirit.id);

    const reviewsHtml = rs.length ? rs.map(r => `
      <div class="card reviewCard">
        <div class="reviewTop">
          <div class="reviewTitle">${esc(r.title || 'Avis')}</div>
          <div class="reviewRating">${Number(r.rating).toFixed(1)}/5</div>
        </div>
        <div>${esc(r.text)}</div>
        <div class="reviewDate">${new Date(r.createdAtIso).toLocaleString()}</div>
      </div>
    `).join('') : `
      <div class="card">
        <div class="small">Aucun avis pour le moment.</div>
        <div class="small" style="margin-top:8px">Sois le premier 👀</div>
      </div>
    `;

    return `
      <div class="header">
        <div class="brand">
          <button class="btnGhost" id="back">← Retour</button>
        </div>
        <div class="nav">
          <button class="tab ${state.route.prevTab==='cellar' ? 'active' : ''}" data-tab="cellar">Ma cave</button>
          <button class="tab ${state.route.prevTab!=='cellar' ? 'active' : ''}" data-tab="home">Explorer</button>
        </div>
      </div>

      <div class="container">
        <div class="card" style="display:flex; gap:14px; align-items:flex-start">
          <div style="flex:1; display:flex; flex-direction:column; gap:6px">
            <div class="title" style="font-size:20px">${esc(spirit.name)}</div>
            <div class="sub">${esc(spirit.brand)} • ${esc(spirit.type)} • ${esc(spirit.country)} • ${esc(spirit.abv)}%</div>

            <div class="notes">
              ${spirit.notes.map(n => `<div class="chip">${esc(n)}</div>`).join('')}
            </div>

            <div class="divider"></div>

            <div class="h2" style="font-size:16px">Statuts (Ma cave)</div>
            <div class="small">Tape pour activer/désactiver</div>
            <div class="statusRow" style="margin-top:8px">
              <button class="pill ${st.owned ? 'on' : ''}" data-status="owned">${STATUS.owned.label}</button>
              <button class="pill ${st.tasted ? 'on' : ''}" data-status="tasted">${STATUS.tasted.label}</button>
              <button class="pill ${st.wishlist ? 'on' : ''}" data-status="wishlist">${STATUS.wishlist.label}</button>
            </div>
          </div>

          <div class="scoreBox" style="min-width:160px">
            <div class="score" style="font-size:34px">${avg == null ? '—' : avg.toFixed(1)}</div>
            <div class="count">${rs.length} avis</div>
            <div style="height:6px"></div>
            <button class="btn" id="addReview">+ Ajouter un avis</button>
          </div>
        </div>

        <div class="h2">Avis</div>
        <div style="display:flex; flex-direction:column; gap:10px">
          ${reviewsHtml}
        </div>
      </div>
    `;
  }

  function addReviewView(spirit){
    return `
      <div class="header">
        <div class="brand">
          <button class="btnGhost" id="back">← Retour</button>
        </div>
        <div class="nav"></div>
      </div>

      <div class="container" style="max-width:700px">
        <div class="h2">Ajouter un avis</div>
        <div class="small">${esc(spirit.name)} — ${esc(spirit.brand)}</div>

        <div class="card">
          <div class="h2" style="font-size:16px">Note</div>
          <div class="small" style="margin-top:6px">Ajuste par pas de 0.5</div>
          <div class="toolbar" style="margin-top:10px">
            <button class="btnGhost" id="minus">−</button>
            <div style="text-align:center">
              <div class="score" id="ratingText" style="font-size:26px">4.0/5</div>
              <div class="small" id="stars">★★★★☆</div>
            </div>
            <button class="btnGhost" id="plus">+</button>
          </div>
        </div>

        <div class="h2" style="font-size:16px">Titre</div>
        <input class="input" id="title" value="Très bon" />

        <div class="h2" style="font-size:16px">Commentaire</div>
        <textarea class="input" id="text">Nez agréable, bouche équilibrée, finale propre.</textarea>

        <button class="btn" id="save">Enregistrer l’avis</button>
        <div class="small">(V2) Avis sauvegardé dans ton navigateur.</div>
      </div>
    `;
  }

  function bindNavTabs(){
    app.querySelectorAll('[data-tab]').forEach(el => {
      el.addEventListener('click', () => {
        const tab = el.getAttribute('data-tab');
        if(tab === 'home') navTo({ name:'home', spiritId:null, prevTab:'home' });
        if(tab === 'cellar') navTo({ name:'cellar', spiritId:null, prevTab:'cellar' });
      });
    });
  }

  function bindSpiritOpens(prevTab){
    app.querySelectorAll('[data-open]').forEach(el => {
      el.addEventListener('click', () => navTo({ name:'detail', spiritId: el.getAttribute('data-open'), prevTab }));
      el.addEventListener('keydown', (ev) => { if(ev.key === 'Enter') el.click(); });
    });
  }

  function render(){
    if(state.route.name === 'home'){
      app.innerHTML = homeView();
      bindNavTabs();

      const q = document.getElementById('q');
      const type = document.getElementById('type');
      const country = document.getElementById('country');
      const abvMin = document.getElementById('abvMin');
      const abvMax = document.getElementById('abvMax');

      const rerender = () => render();

      q.addEventListener('input', (e) => { state.q = e.target.value; rerender(); });
      type.addEventListener('change', (e) => { state.filters.type = e.target.value; rerender(); });
      country.addEventListener('change', (e) => { state.filters.country = e.target.value; rerender(); });
      abvMin.addEventListener('input', (e) => { state.filters.abvMin = e.target.value; rerender(); });
      abvMax.addEventListener('input', (e) => { state.filters.abvMax = e.target.value; rerender(); });

      bindSpiritOpens('home');
      return;
    }

    if(state.route.name === 'cellar'){
      app.innerHTML = cellarView();
      bindNavTabs();
      bindSpiritOpens('cellar');

      document.getElementById('resetCellar').addEventListener('click', () => {
        if(confirm('Réinitialiser tous les statuts de la cave ?')){
          state.cellar = {};
          persist();
          render();
        }
      });
      return;
    }

    const spirit = spirits.find(s => s.id === state.route.spiritId);
    if(!spirit){
      navTo({ name:'home', spiritId:null, prevTab:'home' });
      return;
    }

    if(state.route.name === 'detail'){
      app.innerHTML = detailView(spirit);
      bindNavTabs();

      document.getElementById('back').addEventListener('click', () => {
        navTo({ name: state.route.prevTab === 'cellar' ? 'cellar' : 'home', spiritId: null, prevTab: state.route.prevTab });
      });

      document.getElementById('addReview').addEventListener('click', () =>
        navTo({ name:'addReview', spiritId: spirit.id, prevTab: state.route.prevTab })
      );

      app.querySelectorAll('[data-status]').forEach(el => {
        el.addEventListener('click', () => toggleStatus(spirit.id, el.getAttribute('data-status')));
      });

      return;
    }

    if(state.route.name === 'addReview'){
      app.innerHTML = addReviewView(spirit);

      let rating = 4.0;
      const ratingText = document.getElementById('ratingText');
      const stars = document.getElementById('stars');
      const title = document.getElementById('title');
      const text = document.getElementById('text');

      const update = () => {
        rating = Math.max(0, Math.min(5, Math.round(rating*2)/2));
        ratingText.textContent = rating.toFixed(1) + '/5';
        const full = Math.floor(rating);
        const half = (rating - full) >= 0.5;
        const empty = 5 - full - (half ? 1 : 0);
        stars.textContent = '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(Math.max(0, empty));
      };
      update();

      document.getElementById('minus').addEventListener('click', () => { rating -= 0.5; update(); });
      document.getElementById('plus').addEventListener('click', () => { rating += 0.5; update(); });

      document.getElementById('back').addEventListener('click', () =>
        navTo({ name:'detail', spiritId: spirit.id, prevTab: state.route.prevTab })
      );

      document.getElementById('save').addEventListener('click', () => {
        state.reviews = [
          ...state.reviews,
          {
            id: cryptoRandomId(),
            spiritId: spirit.id,
            rating,
            title: (title.value || '').trim(),
            text: (text.value || '').trim(),
            createdAtIso: new Date().toISOString(),
          }
        ];
        persist();
        navTo({ name:'detail', spiritId: spirit.id, prevTab: state.route.prevTab });
      });

      return;
    }
  }

  render();
})();