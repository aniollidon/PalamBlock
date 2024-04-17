const logger = require("../logger").logger;

function postErrorLoggingAPI(req, res) {
    const { body } = req;

    logger.debug("Frontend error:"+ body.error);

    res.status(200).json({
        status: "success"
    });
}

module.exports = {
    postErrorLoggingAPI
}
