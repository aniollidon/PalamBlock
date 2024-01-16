
chrome.storage.sync.get(['alumne'], function(result) {

    if(!result.alumne){
      window.location.href = chrome.runtime.getURL("login.html")
      return;
    }

    chrome.runtime.sendMessage({
        type: 'validacio',
        alumne:result.alumne
    }).then((message)=>{
        if(message.do === "block"){
            window.location.href = chrome.runtime.getURL(`blocked.html?title=${document.title}`)
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