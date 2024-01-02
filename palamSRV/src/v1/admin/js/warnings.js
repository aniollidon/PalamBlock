
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
                    div.appendChild(button);

                    avisos.appendChild(div);
                }
            }
        }
    }
}
