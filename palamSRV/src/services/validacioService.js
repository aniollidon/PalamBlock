const db = require("../database/db");
const {logger} = require("../logger");

const severity_rank = {
    "allow": 0,
    "warn": 1,
    "block": 2
}

function conteAlguna(text, paraules) {
    return paraules.some(paraula => text.includes(paraula));
}

function hhmmToMinutes(hhmm){
    const h = parseInt(hhmm.split(":")[0])
    const m = parseInt(hhmm.split(":")[1])
    return h*60 + m;
}

function compara(paraula, norma, ishost = false) {
    if (norma === undefined || norma === null || norma === "" || norma === "*")
        return true;

    // regex prepare
    norma = norma.replaceAll(".", "\\.");
    norma = norma.replaceAll("*", ".*");

    // add optional www.
    if (ishost) {
        if(!norma.startsWith("www."))
            norma = "^[w]{0,3}\\.{0,1}" + norma;
    }

    const regex = new RegExp(norma, "i");
    return regex.test(paraula);
}

function compare_severity(severity1, severity2) {
    const severity = Math.max(severity_rank[severity1], severity_rank[severity2]);
    return Object.keys(severity_rank).find(key => severity_rank[key] === severity);
}

class Validacio {
    constructor(alumneid) {
        this.alumneid = alumneid;
    }
    async checkWeb(webPage) {

        let tracelog = "";
        const alumne = await db.Alumne.findOne({alumneId: this.alumneid})
            .populate('grup')
            .populate('normes2Web');

        if(!alumne) {
            //logger.info("L'alumne no existeix: alumne=" + this.alumneid);
            return "allow";
        }

        if(alumne.status === "RuleFree")
            return "allow";
        else if(alumne.status === "Blocked")
            return "block";

        const grup = await db.Grup.findOne({grupId: alumne.grup}).populate('normes2Web');

        if(!grup){
            //logger.info("L'alumne no té grup assignat: alumne=" + this.alumneid);
            return "allow";
        }

        if(grup.status === "RuleFree")
            return "allow";
        else if(grup.status === "Blocked")
            return "block";

        // Busca les normesWeb del grup
        const normesWeb = [];
        for (const norma of grup.normes2Web) {
            normesWeb.push(norma);
        }
        for (const norma of alumne.normes2Web) {
            normesWeb.push(norma);
        }

        const dataActual = new Date();
        const datetime_ara = dataActual.getTime();
        const dia_avui = dataActual.toLocaleDateString('ca-ES',  { weekday: 'long' });
        let action = "allow";

        tracelog = "En " + this.alumneid + " del grup " + grup.grupId + ": " + webPage.join() + "\n";

        for(const norma of normesWeb) {

            // si la norma no està activa, no la comprovem
            if(!norma.alive) continue;

            // Si la norma té marques de temps mira si està activa
            if(norma.enabled_on && norma.enabled_on.length>0) {
                const norma_enabled =  norma.enabled_on.find((enabled) => {
                    const duration = enabled.duration || 0;

                    // Mira per datetime
                    for (const datetime of enabled.datetimes) {
                        const timestamp = datetime.getTime();
                        if (duration === 0 && datetime_ara > timestamp)
                            return true;
                        else if (datetime_ara > timestamp && datetime_ara < timestamp + duration * 60000)
                            return true;

                    }

                    let horaTrobada = false;
                    // Mira per hora
                    for (const startHour of enabled.startHours) {
                        const startHourM = hhmmToMinutes(startHour);
                        const endHourM = startHourM + duration;
                        const momentM = hhmmToMinutes(dataActual.toLocaleTimeString('ca-ES', {hour: '2-digit', minute:'2-digit'}));
                        if(momentM >= startHourM && momentM <= endHourM)
                        {
                            horaTrobada = true;
                            break;
                        }
                    }

                    // Mira per dia
                    const diaTrobat = enabled.days.includes(dia_avui);

                    // Comprova
                    return horaTrobada && diaTrobat
                        || enabled.startHours === 0 && diaTrobat
                        || horaTrobada && enabled.days.length === 0;
                });

                if(!norma_enabled)
                    continue;
            }

            const mode = norma.mode;

            let matchInLines = false;
            for (const line of norma.lines) {
                const matchHost = !line.host || compara(webPage.host, line.host, true);
                const matchProtocol = !line.protocol || compara(webPage.protocol,line.protocol);
                const matchSearch = !line.search || compara(webPage.search, line.search);
                const matchPathname = !line.pathname || compara(webPage.pathname, line.pathname);
                const matchTitle = !line.title || compara(webPage.title, line.title);
                //const matchBrowser; TODO
                //const matchIncognito;
                //const matchAudible;

                const match = matchHost && matchProtocol && matchSearch && matchPathname && matchTitle;
                matchInLines = matchInLines || match;

                if(match)
                    break;
            }

            let current_action = "allow";

            if(mode === "whitelist") {
                current_action = matchInLines ? "allow" : norma.severity;
            }
            else if(mode === "blacklist") {
                current_action = matchInLines ? norma.severity : "allow";
            }

            action = compare_severity(action, current_action);

            tracelog += "La norma " + norma._id + " ha donat " + current_action + "\n";
        }

        if(action === "block")
            logger.debug(tracelog);

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
