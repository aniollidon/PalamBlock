const db = require("../database/db");

const severity_rank = {
    "allow": 0,
    "warn": 1,
    "block": 2
}

function conteAlguna(text, paraules) {
    return paraules.some(paraula => text.includes(paraula));
}

function compare_severity(severity1, severity2) {
    const severity = Math.max(severity_rank[severity1], severity_rank[severity2]);
    return Object.keys(severity_rank).find(key => severity_rank[key] === severity);
}

class Validacio {
    constructor(alumneid) {
        this.alumneid = alumneid;
    }
    async checkWeb(host, protocol, search, pathname, title) {
        const alumne = await db.Alumne.findOne({alumneId: this.alumneid})
            .populate('grup')
            .populate('normesWeb');

        if(!alumne) {
            //logger.info("L'alumne no existeix: alumne=" + this.alumneid);
            return "allow";
        }

        if(alumne.status === "RuleFree")
            return "allow";
        else if(alumne.status === "Blocked")
            return "block";

        const grup = await db.Grup.findOne({grupId: alumne.grup})

        if(!grup){
            //logger.info("L'alumne no té grup assignat: alumne=" + this.alumneid);
            return "allow";
        }

        if(grup.status === "RuleFree")
            return "allow";
        else if(grup.status === "Blocked")
            return "block";

        // Busca les normesWeb del grup
        const normesgrup = await db.NormaWeb.find({_id: {$in: grup.normesWeb}});
        // Busca les normesWeb de l'alumne
        const normesalumne = await db.NormaWeb.find({_id: {$in: alumne.normesWeb}});

        const normesWeb = normesgrup.concat(normesalumne);
        const dataActual = new Date();
        const datetime_ara = dataActual.getTime();
        const dia_avui = dataActual.toLocaleDateString('ca-ES',  { weekday: 'long' });
        let action = "allow";

        for(const norma of normesWeb) {

            // Troba si una norma està activa
            const normaNotEnabled = norma.enabled_on.find((enabled) => {
                const duration = enabled.duration;

                for(const datetime of duration.datetimes) {
                    if(datetime_ara < datetime.getTime())  // No ha arribat l'hora
                        return true;
                    else if(duration === 0 && datetime_ara > datetime.getTime() + duration * 60000) // Ha passat l'hora
                        return true;
                }

                const todayactive = enabled.days.includes(dia_avui);
                return !todayactive;
            });

            if(normaNotEnabled)
                continue;

            const matchHost = conteAlguna(host, norma.hosts_list);
            const matchProtocol = conteAlguna(protocol, norma.protocols_list);
            const matchSearch = conteAlguna(search, norma.searches_list);
            const matchPathname = conteAlguna(pathname, norma.pathnames_list);
            const matchTitle = conteAlguna(title, norma.titles_list);

            const match = (matchHost || norma.hosts_list.length === 0)
                && (matchProtocol || norma.protocols_list.length === 0)
                && (matchSearch || norma.searches_list.length === 0)
                && (matchPathname || norma.pathnames_list.length === 0)
                && (matchTitle || norma.titles_list.length === 0);

            const mode = norma.mode;

            let current_action = "allow";

            if(mode === "whitelist")
                current_action = match ? "allow" : norma.severity;
            else if(mode === "blacklist")
                current_action = match ? norma.severity: "allow";

            action = compare_severity(action, current_action);
        }

        return action;
    }

    allApps(apps, status){
        const return_status = {};
        for (const app of apps) {
            return_status[app.pid] = status;
        }
        return return_status;
    }
    async checkApps(apps) {
        const alumne = await db.Alumne.findOne({alumneId: this.alumneid})
            .populate('grup')
            .populate('normesApp');

        if(!alumne) {
            //logger.info("L'alumne no existeix: alumne=" + this.alumneid);
            return {};
        }

        if(alumne.status === "RuleFree")
            return {};
        else if(alumne.status === "Blocked")
            return this.allApps(apps, "close");

        const grup = await db.Grup.findOne({grupId: alumne.grup})

        if(!grup){
            //logger.info("L'alumne no té grup assignat: alumne=" + this.alumneid);
            return {};
        }

        if(grup.status === "RuleFree")
            return {};
        else if(grup.status === "Blocked")
            return  this.allApps(apps, "close");

        // Busca les normesApp del grup
        const normesgrup = await db.NormaApp.find({_id: {$in: grup.normesApp}});
        // Busca les normesApp de l'alumne
        const normesalumne = await db.NormaApp.find({_id: {$in: alumne.normesApp}});
        const normesApp = normesgrup.concat(normesalumne);

        let statusForApps = {};
        for (const app of apps) {
            const name = app.name;
            const path = app.path;
            statusForApps[app.name] = "allow";

            for (const norma of normesApp) {
                if(norma.processName === name || path && norma.processPath === path) {
                    statusForApps[app.name] = norma.severity;
                }
                else if (path && norma.processPathisRegex) {
                    const regex = new RegExp(norma.processPath);
                    if (regex.test(path)) {
                        statusForApps[app.name] = norma.severity;
                    }
                }
            }
        }

        return statusForApps;
    }
}




module.exports = {
    Validacio
}
