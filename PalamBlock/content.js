function conteAlguna(text, paraules) {
  return paraules.some(paraula => text.includes(paraula));
}

chrome.storage.sync.get(['alumne'], function(result) {

    if(!result.alumne){
      window.location.href = chrome.runtime.getURL("login.html")
      return;
    }

    const url = window.location.href;
    chrome.runtime.sendMessage({
        url:url,
        alumne:result.alumne
    }).then((message)=>{
        console.log(JSON.stringify(message));
    }).catch((error)=>{
        console.error(error);
    });
});