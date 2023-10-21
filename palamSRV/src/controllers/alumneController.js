const alumneService = require("../services/alumneServices");


const postAlumne = (req, res) => {
    const { body } = req;
    const alumneId = body.alumne;
    const grupId = body.grup;
    const nom = body.nom;
    const cognoms = body.cognoms;
    const clau = body.clau;

    if(alumneId && grupId && nom && cognoms && clau){
        alumneService.creaAlumne(alumneId, grupId, clau, nom, cognoms)
            .then((alumne) => {
                res.send({status: "OK", data: alumne});
            })
            .catch((error) => {
                console.error(error);
                res.status(error?.status || 500)
                    .send({ status: "FAILED", data: { error: error?.message || error } });
            });
    } else
        res.send({ status: "ERROR", data:"Falten dades de l'Alumne. Es necessiten alumne, grup, nom, cognoms i clau"})
}

const autentificaAlumne = (req, res) => {
    const { body } = req;
    const alumneId = body.alumne;
    const clau = body.clau;

    if(alumneId){
        alumneService.autentificaAlumne(alumneId, clau)
            .then((alumne) => {
                res.send({status: "OK", data: alumne});
            })
            .catch((error) => {
                console.error(error);
                res.status(error?.status || 500)
                    .send({ status: "FAILED", data: { error: error?.message || error } });
            });
    } else
        res.send({ status: "ERROR", data:"Falten dades de l'Alumne"})
}

const getGrupAlumnesList = () => {
    return alumneService.getGrupAlumnesList();
}
module.exports = {
    postAlumne,
    autentificaAlumne,
    getGrupAlumnesList,
}