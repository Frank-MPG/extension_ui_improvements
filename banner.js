// MPG – Bannière dynamique : bandeaux mosaïque animés, couleur par page.
// Tout passe par des attributs data-* (React réécrit les className) et par des
// pseudo-éléments : le fond d'origine n'est jamais écrasé, ce qui permet de
// réévaluer chaque élément à tout moment.
(() => {
  const MOSAIC = /nav\/mosaic/;
  const HEADER_BG = /rgb\(48, 63, 153\)/; // dégradé d'origine du header
  const PROFILE_BG = 'rgb(0, 64, 112)';    // bandeau uni de la page Profil
  const FALLBACK = { w: 128, h: 64 };
  const CACHE_KEY = 'mpgTileCache';

  // ---- Palettes (toutes ≥ 5:1 de contraste avec du texte blanc) ------------
  const PALETTES = {
    home:     ['#3b4cc0', '#2f3a9a', '#5536c0', '#2a58b0'], // Mon MPG
    matches:  ['#15803d', '#166534', '#0f766e', '#1d6b45'], // Matchs
    newsfeed: ['#c2410c', '#b91c1c', '#a8480a', '#be123c'], // Actus
    profile:  ['#6d28d9', '#5b21b6', '#7e22ce', '#4338ca'], // Profil
  };
  // Ligues, tournois et autres pages : une palette de cette liste, choisie
  // à partir de l'URL (une ligue garde toujours la même).
  const POOL = [
    ['#be123c', '#9f1239', '#a21caf', '#b4232c'],
    ['#0f766e', '#115e59', '#0e7490', '#13705a'],
    ['#b45309', '#92400e', '#a3410f', '#9a5b0b'],
    ['#6d28d9', '#5b21b6', '#4c1d95', '#7c3aed'],
    ['#1d4ed8', '#1e40af', '#1e3a8a', '#2563eb'],
    ['#047857', '#065f46', '#166534', '#0f766e'],
    ['#be185d', '#9d174d', '#a21caf', '#c0265e'],
    ['#0e7490', '#155e75', '#1e40af', '#0369a1'],
  ];
  const hash = s => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  function paletteFor(pathname) {
    const parts = pathname.split('/').filter(Boolean);
    const section = parts[0] || 'home';
    if (PALETTES[section]) return PALETTES[section];
    return POOL[hash(parts.slice(0, 2).join('/')) % POOL.length];
  }

  // ---- Styles ---------------------------------------------------------------
  const root = document.documentElement;
  const style = document.createElement('style');
  style.id = 'mpg-dyn-style';
  style.textContent = `
    @property --mpg-c1 { syntax: '<color>'; inherits: true; initial-value: #3b4cc0; }
    @property --mpg-c2 { syntax: '<color>'; inherits: true; initial-value: #2f3a9a; }
    @property --mpg-c3 { syntax: '<color>'; inherits: true; initial-value: #5536c0; }
    @property --mpg-c4 { syntax: '<color>'; inherits: true; initial-value: #2a58b0; }
    :root { transition: --mpg-c1 .7s ease, --mpg-c2 .7s ease, --mpg-c3 .7s ease, --mpg-c4 .7s ease; }

    @keyframes mpgHue { 0%,100% { background-position: 0% 50% } 50% { background-position: 100% 50% } }
    @keyframes mpgMosaic { from { background-position: 0 0 } to { background-position: var(--mpg-dx) var(--mpg-dy) } }

    [data-mpg-dyn], [data-mpg-header] { isolation: isolate; }
    [data-mpg-dyn]::before, [data-mpg-dyn]::after, [data-mpg-header]::before {
      content: ""; position: absolute; inset: 0; z-index: -1;
      pointer-events: none; border-radius: inherit;
    }
    [data-mpg-dyn]::before {
      background: linear-gradient(120deg, var(--mpg-c1), var(--mpg-c2), var(--mpg-c3), var(--mpg-c4), var(--mpg-c1));
      background-size: 300% 300%;
      animation: mpgHue 14s ease infinite;
    }
    /* Tant que le carreau n'est pas prêt : mosaïque d'origine, fixe (pas de flash) */
    [data-mpg-dyn]::after { background: var(--mpg-orig) no-repeat; }
    :root[data-mpg-tile] [data-mpg-dyn]::after {
      background: var(--mpg-tile) repeat;
      background-size: var(--mpg-tw) var(--mpg-th);
      animation: mpgMosaic 30s linear infinite;
    }
    [data-mpg-dyn][data-mpg-paused]::before,
    [data-mpg-dyn][data-mpg-paused]::after { animation-play-state: paused; }

    [data-mpg-clear] { background-color: transparent !important; }

    /* Bande sombre au-dessus du header flottant : le contenu ne s'y voit plus en défilant */
    [data-mpg-header]::after {
      content: ""; position: absolute; left: -16px; right: -16px; bottom: 100%; height: 48px;
      background: var(--colors-surface-page, rgb(22, 22, 22)); z-index: -2; pointer-events: none;
    }

    [data-mpg-header]::before {
      background: linear-gradient(var(--mpg-c2) -73.75%, var(--mpg-c3) 183.12%);
    }

    @media (prefers-reduced-motion: reduce) {
      :root { transition: none; }
      [data-mpg-dyn]::before, :root[data-mpg-tile] [data-mpg-dyn]::after { animation: none; }
    }
  `;
  root.appendChild(style);

  // ---- Couleurs de la page courante ---------------------------------------
  let currentPath = null;
  function applyPalette() {
    if (location.pathname === currentPath) return;
    currentPath = location.pathname;
    paletteFor(currentPath).forEach((c, i) => root.style.setProperty(`--mpg-c${i + 1}`, c));
    // Filet de sécurité : certains styles arrivent après l'insertion des nœuds.
    for (const ms of [300, 1200]) setTimeout(() => document.body && scanTree(document.body), ms);
  }
  applyPalette();
  if (window.navigation) navigation.addEventListener('currententrychange', applyPalette);
  addEventListener('popstate', applyPalette);

  // ---- Carreau de mosaïque sans raccord (mis en cache) --------------------
  const storage = globalThis.chrome?.storage?.local;
  let tileUrl = null;  // URL de la mosaïque pour laquelle :root porte le carreau
  let cache = {};      // { url: {data, w, h} }
  const cacheReady = storage
    ? storage.get(CACHE_KEY).then(r => { cache = r[CACHE_KEY] || {}; }).catch(() => {})
    : Promise.resolve();

  function findPeriod(alpha, W, H, axis, min, max) {
    let best = null, bestScore = Infinity;
    const limit = axis === 'x' ? W : H;
    for (let p = min; p <= Math.min(max, limit - 8); p++) {
      let s = 0, n = 0;
      if (axis === 'x') {
        for (let j = 0; j < H; j += 2)
          for (let i = 0; i + p < W; i += 2) { s += Math.abs(alpha[j * W + i] - alpha[j * W + i + p]); n++; }
      } else {
        for (let j = 0; j + p < H; j++)
          for (let i = 0; i < W; i += 2) { s += Math.abs(alpha[j * W + i] - alpha[(j + p) * W + i]); n++; }
      }
      const score = s / n;
      if (score < bestScore - 0.01) { bestScore = score; best = p; }
      if (score < 0.01) return p;
    }
    return bestScore < 0.5 ? best : null;
  }

  async function buildTile(url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    let w = FALLBACK.w, h = FALLBACK.h;
    try {
      const d = ctx.getImageData(0, 0, W, H).data;
      const alpha = new Uint8Array(W * H);
      for (let k = 0; k < W * H; k++) alpha[k] = d[k * 4 + 3];
      w = findPeriod(alpha, W, H, 'x', 16, 600) || w;
      h = findPeriod(alpha, W, H, 'y', 16, H) || h;
    } catch (e) {
      console.warn('[MPG bannière] détection du motif impossible, valeurs par défaut', e);
    }
    const t = document.createElement('canvas');
    t.width = w; t.height = h;
    t.getContext('2d').drawImage(img, 0, 0, w, h, 0, 0, w, h);
    return { data: t.toDataURL(), w, h };
  }

  async function useMosaic(url) {
    if (tileUrl === url) return;
    tileUrl = url;
    root.style.setProperty('--mpg-orig', `url("${url}")`);
    let tile = cache[url];
    if (!tile) {
      try { tile = await buildTile(url); } catch (e) { console.warn('[MPG bannière]', e); return; }
      cache = { [url]: tile }; // seule la mosaïque actuelle est gardée
      storage?.set({ [CACHE_KEY]: cache }).catch(() => {});
    }
    if (tileUrl !== url) return;
    root.style.setProperty('--mpg-tile', `url(${tile.data})`);
    root.style.setProperty('--mpg-tw', `${tile.w}px`);
    root.style.setProperty('--mpg-th', `${tile.h}px`);
    root.style.setProperty('--mpg-dx', `${tile.w * 2}px`);
    root.style.setProperty('--mpg-dy', `${tile.h * 2}px`);
    root.setAttribute('data-mpg-tile', '');
  }

  // ---- Mise en pause hors écran -------------------------------------------
  const io = new IntersectionObserver(entries => {
    for (const e of entries) e.target.toggleAttribute('data-mpg-paused', !e.isIntersecting);
  });

  // ---- Évaluation d'un élément ------------------------------------------
  function ensurePositioned(el) {
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  }

  function check(el) {
    if (el.nodeType !== 1 || el.tagName !== 'DIV') return;
    const c = getComputedStyle(el);
    const bg = c.backgroundImage;
    // Bandeau du profil : bleu uni sans mosaïque → même traitement que les autres
    const onProfile = location.pathname.startsWith('/profile');
    const isProfileBanner = onProfile && c.backgroundColor === PROFILE_BG && el.offsetWidth > 800 && el.offsetHeight > 80;
    // Barre d'onglets du profil : même bleu opaque, posée sur le bas de l'avatar → transparente
    if (onProfile && c.backgroundColor === PROFILE_BG && el.offsetWidth > 800 && el.offsetHeight <= 60)
      el.setAttribute('data-mpg-clear', '');
    const isBanner = MOSAIC.test(bg) || isProfileBanner;
    const isHeader = !isBanner && HEADER_BG.test(bg);

    if (isBanner) {
      if (!el.hasAttribute('data-mpg-dyn')) {
        ensurePositioned(el);
        el.setAttribute('data-mpg-dyn', '');
        io.observe(el);
      }
      const m = bg.match(/url\("?([^")]+)"?\)/);
      if (m) useMosaic(m[1]);
    } else if (el.hasAttribute('data-mpg-dyn')) {
      el.removeAttribute('data-mpg-dyn');
      el.removeAttribute('data-mpg-paused');
      io.unobserve(el);
    }

    if (isHeader) {
      if (!el.hasAttribute('data-mpg-header')) { ensurePositioned(el); el.setAttribute('data-mpg-header', ''); }
    } else if (el.hasAttribute('data-mpg-header')) {
      el.removeAttribute('data-mpg-header');
    }
  }

  function scanTree(node) {
    if (node.nodeType !== 1) return;
    check(node);
    for (const d of node.getElementsByTagName('div')) check(d);
  }

  const mo = new MutationObserver(records => {
    applyPalette();
    for (const r of records) {
      if (r.type === 'attributes') check(r.target); // className changé par React
      else for (const n of r.addedNodes) scanTree(n);
    }
  });

  cacheReady.then(() => {
    // Carreau déjà connu : on l'applique tout de suite (utile sur les pages sans
    // mosaïque d'origine, comme le Profil, et pour éviter tout flash au chargement)
    const known = Object.keys(cache)[0];
    if (known && !tileUrl) useMosaic(known);
    mo.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    if (document.body) scanTree(document.body);
  });
})();
