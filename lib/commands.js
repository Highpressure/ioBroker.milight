module.exports = {
    state: {
        common: {
            type: 'boolean',
            role: 'switch.light',
            name: 'Switch ON/OFF',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    on: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'ON',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    off: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'OFF',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    whiteMode: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'White mode',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    nightMode: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Night mode',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    colorMode: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Color mode',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    brightnessUp: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Brightness up',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    brightnessDown: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Brightness down',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    brightness: {
        common: {
            type: 'number',
            role: 'level.dimmer',
            name: 'Brightness',
            min: 0,
            max: 100,
            unit: '%',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    colorUp: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Color up',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    colorDown: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Color down',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    color: {
        common: {
            type: 'number',
            role: 'level.color',
            name: 'Color',
            min: 0,
            max: 255,
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    rgb: {
        common: {
            type: 'string',
            role: 'level.color.rgb',
            name: 'Color RGB',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    mode: {
        common: {
            type: 'number',
            role: 'value',
            name: 'Mode',
            min: 0,
            max: 9,
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    modeSpeedUp: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Mode speed up',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    modeSpeedDown: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Mode speed down',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    effectModeNext: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Next effect mode',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    effectModePrev: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Previous effect mode',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    saturationUp: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Saturation up',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    saturationDown: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Saturation down',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    saturation: {
        common: {
            type: 'number',
            role: 'level.saturation',
            name: 'Saturation',
            min: 0,
            max: 100,
            unit: '%',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    colorTempUp: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Color temperature up',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    colorTempDown: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Color temperature down',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    colorTemp: {
        common: {
            type: 'number',
            role: 'level.color.temperature',
            name: 'Color temperature',
            min: 0,
            max: 100,
            unit: '%',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    hue: {
        common: {
            type: 'number',
            role: 'level.color.hue',
            name: 'Color HUE',
            min: 0,
            max: 360,
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    speedUp: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Speed up',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    speedDown: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Speed down',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    effectSpeedUp: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Effect speed up',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    effectSpeedDown: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Effect speed down',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    maxBright: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Maximum Brightness',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    allOn: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'All ON',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    allOff: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'All OFF',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    warmer: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Warmer',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    cooler: {
        common: {
            type: 'boolean',
            role: 'button',
            name: 'Cooler',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    },
    brightness2: {
        common: {
            type: 'number',
            role: 'level.dimmer',
            min: 0,
            max: 100,
            unit: '%',
            name: 'Extended level with 22 steps',
            write: true,
            read: false
        },
        native: {
        },
        type: 'state'
    }
};
