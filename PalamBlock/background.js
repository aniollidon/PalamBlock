// Crea un servei de backgroud que escolta els missatges dels scripts de contingut
// i els scripts de contingut que escolten els missatges del servei de background.

//Espera el missatge del script de contingut
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request);
    (async () => {
        sendResponse({blocked:true});
    })();
    return true;
    
    // Envia un missatge al servidor
    /*
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:4000/api/v1/validacio", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({url: request.url, alumne: request.alumne}));
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var response = JSON.parse(xhr.responseText);
            if(response.blocked){
                sendResponse({blocked: true});
            }else{
                sendResponse({blocked: false});
            }
        }
    }
    return true;*/
});