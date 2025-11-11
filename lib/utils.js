'use strict';

/**
 * Kompatible utils.js für moderne ioBroker-Controller (>=5) und Node >=18.
 * - Ersetzt den alten Verweis auf "iobroker.js-controller/lib/adapter.js"
 *   durch @iobroker/adapter-core
 * - Stellt Legacy-Exports bereit:
 *   - exports.adapter  => Adapter-Klasse (für "new utils.Adapter('milight')")
 *   - exports.Adapter  => Adapter-Klasse (neue Schreibweise "new utils.Adapter({ name: 'milight' })")
 *   - exports.getConfig()  => liest iobroker.json (best effort)
 *   - exports.controllerDir => leerer Shim (Legacy)
 *   - exports.appName       => 'milight' (Legacy)
 */

const adapterCore = require('@iobroker/adapter-core');
const fs = require('fs');
const path = require('path');

/**
 * Best-effort Leser für iobroker.json.
 * Moderne Adapter benötigen dies nicht mehr; bleibt für Altcode als Fallback.
 */
function getConfig() {
  const candidates = [
    process.env.IOBROKER_CONFIG_PATH,
    path.join(process.env.IOBROKER_DATA_DIR || '/opt/iobroker/iobroker-data', 'iobroker.json'),
    path.join(process.cwd(), 'iobroker-data', 'iobroker.json')
  ].filter(Boolean);

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const txt = fs.readFileSync(p, 'utf8');
        return JSON.parse(txt);
      }
    } catch {
      // ignorieren und nächsten Kandidaten testen
    }
  }

  // Fallback: leere Konfiguration
  return {};
}

// Objekt exportieren, das adapter-core "durchreicht" und Legacy-Felder ergänzt
module.exports = Object.assign({}, adapterCore, {
  // Legacy: viele alte Adapter erwarten utils.adapter als Klasse/Funktion
  adapter: adapterCore.Adapter,
  Adapter: adapterCore.Adapter,

  // Legacy-Shims
  getConfig,
  controllerDir: '',      // nicht mehr benötigt, leer lassen
  appName: 'milight'      // zur Sicherheit setzen
});
