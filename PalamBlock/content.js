function conteAlguna(text, paraules) {
  return paraules.some(paraula => text.includes(paraula));
}

chrome.storage.sync.get(['alumne'], function(result) {
    
  if(!result.alumne){
      window.location.href = chrome.runtime.getURL("login.html")
      return;
  }

  console.log('Alumne: ' + result.alumne);

  //Notifica a l'script de fons que s'ha carregat la pagina
  var url = window.location.href;
  chrome.runtime.sendMessage({url:url, alumne:result.alumne}, function(response) {
      console.log(response);
  });
});