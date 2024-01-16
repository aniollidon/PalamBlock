import {socket} from "./socket.js";

export function warnNormesWeb(data){
    let avisos = document.getElementById("avisos");
    avisos.innerHTML = "";

    for (let who in data) {
        for (let whois in data[who]) {
            for (let normaid in data[who][whois]) {
                if(!data[who][whois][normaid].alive) continue;
                if(data[who][whois][normaid].mode === "whitelist"){
                    const whotxt = who.replace("s","");
                    let div = document.createElement("div");
                    div.classList.add("alert");
                    div.classList.add("alert-warning");
                    div.classList.add("alert-dismissible");
                    div.classList.add("fade");
                    div.classList.add("show");
                    div.setAttribute("role", "alert");

                    const imsdiv = document.createElement("div");
                    imsdiv.classList.add("warning-tip-icons")
                    // Get images
                    let firstgoogle = false;
                    for (let line of data[who][whois][normaid].lines) {
                       if(line.host) {

                           if(line.host.toString().includes("google.com") || line.host.toString().includes("googleusercontent.com")){
                               if (!firstgoogle)
                                   firstgoogle = true;
                               else
                                   continue;
                           }

                           const favicon = document.createElement("img");
                           favicon.setAttribute("src", "https://www.google.com/s2/favicons?domain=" + line.host.replaceAll("*","") + "&sz=64");
                           favicon.setAttribute("alt", line.host);
                           favicon.setAttribute("width", "20");
                           favicon.setAttribute("height", "20");
                           favicon.setAttribute("style", "margin-right: 5px");
                           imsdiv.appendChild(favicon);
                       }
                    }
                    let strong = document.createElement("strong");
                    strong.innerHTML = "Alerta: ";

                    let span = document.createElement("span");
                    span.innerHTML = whotxt==="alumne" ? "L'alumne": "El grup"
                    span.innerHTML += " " + whois + " té una norma amb llista blanca activa.";

                    const right = document.createElement("div");
                    right.classList.add("warning-right");

                    const eyehide = document.createElement("button");
                    eyehide.classList.add("btn");
                    eyehide.classList.add("eye-button");
                    eyehide.setAttribute("type", "button");
                    eyehide.setAttribute("data-bs-toggle", "tooltip");
                    eyehide.setAttribute("data-bs-placement", "top");
                    eyehide.setAttribute("title", "Desactiva");
                    eyehide.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash-fill" viewBox="0 0 16 16">
                      <path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7 7 0 0 0 2.79-.588M5.21 3.088A7 7 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474z"/>
                      <path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12z"/>
                    </svg>`

                    eyehide.onclick = () => {
                        socket.emit("updateNormaWeb", {normaId: normaid, who: whotxt, whoid: whois, alive: false});
                        bootstrap.Alert.getOrCreateInstance(div).close();

                    }

                    div.appendChild(strong);
                    div.appendChild(span);
                    right.appendChild(imsdiv);
                    right.appendChild(eyehide);
                    div.appendChild(right);
                    avisos.appendChild(div);
                }
            }
        }
    }
}
