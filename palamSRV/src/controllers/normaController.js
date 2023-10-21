const normaService = require('../services/normaService');

const postNorma = (req, res) => {
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
            normaService.creaNormaGrup(whoid, severity, mode, hosts_list, protocols_list, searches_list, pathnames_list,
                titles_list, enabled_on).then((alumne) => {
                res.send({status: "OK", data: alumne});
            });
        } else if(who === "alumne"){
            normaService.creaNormaAlumne(whoid, severity, mode, hosts_list, protocols_list, searches_list, pathnames_list,
                titles_list, enabled_on).then((alumne) => {
                res.send({status: "OK", data: alumne});
            });
        }

    }
    else{
        res.status(500).send({ status: "ERROR", data:"Falten dades de la norma. Cal especificar who, severity, mode, whoid i almenys un dels camps: hosts, protocols, searches, pathnames, titles"})
    }
}

function addNorma(who, whoid, severity, mode, hosts_list, protocols_list, searches_list, pathnames_list,
                  titles_list, enabled_on) {
    if(who === "grup") {
        normaService.creaNormaGrup(whoid, severity, mode, hosts_list, protocols_list, searches_list, pathnames_list,
            titles_list, enabled_on).then((alumne) => {
                console.log("Norma afegida de grup");
        });
    } else if(who === "alumne"){
        normaService.creaNormaAlumne(whoid, severity, mode, hosts_list, protocols_list, searches_list, pathnames_list,
            titles_list, enabled_on).then((alumne) => {
                console.log("Norma afegida d'alumne");
        });
    }
}

const getAllNormes = () => {
    return normaService.getAllNormes();
}

const removeNorma = (who, whoid, normaid) => {
    normaService.removeNorma(who, whoid, normaid);
}

const registerOnUpdateCallback = (callback) => {
    normaService.registerOnUpdateCallback(callback);
}

module.exports = {
    postNorma,
    addNorma,
    getAllNormes,
    removeNorma,
    registerOnUpdateCallback,
}