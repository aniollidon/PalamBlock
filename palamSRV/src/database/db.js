const mongoose = require('mongoose');

const DateTimeEnabledSchema = new mongoose.Schema({
    datetimes: {
        type: [Date] // if empty, all days are enabled
    },
    days: {
        type: [String] // if empty, all days are enabled
    },
    duration: {
        type: Number // in minutes (0 means no limit)
    }
});


const NormaWebSchema = new mongoose.Schema({
    severity: {
        type: String // warn, block
    },
    mode:{
        type: String // whitelist (only accepted), blacklist
    },
    hosts_list: {
        type: [String]
    },
    protocols_list: {
        type: [String]
    },
    searches_list: {
        type: [String]
    },
    pathnames_list: {
        type: [String]
    },
    titles_list: {
        type: [String]
    },
    enabled_on: {
        type: [DateTimeEnabledSchema] // if empty, always enabled
    }
});

const NormaAppSchema = new mongoose.Schema({
    appId: {
        type: String,
        unique: true
    },
    severity: {
        type: String // block, allow, uninstall
    }
});

const GrupSchema = new mongoose.Schema({
    grupId: {
        type: String,
        unique: true
    },
    nom: {
        type: String
    },
    normesWeb: {
        type: [NormaWebSchema]
    },
    status: {
        type: String // Blocked, RuleFree, RuleOn
    }
});

const AlumneSchema = new mongoose.Schema({
    alumneId: {
        type: String,
        unique: true,
        required: true
    },
    clauEncriptada: {
        type: String,
        required: true
    },
    nom: {
        type: String
    },
    cognoms: {
        type: String
    },
    grup: {
        type: String
    },
    status: {
        type: String // Blocked, RuleFree, RuleOn
    },
    normesWeb: {
        type: [NormaWebSchema]
    },
});


const HistorialWebSchema = new mongoose.Schema({
    timestamp: {
        type: Date
    },
    host: {
        type: String
    },
    protocol: {
        type: String
    },
    search: {
        type: String
    },
    pathname: {
        type: String
    },
    title: {
        type: String
    },
    browser: {
        type: String
    },
    tabId: {
        type: String
    },
    incognito: {
        type: Boolean
    },
    favicon: {
        type: String
    },
    alumneid: {
        type: String
    }
});

const HistorialAppsSchema = new mongoose.Schema({
    timestamp: {
        type: Date
    },
    processName: {
        type: String
    },
    processPath: {
        type: String
    },
    caption: {
        type: String
    },
    iconB64: {
        type: String
    },
    alumneid: {
        type: String
    }
});
const Alumne = mongoose.model('Alumne', AlumneSchema);
const Grup = mongoose.model('Grup', GrupSchema);
const NormaWeb = mongoose.model('NormaWeb', NormaWebSchema);
const NormaApp = mongoose.model('NormaApp', NormaAppSchema);
const HistorialWeb = mongoose.model('HistorialWeb', HistorialWebSchema);
const HistorialApps = mongoose.model('HistorialApps', HistorialAppsSchema);


// Fes ids unics
AlumneSchema.index({alumneId: 1}, {unique: true});
GrupSchema.index({grupId: 1}, {unique: true});

module.exports = {
    NormaWeb,
    NormaApp,
    Alumne,
    Grup,
    HistorialWeb,
    HistorialApps,
}