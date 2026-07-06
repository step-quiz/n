# Step Quiz — ClassKit: qualificació nativa cap al professor

Aquest document explica com integrar la **recollida nativa de qualificacions** via
**ClassKit + Schoolwork**, i com conviu amb el flux existent de "copiar codi".

---

## Per què això importa (privadesa i App Store)

El flux original —l'alumne copia un codi i l'enganxa a un Google Form— recull dades
acadèmiques d'un menor per un canal extern. A Apple això li pot generar friccions
(privadesa de menors + mecanisme "opac" tipus 4.2).

**ClassKit** és la resposta oficial d'Apple: l'app publica cada exercici com a activitat,
i quan un alumne el completa, la **nota es reporta xifrada per iCloud** directament al
**professor de l'alumne** dins la mateixa organització d'**Apple School Manager**, a través
de l'app **Schoolwork**. Cap servidor nostre, cap tercer, cap Google Form.

> ClassKit només comparteix el progrés d'activitats que el professor ha **assignat** en un
> handout, i només amb el **professor de l'alumne**. És exactament l'aïllament que volem:
> "només els professors del centre on l'alumne està donat d'alta".

---

## Arquitectura: cascada (natiu → codi)

L'app no assumeix mai que ClassKit hi és. Fa una **cascada**:

```
En completar un exercici:
  ├─ Hi ha ClassKit operatiu? (centre amb Apple School Manager)
  │     └─ SÍ  → reporta la nota nativament (Schoolwork). Bàner "Nota enviada". Cap codi.
  │     └─ NO  → mostra el flux existent: copiar / compartir el codi de verificació.
```

Això cobreix el teu escenari de "barreja dels dos entorns": funciona igual de bé en un
centre amb iPads gestionats que en un iPad personal.

La lògica viu a `vendor/native/native-bridge.js` (`reportGrade()`), i `js/game-core.js`
la crida en generar la nota. Tot amb degradació: al navegador o sense ClassKit, `reportGrade`
retorna `false` i el codi de verificació segueix funcionant com sempre.

---

## Requisits (importants)

- ClassKit **només és operatiu** amb **Apple School Manager** i **Managed Apple IDs**.
- **No funciona al simulador** — cal un **iPad real**.
- L'app **Schoolwork** és només per a iPad i requereix compte escolar.
- iOS 11.4+.

En dispositius sense aquest entorn, la nota nativa no s'envia (i l'app cau al codi). Això
és correcte i esperat.

---

## Passos d'integració a Xcode

Els fitxers Swift ja són al repositori, a `ios-plugins/ClassKitReporter/`:
- `ClassKitReporter.swift` — lògica de ClassKit (publicar activitat + reportar nota).
- `ClassKitReporterPlugin.swift` — pont Capacitor ↔ JavaScript.

### 1. Afegir la capability ClassKit
A Xcode: target **App → Signing & Capabilities → + Capability → ClassKit**.
(Cal que el teu compte de developer tingui ClassKit habilitat.)

### 2. Copiar els fitxers Swift al projecte iOS
Després de `npx cap add ios`:
1. A Xcode, sota el grup **App**, crea un grup `plugins/ClassKitReporter`.
2. Arrossega-hi `ClassKitReporter.swift` i `ClassKitReporterPlugin.swift`
   (des de `ios-plugins/ClassKitReporter/`), marcant "Copy items if needed".

### 3. Registrar el plugin
Obre (o crea) `ios/App/App/AppDelegate.swift` o el teu `CAPBridgeViewController` i
registra el plugin:

```swift
import Capacitor

class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(ClassKitReporterPlugin())
    }
}
```

Si uses el `CAPBridgeViewController` per defecte, pots crear aquesta subclasse i indicar-la
al `Main.storyboard` com a classe del view controller.

### 4. Entitlement d'entorn (proves)
Per provar amb el mode desenvolupador de ClassKit, posa l'entitlement
`com.apple.developer.classkit-environment` a `development`. **Torna'l a `production`**
abans d'enviar a l'App Store.

### 5. Provar (cal iPad real)
1. Al iPad: **Configuració → Desenvolupador → ClassKit API** → selecciona rol **Teacher**.
2. Obre **Schoolwork**, crea un handout amb una activitat de Step Quiz.
3. Canvia a rol **Student**, completa l'exercici.
4. Torna a **Teacher** i comprova que hi surt la nota.

---

## Com queda el codi web (referència)

`native-bridge.js` exposa:
- `classkitAvailable()` → `Promise<bool>`: si ClassKit és operatiu aquí.
- `reportGrade(identifier, title, score01)` → `Promise<'classkit' | false>`:
  reporta la nota (0.0–1.0). `'classkit'` = enviada nativament; `false` = cal el codi.

`game-core.js` crida `reportGrade(exCode, exName, nota/10)` en generar la nota i emet
l'esdeveniment `stepquiz:grade-reported` perquè la pantalla final mostri el bàner
"Nota enviada al professor/a" quan l'enviament natiu té èxit.

---

## Nota per a la revisió d'Apple

A les notes del revisor, val la pena esmentar-ho explícitament:

> Grades are reported natively via **ClassKit** to the student's teacher through
> **Schoolwork** (Apple School Manager environments), encrypted via iCloud. When ClassKit
> is unavailable (personal iPads), the app falls back to a local verification code the
> student can share. No student data is ever sent to our servers or any third party.

Això converteix el que abans era un punt feble (recollida "estranya" de dades) en un
**punt fort**: fas servir la infraestructura educativa oficial d'Apple.
