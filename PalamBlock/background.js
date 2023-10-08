const API_URL = 'http://localhost:4000/api/v1/';
const API_VALIDACIO = API_URL + 'validacio';
const API_REGISTER = API_URL + 'alumne';

function handleMessage(request, sender, sendResponse) {
    if(request.type === 'validacio') {
        fetch(API_VALIDACIO, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                host: request.host,
                protocol: request.protocol,
                search: request.search,
                pathname: request.pathname,
                title: request.title,
                alumne: request.alumne,
                browser: request.browser,
                tabId: sender.tab.id
            })
        }).then((response) => {
            response.json().then((data) => {
                if (response.status === 200) {
                    sendResponse({do: data.do});
                } else {
                    sendResponse({do: "allow"});
                }
            });
        }).catch((error) => {
            console.error(error);
            sendResponse({blocked: false});
        });
    }
    else if(request.type === 'register') {
        fetch(API_REGISTER, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                alumne: request.alumne,
                grup: request.grup,
                clau: request.clau,
                nom: "",
                cognoms: ""
            })
            }).then((response) => {
                response.json().then((data) => {
                    if (response.status === 200) {
                        sendResponse({status: "OK"});
                    } else {
                        sendResponse({status: "FAILED"});
                    }
                });
            }).catch((error) => {
                console.error(error);
                sendResponse({status: "FAILED"});
            });
        }

    return true;
}

chrome.runtime.onMessage.addListener(handleMessage);
