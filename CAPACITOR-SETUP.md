# Step Quiz — Setup Capacitor per a iOS / App Store

Aquest projecte ja està **preparat tècnicament** per empaquetar-se com a app iOS nativa.
Aquesta guia recull els passos que **has d'executar tu en un Mac** (no es poden fer aquí)
per generar el build i pujar-lo a l'App Store.

---

## Què ja s'ha fet en aquest repositori

✅ **Offline complet** — Totes les dependències externes (KaTeX, ExcelJS, xlsx, JSZip,
pdf.js i totes les Google Fonts) s'han descarregat a `vendor/` i les referències dels
65 fitxers HTML s'han reescrit a rutes locals. L'app funciona **sense connexió**.

✅ **Capa nativa** — `vendor/native/native-bridge.js` afegeix capacitats natives reals
(compartir, haptics, persistència, notificacions, exportació de fitxers) i està integrada
al motor de joc (`js/game-core.js`). Es degrada amb elegància en un navegador normal.

✅ **Meta iOS** — `viewport-fit=cover`, tags `apple-mobile-web-app-*` i `theme-color`
afegits a totes les pàgines. Safe areas (notch / illa dinàmica) gestionades a `css/shared.css`.

✅ **Configuració Capacitor** — `package.json`, `capacitor.config.json` i
`ios-config/Info.plist.additions.xml` a punt.

---

## Prerequisits al Mac

- macOS recent + **Xcode** (des de l'App Store) + Command Line Tools.
- **Node.js** LTS (inclou `npm` i `npx`).
- **CocoaPods**: `sudo gem install cocoapods`.
- Compte al **Apple Developer Program** (99 USD/any).

---

## Passos

### 1. Instal·lar dependències

```bash
cd operacions-main
npm install
```

### 2. Afegir la plataforma iOS

```bash
npx cap add ios
```

Això crea la carpeta `ios/` amb el projecte Xcode natiu.

### 3. Sincronitzar els assets web al projecte natiu

```bash
npx cap sync ios
```

> Repeteix aquesta ordre **cada cop** que modifiquis HTML/CSS/JS.

### 4. Configurar l'Info.plist

Obre `ios/App/App/Info.plist` a Xcode i afegeix-hi les claus de
`ios-config/Info.plist.additions.xml` (només les que apliquin — vegeu comentaris).

### 5. Obrir a Xcode

```bash
npx cap open ios
```

A Xcode:
1. **Signing & Capabilities** → activa "Automatically manage signing" i tria el teu Team.
2. Comprova el **Bundle Identifier**: `net.stepquiz.app` (ha de coincidir amb App Store Connect).
3. Afegeix la capability **Push/Local Notifications** si vols recordatoris.
4. Configura la **App Icon** (App Icon set 1024px) i el **Launch Screen**.

### 6. Provar en simulador i dispositiu

- Executa al **simulador** i, molt important, **en mode avió** per confirmar que tot
  funciona offline (prova diversos exercicis, KaTeX, teclat, codi de verificació).
- Prova en un **iPhone real** connectat.

### 7. Archive i pujada

1. A Xcode: destí **"Any iOS Device (arm64)"**.
2. **Product → Archive**.
3. A l'Organizer: **Distribute App → App Store Connect → Upload**.
4. (Recomanat) Distribueix primer per **TestFlight** abans de la revisió.

---

## Icones i splash (opcional però recomanat)

Amb el paquet oficial:

```bash
npm install --save-dev @capacitor/assets
# Posa un icon.png (1024x1024) i un splash.png (2732x2732) a assets/
npx capacitor-assets generate --ios
```

Ja disposes d'`icon.png` d'alta resolució al projecte com a base.

---

## Notes importants per a la revisió d'Apple

- **Guideline 4.2**: la capa nativa (`native-bridge.js`) és el que evita el rebuig per
  "simple wrapper d'un web". A les notes del revisor, destaca: funciona offline + share
  natiu del codi + persistència local + notificacions + haptics.
- **Privadesa (5.1.1)**: l'app no recull dades personals ni les envia enlloc. Declara
  "Data Not Collected" al nutrition label i publica una política de privadesa.
- **Menors**: valora la categoria Educació i, si vols, Kids Category (requereix eliminar
  qualsevol enllaç extern sense gate parental).

Consulta `GUIA-PUBLICACIO-APPSTORE.md` per al detall complet del procés.
