
export function netejaText(text){
    return text.replace(/(\r\n|\n|\r)/gm, "").trim();
}