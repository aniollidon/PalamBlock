const DB = require("./db.json");
const { saveToDatabase } = require("./utils.js");

const getAllhistorial = () => {
    return DB.Historial;
};
const getHistorial = (idHistorial) => {
    return DB.Historial.find(p => p.nom === idHistorial);
}
const addHistorial = (newHistorial) => {
    try {
      const isAlreadyAdded =
        DB.Historial.findIndex((Historial) => Historial.nom === newHistorial.nom) > -1;
      if (isAlreadyAdded) {
        throw {
          status: 400,
          message: `Historial with the name '${newHistorial.nom}' already exists`,
        };
      }
      DB.Historial.push(newHistorial);
      saveToDatabase(DB);
      return newHistorial;
    } catch (error) {
      throw { status: error?.status || 500, message: error?.message || error };
    }
};

const modifyHistorial = (newHistorial) => {
  const indexForUpdate = DB.Historial.findIndex(
    (Historial) => Historial.nom === newHistorial.nom
  );
  if (indexForUpdate === -1) {
    return;
  }
  DB.Historial[indexForUpdate] = newHistorial;
  saveToDatabase(DB);
  return updatedWorkout;
};

const removeHistorial = (nom) => {
  console.log('a')
  const indexForDeletion = DB.Historial.findIndex(
    (Historial) => Historial.nom === nom
  );
  if (indexForDeletion === -1) {
    return;
  }
  console.log(indexForDeletion)
  console.log(DB.Historial[indexForDeletion])
  DB.Historial.splice(indexForDeletion, 1);
  saveToDatabase(DB);
}

module.exports = { 
    getAllhistorial,
    getHistorial,
    addHistorial,
    modifyHistorial,
    removeHistorial
};
