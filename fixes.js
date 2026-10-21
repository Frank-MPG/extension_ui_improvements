// MPG – correctifs UX/UI et accessibilité, appliqués par-dessus le site.
// Règles : uniquement des attributs data-*/aria-* (React réécrit les className),
// des pseudo-éléments pour tout ajout visuel, et des remplacements de texte
// sur des libellés exacts.
(() => {
  const root = document.documentElement;
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const cs = el => getComputedStyle(el);

  // ===========================================================================
  // 1. Styles
  // ===========================================================================
  const style = document.createElement('style');
  style.id = 'mpg-fixes-style';
  style.textContent = `
    /* --- Focus : rien après un clic souris, anneau net au clavier --- */
    html[data-mpg-pointer] body :focus { outline: none !important; }
    html:not([data-mpg-pointer]) body [tabindex]:focus-visible,
    html:not([data-mpg-pointer]) body a:focus-visible {
      outline: 2px solid #fff !important; outline-offset: 3px !important; border-radius: 6px;
    }

    /* --- Lien d'évitement --- */
    .mpg-skip {
      position: fixed; left: 16px; top: -60px; z-index: 2147483000;
      background: #fff; color: #111; font: 600 14px/1 system-ui, sans-serif;
      padding: 12px 16px; border-radius: 6px; text-decoration: none; transition: top .15s;
    }
    .mpg-skip:focus { top: 16px; }

    /* --- Fil d'Ariane inutile sur les pages de premier niveau --- */
    [data-mpg-crumb="hide"] { display: none !important; }

    /* --- Badges d'état : le rouge réservé à l'urgence --- */
    [data-mpg-badge="done"] { background-color: #2c3445 !important; }
    [data-mpg-badge="relaunch"] { background-color: rgb(92, 62, 10) !important; }
    [data-mpg-badge="neutral"] { background-color: #232a39 !important; }
    [data-mpg-badge="neutral"] svg { filter: grayscale(1) brightness(1.6); }
    [data-mpg-urgent] { border-width: 2px !important; border-color: rgba(223, 102, 97, .55) !important; }

    /* --- Badges collés dans le coin d'une carte : arrondi seulement en haut à gauche
           (comme la carte) et en bas à droite --- */
    [data-mpg-corner] { border-radius: var(--mpg-corner, 6px) 0 4px 0 !important; }

    /* --- Comptes à rebours géants : « 07 h 10 min 02 s » --- */
    [data-mpg-countdown] { align-items: stretch; }
    [data-mpg-unit] {
      display: flex !important; flex-direction: row !important; align-items: flex-end !important;
      justify-content: flex-start !important; padding: 0 10px 0 5px !important; width: auto !important;
    }
    [data-mpg-unit] > * { display: none !important; }
    [data-mpg-unit]::after, [data-mpg-unit-after]::after {
      align-self: flex-end; margin-bottom: 7px;
      font: 500 13px/1 Avenir-Medium, system-ui, sans-serif; color: var(--mpg-muted, #8f9299);
    }
    [data-mpg-unit]::after { content: attr(data-mpg-unit); }
    [data-mpg-unit-after]::after { content: attr(data-mpg-unit-after); margin-left: 5px; }
    [data-mpg-countdown] > [data-mpg-cd-hide] { display: none !important; }

    /* --- Rangée « rétro » sans titre --- */
    [data-mpg-title]::before {
      content: attr(data-mpg-title); display: block; margin: 0 0 8px 16px;
      font-size: 12px; font-weight: 600; letter-spacing: .02em; color: #a0a4ad; text-transform: uppercase;
    }

    /* --- Libellé sous un avatar : 2 lignes au lieu d'être tronqué --- */
    [data-mpg-fx="label"] {
      white-space: normal !important; display: -webkit-box !important;
      -webkit-box-orient: vertical; -webkit-line-clamp: 2;
      overflow: hidden !important; overflow-wrap: anywhere; height: auto !important; max-height: 32px;
    }
    [data-mpg-click] { cursor: pointer; }

    /* --- Actus : aperçu tronqué proprement --- */
    [data-mpg-fx="fade"] {
      height: 72px !important;
      background-image: linear-gradient(transparent, var(--colors-surface-primary, #262626) 80%) !important;
    }
    [data-mpg-more] { margin-top: 8px !important; }

    /* --- Cartes cliquables : retour visuel au survol --- */
    [data-mpg-card] { transition: filter .15s, box-shadow .15s; }
    [data-mpg-card]:hover { filter: brightness(1.18); box-shadow: 0 0 0 1px rgba(255, 255, 255, .18); }

    /* --- Formulaire « J'ai un code » --- */
    [data-mpg-dim] { filter: brightness(.4) saturate(.8); }
    [data-mpg-disabled-btn], [data-mpg-disabled-btn] * { color: #a0a4ad !important; }

    /* --- Interrupteurs : état écrit en clair --- */
    [data-mpg-switch] { position: relative; }
    [data-mpg-switch]::before {
      content: attr(data-mpg-state); position: absolute; right: calc(100% + 8px); top: 50%;
      transform: translateY(-50%); font-size: 12px; font-weight: 600; color: #a0a4ad; white-space: nowrap;
    }
    [data-mpg-switch][data-mpg-state="Oui"]::before { color: #7dd3a0; }

    /* --- Ligne de l'utilisateur courant --- */
    [data-mpg-me]::after { content: " (toi)"; color: #a0a4ad; font-weight: 400; }

    /* --- Suffixe d'unité sur un compteur nu (« 69 » → « 69 badges ») --- */
    [data-mpg-suffix]::after { content: attr(data-mpg-suffix); }

    /* --- Titre de section répétant l'onglet actif --- */
    [data-mpg-hide-text] { visibility: hidden; }

    /* --- Menu et notifications (popovers Headless UI) : utiliser la hauteur de l'écran --- */
    [id^="headlessui-popover-panel"] { max-height: calc(100vh - 110px) !important; }
    [data-mpg-scroll] { height: auto !important; max-height: calc(100vh - 190px) !important; }
    [data-mpg-grow] { height: auto !important; max-height: none !important; }

    /* --- Messagerie : conversations lues lisibles --- */
    [data-mpg-read] { opacity: 1 !important; }
    html:not(.light) [data-mpg-read] * { color: #b9bcc4 !important; }

    /* --- Mise en page : bas de Mon MPG, adapté à la largeur disponible ---
       data-mpg-size (posé par un ResizeObserver) : l ≥ 1000 px, m ≥ 620 px, s en dessous.
       l : Nouvelle compétition | Compet' officielles | Compétition privée
       m : Nouvelle compétition | Compet' officielles, puis Compétition privée en dessous
       s : une colonne. */
    [data-mpg-homecol] {
      display: grid !important; column-gap: 24px; align-items: start;
      grid-template-columns: minmax(0, 1fr);
    }
    [data-mpg-homecol] > * { grid-column: 1 / -1; min-width: 0; }
    [data-mpg-homecol][data-mpg-size="m"] { grid-template-columns: minmax(312px, 1fr) minmax(0, 1fr); }
    [data-mpg-homecol][data-mpg-size="l"] {
      grid-template-columns: minmax(312px, 1fr) minmax(260px, .85fr) minmax(0, 1.35fr);
    }
    [data-mpg-homecol]:is([data-mpg-size="m"], [data-mpg-size="l"]) > [data-mpg-homecell] { grid-column: auto; }
    [data-mpg-homecol][data-mpg-size="m"] > [data-mpg-homecell="wide"] { grid-column: 1 / -1; }
    /* « Nouvelle compétition » remontée dans le bandeau : officielles | privée */
    [data-mpg-homecol][data-mpg-acts-out]:is([data-mpg-size="m"], [data-mpg-size="l"]) {
      grid-template-columns: minmax(260px, .8fr) minmax(0, 1.6fr);
    }
    [data-mpg-homecol][data-mpg-acts-out][data-mpg-size="m"] > [data-mpg-homecell="wide"] { grid-column: auto; }

    /* --- Créer / Rejoindre / Suivre : boutons compacts identiques (mascotte + libellé) ---
       banner : boutons à nous, posés à droite dans le bandeau « Mon MPG » (≈ 220 px gagnés) ;
                la section d'origine est masquée et reçoit les clics.
       inline : à défaut (pas de bandeau, ou trop étroit), les tuiles restylées sur place. */
    [data-mpg-acts="banner"] { display: none !important; }
    .mpg-acts {
      position: absolute; top: 50%; right: 20px; transform: translateY(-50%); z-index: 1;
      display: flex; gap: 8px; margin: 0; padding: 0;
    }
    .mpg-act, [data-mpg-act] {
      position: relative; display: flex !important; flex-direction: row !important; align-items: center !important;
      gap: 8px; width: auto !important; height: 36px !important; padding: 0 14px 0 6px !important; margin: 0;
      border: 0; border-radius: 6px; cursor: pointer; transition: background-color .15s, box-shadow .15s;
      color: #fff; font: 600 14px/1 Avenir-Medium, system-ui, sans-serif; white-space: nowrap;
      background-color: var(--colors-surface-primary, #262626);
      box-shadow: inset 0 0 0 1px var(--colors-border-disable, #444955);
    }
    .mpg-act {
      background-color: rgba(8, 10, 18, .45); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .3);
      -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
    }
    .mpg-act:hover, [data-mpg-act]:hover {
      background-color: rgba(255, 255, 255, .16); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .55);
    }
    .mpg-act:active { transform: translateY(1px); }
    .mpg-act:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
    .mpg-act img { width: 26px; height: 26px; object-fit: contain; flex: none; }

    [data-mpg-acts="inline"] {
      flex-direction: row !important; align-items: center !important; flex-wrap: wrap; gap: 8px 16px;
    }
    [data-mpg-acts="inline"] > h5 { margin: 0 !important; width: auto !important; }
    [data-mpg-acts] [data-mpg-tiles] {
      display: flex !important; flex-direction: row !important; flex-wrap: wrap;
      gap: 8px; width: auto !important; height: auto !important;
    }
    /* Tuile d'origine (mode inline) : elle devient l'icône ; son ::after couvre tout le bouton */
    [data-mpg-act] > :first-child {
      position: static !important; width: 26px !important; height: 26px !important; flex: none;
      border: 0 !important; border-radius: 0 !important; background: none !important; padding: 0 !important;
    }
    [data-mpg-act] > :first-child::after { content: ""; position: absolute; inset: 0; border-radius: 6px; }
    [data-mpg-act] > :first-child * {
      width: 26px !important; height: 26px !important; min-width: 0 !important; object-fit: contain;
    }
    html body [data-mpg-act] > [tabindex]:focus-visible { outline: none !important; }
    [data-mpg-act]:has(> :first-child:focus-visible) { outline: 2px solid #fff; outline-offset: 2px; }
    [data-mpg-act] > :last-child {
      width: auto !important; height: auto !important; margin: 0 !important; white-space: nowrap;
      color: #fff !important; font: 600 14px/1 Avenir-Medium, system-ui, sans-serif !important;
    }
    /* Compet' officielles : la carte occupe la colonne (défile s'il y en a plusieurs) */
    [data-mpg-offscroll], [data-mpg-offrow] { width: 100% !important; }
    [data-mpg-offrow] { padding-right: 0 !important; }
    [data-mpg-offrow] > * { flex: 1 0 252px !important; width: auto !important; }
    [data-mpg-offrow] > * > *, [data-mpg-offrow] > * > * > * { width: 100% !important; }
    /* Compétition privée : remplit sa colonne */
    [data-mpg-homecell="wide"], [data-mpg-homecell="wide"] > *, [data-mpg-homecell="wide"] > * > * {
      width: 100% !important; max-width: 100% !important;
    }
    [data-mpg-homecell="wide"] img { width: 100% !important; height: 100% !important; object-fit: cover; }

    /* Ligues / tournois publics : si les cartes tiennent sur la ligne, grille de
       --mpg-cols colonnes égales ; sinon, rangée qui défile (comme le site) avec accroche */
    [data-mpg-cardrow] { padding-right: 0 !important; }
    [data-mpg-cardrow="scroll"] > * { scroll-snap-align: start; }
    [data-mpg-cardview] { scroll-snap-type: x proximity; }
    [data-mpg-cardscroll="grid"] { flex: 1 1 auto !important; width: 100% !important; }
    [data-mpg-cardrow="grid"] {
      display: grid !important; width: 100% !important;
      grid-template-columns: repeat(var(--mpg-cols, 3), minmax(0, 1fr));
    }
    [data-mpg-cardrow="grid"] > * { width: auto !important; min-width: 0; }
    [data-mpg-cardrow] > * > *, [data-mpg-cardrow] > * > * > * { width: 100% !important; }
    [data-mpg-cardrow] > * > * > * > :not(:first-child) { width: 100% !important; align-items: center !important; }

    /* --- Mise en page : Profil (Résumé) sur 2 colonnes --- */
    [data-mpg-profilewrap] { max-width: 1168px !important; width: 100% !important; }
    [data-mpg-profilegrid] {
      display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      column-gap: 24px; row-gap: 16px; align-items: start;
    }
    [data-mpg-profilegrid] > :nth-child(1) { grid-column: 1; grid-row: 1; }
    [data-mpg-profilegrid] > :nth-child(2) { grid-column: 1; grid-row: 2 / span 2; }
    [data-mpg-profilegrid] > :nth-child(3) { grid-column: 2; grid-row: 1; }
    [data-mpg-profilegrid] > :nth-child(4) { grid-column: 2; grid-row: 2; }
    [data-mpg-profilegrid] > :nth-child(5) { grid-column: 2; grid-row: 3; }

    /* --- Options de tournoi : fond neutre, « Oui / Non » porte l'info --- */
    [data-mpg-optrow] { background-color: var(--colors-surface-primary, #262626) !important; }

    /* --- Footer teinté avec la couleur de la page (comme le header) --- */
    [data-mpg-footer] { background-image: linear-gradient(var(--mpg-c2), var(--mpg-c1)) !important; border-radius: 6px !important; }

    /* --- Footer dégagé du widget « Mes messages » --- */
    [data-mpg-footer] { margin-bottom: 72px !important; }
  `;
  root.appendChild(style);

  // ===========================================================================
  // 2. Interactions globales
  // ===========================================================================
  addEventListener('pointerdown', () => root.setAttribute('data-mpg-pointer', ''), true);
  addEventListener('keydown', e => {
    if (e.key === 'Tab' || e.key.startsWith('Arrow')) root.removeAttribute('data-mpg-pointer');
  }, true);

  // Échap ferme la fenêtre modale ouverte (comme il ferme déjà le menu)
  addEventListener('keydown', e => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    const dlg = $$('[role="dialog"][aria-modal="true"]').filter(d => d.offsetWidth > 0).pop();
    const btn = dlg && closeButtonOf(dlg);
    if (btn) { btn.click(); e.preventDefault(); }
  }, true);

  // Espace active les « boutons » faits en div (Entrée est déjà géré par le site)
  addEventListener('keydown', e => {
    if (e.key !== ' ' || !(e.target instanceof Element)) return;
    if (e.target.getAttribute('data-mpg-btn') !== null) { e.preventDefault(); e.target.click(); }
  }, true);

  function closeButtonOf(dlg) {
    return $$('[tabindex], [role="button"], button', dlg)
      .filter(b => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.width <= 56 && r.height <= 56 && b.querySelector('svg') && !b.innerText.trim();
      })
      .sort((a, b) => {
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        return (ra.top - rb.top) || (rb.right - ra.right);
      })[0];
  }

  // Lien d'évitement (hors de #root : React n'y touche pas)
  function addSkipLink() {
    if (document.querySelector('.mpg-skip')) return;
    const a = document.createElement('a');
    a.href = '#'; a.className = 'mpg-skip'; a.textContent = 'Aller au contenu';
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = $$('#root h1, #root h4, #root h5').find(h => h.offsetWidth > 0 && h.getBoundingClientRect().top > 90);
      if (target) { target.setAttribute('tabindex', '-1'); target.focus(); target.scrollIntoView({ block: 'center' }); }
    });
    document.body.prepend(a);
  }

  // ===========================================================================
  // 3. Textes
  // ===========================================================================
  const EXACT = {
    'Newsfeed': 'Actus',                      // le menu dit « Actus »
    'Mon profil': 'Profil',                   // le menu dit « Profil »
    'Relancer ma ligue': 'Saison à relancer', // un état, pas une action (le bouton dit « Relance ta ligue »)
    'Eliminé': 'Éliminé',
    'Plus ancien': 'Plus anciennes',
    'Champions': 'LDC',                       // même nom que l'onglet Matchs
  };
  const TIMER = /^(\d\d) : (\d\d) : (\d\d)$/;

  function fixText(t) {
    const raw = t.nodeValue;
    const v = raw.trim();
    if (!v) return;
    let nv = null;
    if (EXACT[v]) nv = raw.replace(v, EXACT[v]);
    else if (TIMER.test(v)) {
      // Comptes à rebours des cartes : heures : minutes : secondes (vérifié au tic)
      const [, h, m, s] = v.match(TIMER);
      nv = (h === '00' && m === '00' && s === '00') ? 'Délai écoulé' : `${+h} h ${m} min ${s} s`;
    } else if (/ \/illimité$/i.test(v)) nv = raw.replace(/ \/illimité/i, ' / illimité');
    if (nv !== null && nv !== raw) t.nodeValue = nv;

    const el = t.parentElement;
    if (!el) return;
    const shown = (nv ?? raw).trim();
    if (shown === 'Lire la suite') el.parentElement?.setAttribute('data-mpg-more', '');
    if (shown === ':') countdownUnits(el);
    if (shown === 'Mon MPG' || TOP_SECTIONS.test(shown)) checkCrumb(el);
    // Mises en page appliquées dès l'insertion du titre de section (pas de saut visible)
    if (/^(Rejoins un tournoi public|Nouvelle compétition)$/i.test(shown)) queueMicrotask(homeLayout);
    if (/^Ma collection de maillot/i.test(shown)) queueMicrotask(profileLayout);
    contextualText(el, shown);
  }

  // Fil d'Ariane « Mon MPG > Matchs / Actus / Profil » : il répète le menu → masqué.
  // Décidé sur son contenu (pas sur l'URL, mise à jour après le rendu) et dès son
  // insertion, avant le premier affichage : plus de fil d'Ariane qui traîne.
  const TOP_SECTIONS = /^(Matchs|Actus|Newsfeed|Profil|Mon profil)$/;
  function checkCrumb(el) {
    if (!el.closest('#root')) return;
    // Textes du fil (feuilles du DOM : fonctionne aussi quand il est masqué)
    const isTopCrumb = r => {
      const parts = [...r.querySelectorAll('*')].filter(x => x.childElementCount === 0)
        .map(x => x.textContent.trim()).filter(Boolean);
      return parts.length === 2 && parts[0] === 'Mon MPG' && TOP_SECTIONS.test(parts[1]);
    };
    // Déjà masqué (donc sans dimensions) : si React l'a réutilisé pour une ligue, on le réaffiche
    const hidden = el.closest('[data-mpg-crumb]');
    if (hidden) {
      if (!isTopCrumb(hidden)) hidden.removeAttribute('data-mpg-crumb');
      return;
    }
    const top = el.getBoundingClientRect().top + scrollY;
    if (top < 80 || top > 200) return;                  // le fil d'Ariane est sous le header
    let row = el;
    while (row.parentElement && row.parentElement !== document.body && row.parentElement.offsetHeight <= 48) row = row.parentElement;
    if (row.offsetHeight > 48 || row.offsetHeight === 0) return;
    if (isTopCrumb(row)) row.setAttribute('data-mpg-crumb', 'hide');
  }

  // Badges, compteurs, titres, utilisateur courant…
  let me = null;
  function contextualText(el, v) {
    // Badges d'état (fond rouge partagé par tous les états)
    const pill = el.parentElement;
    if (pill && cs(pill).backgroundColor === 'rgb(106, 25, 22)') {
      if (/^(Ligue terminée|Tournoi terminé)$/.test(v)) pill.setAttribute('data-mpg-badge', 'done');
      else if (v === 'Saison à relancer') pill.setAttribute('data-mpg-badge', 'relaunch');
      else if (/^\d+ M$/.test(v)) pill.setAttribute('data-mpg-badge', 'neutral'); // budget de mercato
    }
    // « Badges ………… 69 » → « 69 badges »
    if (/^\d+$/.test(v) && el.childElementCount === 0) {
      const row = el.parentElement;
      const head = row && [...row.children].find(c => c !== el && /^badges$/i.test(c.textContent.trim()));
      if (head) el.setAttribute('data-mpg-suffix', ' badges');
    }
    // Titre « Résumé » juste sous l'onglet « Résumé »
    if (/^résumé$/i.test(v) && el.tagName === 'H5' && location.pathname.startsWith('/profile'))
      el.setAttribute('data-mpg-hide-text', '');
    // Pseudo de l'utilisateur courant (lu dans le menu « Mon compte »)
    if (/^mon compte$/i.test(v)) {
      let sec = el;
      for (let i = 0; i < 4 && sec; i++) {
        sec = sec.parentElement;
        const name = sec && [...sec.querySelectorAll('h4, h5')].map(h => h.textContent.trim()).find(t => t && !/^mon compte$/i.test(t));
        if (name) { me = name; break; }
      }
    }
    if (me && v === me && el.childElementCount === 0) {
      let p = el;
      for (let i = 0; i < 4 && p; i++, p = p.parentElement)
        if (/^rgb\((2\d|3\d), (3\d|4\d), (9\d|1\d\d)\)$/.test(cs(p).backgroundColor)) { el.setAttribute('data-mpg-me', ''); break; }
    }
  }

  // Compte à rebours en gros chiffres « 0 0 : 0 7 : 1 0 : 0 2 » : on écrit les unités.
  // Chaque case est un enfant direct de la rangée : chiffres groupés, séparés par « : ».
  // 4 groupes = j h min s ; 3 ou 2 groupes : format déduit du tic (les secondes bougent).
  // Le texte React n'est jamais modifié : le « : » est masqué et l'unité ajoutée en CSS.
  const isDigitCell = c => /^\d$/.test(c.textContent.trim());
  const countdowns = new WeakSet();
  function countdownUnits(colonEl) {
    let box = colonEl;
    for (let i = 0; i < 5 && box; i++) {
      box = box.parentElement;
      if (box && [...box.children].filter(isDigitCell).length >= 4) break;
    }
    if (!box || countdowns.has(box)) return;
    const cells = [...box.children];
    const seps = cells.filter(c => c.textContent.trim() === ':');
    if (seps.length < 1 || seps.length > 3 || cells.filter(isDigitCell).length < 4) return;
    countdowns.add(box);
    box.setAttribute('data-mpg-countdown', '');

    const read = () => cells.filter(isDigitCell).map(c => c.textContent.trim()).join('');
    const apply = units => {
      seps.forEach((s, i) => s.setAttribute('data-mpg-unit', units[i]));
      box.setAttribute('data-mpg-unit-after', units[units.length - 1]);
      // « 00 j » en tête : inutile, masqué (les jours ne font que décroître)
      if (units[0] === 'j') {
        const head = cells.slice(0, cells.indexOf(seps[0]));
        if (head.every(c => c.textContent.trim() === '0'))
          [...head, seps[0]].forEach(c => c.setAttribute('data-mpg-cd-hide', ''));
      }
    };
    const n = seps.length + 1;
    if (n === 4) return apply(['j', 'h', 'min', 's']);
    const first = read();
    setTimeout(() => {
      const ticking = read() !== first;
      const all = ticking ? ['j', 'h', 'min', 's'] : ['j', 'h', 'min'];
      apply(all.slice(all.length - n));
    }, 2500);
  }

  // ===========================================================================
  // 4. Éléments
  // ===========================================================================
  const FADE = /^linear-gradient\(rgba\(38, 38, 38, 0\)/; // gris écrit en dur par le site (recoloré en CSS)
  const FOOTER = /linear-gradient\(rgb\(66, 164, 110\)/;

  function fixElement(el) {
    const tag = el.tagName;
    if (tag === 'IMG') { if (!el.hasAttribute('alt')) el.setAttribute('alt', ''); return; }
    if (tag === 'H5' && !el.hasAttribute('aria-level')) el.setAttribute('aria-level', '2');
    if (tag === 'H6' && !el.hasAttribute('aria-level')) el.setAttribute('aria-level', '3');
    if (tag !== 'DIV') return;

    const c = cs(el);

    // Boutons en div : rôle, nom accessible, retour au survol
    if (el.getAttribute('tabindex') === '0' && !el.hasAttribute('role') && el.getAttribute('data-mpg-btn') === null) {
      el.setAttribute('role', 'button');
      el.setAttribute('data-mpg-btn', '');
      const r = el.getBoundingClientRect();
      if (r.width >= 150 && r.height >= 60 && c.backgroundColor !== 'rgba(0, 0, 0, 0)') el.setAttribute('data-mpg-card', '');
    }
    if (el.getAttribute('data-mpg-btn') !== null) nameIconButton(el);

    if (c.position === 'absolute' && FADE.test(c.backgroundImage)) el.setAttribute('data-mpg-fx', 'fade');
    if (FOOTER.test(c.backgroundImage)) el.setAttribute('data-mpg-footer', '');
    if (c.borderTopWidth === '4px' && c.borderTopColor === 'rgb(223, 102, 97)') el.setAttribute('data-mpg-urgent', '');

    // Libellé tronqué sous un avatar
    if (el.childElementCount === 0 && c.textOverflow === 'ellipsis' && c.whiteSpace === 'nowrap') {
      const prev = el.previousElementSibling;
      if (prev && prev.querySelector('img') && el.offsetWidth > 0 && el.offsetWidth <= 120) {
        el.setAttribute('data-mpg-fx', 'label');
        el.title = el.textContent;
        if (prev.getAttribute('tabindex') === '0') linkLabel(el, prev);
        else if (el.parentElement.getAttribute('tabindex') === '0') { /* tuile entière déjà cliquable */ }
        // Rangée « rétro » en haut de Mon MPG : lui donner un titre
        // (seulement sur Mon MPG : ailleurs, la section a déjà son propre titre)
        if (location.pathname === '/' && /Terminé/i.test(el.parentElement.innerText)) {
          let row = el.parentElement;
          while (row && row.offsetWidth < 600) row = row.parentElement;
          const col = row && row.parentElement;
          if (col && col.getAttribute('data-mpg-title') === null) col.setAttribute('data-mpg-title', 'Saisons terminées');
        }
      }
    }
    // « Créer / Rejoindre / Suivre » : le texte sous la tuile est cliquable aussi
    if (el.childElementCount === 0 && /^(Créer|Rejoindre|Suivre)$/.test(el.textContent.trim())) {
      const prev = el.previousElementSibling;
      if (prev && prev.getAttribute('tabindex') === '0') linkLabel(el, prev);
    }

    // Bouton désactivé « Voir la compétition » illisible
    if (c.backgroundColor === 'rgb(51, 55, 64)' && el.getAttribute('tabindex') === '-1' && el.innerText.trim() === 'Voir la compétition')
      el.setAttribute('data-mpg-disabled-btn', '');

    cornerBadge(el, c);
    detectSwitch(el, c);
  }

  // Badge d'état posé dans le coin haut-gauche d'une carte arrondie
  function cornerBadge(el, c) {
    if (c.backgroundColor === 'rgba(0, 0, 0, 0)' || parseFloat(c.borderTopLeftRadius) < 4) return;
    const r = el.getBoundingClientRect();
    if (!r.width || r.height > 40 || r.width > 320 || !el.innerText.trim()) return; // badge = du texte
    let card = el.parentElement;
    // (cartes arrondies à 16 px par le site, 6 px avec theme.js)
    for (let i = 0; i < 4 && card && parseFloat(cs(card).borderTopLeftRadius) < 5; i++) card = card.parentElement;
    if (!card || parseFloat(cs(card).borderTopLeftRadius) < 5 || parseFloat(cs(card).borderTopLeftRadius) > 40) return;
    const cc = cs(card), cr = card.getBoundingClientRect();
    const bw = parseFloat(cc.borderTopWidth) || 0;
    if (r.left - cr.left > bw + 2 || r.top - cr.top > bw + 2) return;   // pas dans le coin
    el.style.setProperty('--mpg-corner', `${Math.max(0, parseFloat(cc.borderTopLeftRadius) - bw)}px`);
    el.setAttribute('data-mpg-corner', '');
  }

  function linkLabel(label, target) {
    if (label.getAttribute('data-mpg-click') !== null) return;
    label.setAttribute('data-mpg-click', '');
    label.addEventListener('click', () => target.click());
  }

  function nameIconButton(el) {
    if (el.getAttribute('aria-label') || el.innerText.trim() || el.querySelector('img[alt]:not([alt=""])')) return;
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    const dlg = el.closest('[role="dialog"]');
    if (dlg && closeButtonOf(dlg) === el) return el.setAttribute('aria-label', 'Fermer');
    // Icône « ··· » (Font Awesome ellipsis)
    const d = el.querySelector('svg path')?.getAttribute('d') || '';
    if (d.startsWith('M448 256a48 48 0 1 1 -96 0')) return el.setAttribute('aria-label', 'Plus d\'options');
    // Tuile image dont le libellé est juste en dessous (Créer / Rejoindre / Suivre…)
    const next = el.nextElementSibling;
    if (el.querySelector('img') && next && next.innerText.trim() && next.innerText.trim().length < 40)
      return el.setAttribute('aria-label', next.innerText.trim());
    if (r.width <= 20 && r.height <= 20) return el.setAttribute('aria-label', 'Plus d\'informations');
  }

  function detectSwitch(el, c) {
    // Piste arrondie 40–64 × 20–34 contenant un seul bouton rond
    const w = el.offsetWidth, h = el.offsetHeight;
    if (w < 40 || w > 64 || h < 20 || h > 34 || el.childElementCount !== 1) return;
    if (parseFloat(c.borderRadius) < h / 2 - 2 || c.backgroundColor === 'rgba(0, 0, 0, 0)') return;
    const knob = el.firstElementChild;
    if (!knob || Math.abs(knob.offsetWidth - knob.offsetHeight) > 1 || knob.offsetWidth < 12) return;
    const wrap = el.parentElement || el;
    const update = () => {
      const tr = el.getBoundingClientRect(), kr = knob.getBoundingClientRect();
      const on = kr.left + kr.width / 2 > tr.left + tr.width / 2;
      wrap.setAttribute('role', 'switch');
      wrap.setAttribute('aria-checked', String(on));
      wrap.setAttribute('data-mpg-state', on ? 'Oui' : 'Non');
      const label = wrap.parentElement && [...wrap.parentElement.children].map(x => x.innerText.trim()).find(Boolean);
      if (label) wrap.setAttribute('aria-label', label);
      if (wrap.getAttribute('tabindex') === '-1' && cs(wrap).cursor !== 'pointer') wrap.setAttribute('aria-disabled', 'true');
    };
    // Ligne d'option surlignée en bleu plein : fond neutre
    const row = wrap.parentElement;
    if (row && cs(row).backgroundColor !== 'rgba(0, 0, 0, 0)') row.setAttribute('data-mpg-optrow', '');
    if (wrap.getAttribute('data-mpg-switch') === null) {
      wrap.setAttribute('data-mpg-switch', '');
      wrap.addEventListener('click', () => setTimeout(update, 350));
    }
    update();
  }

  // ===========================================================================
  // 5. Corrections dépendant de la page (passe complète, différée)
  // ===========================================================================
  function pageFixes() {
    // Fil d'Ariane : filet de sécurité (la détection principale est instantanée, dans fixText)
    for (const c of $$('#root div').filter(d => d.childElementCount === 0 && d.textContent.trim() === 'Mon MPG')) checkCrumb(c);

    // Messagerie : conversations lues estompées par opacité
    const msgHead = $$('body div').find(d => d.childElementCount === 0 && /^mes messages$/i.test(d.textContent.trim()));
    if (msgHead) {
      let panel = msgHead;
      while (panel && cs(panel).position !== 'absolute') panel = panel.parentElement;
      if (panel) for (const d of panel.querySelectorAll('div')) {
        const o = parseFloat(cs(d).opacity);
        if (o < 0.9 && o > 0.2 && d.offsetWidth > 200) d.setAttribute('data-mpg-read', '');
      }
    }

    growScrollers();
    homeLayout();
    profileLayout();
    if (location.pathname !== '/') $$('[data-mpg-title]').forEach(e => e.removeAttribute('data-mpg-title'));

    // Formulaire « J'ai un code » : illustration de fond trop chargée
    for (const img of $$('#root img[src*="join_competition_bg"]')) img.setAttribute('data-mpg-dim', '');

    // Profil : l'avatar (180 px) déborde du bandeau (156 px) et se fait rogner
    if (location.pathname.startsWith('/profile')) fitProfileAvatar();
  }

  // Menus déroulants : la zone qui défile et ses parents ont une hauteur fixe en px
  function growScrollers() {
    // Uniquement dans un menu OUVERT, et jamais au-delà du menu lui-même : fermé, le menu
    // est rangé dans le header, et remonter plus haut casserait le scroll de la page.
    for (const panel of $$('[id^="headlessui-popover-panel"]')) {
      if (!panel.offsetHeight) continue;
      for (const sc of panel.querySelectorAll('div')) {
        const oy = cs(sc).overflowY;
        if (oy !== 'auto' && oy !== 'scroll') continue;
        sc.setAttribute('data-mpg-scroll', '');
        for (let p = sc.parentElement; p && p !== panel && panel.contains(p); p = p.parentElement)
          if (cs(p).height.endsWith('px')) p.setAttribute('data-mpg-grow', '');
      }
    }
  }
  // Les menus s'ouvrent souvent sans ajout de nœud (simple affichage) : on repasse après un clic
  addEventListener('click', () => setTimeout(growScrollers, 300), true);

  // Bas de Mon MPG : « Nouvelle compétition », « Compet' officielles » et « J'ai un code »
  // côte à côte ; ligues et tournois publics en grille sur toute la largeur.
  const HOME_ATTRS = ['data-mpg-homecol', 'data-mpg-homecell', 'data-mpg-size', 'data-mpg-tiles', 'data-mpg-offscroll',
    'data-mpg-offrow', 'data-mpg-cardview', 'data-mpg-cardscroll', 'data-mpg-cardrow',
    'data-mpg-acts', 'data-mpg-act', 'data-mpg-acts-out'];
  const homeRO = new ResizeObserver(entries => { for (const e of entries) sizeHome(e.target); });
  let homeCol = null;

  // Créer / Rejoindre / Suivre : trois boutons compacts identiques. Quand il y a la place à
  // côté du titre, ce sont des <button> à nous, posés à droite dans le bandeau « Mon MPG »
  // (la section d'origine, masquée, reçoit les clics : le site garde la main sur l'action).
  // La section ne peut pas être déplacée elle-même : ses ancêtres (ScrollView) la rognent.
  // Sinon (pas de bandeau, ou bandeau trop étroit) : les tuiles restylées sur place.
  let homeActs = null, homeBar = null;
  const actsRO = new ResizeObserver(() => placeActions());
  const tilesOf = sec => [...(sec.children[1]?.children || [])];
  const labelOf = t => t.innerText.trim();
  const homeBanner = () => $$('[data-mpg-dyn]').find(b => b.offsetWidth > 600 && b.getBoundingClientRect().top + scrollY < 400);

  function homeActions(sec) {
    const tiles = tilesOf(sec);
    if (tiles.length < 2 || tiles.length > 4) return;
    setAttr(sec.children[1], 'data-mpg-tiles', '');
    for (const t of tiles) setAttr(t, 'data-mpg-act', '');
    homeActs = sec;
    placeActions();
  }

  function buildBar(banner) {
    const tiles = tilesOf(homeActs);
    const sig = tiles.map(labelOf).join('|');
    if (!homeBar) {
      homeBar = document.createElement('div');
      homeBar.className = 'mpg-acts';
      homeBar.setAttribute('role', 'group');
      homeBar.setAttribute('aria-label', 'Nouvelle compétition');
    }
    if (homeBar.dataset.sig !== sig) {
      homeBar.textContent = '';
      for (const t of tiles) {
        const label = labelOf(t);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mpg-act';
        const src = t.querySelector('img')?.src;
        if (src) { const i = document.createElement('img'); i.src = src; i.alt = ''; btn.append(i); }
        btn.append(label);
        // Tuile retrouvée au moment du clic (React peut l'avoir remplacée)
        btn.addEventListener('click', () => {
          const tile = homeActs && tilesOf(homeActs).find(x => labelOf(x) === label);
          tile?.firstElementChild?.click();
        });
        homeBar.append(btn);
      }
      homeBar.dataset.sig = sig;
    }
    if (homeBar.parentElement !== banner) { banner.append(homeBar); actsRO.disconnect(); actsRO.observe(banner); }
  }

  function removeBar() {
    homeBar?.remove();
    actsRO.disconnect();
  }

  function placeActions() {
    const sec = homeActs;
    if (!sec || !sec.isConnected) return removeBar();
    const banner = homeBanner();
    let mode = 'inline';
    if (banner) {
      buildBar(banner);
      const br = banner.getBoundingClientRect(), r = homeBar.getBoundingClientRect();
      const title = [...banner.querySelectorAll('*')]
        .filter(e => !homeBar.contains(e) && !e.childElementCount && e.textContent.trim() && e.offsetWidth)
        .map(e => e.getBoundingClientRect());
      const clash = title.some(t => t.right + 24 > r.left && t.left < r.right && t.bottom > r.top && t.top < r.bottom);
      if (!clash && r.height <= br.height - 16) mode = 'banner';
    }
    if (mode !== 'banner') removeBar();
    setAttr(sec, 'data-mpg-acts', mode);
    sec.parentElement.toggleAttribute('data-mpg-acts-out', mode === 'banner');
  }
  addEventListener('resize', () => homeActs && placeActions());
  // Changement de page : retirer les boutons du bandeau tout de suite (React peut le réutiliser)
  if (window.navigation) navigation.addEventListener('currententrychange', () => queueMicrotask(homeLayout));

  // Taille de la colonne → disposition. Cartes publiques (≥ 260 px + 16 px d'écart) :
  // en grille si toute la rangée tient (3 par ligne au plus loin), sinon défilement.
  const setAttr = (el, a, v) => { if (el.getAttribute(a) !== v) el.setAttribute(a, v); };
  function sizeHome(col) {
    const w = col.clientWidth;
    if (!w) return;
    setAttr(col, 'data-mpg-size', w >= 1000 ? 'l' : w >= 620 ? 'm' : 's');
    const fit = Math.floor((w + 16) / 276);
    for (const row of $$('[data-mpg-cardrow]', col)) {
      const n = row.children.length;
      const grid = n > 0 && fit >= Math.min(n, 3);
      setAttr(row, 'data-mpg-cardrow', grid ? 'grid' : 'scroll');
      setAttr(row.parentElement, 'data-mpg-cardscroll', grid ? 'grid' : 'scroll');
      row.style.setProperty('--mpg-cols', String(Math.max(1, Math.min(n, fit))));
    }
  }

  function homeLayout() {
    // (les fenêtres « Créer / Rejoindre… » s'ouvrent en /modal/… par-dessus Mon MPG)
    if (location.pathname !== '/' && !location.pathname.startsWith('/modal/')) {
      for (const a of HOME_ATTRS) $$(`[${a}]`).forEach(e => e.removeAttribute(a));
      if (homeCol) { homeRO.unobserve(homeCol); homeCol = null; }
      homeActs = null; removeBar();
      return;
    }
    const h = $$('#root h5').find(x => /^nouvelle compétition$/i.test(x.textContent.trim()));
    const col = h && h.parentElement && h.parentElement.parentElement;
    if (!col) { homeActs = null; removeBar(); return; }
    homeActions(h.parentElement);
    // Grille du bas de page : seulement quand les sections y sont regroupées (selon les
    // comptes, le site les place en bas, ou « Nouvelle compétition » tout en haut)
    if (col.children.length < 5) return;
    col.setAttribute('data-mpg-homecol', '');
    if (homeCol !== col) {
      if (homeCol) homeRO.unobserve(homeCol);
      homeCol = col;
      homeRO.observe(col);
    }
    for (const k of col.children) {
      const t = k.querySelector('h5')?.textContent.trim() || '';
      if (/^nouvelle compétition$/i.test(t)) {
        k.setAttribute('data-mpg-homecell', '');
      } else if (/officielles/i.test(t)) {
        k.setAttribute('data-mpg-homecell', '');
        const scroll = k.children[1]?.firstElementChild;       // zone qui défile
        const row = scroll?.firstElementChild;
        if (row && row.children.length) {
          scroll.setAttribute('data-mpg-offscroll', '');
          row.setAttribute('data-mpg-offrow', '');
        }
      } else if (/privée/i.test(t)) k.setAttribute('data-mpg-homecell', 'wide');
      else if (/publi/i.test(t)) {
        const view = k.children[1];                             // zone qui défile horizontalement
        const content = view?.firstElementChild;
        const row = content?.firstElementChild;
        if (content && row && row.children.length) {
          view.setAttribute('data-mpg-cardview', '');
          if (!content.hasAttribute('data-mpg-cardscroll')) content.setAttribute('data-mpg-cardscroll', '');
          if (!row.hasAttribute('data-mpg-cardrow')) row.setAttribute('data-mpg-cardrow', '');
        }
      }
    }
    sizeHome(col);
  }

  // Profil, onglet Résumé : stats à gauche, badges / trophées / maillots à droite
  function profileLayout() {
    const reset = () => ['data-mpg-profilegrid', 'data-mpg-profilewrap']
      .forEach(a => $$(`[${a}]`).forEach(e => e.removeAttribute(a)));
    if (!location.pathname.startsWith('/profile')) return reset();
    const h = $$('#root h5').find(x => /^tous les matchs$/i.test(x.textContent.trim()) && x.offsetWidth > 0);
    let grid = h;
    while (grid && grid.children.length < 5) grid = grid.parentElement;
    if (!grid || grid.children.length !== 5 || !/badges/i.test(grid.innerText)) return reset();
    if (grid.getAttribute('data-mpg-profilegrid') !== null) return;
    reset();
    grid.setAttribute('data-mpg-profilegrid', '');
    grid.parentElement?.setAttribute('data-mpg-profilewrap', '');
  }

  function fitProfileAvatar() {
    const big = $$('#root img').filter(i => i.offsetWidth >= 100 && i.getBoundingClientRect().top + scrollY < 450);
    if (!big.length) return;
    let banner = big[0].parentElement;
    while (banner && !(cs(banner).overflow === 'hidden' && banner.offsetWidth > 800)) banner = banner.parentElement;
    if (!banner) return;
    // Pour chaque image : son ancêtre positionné en absolu le plus haut sous le bandeau
    // (l'image elle-même est souvent dans un masque rond : il faut déplacer le masque)
    const groups = [...new Set(big.map(i => {
      let top = null;
      for (let p = i; p && p !== banner; p = p.parentElement) if (cs(p).position === 'absolute') top = p;
      return top;
    }))].filter((p, _, all) => p && banner.contains(p) && !all.some(q => q && q !== p && q.contains(p)));
    if (!groups.length) return;
    groups.forEach(g => { g.style.transform = ''; });
    const br = banner.getBoundingClientRect();
    const rects = groups.map(g => g.getBoundingClientRect());
    const top = Math.min(...rects.map(r => r.top)), bottom = Math.max(...rects.map(r => r.bottom));
    const left = Math.min(...rects.map(r => r.left)), right = Math.max(...rects.map(r => r.right));
    const scale = Math.min(1, (br.height - 16) / (bottom - top));
    const cy = (top + bottom) / 2, cx = (left + right) / 2;
    const dy = (br.top + br.height / 2) - cy;
    if (Math.abs(dy) < 1 && scale === 1) return;
    for (const g of groups) {
      const r = g.getBoundingClientRect();
      g.style.transformOrigin = `${cx - r.left}px ${cy - r.top}px`;
      g.style.transform = `translateY(${dy}px) scale(${scale})`;
    }
  }

  // ===========================================================================
  // 6. Observation du rendu
  // ===========================================================================
  function scan(node) {
    if (node.nodeType === 3) { fixText(node); return; }
    if (node.nodeType !== 1) return;
    fixElement(node);
    for (const e of node.querySelectorAll('img, h5, h6, div')) fixElement(e);
    const tw = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    for (let t = tw.nextNode(); t; t = tw.nextNode()) fixText(t);
  }

  let full = null;
  const scheduleFull = () => {
    clearTimeout(full);
    full = setTimeout(() => { if (document.body) { scan(document.body); pageFixes(); } }, 400);
  };

  const mo = new MutationObserver(records => {
    let added = false;
    for (const r of records) {
      if (r.type === 'characterData') fixText(r.target);
      else for (const n of r.addedNodes) {
        if (n === homeBar) continue;               // nos boutons du bandeau (évite une boucle)
        added = true; scan(n);
      }
    }
    if (added) scheduleFull(); // pas pour les simples tics de compte à rebours
  });

  const start = () => {
    addSkipLink();
    mo.observe(root, { childList: true, subtree: true, characterData: true });
    scan(document.body);
    pageFixes();
  };
  if (document.body) start();
  else addEventListener('DOMContentLoaded', start, { once: true });
  addEventListener('resize', () => location.pathname.startsWith('/profile') && fitProfileAvatar());
})();
