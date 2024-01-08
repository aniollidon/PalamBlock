const normaService = require('../services/normaService');

const postNormaAPI = (req, res) => {
    const who = req.body.who;
    const whoid = req.body.whoid;
    const severity = req.body.severity;
    const mode = req.body.mode;
    const hosts_list = req.body.hosts;
    const protocols_list = req.body.protocols;
    const searches_list = req.body.searches;
    const pathnames_list = req.body.pathnames;
    const titles_list = req.body.titles;
    const enabled_on = req.body.enabled_on;

    if(mode !== "whitelist" && mode !== "blacklist") {
        res.status(500).send({status: "ERROR", data: "Mode incorrecte. Ha de ser whitelist o blacklist"});
        return;
    }

    if(severity !== "warn" && severity !== "block") {
        res.status(500).send({status: "ERROR", data: "Severity incorrecte. Ha de ser warn o block"});
        return;
    }

    if(who !== "grup" && who !== "alumne") {
        res.status(500).send({status: "ERROR", data: "Who incorrecte. Ha de ser grup o alumne"});
        return;
    }

    if(whoid && (hosts_list || protocols_list || searches_list || pathnames_list || titles_list)){

        if(who === "grup") {
            normaService.creaNormaWebGrup(whoid, severity, mode, hosts_list, protocols_list, searches_list, pathnames_list,
                titles_list, enabled_on).then((alumne) => {
                res.send({status: "OK", data: alumne});
            });
        } else if(who === "alumne"){
            normaService.addNormaWebAlumne(whoid, severity, mode, hosts_list, protocols_list, searches_list, pathnames_list,
                titles_list, enabled_on).then((alumne) => {
                res.send({status: "OK", data: alumne});
            });
        }

    }
    else{
        res.status(500).send({ status: "ERROR", data:"Falten dades de la norma. Cal especificar who, severity, mode, whoid i almenys un dels camps: hosts, protocols, searches, pathnames, titles"})
    }
}

function addNorma2Web(who, whoid, severity, mode, webList, enabled_on) {
    if(who === "grup") {
        normaService.creaNorma2WebGrup(whoid, severity, mode, webList, enabled_on).then((alumne) => {
            //logger.info("NormaWeb afegida de grup");
        });
    } else if(who === "alumne"){
        normaService.creaNorma2WebAlumne(whoid, severity, mode, webList, enabled_on).then((alumne) => {
            //logger.info("NormaWeb afegida d'alumne");
        });
    }
}
function addNormaApps(who, whoid, severity, processName, processPath, processPathisRegex) {
    if(who === "grup") {
        normaService.creaNormaGrupApp(whoid, processName, processPath, processPathisRegex, severity).then((alumne) => {
            //logger.info("NormaApp afegida de grup");
        });
    } else if(who === "alumne"){
        normaService.creaNormaAlumneApp(whoid, processName, processPath, processPathisRegex, severity).then((alumne) => {
            //logger.info("NormaApp afegida d'alumne");
        });
    }
}

const getAllNormes2Web = () => {
    return normaService.getAllNormes2Web();
}


const getAllNormesApps = () => {
    return normaService.getAllNormesApps();
}

const removeNorma2Web = (who, whoid, normaid) => {
    normaService.removeNorma2Web(who, whoid, normaid);
}

const removeNormaApp = (who, whoid, normaid) => {
    normaService.removeNormaApp(who, whoid, normaid);
}

const registerOnUpdateCallback = (callback) => {
    normaService.registerOnUpdateCallback(callback);
}

module.exports = {
    postNormaAPI,
    addNorma2Web,
    addNormaApps,
    getAllNormes2Web,
    getAllNormesApps,
    removeNorma2Web,
    removeNormaApp,
    registerOnUpdateCallback,
}
