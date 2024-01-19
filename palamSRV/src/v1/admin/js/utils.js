import {commonHorari} from "./common.js";

function eliminarClauJSON(obj, clau) {
    if (obj && typeof obj === 'object') {
        for (const key in obj) {
            if (key === clau) {
                delete obj[key];
            } else {
                eliminarClauJSON(obj[key], clau);
            }
        }
    }
}

export function compareEqualTabs(oobj1, oobj2) {
    //copia els objectes per no modificar els originals
    const obj1 = JSON.parse(JSON.stringify(oobj1));
    const obj2 = JSON.parse(JSON.stringify(oobj2));

    eliminarClauJSON(obj1, 'updatedAt');
    eliminarClauJSON(obj2, 'updatedAt');

    eliminarClauJSON(obj1, 'status');
    eliminarClauJSON(obj2, 'status');

    const strobj1 = JSON.stringify(obj1);
    const strobj2 = JSON.stringify(obj2);

    return strobj1 === strobj2;
}

export function safeURL(web) {
    if (web === undefined || web === null || web === "" || web === "*")
        return {
            host: undefined,
            protocol: undefined,
            search: undefined,
            pathname: undefined
        };

    // remove spaces
    web = web.replaceAll(" ", "");

    // remove last /
    if(web.endsWith("/"))
        web = web.substring(0, web.length - 1);

    // split string until // if not there leave empty
    const protocol = web.includes("//") ? web.split("//")[0] : undefined;
    // remove protocol
    if(protocol){
        web = web.replace(protocol + "//", "");
    }
    // split string until / or ?
    const host = web.split(/\/|\?/)[0];
    if(host) {
        web = web.replace(host, "");
    }
    const search = web.includes("?") ? web.split("?")[1] : undefined;
    if(search) {
        web = web.replace("?" + search, "");
    }
    const pathname = web.length > 0 ? web : undefined;
    return {
        host: host,
        protocol: protocol,
        search: search,
        pathname: pathname
    }
}

export function hhmmToMinutes(hhmm){
    const h = parseInt(hhmm.split(":")[0])
    const m = parseInt(hhmm.split(":")[1])
    return h*60 + m;
}

export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function minutstoDDHHMM(minuts) {
    const dd = Math.floor(minuts / 1440);
    const hh = Math.floor((minuts - dd * 1440) / 60);
    const mm = minuts - dd * 1440 - hh * 60;

    let o = []   ;
    if (dd === 1)
        o.push(dd + " dia");
    else if(dd > 1)
        o.push(dd + " dies");
    if(hh === 1)
        o.push(hh + " hora");
    else if(hh > 1)
        o.push(hh + " hores");
    if(mm === 1)
        o.push(mm + " minut");
    else if(mm > 1)
        o.push(mm + " minuts");

    if(o.length === 1)
        return o[0];
    else
        return  o.slice(0, -1).join(' ')+' i '+o.slice(-1)
}

export function normaTempsActiva(enabled_on) {
    if(enabled_on === undefined || enabled_on === null || enabled_on.length === 0)
        return true;

    const dataActual = new Date();
    const datetime_ara = dataActual.getTime();
    const dia_avui = dataActual.toLocaleDateString('ca-ES',  { weekday: 'long' });

    return enabled_on.find((enabled) => {
        const duration = enabled.duration || 0;

        // Mira per datetime
        for(const datetime of enabled.datetimes) {
            const timestamp = new Date(datetime).getTime();
            if(duration === 0 && datetime_ara > timestamp)
                return true;
            else if(datetime_ara > timestamp  && datetime_ara < timestamp + duration * 60000)
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
    }) !== undefined;
}
export function getIntervalHorari(moment, sessions){

    const momentM = hhmmToMinutes(moment);
    let count_sessions = 0;

    for (let hhmm in commonHorari){
        const minuts = hhmmToMinutes(commonHorari[hhmm]);

        if(minuts > momentM){
            count_sessions++;
            if(count_sessions >= sessions)
                return commonHorari[hhmm];
        }
    }

    return undefined;
}