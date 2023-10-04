// Crea un servei de backgroud que escolta els missatges dels scripts de contingut
// i els scripts de contingut que escolten els missatges del servei de background.

//Espera el missatge del script de contingut
function handleMessage(request, sender, sendResponse) {
    // Envia una peticio al servidor
    fetch('http://localhost:4000/api/v1/validacio', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            host: request.host,
            protocol: request.protocol,
            search: request.search,
            pathname: request.pathname,
            title: request.title,
            alumne: request.alumne
        })
    }).then((response) => {
        response.json().then((data) => {
            if (response.status === 200) {
                sendResponse({blocked: data.blocked});
            }
            else {
                sendResponse({blocked: false});
            }
        });
    }).catch((error) => {
        console.error(error);
        sendResponse({blocked: false});
    });

    return true;
}

chrome.runtime.onMessage.addListener(handleMessage);
