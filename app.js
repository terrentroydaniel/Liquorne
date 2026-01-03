window.__SPIRITS__=[{"id": "s1", "name": "Highland 12", "brand": "Liquorne Distilling", "type": "Whisky", "country": "Écosse", "abv": 40, "notes": ["miel", "vanille", "fruits secs"]}, {"id": "s2", "name": "Caña Dorada", "brand": "Casa del Sol", "type": "Rhum", "country": "Martinique", "abv": 50, "notes": ["canne", "agrumes", "poivre"]}, {"id": "s3", "name": "Juniper No. 3", "brand": "North Bay", "type": "Gin", "country": "France", "abv": 43, "notes": ["genièvre", "citron", "herbes"]}, {"id": "s4", "name": "Reposado Azul", "brand": "Agave Real", "type": "Tequila", "country": "Mexique", "abv": 40, "notes": ["agave", "caramel", "boisé"]}];
(() => {
  const spirits = window.__SPIRITS__;
  const app = document.getElementById('app');

  const storeKey = 'liquorne_reviews_v1';

  function loadReviews(){
    try{
      const raw = localStorage.getItem(storeKey);
      if(!raw) return [{
        id: cryptoRandomId(),
        spiritId: 's1',
        rating: 4.5,
        title: 'Classique, efficace',
        text: 'Vanille, miel, un boisé léger. Très facile à boire.',
        createdAtIso: new Date(Date.now() - 1000*60*60*10).toISOString(),
      }];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }catch{ return []; }
  }
  function saveReviews(reviews){
    localStorage.setItem(storeKey, JSON.stringify(reviews));
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

  let state = {
    route: { name: 'home', spiritId: null },
    q: '',
    reviews: loadReviews(),
  };

  function computeRating(spiritId){
    const rs = state.reviews.filter(r => r.spiritId === spiritId);
    if(rs.length === 0) return { avg: null, count: 0 };
    const sum = rs.reduce((a,r)=>a + Number(r.rating || 0), 0);
    return { avg: sum/rs.length, count: rs.length };
  }

  function navTo(route){
    state.route = route;
    render();
  }

  function header(){
    return `
      <div class="header">
        <div class="h1">Liquorne</div>
        <div class="p">Prototype web — “Vivino” des spiritueux</div>
      </div>
    `;
  }

  function homeView(){
    const qq = state.q.trim().toLowerCase();
    const filtered = !qq ? spirits : spirits.filter(s =>
      (`${s.name} ${s.brand} ${s.type} ${s.country}`).toLowerCase().includes(qq)
    );

    const list = filtered.map(s => {
      const r = computeRating(s.id);
      const ratingText = (r.avg == null || Number.isNaN(r.avg)) ? '—' : r.avg.toFixed(1);
      return `
        <div class="card spiritCard" role="button" tabindex="0" data-open="${esc(s.id)}">
          <div style="flex:1">
            <div class="title">${esc(s.name)}</div>
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
    }).join('');

    return `
      ${header()}
      <div class="container">
        <input class="input" placeholder="Rechercher (ex: whisky, rhum, marque...)" value="${esc(state.q)}" id="q" autocomplete="off" />
        <div class="row">
          <div style="flex:1; display:flex; flex-direction:column; gap:10px">
            ${list || `<div class="card"><div class="p">Aucun résultat.</div></div>`}
          </div>
          <div class="card" style="width:320px; height:170px">
            <div class="h2">Astuce</div>
            <div class="p" style="margin-top:8px">
              Ouvre une bouteille, puis ajoute un avis. Les avis sont sauvegardés dans ton navigateur (localStorage).
            </div>
          </div>
        </div>
        <div class="small">Astuce mobile: “Ajouter à l’écran d’accueil” pour l’avoir comme une app (PWA).</div>
      </div>
    `;
  }

  function detailView(spirit){
    const rs = state.reviews.filter(r => r.spiritId === spirit.id).slice().sort((a,b)=>b.createdAtIso.localeCompare(a.createdAtIso));
    const avg = rs.length ? (rs.reduce((a,r)=>a+r.rating,0)/rs.length) : null;

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
        <div class="p">Aucun avis pour le moment.</div>
        <div class="p" style="margin-top:8px">Sois le premier 👀</div>
      </div>
    `;

    return `
      <div class="header">
        <div class="toolbar">
          <button class="btnGhost" id="back">← Retour</button>
          <div style="flex:1"></div>
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
          </div>
          <div class="scoreBox" style="min-width:140px">
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
        <div class="toolbar">
          <button class="btnGhost" id="back">← Retour</button>
          <div style="flex:1"></div>
        </div>
      </div>
      <div class="container" style="max-width:700px">
        <div class="h1" style="font-size:22px">Ajouter un avis</div>
        <div class="p">${esc(spirit.name)} — ${esc(spirit.brand)}</div>

        <div class="card">
          <div class="h2">Note</div>
          <div class="p" style="margin-top:6px">Ajuste par pas de 0.5</div>
          <div class="toolbar" style="margin-top:10px">
            <button class="btnGhost" id="minus">−</button>
            <div style="text-align:center">
              <div class="score" id="ratingText" style="font-size:26px">4.0/5</div>
              <div class="small" id="stars">★★★★☆</div>
            </div>
            <button class="btnGhost" id="plus">+</button>
          </div>
        </div>

        <div class="h2">Titre</div>
        <input class="input" id="title" value="Très bon" />

        <div class="h2">Commentaire</div>
        <textarea class="input" id="text">Nez agréable, bouche équilibrée, finale propre.</textarea>

        <button class="btn" id="save">Enregistrer l’avis</button>
        <div class="small">(Prototype) Avis sauvegardé dans ton navigateur.</div>
      </div>
    `;
  }

  function render(){
    if(state.route.name === 'home'){
      app.innerHTML = homeView();
      const q = document.getElementById('q');
      q.addEventListener('input', (e) => { state.q = e.target.value; render(); });
      app.querySelectorAll('[data-open]').forEach(el => {
        el.addEventListener('click', () => navTo({ name:'detail', spiritId: el.getAttribute('data-open') }));
        el.addEventListener('keydown', (ev) => { if(ev.key === 'Enter') el.click(); });
      });
      return;
    }

    const spirit = spirits.find(s => s.id === state.route.spiritId);
    if(!spirit){
      state.route = { name:'home', spiritId:null };
      render();
      return;
    }

    if(state.route.name === 'detail'){
      app.innerHTML = detailView(spirit);
      document.getElementById('back').addEventListener('click', () => navTo({ name:'home', spiritId:null }));
      document.getElementById('addReview').addEventListener('click', () => navTo({ name:'addReview', spiritId: spirit.id }));
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
      document.getElementById('back').addEventListener('click', () => navTo({ name:'detail', spiritId: spirit.id }));

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
        saveReviews(state.reviews);
        navTo({ name:'detail', spiritId: spirit.id });
      });
      return;
    }
  }

  // expose spirits
  window.addEventListener('hashchange', render);
  render();
})();