# Step Quiz — Camí "fàcil" cap a l'aprovació a l'App Store

Aquest document és el **full de ruta d'aprovació**: la seqüència d'accions, en ordre,
per maximitzar les possibilitats que Apple aprovi l'app **a la primera**.

No repeteix els passos tècnics de compilació (això és a [CAPACITOR-SETUP.md](CAPACITOR-SETUP.md)).
Aquí ens centrem en **què fer i en quin ordre** perquè la revisió sigui suau.

> **Filosofia:** el rebuig més probable per a una app com aquesta és la **Guideline 4.2
> (Minimum Functionality)** — "sembla només un web empaquetat". Tota la feina ja feta
> (offline complet + capa nativa) està pensada per neutralitzar-lo. La resta d'aquest
> document és sobre **presentar-ho bé** perquè el revisor ho vegi de seguida.

---

## Estat actual del projecte (juliol 2026)

| Requisit | Estat |
|----------|-------|
| Funciona 100% offline (sense CDN) | ✅ Fet |
| Capa nativa real (`native-bridge.js`) | ✅ Fet |
| Qualificació nativa cap al professor (ClassKit/Schoolwork) | ✅ Fet (amb fallback a codi) — vegeu [CLASSKIT-SETUP.md](CLASSKIT-SETUP.md) |
| Meta tags iOS + safe areas | ✅ Fet |
| Config Capacitor (`package.json`, `capacitor.config.json`) | ✅ Fet |
| Enllaços externs (YouTube) i donacions (Ko-fi) | ✅ Eliminats |
| Icona quadrada 1024×1024 | ✅ Fet (`icon.png` és ara 1024×1024 quadrada, sense alfa) |
| Compte Apple Developer | ⚠️ Pendent (acció teva) |
| Política de privadesa publicada | ⚠️ Pendent |
| Captures de pantalla | ⚠️ Pendent |

Les caselles ⚠️ són el que cobreix aquest full de ruta.

---

## Fase 0 — Abans de tocar codi (paral·lelitzable, comença ja)

Aquests tràmits tenen **temps d'espera**, així que llança'ls primer mentre prepares la resta.

1. **Inscriu-te al Apple Developer Program** (99 USD/any) a developer.apple.com.
   - Persona física: Apple ID + verificació d'identitat.
   - Entitat: cal un **D-U-N-S Number** (pot trigar dies/setmanes → demana'l ja).
2. **Reserva el nom "Step Quiz"** a App Store Connect creant l'app (encara sense pujar res).
   - Bundle ID: `net.stepquiz.app` (ha de coincidir amb `capacitor.config.json`).
3. **Publica la política de privadesa** a una URL estable (p. ex. `step-quiz.net/privacitat`).
   - Com que l'app no recull dades ni les envia enlloc, el text és curt i real (vegeu Fase 3).

---

## Fase 1 — Icona ✅ (ja resolta) i splash (opcional)

La icona quadrada ja està feta: `icon.png` és ara **1024×1024, RGB sense transparència**,
amb el disseny original (petjada + "STEP QUIZ") centrat sobre el fons del tema (`#f8fafc`).
L'original apaïsat s'ha conservat com a `icon-original-landscape.png` per si el necessites.

Encara pots, opcionalment, preparar un `splash.png` (2732×2732) per a la pantalla de càrrega,
i generar automàticament tots els jocs d'icones/splash:
```bash
npm install --save-dev @capacitor/assets
# posa icon.png (1024x1024, ja el tens) i splash.png (2732x2732) a assets/
npx capacitor-assets generate --ios
```

---

## Fase 2 — Build i primera prova (TestFlight abans que revisió)

L'ordre importa: **prova a TestFlight abans d'enviar a revisió**. Detectar un crash tu
mateix és gratis; que el detecti Apple et costa una ronda de rebuig.

1. Segueix [CAPACITOR-SETUP.md](CAPACITOR-SETUP.md) fins a tenir l'`.ipa` a Xcode.
2. **Prova crítica offline:** al simulador i en un iPhone real, activa **mode avió** i
   verifica que:
   - Carrega l'`index.html` i tots els tipus d'exercici.
   - KaTeX renderitza (derivades, integrals, sistemes).
   - El teclat numèric i el codi de verificació funcionen.
   - Res queda tallat pel notch / illa dinàmica (safe areas).
3. Puja una build a **TestFlight** (Distribute → App Store Connect). Prova-la des de
   l'app TestFlight en un dispositiu real. Convida 1-2 persones si pots.

---

## Fase 3 — Omplir la fitxa a App Store Connect

 Compte: **metadata inexacta = rebuig (Guideline 2.3)**. Que tot reflecteixi el que fa l'app.

### Informació bàsica
- **Nom:** Step Quiz · **Subtítol:** "Matemàtiques ESO i Batxillerat"
- **Categoria:** Educació · **Age Rating:** 4+
- **Idioma principal:** Català (afegeix Castellà/Anglès si vols abast)

### Privadesa (App Privacy — el "nutrition label")
- Declara **"Data Not Collected"** (l'app no envia res a cap servidor).
- Enllaça la política de privadesa de la Fase 0.
- ⚠️ Assegura't que **cap recurs es carrega de xarxa** (ja està: tot és `vendor/` local).
  Si quedés algun recurs remot, no podries declarar "no es recullen dades" amb rotunditat.

### Captures de pantalla (obligatòries)
- iPhone 6.7" (mida de referència vigent): 3-5 captures.
- iPad si dónes suport a iPad (recomanable per a educació).
- Mostra pantalles **reals**: un exercici amb feedback pas a pas, el teclat numèric,
  la pantalla del codi de verificació.

---

## Fase 4 — Les notes per al revisor (el pas que més ajuda)

Aquest camp lliure a "App Review Information" és **la teva millor arma contra la 4.2**.
Escriu-hi (en anglès) alguna cosa com:

> Step Quiz is an offline educational math app for secondary-school students (ESO and
> Batxillerat). It works **completely offline** — no internet connection required.
> It uses **native iOS capabilities**: grades are reported natively via **ClassKit** to the
> student's teacher through **Schoolwork** (in Apple School Manager environments), encrypted
> via iCloud; when ClassKit is unavailable (personal iPads), the app falls back to a local
> verification code the student can share. It also uses on-device persistence of the student's
> progress/history, local notifications for practice reminders, and haptic feedback.
> No personal data is collected or transmitted to our servers or any third party.
> No ads, no external links, no purchases.
> To test: open any exercise from the home screen, answer the questions, and at the end
> tap "Comparteix el codi" to see the native share flow.

Per què funciona: el revisor sovint tria una app "tipus web" i busca motius per la 4.2.
Si li dius exactament què fa de natiu i com provar-ho, li estalvies la feina i evites
que assumeixi que és un simple wrapper.

---

## Fase 5 — Enviar a revisió i gestionar la resposta

1. Selecciona la build de TestFlight ja provada i prem **Submit for Review**.
2. Temps típic de revisió: hores a un parell de dies.
3. **Si aproven:** tria publicació manual o automàtica. Fet. 🎉
4. **Si rebutgen** (no és estrany a la primera): respon al **Resolution Center**, no
   tornis a enviar a cec.

### Guió de resposta als rebuigs més probables

| Motiu | Què fer |
|-------|---------|
| **4.2 Minimum Functionality** | Al Resolution Center, enumera les funcions natives (share, notificacions, persistència, haptics) i com provar-les. Si insisteixen, afegeix 1-2 capacitats natives més (p. ex. exportar l'informe a Fitxers amb `Filesystem`, ja disponible al bridge). |
| **2.1 crash / pantalla en blanc offline** | Reprodueix en mode avió, arregla el recurs que falli i reenvia. (Ja hauria d'estar cobert.) |
| **5.1.1 privadesa** | Ajusta la política o el nutrition label perquè coincideixin exactament amb el comportament real. |
| **2.3 metadata** | Corregeix captures/descripció perquè reflecteixin l'app real. |
| **1.x contingut menors** | Confirma que no hi ha enllaços externs ni contingut generat per usuaris. (Ja net.) |

Sempre educat i tècnic. Pots demanar una trucada amb l'equip de revisió si el rebuig
és per criteri i creus que s'equivoquen.

---

## Fase 6 — Decisió estratègica: Kids Category (opcional)

L'app s'adreça a menors. Pots publicar-la simplement a **Educació** (camí més fàcil) o
optar a la **Kids Category** (més visibilitat en el seu segment, però requisits més durs):
- Sense SDK d'analítica de tercers (ja compleixes: no n'hi ha cap).
- Sense enllaços externs sense gate parental (ja compleixes: eliminats).
- Privadesa reforçada (ja compleixes: no es recull res).

**Recomanació per a un primer llançament "fàcil":** publica a **Educació** sense Kids
Category. És menys fricció. Pots migrar a Kids Category en una actualització posterior.

---

## Checklist final (imprimible)

**Abans d'enviar:**
- [ ] Compte Apple Developer actiu i Bundle ID `net.stepquiz.app` reservat.
- [x] Icona quadrada 1024×1024 generada i aplicada (`icon.png`).
- [ ] Provat en mode avió en dispositiu real: tots els exercicis + KaTeX + teclat OK.
- [ ] Build provada a TestFlight sense crashos.
- [ ] Política de privadesa publicada i enllaçada.
- [ ] App Privacy = "Data Not Collected".
- [ ] Captures reals (iPhone + iPad).
- [ ] Categoria Educació, Age Rating 4+, idioma català.
- [ ] Notes per al revisor redactades (offline + funcions natives + com provar).
- [ ] `Info.plist` sense permisos innecessaris (només notificacions si les uses).

**Ordre recomanat d'execució:** Fase 0 (ja) → Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5.

---

## Per què aquest camí és "fàcil"

1. **El risc gros (4.2) ja està tècnicament resolt** abans d'enviar: offline real + natiu real.
2. **TestFlight abans de revisió** elimina els rebuigs per crash, que són els més tontos.
3. **Les notes al revisor** li diuen exactament què mirar, reduint la interpretació subjectiva.
4. **Privadesa trivial de declarar** ("no es recull res") perquè l'app no té backend.
5. **Cap element conflictiu** (ni anuncis, ni pagaments, ni enllaços externs, ni contingut de menors problemàtic).

L'únic que queda de veritat pendent per la teva banda és **administratiu** (compte,
icona, captures, política) — res que depengui de reescriure l'app.
