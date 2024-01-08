function eliminarClauJSON(obj, clau) {
    if (obj && typeof obj === 'object') {
        for (const key in obj) {
            if (key === clau) {
                delete obj[key];
            } else {
                eliminarClauJSON(obj[key], clau);
            }
        }
    }
}

export function compareEqualTabs(oobj1, oobj2) {
    //copia els objectes per no modificar els originals
    const obj1 = JSON.parse(JSON.stringify(oobj1));
    const obj2 = JSON.parse(JSON.stringify(oobj2));

    eliminarClauJSON(obj1, 'updatedAt');
    eliminarClauJSON(obj2, 'updatedAt');

    eliminarClauJSON(obj1, 'status');
    eliminarClauJSON(obj2, 'status');

    const strobj1 = JSON.stringify(obj1);
    const strobj2 = JSON.stringify(obj2);

    return strobj1 === strobj2;
}

export function safeURL(web) {
    if (web === undefined || web === null || web === "" || web === "*")
        return {
            host: undefined,
            protocol: undefined,
            search: undefined,
            pathname: undefined
        };

    // remove spaces
    web = web.replaceAll(" ", "");

    // remove last /
    if(web.endsWith("/"))
        web = web.substring(0, web.length - 1);

    // split string until // if not there leave empty
    const protocol = web.includes("//") ? web.split("//")[0] : undefined;
    // remove protocol
    if(protocol){
        web = web.replace(protocol + "//", "");
    }
    // split string until / or ?
    const host = web.split(/\/|\?/)[0];
    if(host) {
        web = web.replace(host, "");
    }
    const search = web.includes("?") ? web.split("?")[1] : undefined;
    if(search) {
        web = web.replace("?" + search, "");
    }
    const pathname = web.length > 0 ? web : undefined;
    return {
        host: host,
        protocol: protocol,
        search: search,
        pathname: pathname
    }
}
