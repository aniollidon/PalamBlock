
export function warnNormesWeb(data){
    let avisos = document.getElementById("avisos");
    avisos.innerHTML = "";

    for (let who in data) {
        for (let whois in data[who]) {
            for (let normaid in data[who][whois]) {
                if(data[who][whois][normaid].mode === "whitelist"){
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

                           if(line.host.toString().includes("google.com")){
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
                    span.innerHTML = who==="alumne" ? "L'alumne": "El grup"
                    span.innerHTML += " " + whois + " té una norma amb llista blanca activa.";

                    let button = document.createElement("button");
                    button.setAttribute("type", "button");
                    button.classList.add("btn-close");
                    button.setAttribute("data-bs-dismiss", "alert");
                    button.setAttribute("aria-label", "Close");

                    div.appendChild(strong);
                    div.appendChild(span);
                    div.appendChild(imsdiv);
                    div.appendChild(button);

                    avisos.appendChild(div);
                }
            }
        }
    }
}
