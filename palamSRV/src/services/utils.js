/**
 * ** estructuraPublica** - Funció que retorna una còpia de l'objecte original sense les claus que comencen per '_'
 * @param original
 * @returns {{}}
 */
function estructuraPublica(original) {
    // Primera creem una còpia de l'objecte original
    let copia;

    if (Array.isArray(original)) {
        // Si és una llista (array)
        copia = original.map(element => {
            if (element && typeof element === 'object') {
                // Si l'element és un objecte, crida la funció recursivament
                return estructuraPublica(element);
            } else {
                return element;
            }
        });
    } else if (typeof original === 'object') {
        // Si és un diccionari (objecte)
        copia = {};
        for (let clau in original) {
            if (!clau.startsWith('_')) {
                // Si la clau no comença amb '_', copiem l'element
                if (typeof original[clau] === 'object') {
                    // Si l'element és un objecte, crida la funció recursivament
                    copia[clau] = estructuraPublica(original[clau]);
                } else {
                    copia[clau] = original[clau];
                }
            }
        }
    } else {
        // Si és un valor simple, simplement el copiem
        copia = original;
    }

    return copia;
}

module.exports = {
    estructuraPublica
};
