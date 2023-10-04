
const historialService = require("../services/historialService");

const getHistorials = (req , res) => {
    const Historials = historialService.getAllhistorial();
    res.send({ status: "OK", data: Historials });
}

const getHistorial = (req , res) => {
    if(req.params.id !== undefined) {
        const Historials = historialService.getHistorial(req.params.id);
        res.send({ status: "OK", data: Historials });
    }else res.send({ status: "ERROR", data:"Falta l'id del Historial"})
}

const postHistorial = (req, res) => {
    const { body } = req;
    const nom = body.nom;
    const tipus = body.tipus;
    const preu = body.preu;
    const categoria = body.categoria;

    if(nom && categoria && tipus && preu){
        const newHistorial = {nom:nom, tipus:tipus, preu:preu, categoria:categoria}
        try{
            const Historial = historialService.addHistorial(newHistorial);
            res.send({status: "OK", data: Historial});
        }catch(error){
            res
            .status(error?.status || 500)
            .send({ status: "FAILED", data: { error: error?.message || error } });
        }
    }else res.send({ status: "ERROR", data:"Falten dades del Historial"})
}

const modifyHistorial = (req, res) => {
    const { body } = req;
    const nom = body.nom;
    const tipus = body.tipus;
    const preu = body.preu;
    const categoria = body.categoria;

    if(nom && categoria && tipus && preu){
        const newHistorial = {nom:nom, tipus:tipus, preu:preu, categoria:categoria}
        try{
            const Historial = historialService.modifyHistorial(newHistorial);
            res.send({status: "OK", data: Historial});
        }catch(error){
            res
            .status(error?.status || 500)
            .send({ status: "FAILED", data: { error: error?.message || error } });
        }
    }else res.send({ status: "ERROR", data:"Falten dades del Historial"})
}

const deleteHistorial = (req, res) => {
    if(req.params.id !== undefined) {
        const Historials = historialService.removeHistorial(req.params.id);
        res.send({ status: "OK", data: Historials });
    }else res.send({ status: "ERROR", data:"Falta l'id del Historial"})
}

module.exports = {
    getHistorials,
    getHistorial,
    postHistorial,
    modifyHistorial,
    deleteHistorial
};
