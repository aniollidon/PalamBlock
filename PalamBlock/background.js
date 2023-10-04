// Crea un servei de backgroud que escolta els missatges dels scripts de contingut
// i els scripts de contingut que escolten els missatges del servei de background.

//Espera el missatge del script de contingut
async function handleMessage(request, sender, sendResponse) {
    console.log("Request from url: " + request.url + " alumne: " + request.alumne);

    // Envia una peticio al servidor
    const response = await fetch('http://localhost:4000/api/v1/validacio', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: request.url,
            alumne: request.alumne
        })
    });

    console.log("Response from server: " + JSON.stringify(response));

    if (response.status === 200) {

        sendResponse({blocked: response.blocked});
    }
    else {
        sendResponse({blocked: false});
    }

    return true;
}

chrome.runtime.onMessage.addListener(handleMessage);
