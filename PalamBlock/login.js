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
            chrome.storage.sync.set({ alumne: alumne}, function() {
                window.close();
            });
        } else {
            alert("Error d'autentificació de l'alumne");
        }
    });
  }

  function restore_options() {
    chrome.storage.sync.get(['alumne'], function(result) {
        if(result.alumne &&  result.alumne !== '')
            document.getElementById('alumne').value = result.alumne;

    });
  }
  
  document.addEventListener('DOMContentLoaded', restore_options);
  document.getElementById('save').addEventListener('click',
      save_options);