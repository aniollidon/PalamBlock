window.addEventListener("beforeunload", function (e) {
    sessionStorage.closedLastTab = '1';
    alert ("Tancant la pestanya");
});


function getBrowser() {
    let userAgent = navigator.userAgent;
    let browser = "Unknown";

    // Detect Chrome
    if (/Chrome/.test(userAgent) && !/Chromium/.test(userAgent)) {
        browser = "Google Chrome family";
    }
    // Detect Chromium-based Edge
    else if (/Edg/.test(userAgent)) {
        browser = "Microsoft Edge";
    }
    // Detect Firefox
    else if (/Firefox/.test(userAgent)) {
        browser = "Mozilla Firefox";
    }
    // Detect Safari
    else if (/Safari/.test(userAgent)) {
        browser = "Apple Safari";
    }
    // Detect Internet Explorer
    else if (/Trident/.test(userAgent)) {
        browser = "Internet Explorer";
    }

    return browser;
}

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
        type: 'validacio',
        host:host,
        protocol:protocol,
        search:search,
        pathname:pathname,
        title:title,
        alumne:result.alumne,
        browser: getBrowser(),
    }).then((message)=>{
        if(message.do === "block"){
            window.location.href = chrome.runtime.getURL("blocked.html")
        }
        else if(message.do === "warn"){
            document.body.innerHTML = `
            <div id="palablock" style="background-color: rgb(77 77 86 / 65%);
            position: fixed; z-index: 9999; height: 100%;width: 100%;
            display: flex; justify-content: center; align-content: center;
            align-items: center; user-select: none; color: white;">
            <div style="background: #00000096; padding: 50px; text-align: center">
            <div style="font-size: 50px;"> Estàs accedint a una pàgina no recomenada </div>
            <div style="font-size: 20px;"> Clica per continuar</div>
            </div>
            </div>
            ` + document.body.innerHTML;

            document.getElementById("palablock").addEventListener("click", function(){
                document.getElementById("palablock").remove();
            });
        }
    }).catch((error)=>{
        console.error(error);
    });
});