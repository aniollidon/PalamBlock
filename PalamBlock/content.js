chrome.storage.sync.get(['alumne'], function(result) {

    if(!result.alumne){
      window.location.href = chrome.runtime.getURL("login.html")
      return;
    }

    const host = window.location.hostname;
    const protocol = window.location.protocol;
    const search = window.location.search;
    const pathname = window.location.pathname;
    const title = document.title;

    chrome.runtime.sendMessage({
        host:host,
        protocol:protocol,
        search:search,
        pathname:pathname,
        title:title,
        alumne:result.alumne
    }).then((message)=>{
        if(message.blocked){
            window.location.href = chrome.runtime.getURL("blocked.html")
        }
    }).catch((error)=>{
        console.error(error);
    });
});