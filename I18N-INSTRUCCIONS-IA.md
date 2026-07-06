# INSTRUCCIONS PER A UNA IA — Convertir Step Quiz en bilingüe (CA/EN)

> **Audiència:** un agent d'IA que editarà el codi. Aquest document és un **pla
> d'execució detallat i verificable**, adaptat a l'estat REAL del projecte (analitzat).
> Segueix les fases en ordre. Cada fase acaba amb una comprovació objectiva.

---

## 0. CONTEXT OBLIGATORI: com està fet el projecte ARA

Abans de tocar res, has d'entendre que **hi ha TRES patrons d'exercici diferents**. El
tractament del text depèn del patró. No apliquis una solució única a tots.

### Capa compartida (afecta TOTS els exercicis)
- `js/game-core.js` — motor comú. Conté text visible dins **template literals** de la
  funció `injectSharedHTML()` (≈ línies 257-286) i de la pantalla final (≈ línia 276) i el
  resum d'historial (≈ línia 454). Exemples de text: `Molt be!`, `+10 punts`,
  `Sessio completada`, `Comencar sessio seguent`, `Resum`, `📋 Informe`, `📝 Copiar codi`,
  `🔄 Tornar a jugar`, `📤 Comparteix el codi`, `Selecciona i copia aquest codi:`,
  `✅ Nota enviada al professor/a (Schoolwork)`, `Resum de les teves respostes`.
- `js/utils.js`, `js/config.js`, `js/fixed-sessions.js` — comprovar si tenen text visible
  (config.js pot tenir missatges de validació; NO són visibles per l'alumne → prioritat baixa).
- **Labels estàtics duplicats a CADA HTML**: `Sessió 1 de 3`, `Operació 1 de 10`,
  `Punts: 0`, `Intents: 6`, etc. Estan al `<body>` de cada HTML amb ids
  (`session-display`, `lvl-display`, `score-display`, `attempts-display`). `game-core.js`
  els actualitza per id, però el **text inicial i les etiquetes fixes** són a l'HTML.

### Patró A — Exercici amb `strings.js` propi (JA separa el text) ✅ FÀCIL
Exercicis: **derivades, integrals, mitjana, recta-numerica, estadistica, probabilitat**.
Tenen `js/<exercici>/strings.js` amb `window.Strings = (() => { … })()`. Tot el text de
l'alumne (hints, feedback) ja és aquí. És el patró model.

### Patró B — Exercici amb subdir `js/<exercici>/` però SENSE `strings.js`
Exercicis amb subdir propi que NO surten a la llista de dalt: **asimptotes, decimals,
descripcio-grafica, estadistica-inversa, llenguatge-algebraic, sistemes-equacions,
triangle-rectangle, trigonometria, vocabulari**. El text està incrustat dins els seus `.js`.

### Patró C — Exercici SENSE subdir `js/` propi (lògica/text INLINE a l'HTML)
Exercicis: **enters, enters-ordenar, fraccions, equacions, mcd-mcm, potencies, factoritzar,
radicals, area-perimetre, pla-cartesia, proporciodirecta, gots-fitxes, complexos, ruffini,
grafica-i-funcio, grafica-funcio-i-derivada, rectes-plans, esglaonar-matriu, inversa-matriu,
raons-trigonometria, teorema-sin-cos**. El text viu en `<script>` inline dins l'HTML i en
etiquetes del `<body>` (p. ex. `Signe del resultat?`, `negatiu`, `zero`, `positiu`,
`Resultat numèric?`).

### Inventari HTML
37 fitxers HTML a l'arrel. Tots tenen `<html lang="ca">`, `<title>` i `<h1>` en català.

---

## 1. FASE 1 — Infraestructura i18n (fer-ho UN sol cop)

**Objectiu:** crear el sistema central. Cap traducció encara, només l'esquelet.

### 1.1 Crear `js/i18n/ca.js`
```js
window.I18N_CA = {
  // UI compartida (game-core)
  'ui.summary': 'Resum',
  'ui.report': 'Informe',
  'ui.copy_code': 'Copiar codi',
  'ui.share_code': 'Comparteix el codi',
  'ui.play_again': 'Tornar a jugar',
  'ui.session_done': 'Sessió completada',
  'ui.next_session': 'Començar sessió següent',
  'ui.well_done': 'Molt bé!',
  'ui.points_plus': '+{n} punts',
  'ui.select_copy': 'Selecciona i copia aquest codi:',
  'ui.grade_sent': 'Nota enviada al professor/a (Schoolwork)',
  'ui.answers_summary': 'Resum de les teves respostes',
  // Labels de joc
  'ui.session': 'Sessió', 'ui.operation': 'Operació', 'ui.points': 'Punts',
  'ui.attempts': 'Intents', 'ui.of': 'de',
  // Títols dels 37 exercicis (clau = nom de fitxer sense .html)
  'title.enters': 'Nombres enters',
  'title.derivades': 'Càlcul de derivades',
  // … completar TOTS (vegeu 2.1) …
};
```

### 1.2 Crear `js/i18n/en.js`
Mateixes claus, valors en anglès. Les que encara no sàpigues traduir, deixa-les en blanc
o repeteix el català: el sistema té fallback, així que no trencaran res.

### 1.3 Crear `js/i18n.js` (el motor)
```js
window.I18n = (function () {
  const DICT = { ca: window.I18N_CA || {}, en: window.I18N_EN || {} };
  function pickLang() {
    const url = new URLSearchParams(location.search).get('lang');
    if (url && DICT[url]) return url;
    try { const s = localStorage.getItem('sq_lang'); if (s && DICT[s]) return s; } catch (e) {}
    const nav = (navigator.language || 'ca').slice(0,2);
    return DICT[nav] ? nav : 'ca';
  }
  const api = {
    lang: pickLang(),
    t(key, vars) {
      let s = (DICT[this.lang] && DICT[this.lang][key]) || DICT.ca[key] || key;
      if (vars) Object.keys(vars).forEach(k => { s = s.replace('{'+k+'}', vars[k]); });
      return s;
    },
    setLang(l) {
      if (!DICT[l]) return;
      this.lang = l;
      try { localStorage.setItem('sq_lang', l); } catch (e) {}
      // Persistència nativa si hi ha el bridge Capacitor:
      if (window.StepQuizNative && window.StepQuizNative.saveProgress)
        window.StepQuizNative.saveProgress('lang', l);
      this.apply(document);
      document.documentElement.setAttribute('lang', l);
    },
    apply(root) {
      (root || document).querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n');
        const txt = this.t(k);
        if (el.hasAttribute('data-i18n-attr'))
          el.setAttribute(el.getAttribute('data-i18n-attr'), txt);
        else el.textContent = txt;
      });
    }
  };
  document.documentElement.setAttribute('lang', api.lang);
  document.addEventListener('DOMContentLoaded', () => api.apply(document));
  return api;
})();
window.t = (k, v) => window.I18n.t(k, v);
```

### 1.4 Comprovació Fase 1
- `node --check js/i18n.js js/i18n/ca.js js/i18n/en.js` → sense errors.
- Carregar qualsevol HTML amb `?lang=en` no ha de trencar res (encara sense claus, cau a CA).

---

## 2. FASE 2 — HTML estàtic (37 fitxers, mecànic)

**Objectiu:** que `<title>`, `<h1>`, `<meta description>` i labels fixos siguin traduïbles.

### 2.1 Per a cada HTML
1. Treure `lang="ca"` de `<html>` (el posa `i18n.js`). Deixa `<html>`.
2. Marcar el títol i la capçalera:
   ```html
   <title data-i18n="title.enters">Nombres enters</title>
   <h1 data-i18n="title.enters">Nombres enters</h1>
   ```
   (El text català es queda com a fallback si el JS falla.)
3. Afegir la clau `title.<fitxer>` als dos diccionaris amb la traducció.
4. Injectar els scripts i18n **els primers**, abans de `utils/config/game-core`:
   ```html
   <script src="js/i18n/ca.js"></script>
   <script src="js/i18n/en.js"></script>
   <script src="js/i18n.js"></script>
   ```
5. Labels estàtics del `<body>` (`Sessió 1 de 3`, `Punts: 0`, `Intents: 6`, etc.):
   com que `game-core.js` els reescriu dinàmicament (Fase 3), aquí NOMÉS cal traduir el
   text que l'alumne pot veure abans que el JS actuï. Opció simple: marcar-los amb
   `data-i18n` també, o deixar-ho a la Fase 3 si sempre es reescriuen.

### 2.2 Comprovació Fase 2
- Cap `<html lang="ca">` fix (excepte com a fallback intencionat).
- Tots els `<title>`/`<h1>` tenen `data-i18n`.
- Els 3 scripts i18n es carreguen abans de `game-core.js` a tots els HTML.
- `grep -L 'js/i18n.js' *.html` retorna buit (tots el carreguen).

---

## 3. FASE 3 — UI compartida a `game-core.js`

**Objectiu:** treure el text català dels template literals i substituir-lo per `t()`.

### 3.1 Editar `injectSharedHTML()` (≈ línies 257-286)
Substituir cada literal per la clau. Exemples:
- `Molt be!` → `${t('ui.well_done')}`
- `+10 punts` → `${t('ui.points_plus', {n: 10})}` (o mantén el número dinàmic ja existent)
- `Sessio completada` → `${t('ui.session_done')}`
- `Comencar sessio seguent` → `${t('ui.next_session')}`
- Pantalla final (línia 276): `Resum`→`t('ui.summary')`, `Informe`→`t('ui.report')`,
  `Copiar codi`→`t('ui.copy_code')`, `Tornar a jugar`→`t('ui.play_again')`.
- Botó compartir (286): `Comparteix el codi` → `t('ui.share_code')`.
- Bàner ClassKit (306): `Nota enviada…` → `t('ui.grade_sent')`.
- Resum historial (454): `Resum de les teves respostes` → `t('ui.answers_summary')`.

### 3.2 Labels dinàmics (Sessió/Operació/Punts/Intents)
Localitza on `game-core.js` escriu aquests displays (busca `session-display`,
`score-display`, etc.) i reescriu amb `t()`:
```js
sessionDisplay.textContent = `${t('ui.session')} ${s} ${t('ui.of')} ${total}`;
```
Si el text "Operació"/"Funció" varia per exercici, fes-ho una clau per exercici
(`label.unit.enters = 'Operació'`, `label.unit.derivades = 'Funció'`) o passa-ho com a
paràmetre de configuració des de l'HTML (`window.APP_CONFIG.unitLabelKey`).

### 3.3 Comprovació Fase 3
- `node --check js/game-core.js` OK.
- Cap literal català visible dins `injectSharedHTML()` ni a la pantalla final (grep de
  paraules clau: `Resum`, `Copiar`, `Intents`, `Sessió`, `Molt be`, `completada`).
- Carregar un exercici amb `?lang=en` mostra la UI compartida en anglès.

---

## 4. FASE 4 — Exercicis Patró A (amb `strings.js`) — 6 exercicis

**Objectiu:** afegir dimensió d'idioma als `strings.js` existents.

Per a **derivades, integrals, mitjana, recta-numerica, estadistica, probabilitat**:
1. Obrir `js/<ex>/strings.js`. Té `window.Strings = (() => { … return {Hints, Feedback…} })()`.
2. Convertir-lo perquè seleccioni per idioma:
   ```js
   window.Strings = (function () {
     const CA = { Hints: { … }, Feedback: { … } };   // el contingut actual
     const EN = { Hints: { … }, Feedback: { … } };   // traducció
     const lang = (window.I18n && window.I18n.lang) || 'ca';
     return (lang === 'en' && EN) ? EN : CA;
   })();
   ```
3. Assegurar que `strings.js` es carrega DESPRÉS de `i18n.js` (revisar l'ordre a l'HTML).
4. Traduir el bloc `EN` (feina lingüística; deixar `EN` = còpia de `CA` no trenca res).

### Comprovació Fase 4
- `node --check` de cada `strings.js`.
- Amb `?lang=en`, els hints/feedback d'aquests 6 exercicis surten en anglès (o CA si no traduït).

---

## 5. FASE 5 — Exercicis Patró B (subdir sense `strings.js`) — ~9 exercicis

**Objectiu:** extreure el text incrustat als `.js` cap a un `strings.js` nou i bilingüe.

Per a **asimptotes, decimals, descripcio-grafica, estadistica-inversa, llenguatge-algebraic,
sistemes-equacions, triangle-rectangle, trigonometria, vocabulari**:
1. Crear `js/<ex>/strings.js` amb el patró de la Fase 4 (objectes `CA`/`EN`).
2. Moure-hi TOTES les cadenes visibles trobades als altres `.js` de l'exercici.
   Substituir al codi original per referències (`window.Strings.X` o `t()`).
3. Afegir `<script src="js/<ex>/strings.js"></script>` a l'HTML, després de `i18n.js`.
4. Traduir el bloc `EN`.

### Comprovació Fase 5
- Cada exercici té `js/<ex>/strings.js`.
- `grep` de paraules catalanes freqüents als `.js` (no-strings) de l'exercici → mínim.
- Prova funcional amb `?lang=en`.

---

## 6. FASE 6 — Exercicis Patró C (tot inline a l'HTML) — ~21 exercicis

**Objectiu:** el cas amb més feina. El text i la lògica són al `<script>` inline de l'HTML.

Per a cadascun (enters, fraccions, equacions, …):
1. Identificar les cadenes visibles (al `<body>` i al `<script>` inline). Exemples reals
   d'`enters.html`: `Signe del resultat?`, `negatiu`, `zero`, `positiu`, `Resultat numèric?`.
2. Dues opcions (tria segons la mida de l'exercici):
   - **Opció recomanada (modular):** crear `js/<ex>/strings.js` amb `CA`/`EN` i moure-hi
     les cadenes; carregar-lo a l'HTML. Igual que Patró B.
   - **Opció lleugera (per exercicis molt petits):** marcar les etiquetes del `<body>` amb
     `data-i18n` i, per al text dins el `<script>` inline, usar `t('clau')` amb claus
     afegides als diccionaris globals `i18n/ca.js` i `i18n/en.js`.
3. Traduir.

### Comprovació Fase 6
- Cap cadena catalana visible sense clau/`data-i18n` a l'HTML de l'exercici.
- Prova funcional CA i EN.

---

## 7. FASE 7 — Selector d'idioma (UI)

1. A `index.html`, afegir un control (botons `CA` / `EN` o `<select>`), amb `data-i18n`
   a les seves etiquetes si cal.
2. Handler: `onclick="I18n.setLang('en')"` / `'ca'`. `setLang` ja desa la preferència
   (localStorage + bridge natiu) i reaplica `apply()`.
3. Opcional: repetir el selector en una cantonada discreta de cada exercici.
4. Assegurar que la preferència persisteix entre pàgines (ja ho fa via localStorage/Preferences).

### Comprovació Fase 7
- Canviar a EN a l'índex i navegar a un exercici → segueix en EN.
- Reobrir l'app → recorda l'idioma.

---

## 8. FASE 8 — Metadades i coherència final

1. `sitemap.xml`: si vols URLs per idioma, afegir variants `?lang=en` o `hreflang`
   (opcional; per SEO). Mínim: no cal.
2. Actualitzar `README.md` esmentant el suport bilingüe.
3. Revisar que KaTeX i les matemàtiques NO s'han traduït mai (símbols i fórmules són
   idioma-neutres; només s'han de traduir enunciats i UI).
4. App Store: pots declarar Català i Anglès com a idiomes suportats a la fitxa.

---

## 9. REGLES GLOBALS (respectar sempre)

- **No dupliquis HTML per idioma.** Un sol joc de fitxers.
- **Fallback sempre a CA:** si falta una clau EN, `t()` retorna la catalana. Mai text buit.
- **No toquis fórmules matemàtiques** (KaTeX, LaTeX, símbols): no són text traduïble.
- **Ordre de càrrega:** `i18n/ca.js` → `i18n/en.js` → `i18n.js` → (utils, config, game-core)
  → strings.js de l'exercici → lògica de l'exercici.
- **Verificació després de cada fitxer editat:** `node --check` del JS i comprovar que
  cap referència d'asset queda trencada.
- **Idempotència:** si una clau ja existeix al diccionari, no la dupliquis.
- **Prova en tots dos idiomes** abans de donar una fase per tancada.

---

## 10. ORDRE D'EXECUCIÓ i criteri d'aturada

Executa **Fase 1 → 8 en ordre**. Cada fase deixa l'app operativa (gràcies al fallback),
així que pots parar entre fases sense deixar res trencat.

Prioritat si el temps és limitat: Fases 1-3 (infraestructura + UI compartida + títols)
donen ja una experiència bilingüe coherent per a la navegació i tota la UI comuna. Els
enunciats concrets dels exercicis (Fases 4-6) es poden completar després, un a un.

**Fet = ** cap cadena catalana visible sense passar per `t()` o `data-i18n`, els dos
diccionaris complets, i prova funcional correcta amb `?lang=ca` i `?lang=en` a tots els HTML.
