document.getElementById('login').addEventListener('click',()=>{
    window.open('login.html', '_blank');
});

chrome.storage.local.get(['alumne', 'server', 'extVersion'], (result)=>{
    if(result.alumne &&  result.alumne !== ''){
        document.getElementById('login').innerText = "Modifica";
        document.getElementById('alumne').innerText = result.alumne;
    }
    else {
        document.getElementById('login').innerText = "Registra";
        document.getElementById('alumne').innerText = "-";
    }

    if(result.server &&  result.server !== '')
        document.getElementById('servidor').innerText = result.server;
    else {
        document.getElementById('servidor').innerText = "DESCONNECTAT";
    }

    if(result.extVersion &&  result.extVersion !== '')
        document.getElementById('version').innerText = result.extVersion;
    else {
        document.getElementById('version').innerText = "ERROR";
    }
});
