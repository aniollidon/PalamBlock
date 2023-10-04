function save_options() {
    let alumne = document.getElementById('alumne').value;
    let grup = document.getElementById('grup').value;
   
    chrome.storage.sync.set({ alumne: alumne, grup:grup }, function() {
        console.log('Dades sincronitzades.');
        window.close();
    });
  }

  function restore_options() {
    chrome.storage.sync.get(['alumne', 'grup'], function(result) {

        if(result.alumne &&  result.alumne != '')
            document.getElementById('alumne').value = result.alumne;

        if(result.grup &&  result.grup != '')
            document.getElementById('grup').value = result.grup;
    });
  }
  
  document.addEventListener('DOMContentLoaded', restore_options);
  document.getElementById('save').addEventListener('click',
      save_options);