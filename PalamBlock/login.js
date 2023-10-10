function save_options() {
    let alumne = document.getElementById('alumne').value;
    let grup = document.getElementById('grup').value;
    let clau = document.getElementById('clau').value;

    chrome.storage.sync.set({ alumne: alumne, grup:grup}); //NONONO

    chrome.runtime.sendMessage({
        type: 'register',
        alumne: alumne,
        grup: grup,
        clau: clau
    }).then((message)=>{
        if(message.status === "OK"){
            alert("Alumne registrat correctament");
            chrome.storage.sync.set({ alumne: alumne, grup:grup}, function() {
                console.log('Dades sincronitzades.');
                window.close();
            });
        } else {
            alert("Error al registrar l'alumne");
        }
    });
  }

  function restore_options() {
    chrome.storage.sync.get(['alumne', 'grup'], function(result) {

        if(result.alumne &&  result.alumne !== '')
            document.getElementById('alumne').value = result.alumne;

        if(result.grup &&  result.grup !== '')
            document.getElementById('grup').value = result.grup;
    });
  }
  
  document.addEventListener('DOMContentLoaded', restore_options);
  document.getElementById('save').addEventListener('click',
      save_options);