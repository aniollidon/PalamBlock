const minimatch = require('minimatch');

var pattern = "*\\Aniol\\*";
var filePath = "C:\\Users\\Aniol\\Documents\\WindowsPowerShell";

if (minimatch(filePath, pattern)) {
    console.log("La ruta coincideix amb el patró.");
} else {
    console.log("La ruta no coincideix amb el patró.");
}