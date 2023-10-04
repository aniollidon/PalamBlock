
const postValidacio = (req, res) => {
    res.status(200).send({ blocked: true } );
}


module.exports = {
    postValidacio
};
