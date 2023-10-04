const historialService = require("../services/historialService");
const validacioService = require("../services/validacioService");

const postValidacio = (req, res) => {
    const host = req.body.host;
    const protocol = req.body.protocol;
    const search = req.body.search;
    const pathname = req.body.pathname;
    const title = req.body.title;
    const alumne = req.body.alumne;
    const timestamp = new Date().toLocaleString("es-CA", { timeZone: "Europe/Madrid" })

    historialService.save(alumne, timestamp, host, protocol, search, pathname, title);
    console.log("host: " + host + " protocol: " + protocol + " search: " + search + " pathname: " + pathname + " title: " + title + " alumne: " + alumne);

    const status = validacioService.validar(host, protocol, search, pathname, title, alumne);
   res.status(200).send({ blocked: status === "block" } );
}


module.exports = {
    postValidacio
};
