/* jshint -W097 */// jshint strict:false
/*jslint node: true */
'use strict';

const utils         = require(__dirname + '/lib/utils'); // Adapter-Core Wrapper
const stateCommands = require(__dirname + '/lib/commands');

let light   = null;
let zones   = [];
let commands;

const nameStates = {
    v6 : {
        basic:  ['state','on','off','whiteMode','brightnessUp','brightnessDown','brightness','colorUp','colorDown','color','rgb','mode'],
        White:  ['state','on','off','maxBright','brightnessUp','nightMode','brightnessDown','warmer','cooler'],
        RGBO:   ['state','on','off','brightnessUp','brightnessDown','colorUp','colorDown','color','rgb','modeSpeedUp','modeSpeedDown','effectModeNext','effectModePrev'],
        RGBW:   ['state','on','off','colorMode','whiteMode','nightMode','brightnessUp','brightnessDown','brightness','colorUp','colorDown','color','rgb','hue','mode','modeSpeedUp','modeSpeedDown','link','unlink'],
        RGBWW:  ['state','on','off','colorMode','whiteMode','nightMode','brightnessUp','brightnessDown','brightness','colorUp','colorDown','color','rgb','hue','mode','modeSpeedUp','modeSpeedDown','link','unlink','saturationUp','saturationDown','saturation','colorTempUp','colorTempDown','colorTemp']
    },
    v5 : {
        basic:  ['state','on','off','hue','rgb','whiteMode','brightness','brightness2','effectModeNext','effectSpeedUp','effectSpeedDown'],
        RGBO:   ['state','on','off','brightUp','brightDown','speedUp','speedDown','effectSpeedUp','effectSpeedDown'],
        White:  ['state','on','off','maxBright','brightUp','brightDown','warmer','cooler'],
        RGBW:   ['state','on','off','colorMode','hue','rgb','whiteMode','nightMode','brightness','brightness2','effectModeNext','effectSpeedUp','effectSpeedDown']
    }
};

function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h, s, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
        h = 0;
    } else {
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
            case g: h = ((b - r) / d + 2); break;
            case b: h = ((r - g) / d + 4); break;
        }
        h = Math.round(h * 60);
        s = Math.round(s * 100);
        v = Math.round(v * 100);
    }
    return [h, s, v];
}

function hsvToRgb(h, s, v) {
    // H:0..360, S/V:0..100
    let r, g, b;
    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(100, s)) / 100;
    v = Math.max(0, Math.min(100, v)) / 100;

    if (s === 0) {
        r = g = b = v;
    } else {
        h /= 60;
        const i = Math.floor(h);
        const f = h - i;
        const p = v * (1 - s);
        const q = v * (1 - s * f);
        const t = v * (1 - s * (1 - f));
        switch (i) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            default: r = v; g = p; b = q;
        }
    }
    const hex = Math.round(b * 255) | (Math.round(g * 255) << 8) | (Math.round(r * 255) << 16);
    return '#' + (0x1000000 + hex).toString(16).slice(1);
}

function pad2(n) { return ('0' + n.toString(16)).slice(-2); }

function splitColor(rgb) {
    if (!rgb) rgb = '#000000';
    if (Array.isArray(rgb)) return rgb.map(v => v|0).slice(0,3);
    if (typeof rgb === 'object') return [rgb.r|0, rgb.g|0, rgb.b|0];

    let s = String(rgb).toUpperCase();
    if (s[0] === '#') s = s.substring(1);
    if (s.length < 6) s = s[0]+s[0]+s[1]+s[1]+s[2]+s[2];
    const r = parseInt(s.substring(0,2), 16) || 0;
    const g = parseInt(s.substring(2,4), 16) || 0;
    const b = parseInt(s.substring(4,6), 16) || 0;
    return [r,g,b];
}

const adapter = new utils.Adapter({
    name: 'milight',
    unload: cb => {
        try {
            if (light) { light.close && light.close(); light = null; }
        } finally {
            if (typeof cb === 'function') cb();
        }
    }
});

adapter.on('message', obj => {
    let wait = false;
    if (obj) {
        switch (obj.command) {
            case 'browse': {
                const discoverBridges = require('node-milight-promise').discoverBridges;
                adapter.log.info('Discover bridges...');
                discoverBridges({ type: 'all' }).then(results => {
                    adapter.log.info('Discover bridges: ' + JSON.stringify(results));
                    if (obj.callback) adapter.sendTo(obj.from, obj.command, results, obj.callback);
                }).catch(err => {
                    adapter.log.error('Discover error: ' + err);
                    if (obj.callback) adapter.sendTo(obj.from, obj.command, { error: String(err) }, obj.callback);
                });
                wait = true;
                break;
            }
            default:
                adapter.log.warn('Unknown command: ' + obj.command);
        }
    }
    if (!wait && obj && obj.callback) adapter.sendTo(obj.from, obj.command, obj.message, obj.callback);
    return true;
});

function checkMethod(zoneObj, funcName) {
    if (zoneObj && typeof zoneObj === 'object' && typeof zoneObj[funcName] === 'function') return true;
    const keys = [];
    if (typeof zoneObj === 'object') {
        for (const name in zoneObj) {
            if (Object.prototype.hasOwnProperty.call(zoneObj, name) && typeof zoneObj[name] === 'function') keys.push(name);
        }
    }
    adapter.log.warn('Property "' + funcName + '" does not exist. Use one of: ' + keys.join(', '));
    return false;
}

adapter.on('stateChange', (id, state) => {
    if (!state || state.ack || !light) return;
    const tmp = id.split('.');
    let dp = tmp.pop();
    const strZone = tmp.slice(2).join('.'); // ZoneX
    let zone;
    switch (strZone) {
        case 'zone1': zone = 1; break;
        case 'zone2': zone = 2; break;
        case 'zone3': zone = 3; break;
        case 'zone4': zone = 4; break;
        case 'zoneAll':
        default:      zone = 0; break;
    }

    // Normalisierung der Datenpunkte
    if (dp === 'rgb')   dp = 'colorRGB';
    if (dp === 'color') dp = 'colorRGB'; // wichtig: kein Toggle, sondern tatsächliche Farbe

    if (adapter.config.version === '6') {
        // V6 (iBox): brightness → brightnessSet
        if (dp === 'brightness') dp = 'brightnessSet';
        if (!zones[zone]) { adapter.log.warn('V6 zone controller not initialized'); return; }

        if (dp === 'hue') {
            const colorhex = hsvToRgb(parseInt(state.val,10), 100, 100);
            const val = splitColor(colorhex);
            adapter.log.debug(`V6 Send zone ${zone} colorRGB via hue: ${JSON.stringify(val)} (${colorhex})`);
            zones[zone].command('colorRGB', val, err => {
                if (!err) adapter.setForeignState(id, state.val, true);
                else adapter.log.error('V6 Cannot control: ' + err);
            });
            return;
        }

        if (dp === 'colorMode') {
            // true => kurz in Farbraum "anstupsen", false => Weiß
            const toColor = (state.val === true || state.val === 'true' || state.val === 1 || state.val === 'on' || state.val === 'ON');
            if (toColor) {
                adapter.log.debug('V6 enter COLOR mode via tiny hue tick');
                zones[zone].command('colorDown', () => zones[zone].command('colorUp', err => {
                    if (!err) adapter.setForeignState(id, true, true);
                    else adapter.log.error('V6 Cannot control: ' + err);
                }));
            } else {
                adapter.log.debug('V6 whiteMode');
                zones[zone].command('whiteMode', err => {
                    if (!err) adapter.setForeignState(id, false, true);
                    else adapter.log.error('V6 Cannot control: ' + err);
                });
            }
            return;
        }

        if (dp === 'state') {
            const turnOn = (state.val === true || state.val === 'true' || state.val === 1 || state.val === 'on' || state.val === 'ON');
            zones[zone].command(turnOn ? 'on' : 'off', err => {
                if (!err) adapter.setForeignState(id, turnOn, true);
                else adapter.log.error('V6 Cannot control: ' + err);
            });
            return;
        }

        // generisch inkl. colorRGB/brightnessSet
        let val;
        if (dp === 'colorRGB') {
            if (Array.isArray(state.val)) val = state.val;
            else if (typeof state.val === 'object' && state.val) val = [state.val.r|0, state.val.g|0, state.val.b|0];
            else val = splitColor(String(state.val));
            adapter.log.debug(`V6 Send zone ${zone} "${dp}": ${JSON.stringify(val)}`);
        } else if (dp === 'brightnessSet') {
            val = Math.max(0, Math.min(100, Math.round(parseFloat(state.val))));
            adapter.log.debug(`V6 Send zone ${zone} "${dp}": ${val}`);
        } else {
            val = parseInt(state.val, 10);
            adapter.log.debug(`V6 Send zone ${zone} "${dp}": ${val}`);
        }

        if (!checkMethod(zones[zone], 'command')) return;
        zones[zone].command(dp, val, err => {
            if (!err) {
                adapter.setForeignState(id, state.val, true);
                if (dp === 'on' || dp === 'off') {
                    adapter.setForeignState(id, false, true);
                    adapter.setForeignState(id.replace('.'+dp, '.state'), dp === 'on', true);
                }
                if (dp === 'colorRGB' && Array.isArray(val)) {
                    const h = rgbToHsv(val[0], val[1], val[2]);
                    // optional: adapter.setForeignState(id.replace('.rgb','.hue'), h[0], true);
                }
            } else {
                adapter.log.error('V6 Cannot control: ' + err);
            }
        });
        return;
    }

    // ==== V5 (dein Setup) ====
    if (dp === 'state') {
        const turnOn = (state.val === true || state.val === 'true' || state.val === 1 || state.val === 'on' || state.val === 'ON');
        if (turnOn) {
            adapter.log.debug(`V5 zone ${zone} ON`);
            if (adapter.config.v5onFullBright === 'true' || adapter.config.v5onFullBright === true ||
                adapter.config.v5onFullBright === 'on'   || adapter.config.v5onFullBright === 'ON' ||
                adapter.config.v5onFullBright === 1) {
                if (!checkMethod(zones[zone], 'on') || !checkMethod(zones[zone], 'brightness')) return;
                light.sendCommands(zones[zone].on(zone), zones[zone].brightness(100), zones[zone].whiteMode(zone)).then(() => {
                    adapter.setForeignState(id, true, true);
                }, err => adapter.log.error('Cannot control: ' + err));
            } else {
                if (!checkMethod(zones[zone], 'on')) return;
                light.sendCommands(zones[zone].on(zone)).then(() => {
                    adapter.setForeignState(id, true, true);
                }, err => adapter.log.error('Cannot control: ' + err));
            }
        } else {
            adapter.log.debug(`V5 zone ${zone} OFF`);
            if (!checkMethod(zones[zone], 'off')) return;
            light.sendCommands(zones[zone].off(zone)).then(() => {
                adapter.setForeignState(id, false, true);
            }, err => adapter.log.error('Cannot control: ' + err));
        }
        return;
    }

    if (dp === 'brightness' || dp === 'brightness2') {
        let val = Math.round(parseFloat(state.val));
        val = Math.max(0, Math.min(100, val));
        adapter.log.debug(`V5 zone ${zone} brightness → ${val}`);
        if (val !== 0) {
            if (!checkMethod(zones[zone], 'on') || !checkMethod(zones[zone], dp)) return;
            light.sendCommands(zones[zone].on(zone), zones[zone][dp](val)).then(() => {
                adapter.setForeignState(id, state.val, true);
            }, err => adapter.log.error('Cannot control: ' + err));
        } else {
            if (!checkMethod(zones[zone], 'off')) return;
            light.sendCommands(zones[zone].off(zone)).then(() => {
                adapter.setForeignState(id, state.val, true);
            }, err => adapter.log.error('Cannot control: ' + err));
        }
        return;
    }

    if (dp === 'hue') {
        let val = parseInt(state.val, 10);
        val = Math.max(0, Math.min(255, val));
        adapter.log.debug(`V5 zone ${zone} hue → ${val}`);
        if (!checkMethod(zones[zone], 'on') || !checkMethod(zones[zone], 'hue')) return;
        light.sendCommands(zones[zone].on(zone), zones[zone].hue(val)).then(() => {
            adapter.setForeignState(id, val, true);
        }, err => adapter.log.error('Cannot control: ' + err));
        return;
    }

    if (dp === 'colorRGB') {
        let arr;
        if (Array.isArray(state.val)) arr = state.val;
        else if (typeof state.val === 'object' && state.val) arr = [state.val.r|0, state.val.g|0, state.val.b|0];
        else arr = splitColor(String(state.val));
        adapter.log.debug(`V5 zone ${zone} rgb255 → ${JSON.stringify(arr)}`);
        if (!checkMethod(zones[zone], 'on') || !checkMethod(zones[zone], 'rgb255')) return;
        light.sendCommands(zones[zone].on(zone), zones[zone].rgb255(arr)).then(() => {
            adapter.setForeignState(id, state.val, true);
        }, err => adapter.log.error('Cannot control: ' + err));
        return;
    }

    if (dp === 'on' || dp === 'off' || dp === 'nightMode' || dp === 'whiteMode' ||
        dp === 'maxBright' || dp === 'brightUp' || dp === 'brightDown' ||
        dp === 'speedUp' || dp === 'speedDown' || dp === 'effectSpeedUp' ||
        dp === 'effectSpeedDown' || dp === 'effectModeNext' || dp === 'cooler' || dp === 'warmer') {

        adapter.log.debug(`V5 zone ${zone} "${dp}"`);
        if (!checkMethod(zones[zone], 'on') || !checkMethod(zones[zone], dp)) return;
        const seq = (dp === 'on' || dp === 'off') ? [ zones[zone][dp](zone) ] : [ zones[zone].on(zone), zones[zone][dp]() ];
        light.sendCommands.apply(light, seq).then(() => {
            const ackVal = (dp === 'on') ? false : false; // Tasten rückstellen
            adapter.setForeignState(id, ackVal, true);
            if (dp === 'on')  adapter.setForeignState(id.replace('.on',  '.state'), true,  true);
            if (dp === 'off') adapter.setForeignState(id.replace('.off', '.state'), false, true);
        }, err => adapter.log.error('Cannot control: ' + err));
        return;
    }

    adapter.log.error('Unknown command: ' + dp);
});

adapter.on('ready', main);

function mergeObject(obj, cb) {
    adapter.getForeignObject(obj._id, (err, _obj) => {
        if (_obj) {
            let changed = false;
            for (const attr in obj) {
                if (!Object.prototype.hasOwnProperty.call(obj, attr)) continue;

                if (typeof obj[attr] === 'object') {
                    for (const _attr in obj[attr]) {
                        if (Object.prototype.hasOwnProperty.call(obj[attr], _attr) && (!_obj[attr] || _obj[attr][_attr] !== obj[attr][_attr])) {
                            _obj[attr] = _obj[attr] || {};
                            _obj[attr][_attr] = obj[attr][_attr];
                            changed = true;
                        }
                    }
                } else {
                    if (obj[attr] !== _obj[attr]) {
                        _obj[attr] = obj[attr]; // BUGFIX: richtige Zuweisung
                        changed = true;
                    }
                }
            }
            if (changed) {
                adapter.setForeignObject(obj._id, _obj, () => cb && cb());
            } else {
                cb && cb();
            }
        } else {
            adapter.setForeignObject(obj._id, obj, () => cb && cb());
        }
    });
}

function mergeObjects(objs, cb) {
    if (!objs || !objs.length) { if (typeof cb === 'function') cb(); return; }
    mergeObject(objs.shift(), () => setTimeout(mergeObjects, 0, objs, cb));
}

function main() {
    // Konfiguration
    adapter.config.commandRepeat        = parseInt(adapter.config.commandRepeat, 10) || 2;
    adapter.config.delayBetweenCommands = parseInt(adapter.config.delayBetweenCommands, 10) || 50;
    const port = parseInt(adapter.config.port, 10) || 5987;

    if (!adapter.config.ip) {
        adapter.log.warn('No IP address defined');
        return;
    }

    if (adapter.config.version === '6') {
        adapter.setState('info.connection', false, true);
        const Bridge = require(__dirname + '/lib/bridge.js');
        light = new Bridge({
            ip:                     adapter.config.ip,
            port:                   port,
            reconnectTimeout:       10000,
            disconnectTimeout:      10000,
            keepAliveTimeout:       10000,
            delayBetweenCommands:   adapter.config.delayBetweenCommands,
            commandRepeat:          adapter.config.commandRepeat,
            debug:                  true,
            log: {
                log:   text => adapter.log.debug(text),
                error: text => adapter.log.error(text)
            }
        });
        light.on('connected',    () => adapter.setState('info.connection', true,  true));
        light.on('disconnected', () => adapter.setState('info.connection', false, true));
        zones[0] = light.baseCtlFactory();

    } else {
        // === V5 (dein Setup) ===
        adapter.setState('info.connection', true, true);
        const Milight = require('node-milight-promise').MilightController;
        commands      = require('node-milight-promise').commands2; // v5
        light = new Milight({
            ip:    adapter.config.ip,
            port:  parseInt(adapter.config.port, 10) || 8899,
            delayBetweenCommands: parseInt(adapter.config.delayBetweenCommands, 10) || 200,
            commandRepeat:        parseInt(adapter.config.commandRepeat, 10) || 2
        });
        zones[0] = commands.rgbw; // ZoneAll = RGBW
    }

    // Objekte anlegen
    const objs = [];
    const nameStatesV = nameStates['v' + adapter.config.version];

    // ZoneAll*
    for (let n = 0; n < nameStatesV.basic.length; n++) {
        if (!stateCommands[nameStatesV.basic[n]]) { adapter.log.error('Unknown command: ' + nameStatesV.basic[n]); continue; }
        const _obj = JSON.parse(JSON.stringify(stateCommands[nameStatesV.basic[n]]));
        if (!_obj) { adapter.log.error('Unknown state: ' + nameStatesV.basic[n]); continue; }
        _obj.common.name = 'All Zones ' + _obj.common.name;
        _obj._id = adapter.namespace + '.zoneAll.' + nameStatesV.basic[n];
        objs.push(_obj);
    }

    // Zonen 1..4
    for (let z = 1; z <= 4; z++) {
        const type = adapter.config['zone' + z];   // bei dir: RGBW
        const names = nameStatesV[type];
        if (!names) continue;

        if (adapter.config.version === '6') {
            if (type === 'basic')      zones[z] = light.baseCtlFactory();
            else if (type === 'White') zones[z] = light.zoneCtlWhiteFactory(z);
            else if (type === 'RGBO')  zones[z] = light.zoneCtlRGBFactory(z);
            else if (type === 'RGBW')  zones[z] = light.zoneCtlRGBWFactory(z);
            else if (type === 'RGBWW') zones[z] = light.zoneCtlRGBWWFactory(z);
        } else {
            if (type === 'RGBO')       zones[z] = commands.rgb;
            else if (type === 'RGBW')  zones[z] = commands.rgbw;   // wichtig für dein Setup
            else if (type === 'RGBWW') zones[z] = commands.rgbww;
            else if (type === 'White') zones[z] = commands.white;
        }

        for (let s = 0; s < names.length; s++) {
            if (!stateCommands[names[s]]) { adapter.log.error('State ' + names[s] + ' unknown'); continue; }
            const obj = JSON.parse(JSON.stringify(stateCommands[names[s]]));
            if (!obj) { adapter.log.error('Unknown state: ' + names[s]); continue; }
            obj.common.name = 'Zone ' + z + ' ' + obj.common.name;
            obj._id = adapter.namespace + '.zone' + z + '.' + names[s];
            objs.push(obj);
        }
    }

    mergeObjects(objs, () => adapter.subscribeStates('*'));
}
