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


const NormaSchema = new mongoose.Schema({
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

const GrupSchema = new mongoose.Schema({
    grupId: {
        type: String,
        unique: true
    },
    nom: {
        type: String
    },
    normes: {
        type: [NormaSchema]
    },
    status: {
        type: String // Blocked, RuleFree, RuleOn
    }
});

const AlumneSchema = new mongoose.Schema({
    alumneId: {
        type: String,
        unique: true
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
    normes: {
        type: [NormaSchema]
    },
});


const HistorialSchema = new mongoose.Schema({
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
    alumneid: {
        type: String
    }
});
const Alumne = mongoose.model('Alumne', AlumneSchema);
const Grup = mongoose.model('Grup', GrupSchema);
const Norma = mongoose.model('Norma', NormaSchema);
const Historial = mongoose.model('Historial', HistorialSchema);

// Fes ids unics
AlumneSchema.index({alumneId: 1}, {unique: true});
GrupSchema.index({grupId: 1}, {unique: true});

module.exports = {
    Norma,
    Alumne,
    Grup,
    Historial
}