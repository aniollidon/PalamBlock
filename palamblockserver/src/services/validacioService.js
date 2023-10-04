const db = require("../database/Normes");

function conteAlguna(text, paraules) {
    return paraules.some(paraula => text.includes(paraula));
}

function validar(host, protocol, search, pathname, title, alumne) {

    const normes = new db.Normes(alumne);
    const blockHost = conteAlguna(host, normes.forbidden_hosts);
    const blockProtocol = conteAlguna(protocol, normes.forbidden_protocols);
    const blockSearch = conteAlguna(search, normes.forbidden_searches);
    const blockPathname = conteAlguna(pathname, normes.forbidden_pathnames);
    const blockTitle = conteAlguna(title, normes.forbidden_titles);

    const blocked = !normes.off && (normes.blockall || blockHost || blockProtocol || blockSearch || blockPathname || blockTitle);
    return blocked? "block" : "";
}

module.exports = {
    validar
}
