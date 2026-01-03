window.__SPIRITS__=[{"id": "s1", "name": "Highland 12", "brand": "Liquorne Distilling", "type": "Whisky", "country": "Écosse", "abv": 40, "notes": ["miel", "vanille", "fruits secs"], "imageDataUrl": ""}, {"id": "s2", "name": "Caña Dorada", "brand": "Casa del Sol", "type": "Rhum", "country": "Martinique", "abv": 50, "notes": ["canne", "agrumes", "poivre"], "imageDataUrl": ""}, {"id": "s3", "name": "Juniper No. 3", "brand": "North Bay", "type": "Gin", "country": "France", "abv": 43, "notes": ["genièvre", "citron", "herbes"], "imageDataUrl": ""}, {"id": "s4", "name": "Reposado Azul", "brand": "Agave Real", "type": "Tequila", "country": "Mexique", "abv": 40, "notes": ["agave", "caramel", "boisé"], "imageDataUrl": ""}, {"id": "s5", "name": "Cognac VSOP Réserve", "brand": "Maison Lune", "type": "Cognac", "country": "France", "abv": 40, "notes": ["abricot", "chêne", "épices"], "imageDataUrl": ""}, {"id": "s6", "name": "Vodka Pure Grain", "brand": "Nordik", "type": "Vodka", "country": "Pologne", "abv": 40, "notes": ["céréales", "poivre blanc", "net"], "imageDataUrl": ""}];
(() => {
  const app = document.getElementById('app');

  const K = {
    reviews:  'liquorne_reviews_v3_2',
    cellar:   'liquorne_cellar_v3_2',
    session:  'liquorne_session_v3_2',
    spirits:  'liquorne_spirits_v3_2',
    users:    'liquorne_users_v3_2',
  };

  const DEMO_USER = 'demo';
  const DEMO_PASS = 'liquorne';

  const STATUS = {
    owned:    { key: 'owned',    label: '✅ Possédé'  },
    tasted:   { key: 'tasted',   label: '🍸 Goûté'    },
    wishlist: { key: 'wishlist', label: '⭐ Wishlist' },
  };

  function loadJson(key, fallback){
    try{ const raw = localStorage.getItem(key); if(!raw) return fallback; return JSON.parse(raw) ?? fallback; }
    catch{ return fallback; }
  }
  function saveJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

  function cryptoRandomId(){
    if (window.crypto && crypto.getRandomValues){
      const a = new Uint32Array(4);
      crypto.getRandomValues(a);
      return Array.from(a).map(x=>x.toString(16)).join('-') + '-' + Date.now().toString(16);
    }
    return Math.random().toString(16).slice(2) + '-' + Date.now().toString(16);
  }
  function esc(s){ return (s ?? '').toString().replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  function seedSpirits(){ return (window.__SPIRITS__ || []).slice(); }
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
  function defaultUsers(){
    return [
      { id: 'u-demo', username: DEMO_USER, email: 'demo@liquorne.local', password: DEMO_PASS, createdAtIso: new Date().toISOString() },
    ];
  }

  let state = {
    route: { name: 'login', spiritId: null, prevTab: 'home' },
    q: '',
    filters: { type:'', country:'', abvMin:'', abvMax:'' },
    reviews: loadJson(K.reviews, null) ?? defaultReviews(),
    cellar:  loadJson(K.cellar, null) ?? {},
    session: loadJson(K.session, null),
    spirits: loadJson(K.spirits, null) ?? seedSpirits(),
    users:   loadJson(K.users, null) ?? defaultUsers(),
    loginError: '',
    signupError: '',
    addDraft: { imageDataUrl:'', name:'', brand:'', type:'Whisky', country:'France', abv:'40', notes:'' },
    editor: { open:false, target:null, srcDataUrl:'', angle:0, zoom:1, panX:0, panY:0, dragging:false, dragStart:{x:0,y:0,panX:0,panY:0} }
  };

  function persist(){
    saveJson(K.reviews, state.reviews);
    saveJson(K.cellar, state.cellar);
    saveJson(K.session, state.session);
    saveJson(K.spirits, state.spirits);
    saveJson(K.users, state.users);
  }

  function isLoggedIn(){ return !!(state.session && state.session.userId); }
  function getUser(){ return state.session?.userId ? (state.users.find(u => u.id === state.session.userId) || null) : null; }

  function ensureAuth(){
    if(!isLoggedIn()){
      state.route = { name:'login', spiritId:null, prevTab:'home' };
      render(); return false;
    }
    return true;
  }
  function navTo(route){ state.route = route; render(); }
  function logout(){ state.session = null; persist(); navTo({ name:'login', spiritId:null, prevTab:'home' }); }

  function computeRating(spiritId){
    const rs = state.reviews.filter(r => r.spiritId === spiritId);
    if(rs.length === 0) return { avg: null, count: 0 };
    const sum = rs.reduce((a,r)=>a + Number(r.rating || 0), 0);
    return { avg: sum/rs.length, count: rs.length };
  }
  function getStatus(spiritId){
    const s = state.cellar[spiritId];
    return { owned: !!s?.owned, tasted: !!s?.tasted, wishlist: !!s?.wishlist };
  }
  function toggleStatus(spiritId, key){
    const current = state.cellar[spiritId] || { owned:false, tasted:false, wishlist:false, updatedAtIso: new Date().toISOString() };
    const next = { ...current, [key]: !current[key], updatedAtIso: new Date().toISOString() };
    state.cellar = { ...state.cellar, [spiritId]: next };
    persist(); render();
  }

  function uniqueSorted(values){ return Array.from(new Set(values)).sort((a,b)=>a.localeCompare(b, 'fr')); }

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
      if(abvMin != null && Number.isFinite(abvMin) && Number(s.abv) < abvMin) return false;
      if(abvMax != null && Number.isFinite(abvMax) && Number(s.abv) > abvMax) return false;
      return true;
    });
  }
  function sortList(list, sortKey){
    const arr = list.slice();
    if(sortKey === 'rating_desc'){
      arr.sort((a,b) => (computeRating(b.id).avg ?? -1) - (computeRating(a.id).avg ?? -1));
    } else if(sortKey === 'abv_desc'){
      arr.sort((a,b) => Number(b.abv||0) - Number(a.abv||0));
    } else if(sortKey === 'abv_asc'){
      arr.sort((a,b) => Number(a.abv||0) - Number(b.abv||0));
    } else if(sortKey === 'name_asc'){
      arr.sort((a,b) => (a.name||'').localeCompare((b.name||''), 'fr'));
    }
    return arr;
  }
  function kpis(){
    const st = Object.values(state.cellar || {});
    const owned = st.filter(v => v?.owned).length;
    const tasted = st.filter(v => v?.tasted).length;
    const wish = st.filter(v => v?.wishlist).length;
    const myAvg = state.reviews.length ? (state.reviews.reduce((a,r)=>a+Number(r.rating||0),0)/state.reviews.length) : null;
    return { owned, tasted, wish, myAvg };
  }

  function thumbHtml(spirit){
    const has = !!(spirit.imageDataUrl && spirit.imageDataUrl.startsWith('data:image/'));
    return has
      ? `<div class="thumb"><img src="${spirit.imageDataUrl}" alt="photo" /></div>`
      : `<div class="thumb"><div class="ph">PHOTO</div></div>`;
  }

  function spiritCardHtml(s){
    const r = computeRating(s.id);
    const ratingText = (r.avg == null || Number.isNaN(r.avg)) ? '—' : r.avg.toFixed(1);
    const st = getStatus(s.id);
    const badges = [
      st.owned ? '<span class="badge">Possédé</span>' : '',
      st.tasted ? '<span class="badge">Goûté</span>' : '',
      st.wishlist ? '<span class="badge">Wishlist</span>' : '',
    ].filter(Boolean).join('');
    const notes = (s.notes || []).slice(0,3);
    return `
      <div class="card item" role="button" tabindex="0" data-open="${esc(s.id)}">
        <div style="display:flex; gap:12px; align-items:center; flex:1; min-width:0">
          ${thumbHtml(s)}
          <div style="min-width:0">
            <div class="title" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis">
              ${esc(s.name)} ${badges || ''}
            </div>
            <div class="meta">${esc(s.brand)} • ${esc(s.type)} • ${esc(s.country)} • ${esc(s.abv)}%</div>
            <div class="tags">
              ${notes.map(n => `<div class="chip">${esc(n)}</div>`).join('')}
            </div>
          </div>
        </div>
        <div class="scoreBox">
          <div class="score">${ratingText}</div>
          <div class="count">${r.count} avis</div>
        </div>
      </div>
    `;
  }

  // ---- Photo editor ----
  function fileToDataUrl(file){
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
  function openEditor(target, srcDataUrl){
    state.editor.open = true;
    state.editor.target = target;
    state.editor.srcDataUrl = srcDataUrl;
    state.editor.angle = 0;
    state.editor.zoom = 1;
    state.editor.panX = 0;
    state.editor.panY = 0;
    render();
    setTimeout(drawEditor, 0);
  }
  function closeEditor(){
    state.editor.open = false;
    state.editor.target = null;
    state.editor.srcDataUrl = '';
    render();
  }
  function applyEditedPhoto(dataUrl){
    if(!state.editor.target) return;
    if(state.editor.target.kind === 'addDraft'){
      state.addDraft.imageDataUrl = dataUrl;
    } else if(state.editor.target.kind === 'spirit'){
      const id = state.editor.target.spiritId;
      state.spirits = state.spirits.map(s => s.id === id ? { ...s, imageDataUrl: dataUrl } : s);
      persist();
    }
  }
  function drawEditor(){
    if(!state.editor.open) return;
    const canvas = document.getElementById('editorCanvas');
    const wrap = document.getElementById('editorWrap');
    if(!canvas || !wrap) return;

    const size = Math.max(260, Math.min(520, Math.floor(wrap.clientWidth)));
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,size,size);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = 'rgba(255,255,255,.02)';
      ctx.fillRect(0,0,size,size);

      ctx.save();
      ctx.translate(size/2 + state.editor.panX, size/2 + state.editor.panY);
      ctx.rotate((state.editor.angle * Math.PI)/180);

      const baseScale = Math.max(size / img.width, size / img.height);
      const scale = baseScale * state.editor.zoom;
      ctx.scale(scale, scale);

      ctx.drawImage(img, -img.width/2, -img.height/2);
      ctx.restore();

      ctx.strokeStyle = 'rgba(255,255,255,.14)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1,1,size-2,size-2);
    };
    img.src = state.editor.srcDataUrl;
  }
  function bindEditorEvents(){
    const wrap = document.getElementById('editorWrap');
    if(!wrap) return;

    const getPoint = (e) => {
      if(e.touches && e.touches.length){
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    };

    const start = (e) => {
      e.preventDefault();
      const p = getPoint(e);
      state.editor.dragging = true;
      state.editor.dragStart = { x:p.x, y:p.y, panX: state.editor.panX, panY: state.editor.panY };
    };
    const move = (e) => {
      if(!state.editor.dragging) return;
      e.preventDefault();
      const p = getPoint(e);
      const dx = p.x - state.editor.dragStart.x;
      const dy = p.y - state.editor.dragStart.y;
      state.editor.panX = state.editor.dragStart.panX + dx;
      state.editor.panY = state.editor.dragStart.panY + dy;
      drawEditor();
    };
    const end = (e) => {
      if(!state.editor.dragging) return;
      e.preventDefault();
      state.editor.dragging = false;
    };

    wrap.addEventListener('mousedown', start);
    wrap.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    wrap.addEventListener('touchstart', start, { passive:false });
    wrap.addEventListener('touchmove', move, { passive:false });
    wrap.addEventListener('touchend', end, { passive:false });

    document.getElementById('zoom')?.addEventListener('input', (e) => {
      state.editor.zoom = Number(e.target.value);
      drawEditor();
    });
    document.getElementById('rotate')?.addEventListener('click', () => {
      state.editor.angle = (state.editor.angle + 90) % 360;
      drawEditor();
    });
    document.getElementById('center')?.addEventListener('click', () => {
      state.editor.panX = 0; state.editor.panY = 0; state.editor.zoom = 1; state.editor.angle = 0;
      const z = document.getElementById('zoom');
      if(z) z.value = '1';
      drawEditor();
    });
    document.getElementById('savePhoto')?.addEventListener('click', () => {
      const c = document.getElementById('editorCanvas');
      if(!c) return;
      const out = c.toDataURL('image/jpeg', 0.86);
      applyEditedPhoto(out);
      closeEditor();
    });
    document.getElementById('cancelPhoto')?.addEventListener('click', closeEditor);
  }

  // ---- UI blocks ----
  function fab(){
    if(!isLoggedIn()) return '';
    return `<button class="fab" id="fabAdd" aria-label="Ajouter">+</button>`;
  }
  function topbar(active){
    const user = getUser();
    const uname = user ? esc(user.username) : '';
    return `
      <div class="topbar">
        <div class="topbarInner">
          <div class="brand">
            <img src="./assets/logo-diamond-256-v34.png" alt="Liquorne"/>
            <div class="brandTitle">
              <div class="h1">Liquorne</div>
              <div class="sub">V3.4 • prototype</div>
            </div>
          </div>
          <div class="actions">
            <button class="pill ${active==='home'?'':'ghost'}" data-tab="home">Explorer</button>
            <button class="pill ${active==='cellar'?'':'ghost'}" data-tab="cellar">Ma cave</button>
            <button class="pill ghost" id="logout">Déco${uname ? ` • ${uname}` : ''}</button>
          </div>
        </div>
      </div>
    `;
  }

  function editorModal(){
    if(!state.editor.open) return '';
    return `
      <div class="modalBg">
        <div class="modal">
          <div class="modalHeader">
            <div>
              <div class="h2" style="font-size:16px">Éditer la photo</div>
              <div class="small">Glisse pour déplacer • Zoom • Rotation</div>
            </div>
            <button class="btnGhost" id="cancelPhoto">Fermer</button>
          </div>
          <div class="modalBody">
            <div class="canvasWrap" id="editorWrap">
              <canvas id="editorCanvas" width="400" height="400"></canvas>
            </div>
            <div class="sliderRow">
              <div class="small" style="min-width:58px">Zoom</div>
              <input id="zoom" type="range" min="0.8" max="2.6" step="0.01" value="${state.editor.zoom}" />
            </div>
            <div class="row" style="margin-top:10px">
              <button class="btnGhost" id="rotate">↻ Rotation</button>
              <button class="btnGhost" id="center">Centrer</button>
              <button class="btn" id="savePhoto">Enregistrer</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function filtersHtml(sortKey){
    const types = uniqueSorted(state.spirits.map(s => s.type).filter(Boolean));
    const countries = uniqueSorted(state.spirits.map(s => s.country).filter(Boolean));
    return `
      <div class="card">
        <div class="grid">
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
        <div class="row">
          <div class="small">Android → Chrome ⋮ → “Ajouter à l’écran d’accueil” (PWA)</div>
          <select id="sort" style="max-width:260px">
            <option value="rating_desc" ${sortKey==='rating_desc'?'selected':''}>Trier : note ↓</option>
            <option value="name_asc" ${sortKey==='name_asc'?'selected':''}>Trier : nom A→Z</option>
            <option value="abv_desc" ${sortKey==='abv_desc'?'selected':''}>Trier : ABV ↓</option>
            <option value="abv_asc" ${sortKey==='abv_asc'?'selected':''}>Trier : ABV ↑</option>
          </select>
        </div>
      </div>
    `;
  }

  function homeView(sortKey){
    const filtered = applyFilters(state.spirits);
    const sorted = sortList(filtered, sortKey);
    const list = sorted.map(spiritCardHtml).join('');
    const { owned, tasted, wish, myAvg } = kpis();
    return `
      <div class="page">
        ${topbar('home')}
        <div class="container">
          <div class="card">
            <div class="kpis">
              <div class="kpi"><div class="value">${owned}</div><div class="label">Possédés</div></div>
              <div class="kpi"><div class="value">${tasted}</div><div class="label">Goûtés</div></div>
              <div class="kpi"><div class="value">${wish}</div><div class="label">Wishlist</div></div>
              <div class="kpi"><div class="value">${myAvg == null ? '—' : myAvg.toFixed(1)}</div><div class="label">Ma note moyenne</div></div>
            </div>
          </div>
          ${filtersHtml(sortKey)}
          <div class="list">
            ${list || `<div class="card"><div class="small">Aucun résultat.</div></div>`}
          </div>
        </div>
        ${fab()}
      </div>
    `;
  }

  function cellarSection(title, items, sortKey){
    const sorted = sortList(items, sortKey);
    return `
      <div class="card">
        <div class="row">
          <div>
            <div class="h2">${esc(title)}</div>
            <div class="small">${sorted.length} bouteille(s)</div>
          </div>
          <div class="small">Tape une bouteille</div>
        </div>
        <div class="divider"></div>
        <div class="list">
          ${sorted.length ? sorted.map(spiritCardHtml).join('') : `<div class="small">Rien pour le moment.</div>`}
        </div>
      </div>
    `;
  }

  function cellarView(sortKey){
    const inCellar = state.spirits.filter(s => {
      const st = getStatus(s.id);
      return st.owned || st.tasted || st.wishlist;
    });
    const owned = inCellar.filter(s => getStatus(s.id).owned);
    const tasted = inCellar.filter(s => getStatus(s.id).tasted);
    const wish = inCellar.filter(s => getStatus(s.id).wishlist);
    const { owned: kOwned, tasted: kTasted, wish: kWish, myAvg } = kpis();
    return `
      <div class="page">
        ${topbar('cellar')}
        <div class="container">
          <div class="card">
            <div class="row">
              <div>
                <div class="h2">Ma cave</div>
                <div class="small">Données sur ce téléphone (prototype)</div>
              </div>
              <div style="display:flex; gap:10px; flex-wrap:wrap">
                <select id="sort" style="max-width:260px">
                  <option value="rating_desc" ${sortKey==='rating_desc'?'selected':''}>Trier : note ↓</option>
                  <option value="name_asc" ${sortKey==='name_asc'?'selected':''}>Trier : nom A→Z</option>
                  <option value="abv_desc" ${sortKey==='abv_desc'?'selected':''}>Trier : ABV ↓</option>
                  <option value="abv_asc" ${sortKey==='abv_asc'?'selected':''}>Trier : ABV ↑</option>
                </select>
                <button class="btnGhost" id="resetCellar">Réinitialiser</button>
              </div>
            </div>
            <div class="divider"></div>
            <div class="kpis">
              <div class="kpi"><div class="value">${kOwned}</div><div class="label">Possédés</div></div>
              <div class="kpi"><div class="value">${kTasted}</div><div class="label">Goûtés</div></div>
              <div class="kpi"><div class="value">${kWish}</div><div class="label">Wishlist</div></div>
              <div class="kpi"><div class="value">${myAvg == null ? '—' : myAvg.toFixed(1)}</div><div class="label">Ma note moyenne</div></div>
            </div>
          </div>
          ${cellarSection('✅ Possédés', owned, sortKey)}
          ${cellarSection('🍸 Goûtés', tasted, sortKey)}
          ${cellarSection('⭐ Wishlist', wish, sortKey)}
        </div>
        ${fab()}
      </div>
    `;
  }

  function detailView(spirit){
    const rs = state.reviews.filter(r => r.spiritId === spirit.id).slice().sort((a,b)=>b.createdAtIso.localeCompare(a.createdAtIso));
    const avg = rs.length ? (rs.reduce((a,r)=>a+r.rating,0)/rs.length) : null;
    const st = getStatus(spirit.id);
    const image = spirit.imageDataUrl && spirit.imageDataUrl.startsWith('data:image/')
      ? `<img src="${spirit.imageDataUrl}" alt="photo" style="width:120px;height:120px;object-fit:cover;border-radius:24px;border:1px solid rgba(255,255,255,.12)" />`
      : `<div class="thumb" style="width:120px;height:120px;border-radius:24px"><div class="ph">PHOTO</div></div>`;

    const reviewsHtml = rs.length ? rs.map(r => `
      <div class="card">
        <div class="row">
          <div class="title">${esc(r.title || 'Avis')}</div>
          <div class="title">${Number(r.rating).toFixed(1)}/5</div>
        </div>
        <div class="small" style="margin-top:6px;color:var(--text)">${esc(r.text)}</div>
        <div class="small" style="margin-top:8px">${new Date(r.createdAtIso).toLocaleString()}</div>
      </div>
    `).join('') : `<div class="card"><div class="small">Aucun avis pour le moment.</div></div>`;

    const hasPhoto = !!spirit.imageDataUrl;

    return `
      <div class="page">
        ${topbar(state.route.prevTab === 'cellar' ? 'cellar' : 'home')}
        <div class="container">
          <button class="btnGhost" id="back">← Retour</button>

          <div class="card" style="display:flex; gap:14px; align-items:flex-start; flex-wrap:wrap">
            ${image}
            <div style="flex:1; min-width:240px; display:flex; flex-direction:column; gap:6px">
              <div class="title" style="font-size:20px">${esc(spirit.name)}</div>
              <div class="small">${esc(spirit.brand)} • ${esc(spirit.type)} • ${esc(spirit.country)} • ${esc(spirit.abv)}%</div>
              <div class="tags">${(spirit.notes||[]).map(n => `<div class="chip">${esc(n)}</div>`).join('')}</div>

              <div class="divider"></div>

              <div class="row">
                <div>
                  <div class="h2" style="font-size:16px">Photo</div>
                  <div class="small">Remplacer / éditer / retirer</div>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap">
                  <label class="btnGhost" style="cursor:pointer">
                    Changer
                    <input id="fileChange" type="file" accept="image/*" style="display:none" />
                  </label>
                  <button class="btnGhost" id="editPhoto" ${hasPhoto ? '' : 'disabled'}>Éditer</button>
                  <button class="btnDanger" id="removePhoto" ${hasPhoto ? '' : 'disabled'}>Retirer</button>
                </div>
              </div>

              <div class="divider"></div>

              <div class="h2" style="font-size:16px">Statuts (Ma cave)</div>
              <div class="small">Tape pour activer/désactiver</div>
              <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px">
                <button class="pill ${st.owned ? '' : 'ghost'}" data-status="owned">${STATUS.owned.label}</button>
                <button class="pill ${st.tasted ? '' : 'ghost'}" data-status="tasted">${STATUS.tasted.label}</button>
                <button class="pill ${st.wishlist ? '' : 'ghost'}" data-status="wishlist">${STATUS.wishlist.label}</button>
              </div>
            </div>

            <div class="scoreBox" style="min-width:160px">
              <div class="score" style="font-size:34px">${avg == null ? '—' : avg.toFixed(1)}</div>
              <div class="count">${rs.length} avis</div>
              <div style="height:8px"></div>
              <button class="btn" id="addReview">+ Ajouter un avis</button>
            </div>
          </div>

          <div class="h2">Avis</div>
          <div class="list">${reviewsHtml}</div>
        </div>
        ${fab()}
      </div>
    `;
  }

  function addReviewView(spirit){
    return `
      <div class="page">
        ${topbar('home')}
        <div class="container" style="max-width:720px">
          <button class="btnGhost" id="back">← Retour</button>

          <div class="card">
            <div class="h2">Ajouter un avis</div>
            <div class="small">${esc(spirit.name)} — ${esc(spirit.brand)}</div>
          </div>

          <div class="card">
            <div class="row">
              <div>
                <div class="h2" style="font-size:16px">Note</div>
                <div class="small">Pas de 0.5</div>
              </div>
              <div class="title" id="ratingText" style="font-size:20px">4.0/5</div>
            </div>
            <div class="sliderRow">
              <input id="rating" type="range" min="0" max="5" step="0.5" value="4" />
            </div>
          </div>

          <div class="card">
            <div class="small">Titre</div>
            <input class="input" id="title" value="Très bon" />
            <div style="height:10px"></div>
            <div class="small">Commentaire</div>
            <textarea class="input" id="text">Nez agréable, bouche équilibrée, finale propre.</textarea>
            <div style="height:12px"></div>
            <button class="btn" id="save">Enregistrer</button>
          </div>
        </div>
      </div>
    `;
  }

  function addSpiritView(){
    const types = uniqueSorted(state.spirits.map(s => s.type).filter(Boolean).concat(['Whisky','Rhum','Gin','Tequila','Cognac','Vodka','Armagnac','Brandy','Autre']));
    const countries = uniqueSorted(state.spirits.map(s => s.country).filter(Boolean).concat(['France','Écosse','Irlande','USA','Mexique','Japon','Martinique','Guadeloupe','Italie','Espagne','Canada','Autre']));
    const hasPhoto = state.addDraft.imageDataUrl && state.addDraft.imageDataUrl.startsWith('data:image/');
    const img = hasPhoto
      ? `<img src="${state.addDraft.imageDataUrl}" alt="photo" style="width:120px;height:120px;object-fit:cover;border-radius:24px;border:1px solid rgba(255,255,255,.12)" />`
      : `<div class="thumb" style="width:120px;height:120px;border-radius:24px"><div class="ph">PHOTO</div></div>`;

    return `
      <div class="page">
        ${topbar('home')}
        <div class="container" style="max-width:820px">
          <button class="btnGhost" id="back">← Retour</button>

          <div class="card">
            <div class="row">
              <div>
                <div class="h2">Ajouter un spiritueux</div>
                <div class="small">Import galerie + recadrage intégré</div>
              </div>
              <button class="btnGhost" id="clearDraft">Réinitialiser</button>
            </div>

            <div class="divider"></div>

            <div style="display:flex; gap:14px; flex-wrap:wrap; align-items:center">
              ${img}
              <div style="flex:1; min-width:240px; display:flex; flex-direction:column; gap:10px">
                <div class="row" style="justify-content:flex-start">
                  <label class="btn" style="cursor:pointer">
                    📁 Importer une photo
                    <input id="fileInputAdd" type="file" accept="image/*" style="display:none" />
                  </label>
                  <button class="btnGhost" id="editDraft" ${hasPhoto ? '' : 'disabled'}>Éditer</button>
                  <button class="btnDanger" id="removeDraft" ${hasPhoto ? '' : 'disabled'}>Retirer</button>
                </div>
                <div class="small">Édition : recadrage carré + zoom + déplacement + rotation.</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="h2" style="font-size:16px">Informations</div>
            <div style="height:10px"></div>

            <div class="small">Nom</div>
            <input class="input" id="name" placeholder="Ex: Talisker 10" value="${esc(state.addDraft.name)}" />

            <div style="height:10px"></div>
            <div class="small">Marque / Distillerie</div>
            <input class="input" id="brand" placeholder="Ex: Talisker" value="${esc(state.addDraft.brand)}" />

            <div style="height:10px"></div>
            <div class="grid" style="grid-template-columns:1fr 1fr 1fr;">
              <div>
                <div class="small">Type</div>
                <select id="type">
                  ${types.map(t => `<option value="${esc(t)}" ${state.addDraft.type===t ? 'selected' : ''}>${esc(t)}</option>`).join('')}
                </select>
              </div>
              <div>
                <div class="small">Pays</div>
                <select id="country">
                  ${countries.map(c => `<option value="${esc(c)}" ${state.addDraft.country===c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
                </select>
              </div>
              <div>
                <div class="small">ABV %</div>
                <input class="input" id="abv" inputmode="decimal" placeholder="40" value="${esc(state.addDraft.abv)}" />
              </div>
            </div>

            <div style="height:10px"></div>
            <div class="small">Notes (séparées par des virgules)</div>
            <input class="input" id="notes" placeholder="vanille, miel, tourbe" value="${esc(state.addDraft.notes)}" />

            <div style="height:14px"></div>
            <div class="row">
              <button class="btn" id="saveSpirit">Enregistrer</button>
              <div class="small">Puis : avis maintenant ou plus tard.</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ---- Auth views ----
  function loginView(){
  return `
    <div class="authShellB">
      <div class="authPanelB">
        <div class="authGridB">
          <div class="authB">
            <div class="badgeWrap" aria-label="Liquorne badge">
              <img class="badgeLogo" src="./assets/logo-diamond-512-v34.png" alt="Liquorne" />
            </div>

            <div class="brandNameB">Liquorne</div>
            <div class="baselineB">Spirits Explorer</div>

            <div class="authCardB">
              <button class="googleBtn" id="googleLogin">
                <span class="googleDot"></span>
                Continuer avec Google (démo)
              </button>

              <div class="sep">ou</div>

              <div class="small">Identifiant (username ou email)</div>
              <input class="input" id="login" placeholder="demo" autocomplete="username" />

              <div class="small">Mot de passe</div>
              <input class="input" id="pass" type="password" placeholder="liquorne" autocomplete="current-password" />

              <button class="btnGold" id="doLogin">Se connecter</button>
              ${state.loginError ? `<div class="error">${esc(state.loginError)}</div>` : ''}

              <div class="row">
                <div class="small">Démo : <b>${DEMO_USER}</b> / <b>${DEMO_PASS}</b></div>
                <button class="btnGhost" id="goSignup">S’inscrire</button>
              </div>

              <div class="small" style="opacity:.85; margin-top:2px">
                Prototype : les comptes et données restent sur ce téléphone.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function signupView(){
  return `
    <div class="authShellB">
      <div class="authPanelB">
        <div class="authGridB">
          <div class="authB">
            <div class="badgeWrap" aria-label="Liquorne badge">
              <img class="badgeLogo" src="./assets/logo-diamond-512-v34.png" alt="Liquorne" />
            </div>

            <div class="brandNameB">Créer un compte</div>
            <div class="baselineB">Spirits Explorer</div>

            <div class="authCardB">
              <div class="authTitle">S’inscrire</div>

              <div class="small">Username</div>
              <input class="input" id="suUser" placeholder="ex: daniel" autocomplete="username" />

              <div class="small">Email (optionnel)</div>
              <input class="input" id="suEmail" placeholder="ex: moi@mail.com" autocomplete="email" inputmode="email" />

              <div class="small">Mot de passe</div>
              <input class="input" id="suPass" type="password" placeholder="8 caractères min." autocomplete="new-password" />

              <div class="small">Confirmer</div>
              <input class="input" id="suPass2" type="password" placeholder="retaper le mot de passe" autocomplete="new-password" />

              <button class="btnGold" id="doSignup">Créer mon compte</button>
              ${state.signupError ? `<div class="error">${esc(state.signupError)}</div>` : ''}

              <div class="row">
                <button class="btnGhost" id="backLogin">← Retour</button>
                <div class="small">Prototype (non sécurisé).</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ---- Bindings ----
  function bindTopbarTabs(){
    app.querySelectorAll('[data-tab]').forEach(el => {
      el.addEventListener('click', () => {
        const tab = el.getAttribute('data-tab');
        if(tab === 'home') navTo({ name:'home', spiritId:null, prevTab:'home' });
        if(tab === 'cellar') navTo({ name:'cellar', spiritId:null, prevTab:'cellar' });
      });
    });
    document.getElementById('logout')?.addEventListener('click', logout);
    document.getElementById('fabAdd')?.addEventListener('click', () => navTo({ name:'add', spiritId:null, prevTab: state.route.name === 'cellar' ? 'cellar' : 'home' }));
  }
  function bindSpiritOpens(prevTab){
    app.querySelectorAll('[data-open]').forEach(el => {
      el.addEventListener('click', () => navTo({ name:'detail', spiritId: el.getAttribute('data-open'), prevTab }));
      el.addEventListener('keydown', (ev) => { if(ev.key === 'Enter') el.click(); });
    });
  }

  function findUserByLogin(login){
    const s = (login || '').trim().toLowerCase();
    if(!s) return null;
    return state.users.find(u => (u.username||'').toLowerCase() === s || (u.email||'').toLowerCase() === s) || null;
  }
  function loginAs(user){
    state.session = { userId: user.id, createdAtIso: new Date().toISOString() };
    state.loginError = '';
    persist();
    navTo({ name:'home', spiritId:null, prevTab:'home' });
  }
  function validateEmail(email){
    const e = (email || '').trim();
    if(!e) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  // ---- Router ----
  let sortHome = 'rating_desc';
  let sortCellar = 'rating_desc';

  function render(){
    if(!Array.isArray(state.users) || !state.users.length){
      state.users = defaultUsers();
      persist();
    }

    if(!isLoggedIn()){
      if(state.route.name !== 'signup'){
        state.route = { name:'login', spiritId:null, prevTab:'home' };
      }
    } else if(state.route.name === 'login' || state.route.name === 'signup'){
      state.route = { name:'home', spiritId:null, prevTab:'home' };
    }

    if(state.route.name === 'login'){
      app.innerHTML = loginView();
      const login = document.getElementById('login');
      const pass = document.getElementById('pass');
      login.value = DEMO_USER;
      pass.value = DEMO_PASS;

      document.getElementById('doLogin').addEventListener('click', () => {
        const u = findUserByLogin(login.value);
        const p = (pass.value || '').trim();
        if(!u || u.password !== p){
          state.loginError = 'Identifiants incorrects.';
          render();
          return;
        }
        loginAs(u);
      });
      pass.addEventListener('keydown', (e) => { if(e.key === 'Enter') document.getElementById('doLogin').click(); });

      document.getElementById('googleLogin').addEventListener('click', () => {
        let u = state.users.find(x => x.username === 'google');
        if(!u){
          u = { id:'u-google', username:'google', email:'google@demo', password:'', createdAtIso: new Date().toISOString() };
          state.users = [u, ...state.users];
          persist();
        }
        loginAs(u);
      });

      document.getElementById('goSignup').addEventListener('click', () => {
        state.signupError = '';
        navTo({ name:'signup', spiritId:null, prevTab:'home' });
      });
      return;
    }

    if(state.route.name === 'signup'){
      app.innerHTML = signupView();
      document.getElementById('backLogin').addEventListener('click', () => navTo({ name:'login', spiritId:null, prevTab:'home' }));

      document.getElementById('doSignup').addEventListener('click', () => {
        const username = (document.getElementById('suUser').value || '').trim();
        const email = (document.getElementById('suEmail').value || '').trim();
        const p1 = (document.getElementById('suPass').value || '').trim();
        const p2 = (document.getElementById('suPass2').value || '').trim();

        const unameLow = username.toLowerCase();

        if(username.length < 3){ state.signupError = 'Username : 3 caractères minimum.'; render(); return; }
        if(state.users.some(u => (u.username||'').toLowerCase() === unameLow)){ state.signupError = 'Ce username est déjà utilisé.'; render(); return; }
        if(!validateEmail(email)){ state.signupError = 'Email invalide.'; render(); return; }
        if(email && state.users.some(u => (u.email||'').toLowerCase() === email.toLowerCase())){ state.signupError = 'Cet email est déjà utilisé.'; render(); return; }
        if(p1.length < 8){ state.signupError = 'Mot de passe : 8 caractères minimum.'; render(); return; }
        if(p1 !== p2){ state.signupError = 'Les mots de passe ne correspondent pas.'; render(); return; }

        const newUser = { id:'u-' + cryptoRandomId(), username, email, password:p1, createdAtIso: new Date().toISOString() };
        state.users = [newUser, ...state.users];
        persist();
        loginAs(newUser);
      });
      return;
    }

    if(state.route.name === 'home'){
      if(!ensureAuth()) return;
      app.innerHTML = homeView(sortHome) + editorModal();
      bindTopbarTabs();

      const q = document.getElementById('q');
      const type = document.getElementById('type');
      const country = document.getElementById('country');
      const abvMin = document.getElementById('abvMin');
      const abvMax = document.getElementById('abvMax');
      const sort = document.getElementById('sort');

      const rerender = () => render();
      q.addEventListener('input', (e) => { state.q = e.target.value; rerender(); });
      type.addEventListener('change', (e) => { state.filters.type = e.target.value; rerender(); });
      country.addEventListener('change', (e) => { state.filters.country = e.target.value; rerender(); });
      abvMin.addEventListener('input', (e) => { state.filters.abvMin = e.target.value; rerender(); });
      abvMax.addEventListener('input', (e) => { state.filters.abvMax = e.target.value; rerender(); });
      sort.addEventListener('change', (e) => { sortHome = e.target.value; rerender(); });

      bindSpiritOpens('home');
      if(state.editor.open) bindEditorEvents();
      return;
    }

    if(state.route.name === 'cellar'){
      if(!ensureAuth()) return;
      app.innerHTML = cellarView(sortCellar) + editorModal();
      bindTopbarTabs();
      bindSpiritOpens('cellar');

      document.getElementById('sort')?.addEventListener('change', (e) => { sortCellar = e.target.value; render(); });
      document.getElementById('resetCellar')?.addEventListener('click', () => {
        if(confirm('Réinitialiser tous les statuts de la cave ?')){
          state.cellar = {}; persist(); render();
        }
      });

      if(state.editor.open) bindEditorEvents();
      return;
    }

    if(state.route.name === 'add'){
      if(!ensureAuth()) return;
      app.innerHTML = addSpiritView() + editorModal();

      document.getElementById('back').addEventListener('click', () => {
        navTo({ name: state.route.prevTab === 'cellar' ? 'cellar' : 'home', spiritId:null, prevTab: state.route.prevTab });
      });

      document.getElementById('clearDraft')?.addEventListener('click', () => {
        if(confirm('Réinitialiser le formulaire ?')){
          state.addDraft = { imageDataUrl:'', name:'', brand:'', type:'Whisky', country:'France', abv:'40', notes:'' };
          render();
        }
      });
      document.getElementById('removeDraft')?.addEventListener('click', () => { state.addDraft.imageDataUrl = ''; render(); });
      document.getElementById('editDraft')?.addEventListener('click', () => { if(state.addDraft.imageDataUrl) openEditor({kind:'addDraft'}, state.addDraft.imageDataUrl); });

      document.getElementById('fileInputAdd')?.addEventListener('change', async (e) => {
        const f = e.target.files && e.target.files[0];
        if(!f) return;
        const dataUrl = await fileToDataUrl(f);
        openEditor({kind:'addDraft'}, dataUrl);
      });

      const name = document.getElementById('name');
      const brand = document.getElementById('brand');
      const type = document.getElementById('type');
      const country = document.getElementById('country');
      const abv = document.getElementById('abv');
      const notes = document.getElementById('notes');

      const syncDraft = () => {
        state.addDraft.name = name.value;
        state.addDraft.brand = brand.value;
        state.addDraft.type = type.value;
        state.addDraft.country = country.value;
        state.addDraft.abv = abv.value;
        state.addDraft.notes = notes.value;
      };
      [name, brand, abv, notes].forEach(el => el.addEventListener('input', syncDraft));
      type.addEventListener('change', syncDraft);
      country.addEventListener('change', syncDraft);

      document.getElementById('saveSpirit')?.addEventListener('click', () => {
        syncDraft();
        if(!state.addDraft.name.trim()){ alert('Nom requis (ex: Talisker 10).'); return; }

        const id = 's-' + cryptoRandomId();
        const newSpirit = {
          id,
          name: state.addDraft.name.trim(),
          brand: state.addDraft.brand.trim() || '—',
          type: state.addDraft.type || 'Autre',
          country: state.addDraft.country || '—',
          abv: Number(state.addDraft.abv || 0) || 0,
          notes: (state.addDraft.notes || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 8),
          imageDataUrl: state.addDraft.imageDataUrl || ''
        };

        state.spirits = [newSpirit, ...state.spirits];
        persist();

        state.addDraft = { imageDataUrl:'', name:'', brand:'', type:'Whisky', country:'France', abv:'40', notes:'' };

        const addNow = confirm("Spiritueux ajouté ✅\n\nAjouter un avis maintenant ?");
        if(addNow) navTo({ name:'addReview', spiritId: id, prevTab:'home' });
        else navTo({ name:'detail', spiritId: id, prevTab:'home' });
      });

      if(state.editor.open) bindEditorEvents();
      return;
    }

    const spirit = state.spirits.find(s => s.id === state.route.spiritId);
    if(!spirit){ navTo({ name:'home', spiritId:null, prevTab:'home' }); return; }

    if(state.route.name === 'detail'){
      if(!ensureAuth()) return;
      app.innerHTML = detailView(spirit) + editorModal();
      bindTopbarTabs();

      document.getElementById('back').addEventListener('click', () => {
        navTo({ name: state.route.prevTab === 'cellar' ? 'cellar' : 'home', spiritId:null, prevTab: state.route.prevTab });
      });

      document.getElementById('addReview')?.addEventListener('click', () => navTo({ name:'addReview', spiritId: spirit.id, prevTab: state.route.prevTab }));

      app.querySelectorAll('[data-status]').forEach(el => el.addEventListener('click', () => toggleStatus(spirit.id, el.getAttribute('data-status'))));

      document.getElementById('removePhoto')?.addEventListener('click', () => {
        state.spirits = state.spirits.map(s => s.id === spirit.id ? { ...s, imageDataUrl: '' } : s);
        persist(); render();
      });

      document.getElementById('editPhoto')?.addEventListener('click', () => { if(spirit.imageDataUrl) openEditor({kind:'spirit', spiritId: spirit.id}, spirit.imageDataUrl); });

      document.getElementById('fileChange')?.addEventListener('change', async (e) => {
        const f = e.target.files && e.target.files[0];
        if(!f) return;
        const dataUrl = await fileToDataUrl(f);
        openEditor({kind:'spirit', spiritId: spirit.id}, dataUrl);
      });

      if(state.editor.open) bindEditorEvents();
      return;
    }

    if(state.route.name === 'addReview'){
      if(!ensureAuth()) return;
      app.innerHTML = addReviewView(spirit);
      const rating = document.getElementById('rating');
      const ratingText = document.getElementById('ratingText');
      const title = document.getElementById('title');
      const text = document.getElementById('text');

      const update = () => { ratingText.textContent = Number(rating.value).toFixed(1) + '/5'; };
      rating.addEventListener('input', update); update();

      document.getElementById('back')?.addEventListener('click', () => navTo({ name:'detail', spiritId: spirit.id, prevTab: state.route.prevTab }));

      document.getElementById('save')?.addEventListener('click', () => {
        state.reviews = [...state.reviews, {
          id: cryptoRandomId(),
          spiritId: spirit.id,
          rating: Number(rating.value),
          title: (title.value || '').trim(),
          text: (text.value || '').trim(),
          createdAtIso: new Date().toISOString(),
        }];
        persist();
        navTo({ name:'detail', spiritId: spirit.id, prevTab: state.route.prevTab });
      });
      return;
    }
  }

  render();
})();