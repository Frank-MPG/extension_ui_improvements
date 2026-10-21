// MPG – thème : gris neutres remplacés par des tons ardoise bleutés (accordés au
// bleu MPG), et arrondis resserrés.
// - Couleurs : le site expose ses couleurs en variables CSS (--colors-*), on les redéfinit.
// - Arrondis : écrits en dur dans les feuilles générées (Unistyles, React Native Web).
//   On réécrit ces règles via le CSSOM ; les cercles (avatars, pastilles, points)
//   sont reconnus sur les éléments réels et laissés ronds.
(() => {
  const root = document.documentElement;

  // ===========================================================================
  // 1. Couleurs
  // ===========================================================================
  const T = {
    page:    '#0d1017', // fond de page (était #161616)
    surface: '#161b25', // cartes, listes (était #262626)
    raised:  '#1f2533', // champs, éléments posés sur une carte
    line:    '#262d3c', // bordures (était #333740)
    lineHi:  '#343c4f',
    muted:   '#8b93a6', // texte secondaire (était #8F9299)
    faint:   '#5f677a', // texte désactivé (était #696D77)
  };
  const style = document.createElement('style');
  style.id = 'mpg-theme-style';
  style.textContent = `
    html:root:not(.light) {
      --mpg-page: ${T.page}; --mpg-surface: ${T.surface}; --mpg-raised: ${T.raised};
      --mpg-line: ${T.line}; --mpg-muted: ${T.muted};
      --colors-surface-page: ${T.page};
      --colors-surface-primary: ${T.surface};
      --colors-surface-disable: ${T.raised};
      --colors-surface-disable-low: ${T.raised};
      --colors-border-primary: ${T.line};
      --colors-border-secondary: ${T.page};
      --colors-border-disable: ${T.lineHi};
      --colors-text-headings-low: ${T.muted};
      --colors-text-body-low: ${T.muted};
      --colors-text-disable: ${T.faint};
      --colors-text-action-disable: ${T.raised};
      --colors-icon-primary: #6b7386;
      --colors-icon-disable: ${T.lineHi};
      background-color: ${T.page};
    }
  `;
  root.appendChild(style);

  // ===========================================================================
  // 2. Arrondis
  // ===========================================================================
  // ≥ 10 px (cartes, header, bandeaux, boutons « pilule ») → 6 px ; 8 px → 6 px.
  // Un cercle (élément carré dont l'arrondi fait au moins la moitié) reste rond.
  const CORNERS = ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'];
  const CARD = '6px';
  const SHEETS = /^(unistyles-web|react-native-stylesheet)$/;
  const done = new WeakSet();     // règles traitées (ou sans arrondi à toucher)
  const pending = new Set();      // règles dont on ne voit encore aucun élément

  const px = v => {
    if (!v) return null;
    if (/%$/.test(v)) return parseFloat(v) >= 50 ? Infinity : null;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  };

  // Rayon cible pour une valeur d'origine (null = ne pas toucher)
  const target = n => (n === null || n < 8) ? null : CARD;

  // Les éléments réels d'une règle : cercle ? rectangle ? (null = rien d'affiché)
  function shapeOf(rule, radius) {
    let els;
    try { els = document.querySelectorAll(rule.selectorText.replace(/::?[a-z-]+(\([^)]*\))?/gi, '') || '*'); }
    catch { return 'rect'; }
    let seen = false;
    for (let i = 0; i < els.length && i < 6; i++) {
      const w = els[i].offsetWidth, h = els[i].offsetHeight;
      if (!w || !h) continue;
      seen = true;
      if (radius < Math.min(w, h) / 2 - 2) continue;
      if (Math.abs(w - h) <= 2) return 'circle';
      // Piste d'interrupteur : pilule basse avec un seul bouton rond → garder la pilule
      const k = els[i].childElementCount === 1 && els[i].firstElementChild;
      if (h <= 36 && k && k.offsetWidth && Math.abs(k.offsetWidth - k.offsetHeight) <= 1) return 'circle';
    }
    return seen ? 'rect' : null;
  }

  function patchRule(rule) {
    if (done.has(rule)) return;
    const st = rule.style;
    const vals = CORNERS.map(p => px(st.getPropertyValue(p)));
    const max = Math.max(...vals.map(v => v ?? 0));
    if (max < 8) { done.add(rule); return; }
    // Forme réelle à vérifier (un 16 × 16 arrondi à 8 px est un cercle)
    const shape = shapeOf(rule, max);
    if (shape === null) { pending.add(rule); return; }
    pending.delete(rule);
    if (shape === 'circle') { done.add(rule); return; }
    CORNERS.forEach((p, i) => {
      const t = target(vals[i]);
      if (t) st.setProperty(p, t, st.getPropertyPriority(p));
    });
    done.add(rule);
  }

  function walk(rules) {
    for (const r of rules) {
      if (r.style) { if (!pending.has(r)) patchRule(r); }
      else if (r.cssRules) walk(r.cssRules);
    }
  }

  function patchAll() {
    for (const s of document.styleSheets) {
      if (!SHEETS.test(s.ownerNode?.id || '')) continue;
      try { walk(s.cssRules); } catch { /* feuille inaccessible */ }
    }
  }
  const retryPending = () => { for (const r of [...pending]) patchRule(r); };

  // Les feuilles sont réécrites ou complétées pendant la navigation : on repasse
  // dès qu'un nœud est ajouté (callback avant le rendu → pas de flash d'arrondis).
  let queued = false;
  const mo = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; patchAll(); retryPending(); });
  });
  // (pas characterData : les tics de compte à rebours n'ajoutent ni règle ni élément)
  mo.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  addEventListener('load', () => { patchAll(); retryPending(); });

  // ===========================================================================
  // 3. Bouton clair / sombre dans le header
  // ===========================================================================
  // Le site applique son thème par une classe sur <html> (light / dark ; aucune = automatique,
  // selon le système) et le mémorise dans localStorage « mmkv.default\theme »
  // (light | dark | automatic), relu au chargement. Changer la classe seule ne suffit pas :
  // les composants déjà affichés gardent des couleurs calculées en JS (textes blancs sur
  // blanc…). On enregistre donc le choix et on recharge la page.
  // Le mode automatique reste disponible dans Réglages → Thème.
  const THEME_KEY = 'mmkv.default\\theme';
  const SUN = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7z"/></svg>';
  const dark = () => root.classList.contains('dark') ||
    (!root.classList.contains('light') && matchMedia('(prefers-color-scheme: dark)').matches);

  const tstyle = document.createElement('style');
  tstyle.textContent = `
    .mpg-theme-btn {
      display: flex; align-items: center; justify-content: center; flex: none;
      width: 34px; height: 30px; margin: 0; padding: 0; border: 0; border-radius: 6px;
      background: transparent; color: #fff; cursor: pointer; transition: background-color .15s;
    }
    .mpg-theme-btn:hover { background: rgba(255, 255, 255, .14); }
    .mpg-theme-btn:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
    .mpg-theme-btn svg { display: block; }
    .mpg-theme-btn:disabled { cursor: progress; }
    html[data-mpg-theme-switch] body { opacity: 0; transition: opacity .12s; }
  `;
  root.appendChild(tstyle);

  let btn = null;
  function makeButton() {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mpg-theme-btn';
    btn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const next = dark() ? 'light' : 'dark';
      try { localStorage.setItem(THEME_KEY, next); } catch { return; /* stockage indisponible */ }
      btn.disabled = true;
      root.setAttribute('data-mpg-theme-switch', '');   // fondu le temps du rechargement
      setTimeout(() => location.reload(), 120);
    });
    btn.addEventListener('mousedown', e => e.stopPropagation()); // ne pas fermer/ouvrir les menus
    paintButton();
  }
  function paintButton() {
    if (!btn) return;
    const d = dark();
    const label = d ? 'Passer en mode clair' : 'Passer en mode sombre';
    if (btn.getAttribute('aria-label') === label) return;
    btn.innerHTML = d ? SUN : MOON;            // icône = le mode vers lequel on bascule
    btn.setAttribute('aria-label', label);
    btn.title = label;
  }

  // Emplacement : groupe de droite du header (Menu, notifications), en premier.
  // Le header est rendu par React (et son fond change avec le thème) : on le retrouve par
  // son libellé « Menu », et on y remet le bouton s'il a disparu.
  let group = null, lastSearch = 0, retry = 0;
  function placeButton() {
    if (btn && btn.isConnected && group && group.isConnected && group.firstElementChild === btn) return;
    // Recherche limitée à une toutes les 300 ms (pages qui changent beaucoup)
    if (performance.now() - lastSearch < 300) {
      if (!retry) retry = setTimeout(() => { retry = 0; placeButton(); }, 320);
      return;
    }
    lastSearch = performance.now();
    const menu = [...document.querySelectorAll('#root div')]
      .find(d => !d.childElementCount && d.textContent.trim() === 'Menu' && d.getBoundingClientRect().top < 120);
    if (!menu) return;
    let row = menu.parentElement;
    while (row && row !== document.body && !row.querySelector('a[tabindex="0"]')) row = row.parentElement;
    group = row && row !== document.body ? [...row.children].find(c => c.contains(menu)) : null;
    if (!group || group === menu) return;
    if (!btn) makeButton();
    if (group.firstElementChild !== btn) group.prepend(btn);
  }

  let raf = 0;
  new MutationObserver(() => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; placeButton(); paintButton(); });
  }).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paintButton);
})();
