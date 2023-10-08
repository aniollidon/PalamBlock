const alumneService = require("../services/alumneServices");


const postAlumne = (req, res) => {
    const { body } = req;
    const alumneId = body.alumne;
    const grupId = body.grup;
    const nom = body.nom;
    const cognoms = body.cognoms;
    const clau = body.clau;

    // TODO CHECK CLAU

    if(alumneId && grupId){
        alumneService.creaAlumne(alumneId, grupId, nom, cognoms)
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

module.exports = {
    postAlumne
}