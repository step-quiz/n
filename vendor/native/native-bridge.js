/**
 * native-bridge.js — Capa d'integració nativa per a Step Quiz (Capacitor)
 * ---------------------------------------------------------------------------
 * Aquest fitxer afegeix capacitats NATIVES reals a la webapp quan s'executa
 * dins el contenidor Capacitor (iOS). En un navegador normal es degrada
 * amb elegància (fallbacks web), de manera que el mateix codi funciona a tot arreu.
 *
 * Capacitats natives que aporta (clau per superar la Guideline 4.2 d'Apple):
 *   1. Share natiu     → compartir el codi de verificació amb el full d'iOS.
 *   2. Preferences     → desar el progrés/historial de l'alumne al dispositiu.
 *   3. Haptics         → feedback tàctil en encerts i errors.
 *   4. LocalNotifications → recordatoris de pràctica programats.
 *   5. Filesystem      → exportar resultats (informes) a fitxers locals.
 *   6. StatusBar/Splash → experiència d'app pròpia.
 *
 * Ús: incloure aquest script (type="module") a les pàgines. Exposa
 * `window.StepQuizNative` amb mètodes async segurs.
 *
 * IMPORTANT: no requereix connexió a internet. Tot funciona offline.
 */

(function () {
  'use strict';

  // Detecció de plataforma nativa (Capacitor injecta window.Capacitor)
  const Cap = window.Capacitor || null;
  const isNative = !!(Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform());

  // Accés als plugins (només existeixen dins el contenidor natiu)
  function plugin(name) {
    return (Cap && Cap.Plugins && Cap.Plugins[name]) ? Cap.Plugins[name] : null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1. HAPTICS — feedback tàctil
  // ─────────────────────────────────────────────────────────────────────────
  async function hapticSuccess() {
    const H = plugin('Haptics');
    if (H) { try { await H.notification({ type: 'SUCCESS' }); return; } catch (e) {} }
    if (navigator.vibrate) navigator.vibrate(30);
  }
  async function hapticError() {
    const H = plugin('Haptics');
    if (H) { try { await H.notification({ type: 'ERROR' }); return; } catch (e) {} }
    if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
  }
  async function hapticTap() {
    const H = plugin('Haptics');
    if (H) { try { await H.impact({ style: 'LIGHT' }); return; } catch (e) {} }
    if (navigator.vibrate) navigator.vibrate(10);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. SHARE — compartir el codi de verificació via full natiu d'iOS
  // ─────────────────────────────────────────────────────────────────────────
  async function shareCode(code, exerciseName) {
    const title = 'Codi de verificació Step Quiz';
    const text = exerciseName
      ? `Exercici: ${exerciseName}\nCodi: ${code}`
      : `Codi Step Quiz: ${code}`;
    const S = plugin('Share');
    if (S) {
      try { await S.share({ title, text, dialogTitle: 'Envia el codi al professor/a' }); return true; }
      catch (e) { /* usuari cancel·la o error → fallback */ }
    }
    // Fallback web: Web Share API si existeix, si no clipboard
    if (navigator.share) {
      try { await navigator.share({ title, text }); return true; } catch (e) {}
    }
    if (navigator.clipboard) {
      try { await navigator.clipboard.writeText(code); return 'clipboard'; } catch (e) {}
    }
    return false;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2b. CLASSKIT — reportar la qualificació de manera nativa al professor
  //     (Apple School Manager + Schoolwork). Camí preferent; si no hi és,
  //     el codi que crida aquesta funció ha de caure al flux "copiar codi".
  // ─────────────────────────────────────────────────────────────────────────
  const _classkitState = { checked: false, available: false, published: {} };

  /** Comprova (una sola vegada, amb memòria) si ClassKit és operatiu aquí. */
  async function classkitAvailable() {
    if (_classkitState.checked) return _classkitState.available;
    _classkitState.checked = true;
    const CK = plugin('ClassKitReporter');
    if (!CK) { _classkitState.available = false; return false; }
    try {
      const r = await CK.isAvailable();
      _classkitState.available = !!(r && r.available);
    } catch (e) {
      _classkitState.available = false;
    }
    return _classkitState.available;
  }

  /**
   * Reporta la nota d'un exercici. Retorna:
   *   'classkit'  → s'ha reportat de manera nativa (èxit, cap còpia necessària)
   *   false       → ClassKit no disponible o ha fallat → el cridant ha de
   *                 mostrar el flux de "copiar/compartir codi" com a alternativa.
   * @param identifier  id estable de l'exercici (p.ex. 'enters')
   * @param title       títol llegible (p.ex. 'Nombres enters')
   * @param score01     nota normalitzada 0.0–1.0
   */
  async function reportGrade(identifier, title, score01) {
    if (!(await classkitAvailable())) return false;
    const CK = plugin('ClassKitReporter');
    try {
      // Publica el context de l'exercici un sol cop per sessió.
      if (!_classkitState.published[identifier]) {
        const p = await CK.publishActivity({ identifier, title });
        if (p && p.ok) _classkitState.published[identifier] = true;
        else return false;
      }
      const r = await CK.reportScore({ identifier, score: score01 });
      return (r && r.ok) ? 'classkit' : false;
    } catch (e) {
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. PREFERENCES — persistència nativa del progrés
  // ─────────────────────────────────────────────────────────────────────────
  async function saveProgress(key, value) {
    const P = plugin('Preferences');
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    if (P) { try { await P.set({ key, value: str }); return true; } catch (e) {} }
    // Fallback web: NO usem localStorage dins artefactes, però en un navegador
    // real (fora d'App Store) sí és vàlid. Protegit amb try.
    try { window.localStorage.setItem('sq_' + key, str); return true; } catch (e) { return false; }
  }
  async function loadProgress(key) {
    const P = plugin('Preferences');
    if (P) {
      try { const r = await P.get({ key }); return r && r.value ? r.value : null; } catch (e) {}
    }
    try { return window.localStorage.getItem('sq_' + key); } catch (e) { return null; }
  }

  /** Afegeix un codi a l'historial persistent de l'alumne (últims 50). */
  async function appendHistory(entry) {
    const raw = await loadProgress('history');
    let list = [];
    if (raw) { try { list = JSON.parse(raw); } catch (e) { list = []; } }
    list.unshift(Object.assign({ ts: Date.now() }, entry));
    if (list.length > 50) list = list.slice(0, 50);
    await saveProgress('history', list);
    return list;
  }
  async function getHistory() {
    const raw = await loadProgress('history');
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (e) { return []; }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. LOCAL NOTIFICATIONS — recordatoris de pràctica
  // ─────────────────────────────────────────────────────────────────────────
  async function requestNotificationPermission() {
    const N = plugin('LocalNotifications');
    if (!N) return false;
    try {
      const perm = await N.requestPermissions();
      return perm && (perm.display === 'granted');
    } catch (e) { return false; }
  }

  /** Programa un recordatori diari a l'hora indicada (hora local). */
  async function schedulePracticeReminder(hour = 18, minute = 0) {
    const N = plugin('LocalNotifications');
    if (!N) return false;
    try {
      await N.schedule({
        notifications: [{
          id: 1001,
          title: 'Step Quiz',
          body: 'És un bon moment per practicar matemàtiques! 📐',
          schedule: { on: { hour, minute }, allowWhileIdle: true, repeats: true }
        }]
      });
      return true;
    } catch (e) { return false; }
  }
  async function cancelPracticeReminder() {
    const N = plugin('LocalNotifications');
    if (!N) return false;
    try { await N.cancel({ notifications: [{ id: 1001 }] }); return true; } catch (e) { return false; }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. FILESYSTEM — exportar un informe de text/CSV localment
  // ─────────────────────────────────────────────────────────────────────────
  async function exportReport(filename, contents) {
    const FS = plugin('Filesystem');
    if (FS) {
      try {
        const res = await FS.writeFile({
          path: filename,
          data: contents,
          directory: 'DOCUMENTS',
          encoding: 'utf8'
        });
        return res && res.uri ? res.uri : true;
      } catch (e) { /* fallback */ }
    }
    // Fallback web: descàrrega via Blob
    try {
      const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (e) { return false; }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. BROWSER — obrir enllaços externs de manera segura (Safari View Controller)
  // ─────────────────────────────────────────────────────────────────────────
  async function openExternal(url) {
    const B = plugin('Browser');
    if (B) { try { await B.open({ url }); return true; } catch (e) {} }
    try { window.open(url, '_blank', 'noopener'); return true; } catch (e) { return false; }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Inicialització d'aparença (status bar, amagar splash)
  // ─────────────────────────────────────────────────────────────────────────
  async function initAppearance() {
    if (!isNative) return;
    const SB = plugin('StatusBar');
    if (SB) { try { await SB.setStyle({ style: 'LIGHT' }); } catch (e) {} }
    const SP = plugin('SplashScreen');
    if (SP) { try { await SP.hide(); } catch (e) {} }
  }

  // API pública
  window.StepQuizNative = {
    isNative,
    hapticSuccess, hapticError, hapticTap,
    shareCode,
    classkitAvailable, reportGrade,
    saveProgress, loadProgress, appendHistory, getHistory,
    requestNotificationPermission, schedulePracticeReminder, cancelPracticeReminder,
    exportReport,
    openExternal,
    initAppearance
  };

  // Auto-init quan el DOM està llest
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppearance);
  } else {
    initAppearance();
  }
})();
