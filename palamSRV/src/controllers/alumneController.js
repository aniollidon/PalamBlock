const alumneService = require("../services/alumneService");
const logger = require("../logger").logger;

const postAlumneAPI = (req, res) => {
  const { body } = req;
  const alumneId = body.alumne;
  const grupId = body.grup;
  const nom = body.nom;
  const cognoms = body.cognoms;
  const clau = body.clau;

  if (alumneId && grupId && nom && cognoms && clau) {
    alumneService
      .creaAlumne(alumneId, grupId, clau, nom, cognoms)
      .then((alumne) => {
        res.send({ status: "OK", data: alumne });
      })
      .catch((error) => {
        logger.error(error);
        res
          .status(error?.status || 500)
          .send({ status: "FAILED", data: { error: error?.message || error } });
      });
  } else
    res.send({
      status: "ERROR",
      data: "Falten dades de l'Alumne. Es necessiten alumne, grup, nom, cognoms i clau",
    });
};

const autentificaAlumneAPI = (req, res) => {
  const { body } = req;
  const alumneId = body.alumne;
  const clau = body.clau;

  if (alumneId) {
    alumneService
      .autentificaAlumne(alumneId, clau)
      .then((alumne) => {
        res.send({ status: "OK", data: alumne });
      })
      .catch((error) => {
        // Diferencia entre errors d'autenticació (esperats) i errors del sistema
        if (error?.status === 401 || error?.status === 404) {
          logger.warn("Error d'autenticació:", error.message);
        } else {
          logger.error("Error autenticant l'alumne:", error);
        }

        // Per errors d'autenticació, utilitza 401 per defecte en lloc de 500
        const statusCode = error?.status || 401;
        res
          .status(statusCode)
          .send({ status: "FAILED", data: { error: error?.message || error } });
      });
  } else res.send({ status: "ERROR", data: "Falten dades de l'Alumne" });
};

const getGrupAlumnesList = () => {
  return alumneService.getGrupAlumnesList();
};

function setAlumneStatus(alumneId, status) {
  alumneService.setAlumneStatus(alumneId, status).catch((error) => {
    logger.error(error);
  });
}

function setGrupStatus(grupId, status) {
  return alumneService.setGrupStatus(grupId, status).catch((error) => {
    logger.error(error);
  });
}

async function creaAlumne(alumneId, grupId, clau, nom, cognoms) {
  return alumneService.creaAlumne(alumneId, grupId, clau, nom, cognoms);
}

async function updateAlumne(alumneId, updates) {
  return alumneService.updateAlumne(alumneId, updates);
}

async function deleteAlumne(alumneId) {
  return alumneService.deleteAlumne(alumneId);
}

async function creaGrup(grupId, nom) {
  return alumneService.creaGrup(grupId, nom);
}

async function updateGrup(grupId, updates) {
  return alumneService.updateGrup(grupId, updates);
}

async function deleteGrup(grupId) {
  return alumneService.deleteGrup(grupId);
}

module.exports = {
  postAlumneAPI,
  autentificaAlumneAPI,
  getGrupAlumnesList,
  setAlumneStatus,
  setGrupStatus,
  creaAlumne,
  updateAlumne,
  deleteAlumne,
  creaGrup,
  updateGrup,
  deleteGrup,
};
