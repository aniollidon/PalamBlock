function save_options() {
    let alumne = document.getElementById('alumne').value;
    let clau = document.getElementById('clau').value;

    if(alumne === '' || clau === ''){
        alert("Cal especificar alumne i clau");
        return;
    }

    chrome.runtime.sendMessage({
        type: 'autentificacio',
        alumne: alumne,
        clau: clau
    }).then((message)=>{
        if(message.status === "OK"){
            alert("Alumne registrat correctament");
            chrome.storage.local.set({ alumne: alumne}, function() {
                window.close();
            });
        } else {
            alert("Error d'autentificació de l'alumne");
        }
    });
  }

  function restore_options() {
    chrome.storage.local.get(['alumne'], function(result) {
        if(result.alumne &&  result.alumne !== '')
            document.getElementById('alumne').value = result.alumne;

    });
  }

  document.addEventListener('DOMContentLoaded', restore_options);
  document.getElementById('save').addEventListener('click',
      save_options);

  document.getElementById('clau').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        save_options();
    }});

chrome.management.getSelf(myInfo => {
    if (myInfo.installType !== "admin") {
        document.getElementById('uninstall').addEventListener('click', function () {
            chrome.runtime.sendMessage({type: 'uninstall'});
        });
    }
    else {
        document.getElementById('uninstall-message').style.display = "none";
        document.getElementById('no-uninstall-message').style.display = "";
    }
});
