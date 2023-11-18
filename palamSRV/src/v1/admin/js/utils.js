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
