
const postValidacio = (req, res) => {
    console.log(req.body);
    // Send json amb el resultat de la validació
    res.send({ status: "OK", blocked: true });
}


module.exports = {
    postValidacio
};
