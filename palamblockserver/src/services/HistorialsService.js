const Historial = require("../database/Historials");

const getAllhistorial = () => {
    const allhistorial = Historial.getAllhistorial();
    return allhistorial;
};

const getHistorial = (idHistorial) => {
    const Historial = Historial.getHistorial(idHistorial);
    return Historial;
}

const addHistorial = (newHistorial) => {
    try {
        const createdHistorial = Historial.addHistorial(newHistorial);
        return createdHistorial;
    } catch (error) {
        return error;
    }
}
const modifyHistorial = (newHistorial) => {
    try {
        const createdHistorial = Historial.modifyHistorial(newHistorial);
        return createdHistorial;
    } catch (error) {
        return error;
    }
}

const removeHistorial = (nom) => {
    try {
        const createdHistorial = Historial.removeHistorial(nom);
        return createdHistorial;
    } catch (error) {
        return error;
    }
}

module.exports = {
    getAllhistorial,
    getHistorial,
    addHistorial,
    modifyHistorial,
    removeHistorial
};
